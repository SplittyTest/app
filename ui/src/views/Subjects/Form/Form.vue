<template>
    <div class="page max-w-120">
        <hgroup class="flex items-center gap-2 mb-3">
            <div class="page-icon bg-brand">
                <Icon type="Devices" color="white" size="28px"/>
            </div>
            <h1>{{ isNew ? 'New Subject' : 'Edit Subject' }}</h1>
        </hgroup>
        <div class="page-content">
            <div class="test-form basis-full">
                <Card>
                    <template #content>
                        <div class="flex items-start gap-2">
                            <div class="sections-list flex-1 p-1 pt-2.5">
                                <Button fluid text label="Details" :class="{selected: current_section === 'details'}" @click="current_section = 'details'">
                                    <template #icon>
                                        <Icon type="info" color="brand" size="24px"/>
                                    </template>
                                </Button>
                                <Button fluid text label="Sections" :class="{selected: current_section === 'sections'}" @click="current_section = 'sections'">
                                    <template #icon>
                                        <Icon type="View Compact Alt" color="brand" size="20px"/>
                                    </template>
                                </Button>
                                <Button fluid text label="Settings" :class="{selected: current_section === 'settings'}" @click="current_section = 'settings'">
                                    <template #icon>
                                        <Icon type="Settings" color="brand" size="20px"/>
                                    </template>
                                </Button>
                            </div>
                            <div class="form flex-4 p-1">
                                <Accordion v-model:value="current_section">
                                    <AccordionPanel value="details">
                                        <AccordionHeader>
                                            <div class="section-heading">
                                                Subject Details
                                            </div>
                                        </AccordionHeader>
                                        <AccordionContent>
                                            <Details :subject="subject" :validator="validator" />
                                        </AccordionContent>
                                    </AccordionPanel>
                                    <AccordionPanel value="sections">
                                        <AccordionHeader>
                                            <div class="section-heading">
                                                Sections
                                            </div>
                                        </AccordionHeader>
                                        <AccordionContent>
                                            <Sections :subject="subject" :validator="validator" />
                                        </AccordionContent>
                                    </AccordionPanel>
                                    <AccordionPanel value="settings" class="border-b-0">
                                        <AccordionHeader>
                                            <div class="section-heading">
                                                Settings
                                            </div>
                                        </AccordionHeader>
                                        <AccordionContent>
                                            <Settings :subject="subject" :validator="validator" />
                                        </AccordionContent>
                                    </AccordionPanel>
                                </Accordion>
                            </div>
                        </div>
                    </template>
                    <template #footer>
                        <div class="flex items-center justify-between">
                            <div>
                                <template v-if="!isNew">
                                    <Button label="Duplicate This Subject" @click="duplicateSubject()">
                                        <template #icon>
                                            <Icon type="Content Copy" color="white" size="18px"/>
                                        </template>
                                    </Button>
                                </template>
                            </div>
                            <div class="inline-flex items-center gap-2">
                                <Button text severity="secondary" @click="$router.push('/subjects')">Cancel</Button>
                                <Button label="Save Subject" @click="saveSubject()">
                                    <template #icon>
                                        <Icon type="Check" size="20px"/>
                                    </template>
                                </Button>
                            </div>
                        </div>
                    </template>
                </Card>
            </div>
        </div>
        <Dialog v-model:visible="show_error_modal" modal class="w-full max-w-40 tight">
            <template #header>
                <div class="flex-row">
                    <Icon type="Error" color="red" size="20px"/>
                    <strong>Oops!</strong>
                </div>
            </template>
            <p class="text-sm">Please fix the following errors before saving...</p>
            <ul class="form-errors">
                <li v-for="error in error_messages" :key="error">{{ error }}</li>
            </ul>
        </Dialog>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { cloneDeep, defaultsDeep, isNumber, snakeCase, sortBy, uniqueId } from 'lodash-es';
import { useFormValidator, rules } from '@splitty-test/validation';
import Details from './Sections/Details.vue';
import Sections from './Sections/Sections.vue';
import Settings from './Sections/Settings.vue';
import { hash } from 'hash-it';
import { useConfirm } from 'primevue/useconfirm';

