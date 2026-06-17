<template>
    <div class="subject-form-section details">
        <div class="control-group">
            <div class="inner">
                <label class="control-label">Test Subject Name:</label>
                <div class="controls">
                    <div class="field">
                        <FieldValidation name="name" :value="subject.name" v-slot="{ error_message }" :validator="validator" :rules="validationRules.name">
                            <InputText fluid v-model="subject.name" :invalid="!!error_message" autofocus />
                            <FormError :error="error_message"/>
                        </FieldValidation>
                    </div>
                </div>
            </div>
        </div>
        <div class="control-group">
            <div class="inner">
                <label class="control-label">Subject ID:</label>
                <div class="controls">
                    <div class="field">
                        <FieldValidation name="id" :value="subjectId" v-slot="{ error_message }" :validator="validator" :rules="validationRules.id">
                            <InputText fluid v-model.trim="subjectId" :invalid="!!error_message" :disabled="!isNew" autofocus />
                            <FormError :error="error_message"/>
                        </FieldValidation>
                    </div>
                </div>
            </div>
        </div>
        <div class="control-group">
            <div class="inner">
                <label class="control-label">Type:</label>
                <div class="controls">
                    <div class="field">
                        <Select fluid v-model="subject.type" :options="type_options" option-label="label" option-value="value"/>
                    </div>
                </div>
            </div>
        </div>
        <div class="control-group">
            <div class="inner">
                <label class="control-label">Description:</label>
                <div class="controls">
                    <div class="field">
                        <FieldValidation name="description" :value="subject.description" v-slot="{ error_message }" :validator="validator" :rules="validationRules.description">
                            <InputText fluid v-model="subject.description" :invalid="!!error_message"/>
                            <FormError :error="error_message"/>
                        </FieldValidation>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { rules } from '@splitty-test/validation';
import { snakeCase } from 'lodash-es';

export default defineComponent({
    name: 'SubjectFormDetails',
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
            type_options: [
                { label: 'Website', value: 'website' },
                { label: 'App', value: 'app' },
                { label: 'Other', value: 'other' },
            ],
        };
    },
    computed: {
        isNew() {
            return !this.$route.params.subject_id;
        },
        subjectId: {
            get() {
                return this.subject.id;
            },
            set(new_value: string) {
                this.subject.id = snakeCase(new_value);
            }
        },
        validationRules() {
            return {
                id: [
                    rules.required('An ID is required'),
                    async (v: string) => {
                        if (this.isNew) {
                            const { data: subjects } = await this.$API.get(`/api/subjects`);
                            if (Array.isArray(subjects)) {
                                const subject_ids = subjects.map((subject) => {
                                    return subject.id;
                                });
                                if (subject_ids.includes(v)) {
                                    return 'Another subject is already using that ID';
                                }
                            }
                        }
                        return null;
                    }
                ],
                name: [
                    rules.required('A subject name is required')
                ],
                description: [
                    rules.required('A description is required')
                ]
            }
        }
    },
    watch: {
        'subject.name': {
            handler(new_value) {
                if (this.isNew) {
                    this.subject.id = snakeCase(new_value);
                }
            }
        }
    },
});
</script>
