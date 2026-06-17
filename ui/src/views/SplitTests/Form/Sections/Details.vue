<template>
    <div class="test-form-section details">
        <p>Enter unique details to identify this test...</p>

        <!-- Name -->
        <div class="control-group">
            <div class="inner">
                <label class="control-label">Split Test Name:</label>
                <div class="controls">
                    <div class="field">
                        <FieldValidation name="name" :value="test.name" v-slot="{ error_message }" :validator="validator" :rules="validationRules.name">
                            <InputText fluid v-model="test.name" :invalid="!!error_message" placeholder="Enter a unique and descriptive name for this test" autofocus />
                            <FormError :error="error_message"/>
                        </FieldValidation>
                    </div>
                </div>
            </div>
        </div>

        <!-- Description -->
        <div class="control-group">
            <div class="inner">
                <label class="control-label">Description:</label>
                <div class="controls">
                    <div class="field">
                        <Textarea fluid v-model="test.description" auto-resize placeholder="Optional description..." />
                    </div>
                </div>
            </div>
        </div>
        <div class="grid grid-cols-2 gap-3">

            <!-- Subject -->
            <div class="control-group">
                <div class="inner">
                    <label class="control-label">Subject:</label>
                    <div class="controls">
                        <div class="field">
                            <FieldValidation name="subject_id" :value="test.subject_id" v-slot="{ error_message }" el=".p-select-label" :validator="validator" :rules="validationRules.subject_id">
                                <Select
                                    fluid
                                    v-model="test.subject_id"
                                    :invalid="!!error_message"
                                    :options="$sessionStore.subject_options"
                                    option-label="label"
                                    option-value="value"
                                    placeholder="Select Subject"
                                    :disabled="!isPending"
                                >
                                </Select>
                                <FormError :error="error_message"/>
                            </FieldValidation>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Section -->
            <div class="control-group">
                <div class="inner">
                    <label class="control-label">Section:</label>
                    <div class="controls">
                        <div class="field">
                            <FieldValidation name="section_id" :value="test.section_id" v-slot="{ error_message }" el=".p-select-label" :validator="validator" :rules="validationRules.section_id">
                                <Select fluid v-model="test.section_id" :invalid="!!error_message" :options="sectionOptions" option-label="label" option-value="value"  placeholder="Select Section" :disabled="!isPending">
                                    <template #option="{ option }">
                                        <div class="section-option">
                                            <div class="section-name font-mono text-sm text-accent-500">{{ option.label }}</div>
                                            <div class="section-description text-sm text-gray-400">{{ option.description }}</div>
                                        </div>
                                    </template>
                                </Select>
                                <FormError :error="error_message"/>
                            </FieldValidation>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { rules } from '@splitty-test/validation';

export default defineComponent({
    name : 'SplitTestFormDetails',
    props : {
        test : {
            type : Object,
            required : true,
        },
        validator : {
            type : Object,
            required : true,
        }
    },
    computed: {
        isPending() {
            return this.test.status === 'pending';
        },
        sectionOptions() {
            if (this.test.subject_id) {
                const selected_subject = this.$sessionStore.subject_options.find((option: any) => option.value === this.test.subject_id);
                if (selected_subject) {
                    return selected_subject.sections;
                }
            }
            return [];
        },
        validationRules() {
            return {
                name: [
                    rules.required('A test name is required')
                ],
                subject_id: [
                    rules.required('A subject for this test is required')
                ],
                section_id: [
                    rules.required('A section for this test is required')
                ],
                variations: [
                    rules.minLength(2, 'At least 2 variations are required')
                ]
            };
        },
    },

});
</script>

<style lang="less">

</style>