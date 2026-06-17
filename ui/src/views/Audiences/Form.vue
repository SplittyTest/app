<template>
    <div class="page">
        <hgroup class="flex items-center gap-2 mb-3">
            <div class="page-icon bg-brand">
                <Icon type="Groups" color="white" size="28px"/>
            </div>
            <h1>{{ is_new ? 'New Audience' : 'Edit Audience' }}</h1>
        </hgroup>
        <div class="page-content">
            <Message v-if="in_active_tests" severity="warn" class="mb-2">
                <template #icon>
                    <Icon type="Error" color="yellow" size="48px"/>
                </template>
                This audience is currently in use by active tests. Making changes to this audience may affect the accuracy and results of those tests. Exercise caution when making changes to audiences that are in use.
            </Message>
            <Card class="max-w-90">
                <template #content>
                    <div class="audience-form">
                        <div class="control-group">
                            <div class="inner">
                                <label class="control-label">Subject:</label>
                                <div class="controls">
                                    <div class="field">
                                        <FieldValidation name="subject_id" :value="audience.subject_id" el=".p-select-label" v-slot="{ error_message }" :validator="validator" :rules="validationRules.subject_id">
                                            <Dropdown fluid v-model="audience.subject_id" :options="$sessionStore.subject_options" option-label="label" option-value="value" placeholder="Select Subject"/>
                                            <FormError :error="error_message"/>
                                        </FieldValidation>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="control-group">
                            <div class="inner">
                                <label class="control-label">Name:</label>
                                <div class="controls">
                                    <div class="field">
                                        <FieldValidation name="name" :value="audience.name" v-slot="{ error_message }" :validator="validator" :rules="validationRules.name">
                                            <InputText fluid v-model="audience.name" :invalid="!!error_message" autofocus />
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
                                        <FieldValidation name="description" :value="audience.description" v-slot="{ error_message }" :validator="validator" :rules="validationRules.description">
                                            <Textarea fluid v-model="audience.description" :invalid="!!error_message"/>
                                            <FormError :error="error_message"/>
                                        </FieldValidation>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <FieldSet legend="Filter Rules">
                            <FilterMatch v-model="audience.filters" :validator="validator" />
                        </FieldSet>
                    </div>
                </template>
                <template #footer>
                    <div class="flex-row justify-end">
                        <Button text severity="secondary" label="Cancel" @click="$router.push('/audiences')" />
                        <Button label="Save Audience" @click="saveAudience()">
                            <template #icon>
                                <Icon type="Check" color="white" size="20px"/>
                            </template>
                        </Button>
                    </div>
                </template>
            </Card>
        </div>
    </div>
</template>

<script lang="ts">
import { cloneDeep } from 'lodash-es';
import { useFormValidator, rules } from '@splitty-test/validation';

const default_audience = {
    id: null as string | null,
    name: '' as string,
    description: '' as string,
    subject_id: null as string | null,
    filters: [] as any[]
};

export default {
    name : 'AudienceForm',
    data() {
        return {
            audience: cloneDeep(default_audience) as any,
            in_active_tests: false,
            is_new: false,
            validator: useFormValidator()
        };
    },
    computed: {
        validationRules() {
            return {
                name: [
                    rules.required('An name is required')
                ],
                description: [
                    rules.required('A description is required')
                ],
                subject_id: [
                    rules.required('A subject is required')
                ]
            }
        },
    },
    methods: {
        async getActiveTests(audience_id: string) {
            const { data } = await this.$API.get(`/api/audiences/${audience_id}/active-tests`);
            if (data && data.active_tests) {
                this.in_active_tests = true;
            }
        },
        async getAudience(audience_id: string) {
            const { data } = await this.$API.get(`/api/audiences/${audience_id}`);
            this.audience = data;
        },
        async saveAudience() {
            const is_valid = await this.validator.validate();

            if (is_valid) {
                let status;
                const new_value: Record<string, any> = cloneDeep(this.audience);
                if (this.is_new) {
                    ({ status } = await this.$API.post('/api/audiences', { audience: new_value }));
                }
                else {
                    ({ status } = await this.$API.patch(`/api/audiences/${this.audience.id}`, { audience: new_value }));
                }
                
                if (status < 300) {
                    this.$toast.add({
                        severity: 'success',
                        summary: 'Audience Saved',
                        detail: 'The audience was successfully saved',
                        life: 3000
                    });
                    this.$router.push({ name: 'AudiencesList' });
                }
            }
        }
    },
    async beforeMount() {
        if (this.$route.params.audience_id) {
            await this.getAudience(this.$route.params.audience_id as string);
            await this.getActiveTests(this.$route.params.audience_id as string);
        }
        else {
            this.is_new = true;

            if (this.$route.query.duplicate_audience_id) {
                await this.getAudience(this.$route.query.duplicate_audience_id as string);
                this.audience.id = null;
                this.audience.name = `${this.audience.name} (Copy)`;
            }
        }
    }
}
</script>

<style lang="less" scoped>
.page {
    margin: 0 auto;
    max-width: 900px;
    width: 100%;
}
</style>