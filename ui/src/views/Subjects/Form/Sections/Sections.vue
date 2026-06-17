<template>
    <div class="subject-form-section">
        <div class="flex items-center justify-between mb-2">
            <div>
                <strong class="text-lg mb-0">Test Sections</strong>
                <div class="text-gray-500 text-sm mb-0">These are specific sections of your test subject you want to run tests against</div>
            </div>
            <Button label="Add Section" @click="editSection()">
                <template #icon>
                    <Icon type="Add" size="20px"/>
                </template>
            </Button>
        </div>
        <div v-for="(section, index) in subject.sections" :key="section.id!" class="section">
            <div class="flex items-center justify-between w-full">
                <div class="info">
                    <div class="id">{{ section.id }}</div>
                    <div class="description">{{ section.description }}</div>
                </div>
            </div>
            <div class="settings flex items-center gap-3">
                <div v-if="section.preview_url" class="preview-url">
                    <div class="flex items-center cursor-pointer" @click="openPreview(section.preview_url)">
                        <Icon type="Open In Browser" color="blue" size="24px" v-tooltip.top="'Preview'"/>
                    </div>
                </div>
                <template v-if="section.testing_enabled">
                    <div class="testing-enabled flex-row cursor-default" v-tooltip.top="'Testing Enabled'">
                        <Icon type="Inventory" color="green" size="24px"/>
                    </div>
                </template>
                <template v-else>
                    <div class="testing-enabled flex-row cursor-default" v-tooltip.top="'Testing Disabled'">
                        <Icon type="Content Paste Off" color="red" size="24px"/>
                    </div>
                </template>
                <div class="skip-test">
                    <div class="flex items-center cursor-default">
                        <Icon type="Next Plan" color="blue" size="24px" v-tooltip.top="'Skip Test Frequency'"/><div class="weight p-1">{{ section.skip_test_frequency || 0 }}</div>
                    </div>
                </div>
            </div>
            <div class="actions flex gap-1">
                <Button text rounded severity="secondary" :disabled="hasActiveTests(section.id)" v-tooltip.top="'Edit Section'" @click="editSection(section, index)">
                    <template #icon>
                        <Icon type="Edit" color="gray" size="20px"/>
                    </template>
                </Button>
                <ConfirmDelete
                    text
                    rounded
                    v-tooltip.top="'Delete Section'"
                    icon-color="red"
                    message="Are you sure you want to delete this section?"
                    :disabled="hasActiveTests(section.id)"
                    @accept="deleteSection(section.id)"
                />
            </div>
        </div>
        <SectionForm ref="section_form" v-model="selected_section" :section-ids="sectionIds" @save="saveSection" />
    </div>
</template>

<script lang="ts">
import { isNumber, sortBy, uniqueId } from 'lodash-es';
import { defineComponent } from 'vue';
import SectionForm from '../SectionForm.vue';

export default defineComponent({
    name: 'SubjectFormSections',
    components: {
        SectionForm,
    },
    props: {
        subject: {
            type: Object,
            required: true,
        },
        validator: {
            type: Object,
            required: true,
        }
    },
    data() {
        return {
            edit_index: null as number | null,
            selected_section: null as any,
            active_tests: [] as any[],
        };
    },
    computed: {
        sectionIds() {
            return this.subject.sections.map((v: any) => v.id);
        },
    },
    methods: {
        editSection(section?: any, index?: number) {
            if(isNumber(index)) {
                this.edit_index = index;
            }
            else {
                this.edit_index = null;
            }

            const section_form = this.$refs.section_form as InstanceType<typeof SectionForm>;
            if (section) {
                this.selected_section = section;
                section_form.loadSection(section);
            }
            else {
                section_form.loadSection({
                    id: uniqueId('section_'),
                    description: '',
                    preview_url: '',
                    data: {},
                    max_concurrent_tests: 1,
                    testing_enabled: true,
                    skip_test_frequency: 0,
                    archived: false,
                });
            }
            section_form.validator.reset();
            section_form.show_modal = true;
        },
        saveSection(new_section: any) {
            if (isNumber(this.edit_index)) {
                this.subject.sections.splice(this.edit_index, 1, new_section);
            }
            else {
                this.subject.sections.push(new_section);
            }

            // Sort the sections by ID
            this.subject.sections = sortBy(this.subject.sections, ['id']);
        },
        deleteSection(section_id: string | null) {
            const section_index = this.subject.sections.findIndex((section: any) => {
                return section.id === section_id;
            });
            this.subject.sections.splice(section_index, 1);
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
    }
});
</script>

<style scoped lang="less">
.section {
    align-items: center;
    border: 1px solid var(--color-gray-300);
    border-radius: 4px;
    box-shadow: 0 2px 0 0 rgba(0,0,0,0.1);
    display: flex;
    gap: 1em;
    justify-content: space-between;
    margin-bottom: 1em;
    
    & > div {
        padding: 1em 1.5em;
    }

    .id {
        color: var(--color-accent-500);
        font-family: var(--font-mono);
        font-size: var(--text-sm);
        font-weight: bold;
    }

    .description {
        color: var(--color-gray-400);
        font-size: var(--text-sm);
    }

    .actions {
        border-left: 1px solid var(--color-gray-200);
        padding-left: 2em;
    }

    &.selected {
        background-color: var(--color-brand-50);
        border-color: var(--color-brand-200);
    }
}

:deep(.p-inputnumber-input) {
    text-align: center;
}
</style>