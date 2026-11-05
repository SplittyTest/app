<template>
    <div class="project-form-section details">
        <div class="control-group">
            <div class="inner">
                <label class="control-label">Project Name:</label>
                <div class="controls">
                    <div class="field">
                        <FieldValidation name="name" :value="project.name" v-slot="{ error_message }" :validator="validator" :rules="validationRules.name">
                            <InputText fluid v-model="project.name" :invalid="!!error_message" autofocus />
                            <FormError :error="error_message"/>
                        </FieldValidation>
                    </div>
                </div>
            </div>
        </div>
        <div class="control-group">
            <div class="inner">
                <label class="control-label">Project ID:</label>
                <div class="controls">
                    <div class="field">
                        <FieldValidation name="id" :value="projectId" v-slot="{ error_message }" :validator="validator" :rules="validationRules.id">
                            <InputText fluid v-model.trim="projectId" :invalid="!!error_message" :disabled="!isNew" autofocus />
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
                        <Select fluid v-model="project.type" :options="type_options" option-label="label" option-value="value"/>
                    </div>
                </div>
            </div>
        </div>
        <div class="control-group">
            <div class="inner">
                <label class="control-label">Description:</label>
                <div class="controls">
                    <div class="field">
                        <FieldValidation name="description" :value="project.description" v-slot="{ error_message }" :validator="validator" :rules="validationRules.description">
                            <InputText fluid v-model="project.description" :invalid="!!error_message"/>
                            <FormError :error="error_message"/>
                        </FieldValidation>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { rules } from '@splittytest/validation';
import { snakeCase } from 'lodash-es';
import { defineComponent } from 'vue';

export default defineComponent({
    name: 'ProjectFormDetails',
    props: {
        project: {
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
            return !this.$route.params.project_id;
        },
        projectId: {
            get() {
                return this.project.id;
            },
            set(new_value: string) {
                this.project.id = snakeCase(new_value);
            }
        },
        validationRules() {
            return {
                id: [
                    rules.required('An ID is required'),
                    async (v: string) => {
                        if (this.isNew) {
                            const { data: projects } = await this.$API.get(`/api/projects`);
                            if (Array.isArray(projects)) {
                                const project_ids = projects.map((project) => {
                                    return project.id;
                                });
                                if (project_ids.includes(v)) {
                                    return 'Another project is already using that ID';
                                }
                            }
                        }
                        return null;
                    }
                ],
                name: [
                    rules.required('A project name is required')
                ],
                description: [
                    rules.required('A description is required')
                ]
            }
        }
    },
    watch: {
        'project.name': {
            handler(new_value) {
                if (this.isNew) {
                    this.project.id = snakeCase(new_value);
                }
            }
        }
    },
});
</script>