export default defineComponent({
    name: 'SubjectForm',
    components: {
        Details,
        Sections,
        Settings,
    },
    data() {
        return {
            current_section: 'details',
            subject: {
                id: null as string | null,
                name: '',
                type: 'website',
                description: '',
                sections: [
                    {
                        id: 'default' as string | null,
                        description: 'Default section',
                        preview_url: '',
                        data: {},
                        max_concurrent_tests: 1,
                        testing_enabled: true,
                        skip_test_frequency: 0,
                        archive: false,
                    }
                ],
                data: {},
                testing_enabled: true,
                max_concurrent_tests: 99,
                settings: {
                    log_unknown_events: false,
                    unknown_events_idle_logging: true,
                    unknown_events_idle_logging_percentage: 1,
                    log_untracked_events: false,
                },
                archived: false,
            },
            hash: null as number | null,
            type_options: [
                { label: 'Website', value: 'website' },
                { label: 'App', value: 'app' },
                { label: 'Other', value: 'other' },
            ],
            selected_section: {},
            edit_index: null as number | null,
            show_section_modal: false,
            show_archived: false,
            active_tests: [] as any[],
            validator: useFormValidator(),
            show_error_modal: false,
            error_messages: [] as string[],
        }
    },
    computed: {
        isNew() {
            return !this.$route.params.subject_id;
        },  
        isArchivable() {
            // A subject is archivable if it has no active tests with start times
            if (Array.isArray(this.active_tests) && this.active_tests.length > 0) {
                return false;
            }
            return true;
        }  
    },
    methods: {
        async fetchSubject() {
            const { data } = await this.$API.get(`/api/subjects/${this.$route.params.subject_id}`);
            this.subject = defaultsDeep(data, this.subject);
        },
        hasActiveTests(section_id: string | null) {
            if (Array.isArray(this.active_tests)) {
                return this.active_tests.some((test) => {
                    return test.section_id === section_id && test.status === 'active';
                });
            }
            return false;
        },
        openPreview(preview_url: string) {
            window.open(preview_url, '_blank', 'noopener,noreferrer');
        },
        async saveSubject() {
            const is_valid = await this.validator.validate();

            if (is_valid) {
                const new_value: Record<string, any> = cloneDeep(this.subject);

                let method = 'post';
                let url = `/api/subjects`;
                if (!this.isNew) {
                    method = 'patch';
                    url += `/${this.$route.params.subject_id}`;
                }
                else {
                    new_value.created_at = new Date();
                }
                const { status } = await this.$API[method](url, { subject: new_value });
                if (status < 300) {
                    this.$toast.add({
                        severity: 'success',
                        summary: 'Test Subject Saved',
                        detail: 'The test subject was successfully saved',
                        life: 3000
                    });
                    this.$router.push('/subjects');
                }

                this.hash = hash(this.subject);
            }
        },
        async archiveSubject(event: MouseEvent) {
            if (this.isArchivable) {
                this.$confirm.require({
                    target: event.currentTarget as HTMLElement,
                    message: 'Are you sure you want to archive this test subject?',
                    accept: async () => {
                        try {
                            await this.$API.patch(`/api/subjects/${this.subject.id}`, { subject: { archived: true } });
                            this.$toast.add({
                                severity: 'success',
                                summary: 'Subject Archived',
                                detail: `The subject named ${this.subject.name} was successfully archived`,
                                life: 5000
                            });
                            this.subject.archived = true;
                        } catch (err) {
                            // Auto handled
                        }
                        finally {
                            this.$emit('delete');
                        }
                    },
                    acceptProps: {
                        label: 'Archive',
                        severity: 'danger'
                    },
                    reject: () => {
                        this.$emit('reject');
                    },
                    rejectProps: {
                        label: 'Cancel',
                        severity: 'secondary',
                        outlined: true
                    },
                });
            }
        },
        async unarchiveSubject(event: MouseEvent) {
            try {
                await this.$API.patch(`/api/subjects/${this.subject.id}`, { subject: { archived: false } });
                this.$toast.add({
                    severity: 'success',
                    summary: 'Subject Unarchived',
                    detail: `The subject named ${this.subject.name} was successfully unarchived`,
                    life: 5000
                });
                this.subject.archived = false;
            } catch (err) {
                // Auto handled
            }
        },
        duplicateSubject() {
            this.$router.push({
                name: 'SubjectCreate',
                query: {
                    duplicate_subject_id: this.subject.id
                }
            });
        },
    },
    async beforeMount() {
        // Get the test subject data
        if (this.$route.params.subject_id) {
            this.fetchSubject();
        }
        else {
            this.isNew = true;
        }

        // Check if we are duplicating another subject
        const subject_id = this.$route.params.subject_id || this.$route.query.duplicate_subject_id || null;
        if (subject_id) {
            try {
                const { data } = await this.$API.get(`/api/subjects/${subject_id}`);
                if (data) {
                    this.subject = data;
    
                    if (this.isNew) {
                        this.subject.id += '_copy';
                        this.subject.name += ' (Copy)';
                    }
                }
            } catch (err) {
                console.error(err);
            }
        }

        this.hash = hash(this.subject);
    },
    beforeRouteLeave(to, from, next) {
        const confirm = useConfirm();

        if (hash(this.subject) !== this.hash) {
            confirm.require({
                group: 'confirmation',
                severity: 'danger',
                icon: 'Error',
                header: 'You Have Unsaved Changes',
                message: 'Some of the subject data has been modified. Are you sure you want to leave? You will lose any changes.',
                acceptProps: {
                    label: 'Leave Without Saving',
                    severity: 'danger'
                },
                accept: () => {
                    next();
                },
                rejectProps: {
                    label: 'Stay Here'
                },
                reject: () => {
                    // Do nothing
                }
            } as any);
        }
        else {
            next();
        }
    }
});
</script>

<style lang="less" scoped>
:deep(.p-overlay-mask) {
    background-color: rgba(255, 255, 255, 0.5) !important;
}

.page {
    margin: 0 auto;
    width: 100%;
}

.sections-list {
    button {
        color: var(--color-gray-500);
        justify-content: flex-start;
        gap: 0.75em;
        margin-bottom: 0.25rem;;

        &.selected {
            background-color: var(--color-stone-100);
            color: var(--color-brand);
            font-weight: bold;
        }
    }
}

.form {
    border-left: 1px solid var(--color-gray-200);
    padding: 1em 1em 1em 0;
}

.section-heading {
    align-items: center;
    color: var(--color-brand);
    display: flex;
    font-size: 1.125em;
    gap: 0.75em;
    padding: 0 1em ;
}

:deep(.subject-form-section) {
    padding: 1em;
}

:deep(.p-card-footer) {
    border-top: 1px solid var(--color-gray-200);
    margin: 0 -20px -20px;
    padding: 20px;
    text-align: right;
}

:global(.p-dialog.tight .p-dialog-content) {
    padding: 0 var(--p-dialog-content-padding) var(--p-dialog-content-padding);
}

.form-errors {
    color: var(--color-red-400);
    font-size: var(--text-sm);
    list-style-type: disc;
    padding-left: 1.5em;
}
</style>