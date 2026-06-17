<template>
    <Dialog v-model:visible="show_modal" :close-on-escape="false" modal class="bordered max-w-75">
        <template #header>
            <div class="h-flex">
                <Icon type="View Stream" size="24px"/>
                Edit Section
            </div>
        </template>
        <div class="control-group">
            <div class="inner">
                <label class="control-label">Section ID:</label>
                <div class="controls">
                    <div class="field">
                        <FieldValidation name="id" :value="sectionId" v-slot="{ error_message }" :validator="validator" :rules="validationRules.id">
                            <InputText fluid v-model="sectionId" :invalid="!!error_message" autofocus />
                            <FormError :error="error_message"/>
                        </FieldValidation>
                    </div>
                </div>
            </div>
        </div>
        <div class="control-group">
            <div class="inner">
                <label class="control-label">Description:</label>
                <div class="controls">
                    <div class="field">
                        <FieldValidation name="description" :value="local_section.description" v-slot="{ error_message }" :validator="validator" :rules="validationRules.description">
                            <InputText fluid v-model="local_section.description" :invalid="!!error_message" />
                            <FormError :error="error_message"/>
                        </FieldValidation>
                    </div>
                </div>
            </div>
        </div>
        <div class="control-group">
            <div class="inner">
                <label class="control-label">Preview URL:</label>
                <div class="controls">
                    <div class="field">
                        <FieldValidation name="preview_url" :value="local_section.preview_url" v-slot="{ error_message }" :validator="validator" :rules="validationRules.preview_url">
                            <InputText fluid v-model="local_section.preview_url" :invalid="!!error_message" />
                            <FormError :error="error_message"/>
                        </FieldValidation>
                    </div>
                </div>
            </div>
        </div>
        <div class="control-group">
            <div class="inner">
                <label class="control-label">Data:</label>
                <div class="controls">
                    <div class="field">
                        <JsonEditor v-model="local_section.data"/>
                    </div>
                </div>
            </div>
        </div>
        <div class="control-group alt">
            <div class="inner">
                <div class="controls">
                    <div class="field alt-label max-w-[75%]">
                        <strong>Testing Enabled</strong>
                        <div class="description">Allow tests to run on this section</div>
                    </div>
                    <div class="field max-w-5">
                        <ToggleSwitch fluid v-model="local_section.testing_enabled"/>
                    </div>
                </div>
            </div>
        </div>
        <template v-if="local_section.testing_enabled">
            <div class="control-group alt">
                <div class="inner">
                    <div class="controls">
                        <div class="field alt-label max-w-[75%]">
                            <strong>Max Concurrent Tests</strong>
                            <div class="description">The maximum number of tests that can concurrently run on this section</div>
                        </div>
                        <div class="field max-w-6">
                            <InputNumber fluid v-model="local_section.max_concurrent_tests" class="input-center"/>
                        </div>
                    </div>
                </div>
            </div>
            <div class="control-group alt">
                <div class="inner">
                    <div class="controls">
                        <div class="field alt-label max-w-[75%]">
                            <strong>Skip Test Frequency</strong>
                            <div class="description">How often during a rotation that serving a test is skipped</div>
                        </div>
                        <div class="field max-w-6">
                            <InputNumber fluid v-model="local_section.skip_test_frequency" class="input-center"/>
                        </div>
                    </div>
                </div>
            </div>
        </template>
        <template #footer>
            <div class="flex-row">
                <Button text severity="secondary" @click="show_modal = false">Cancel</Button>
                <Button @click="saveSection">
                    <Icon type="Check" size="20px"/>
                    Save Section
                </Button>
            </div>
        </template>
    </Dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import JsonEditor from '@components/JsonEditor.vue';
import { cloneDeep, isEmpty, isNumber, snakeCase } from 'lodash-es';
import { useFormValidator, rules } from '@splitty-test/validation';

export default defineComponent({
    name: 'SectionForm',
    emits: [
        'save',
        'cancel'
    ],
    components: {
        JsonEditor
    },
    props: {
        modelValue: {
            type: [Object, null],
            default() {
                return {
                    id: null,
                    description: '',
                    preview_url: '',
                    data: {},
                    max_concurrent_tests: 1,
                    testing_enabled: true,
                    skip_test_frequency: 0,
                    archived: false,
                };
            }
        },
        sectionIds: {
            type: Array,
            default() {
                return [];
            }
        }
    },
    data() {
        return {
            local_section: {
                id: null as string | null,
                description: '',
                preview_url: '',
                data: {},
                max_concurrent_tests: 1,
                testing_enabled: true,
                skip_test_frequency: 0,
                archived: false
            },
            show_modal: false,
            validator: useFormValidator()
        }
    },
    computed: {
        validationRules() {
            return {
                id: [
                    rules.required('An ID for this section is required'),
                    (value: any) => {
                        // The ID was not changed
                        if (!isEmpty(this.modelValue) && this.modelValue.id === value) {
                            return null;
                        }
                        else if (this.sectionIds.includes(value)) {
                            return 'Another section is already using this ID';
                        }
                        return null;
                    }
                ],
                description: [rules.required('A description is required')],
                preview_url: [
                    (value: any) => {
                        if (isEmpty(value)) {
                            return null;
                        }
                        // Simple URL validation
                        const url_pattern = /^(https?:\/\/)?([\w-]+(\.[\w-]+)+)(\/[\w-]*)*\/?/;
                        if (!url_pattern.test(value)) {
                            return 'Please enter a valid URL';
                        }
                        return null;
                    }
                ]
            };
        },
        sectionId: {
            get() {
                return this.local_section.id;
            },
            set(new_value: string) {
                this.local_section.id = snakeCase(new_value);
            }
        }
    },
    watch: {
        modelValue: {
            handler(new_value) {
                this.loadSection(new_value);
            },
            immediate: true,
        }
    },
    methods: {
        loadSection(section: any) {
            this.local_section = cloneDeep(section);
        },
        async saveSection() {
            // Validate
            const is_valid = await this.validator.validate();
            if (is_valid) {
                if (!isNumber(this.local_section.max_concurrent_tests)) {
                    this.local_section.max_concurrent_tests = 1;
                }
                if (!isNumber(this.local_section.skip_test_frequency)) {
                    this.local_section.skip_test_frequency = 0;
                }
                this.$emit('save', this.local_section);
                this.show_modal = false;
            }
        }
    }
});
</script>