<template>
    <div class="page max-w-120">
        <hgroup class="flex items-center gap-2 mb-3">
            <div class="page-icon bg-brand">
                <Icon type="Devices" color="white" size="28px"/>
            </div>
            <h1>{{ isNew ? 'New Project' : 'Edit Project' }}</h1>
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
                                                Project Details
                                            </div>
                                        </AccordionHeader>
                                        <AccordionContent>
                                            <Details :project="project" :validator="validator" />
                                        </AccordionContent>
                                    </AccordionPanel>
                                    <AccordionPanel value="sections">
                                        <AccordionHeader>
                                            <div class="section-heading">
                                                Sections
                                            </div>
                                        </AccordionHeader>
                                        <AccordionContent>
                                            <Sections :project="project" :validator="validator" />
                                        </AccordionContent>
                                    </AccordionPanel>
                                    <AccordionPanel value="settings" class="border-b-0">
                                        <AccordionHeader>
                                            <div class="section-heading">
                                                Settings
                                            </div>
                                        </AccordionHeader>
                                        <AccordionContent>
                                            <Settings :project="project" :validator="validator" />
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
                                    <Button label="Duplicate This Project" @click="duplicateProject()">
                                        <template #icon>
                                            <Icon type="Content Copy" color="white" size="18px"/>
                                        </template>
                                    </Button>
                                </template>
                            </div>
                            <div class="inline-flex items-center gap-2">
                                <Button text severity="secondary" @click="$router.push('/projects')">Cancel</Button>
                                <Button label="Save Project" @click="saveProject()">
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
import { useFormValidator } from '@splitty-test/validation';
import { hash } from 'hash-it';
import { cloneDeep, defaultsDeep } from 'lodash-es';
import { useConfirm } from 'primevue/useconfirm';
import { defineComponent } from 'vue';
import Details from './Sections/Details.vue';
import Sections from './Sections/Sections.vue';
import Settings from './Sections/Settings.vue';

export default defineComponent({
    name: 'ProjectForm',
    components: {
        Details,
        Sections,
        Settings,
    },
    data() {
        return {
            current_section: 'details',
            project: {
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
            return !this.$route.params.project_id;
        },  
        isArchivable() {
            // A project is archivable if it has no active tests with start times
            if (Array.isArray(this.active_tests) && this.active_tests.length > 0) {
                return false;
            }
            return true;
        }  
    },
    methods: {
        async fetchProject() {
            const { data } = await this.$API.get(`/api/projects/${this.$route.params.project_id}`);
            this.project = defaultsDeep(data, this.project);
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
        async saveProject() {
            const is_valid = await this.validator.validate();

            if (is_valid) {
                const new_value: Record<string, any> = cloneDeep(this.project);

                let method = 'post';
                let url = `/api/projects`;
                if (!this.isNew) {
                    method = 'patch';
                    url += `/${this.$route.params.project_id}`;
                }
                else {
                    new_value.created_at = new Date();
                }
                const { status } = await this.$API[method](url, { project: new_value });
                if (status < 300) {
                    this.$toast.add({
                        severity: 'success',
                        summary: 'Project Saved',
                        detail: 'The project was successfully saved',
                        life: 3000
                    });
                    this.$router.push('/projects');
                }

                this.hash = hash(this.project);
            }
        },
        async archiveProject(event: MouseEvent) {
            if (this.isArchivable) {
                this.$confirm.require({
                    target: event.currentTarget as HTMLElement,
                    message: 'Are you sure you want to archive this project?',
                    accept: async () => {
                        try {
                            await this.$API.patch(`/api/projects/${this.project.id}`, { project: { archived: true } });
                            this.$toast.add({
                                severity: 'success',
                                summary: 'Project Archived',
                                detail: `The project named ${this.project.name} was successfully archived`,
                                life: 5000
                            });
                            this.project.archived = true;
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
        async unarchiveProject(event: MouseEvent) {
            try {
                await this.$API.patch(`/api/projects/${this.project.id}`, { project: { archived: false } });
                this.$toast.add({
                    severity: 'success',
                    summary: 'Project Unarchived',
                    detail: `The project named ${this.project.name} was successfully unarchived`,
                    life: 5000
                });
                this.project.archived = false;
            } catch (err) {
                // Auto handled
            }
        },
        duplicateProject() {
            this.$router.push({
                name: 'ProjectCreate',
                query: {
                    duplicate_project_id: this.project.id
                }
            });
        },
    },
    async beforeMount() {
        // Get the project data
        if (this.$route.params.project_id) {
            this.fetchProject();
        }
        else {
            this.isNew = true;
        }

        // Check if we are duplicating another project
        const project_id = this.$route.params.project_id || this.$route.query.duplicate_project_id || null;
        if (project_id) {
            try {
                const { data } = await this.$API.get(`/api/projects/${project_id}`);
                if (data) {
                    this.project = data;
    
                    if (this.isNew) {
                        this.project.id += '_copy';
                        this.project.name += ' (Copy)';
                    }
                }
            } catch (err) {
                console.error(err);
            }
        }

        this.hash = hash(this.project);
    },
    beforeRouteLeave(to, from, next) {
        const confirm = useConfirm();

        if (hash(this.project) !== this.hash) {
            confirm.require({
                group: 'confirmation',
                severity: 'danger',
                icon: 'Error',
                header: 'You Have Unsaved Changes',
                message: 'Some of the project data has been modified. Are you sure you want to leave? You will lose any changes.',
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
        gap: 0.75em;
        justify-content: flex-start;
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

:deep(.project-form-section) {
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