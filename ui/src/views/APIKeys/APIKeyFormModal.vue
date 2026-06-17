<template>
    <Dialog v-model:visible="show_modal" modal class="bordered w-full max-w-60">
        <template #header>
            <div class="flex-row">
                <Icon type="Key" size="20px"/>
                <strong>{{ isNew ? 'New API Key' : 'Edit API Key' }}</strong>
            </div>
        </template>

        <!-- START FORM -->
        <div class="control-group">
            <div class="inner">
                <label class="control-label">Name:</label>
                <div class="controls">
                    <div class="field">
                        <FieldValidation name="name" :value="api_key.name" v-slot="{ error_message }" :validator="validator" :rules="validationRules.name">
                            <InputText fluid v-model="api_key.name"/>
                            <FormError :error="error_message"/>
                        </FieldValidation>
                    </div>
                </div>
            </div>
        </div>
        <div class="control-group">
            <div class="inner">
                <label class="control-label">Subject:</label>
                <div class="controls">
                    <div class="field">
                        <FieldValidation name="subject_id" :value="api_key.subject_id" v-slot="{ error_message }" :validator="validator" :rules="validationRules.subject_id">
                            <Select fluid v-model="api_key.subject_id" :options="$sessionStore.subject_options" option-label="label" option-value="value" placeholder="Select a subject"/>
                            <FormError :error="error_message"/>
                        </FieldValidation>
                    </div>
                </div>
            </div>
        </div>
        <div class="control-group">
            <div class="inner">
                <label class="control-label">IP Whitelist:</label>
                <div class="text-sm text-gray-400">Used to limit where requests can be made from</div>
                <div class="controls">
                    <div class="field">
                        <FieldValidation name="ip_whitelist" :value="api_key.ip_whitelist" v-slot="{ error_message }" :validator="validator" :rules="validationRules.ip_whitelist">
                            <Chips fluid v-model="api_key.ip_whitelist" unique placeholder="Valid IP addresss or CIDR ranges only"/>
                            <FormError :error="error_message"/>
                        </FieldValidation>
                    </div>
                </div>
            </div>
        </div>
        <div class="control-group">
            <div class="inner">
                <label class="control-label">Domain Whitelist:</label>
                <div class="text-sm text-gray-400">Used for CORS when restricting access to specific domains or subdomains</div>
                <div class="controls">
                    <div class="field">
                        <FieldValidation name="domain_whitelist" :value="api_key.domain_whitelist" v-slot="{ error_message }" :validator="validator" :rules="validationRules.domain_whitelist">
                            <Chips fluid v-model="api_key.domain_whitelist" unique placeholder="Domains or subdomains"/>
                            <FormError :error="error_message"/>
                        </FieldValidation>
                    </div>
                </div>
            </div>
        </div>
        <div class="control-group">
            <div class="inner">
                <label class="control-label">Status:</label>
                <div class="controls">
                    <div class="field">
                        <Select fluid v-model="api_key.status" :options="status_options" option-label="label" option-value="value"/>
                    </div>
                </div>
            </div>
        </div>
        <!-- END FORM -->

        <template #footer>
            <div class="flex-row gap-2 justify-end">
                <Button label="Cancel" text @click="close"/>
                <Button label="Save" @click="saveAPIKey"/>
            </div>
        </template>
    </Dialog>
</template>

<script lang="ts">
import { cloneDeep, omit } from 'lodash-es';
import { defineComponent } from 'vue';
import { useFormValidator, rules } from '@splitty-test/validation';

const default_api_key = {
    prefix: '',
    name: '',
    subject_id: '',
    key: '',
    ip_whitelist: [],
    domain_whitelist: [],
    status: 'active',
};

export default defineComponent({
    name : 'ApiKeyFormModal',
    props : {
        apiKeyPrefix: {
            type: [String, null],
            required: false
        }
    },
    emits: ['refreshList', 'saveNew'],
    data() {
        return {
            show_modal: false,
            api_key: {
                ...default_api_key
            },
            status_options: [
                { label: 'Active', value: 'active' },
                { label: 'Suspended', value: 'suspended' }
            ],
            validator: useFormValidator()
        };
    },
    computed: {
        isNew() {
            return this.apiKeyPrefix === 'new';
        },
        validationRules() {
            return {
                name: [
                    rules.required('A unique name is required for this API key')
                ],
                subject_id: [
                    rules.required('A subject is required for this API key')
                ],
                ip_whitelist: [
                    rules.minLength(1, 'At least one IP address or CIDR range is required'),
                    (value: string[]) => {
                        const ipRegex = /^(?:\d{1,3}\.){3}\d{1,3}(?:\/\d{1,2})?$/;
                        if (!value.every((item: string) => ipRegex.test(item))) {
                            return 'Valid IP addresss or CIDR ranges only';
                        }
                        return null;
                    }
                ],
                domain_whitelist: [
                    rules.minLength(1, 'At least one domain is required'),
                    (value: string[]) => {
                        const domainRegex = /^(([a-zA-Z0-9-]+|\*\.)*[a-zA-Z0-9-]+\.[a-z]{2,})$/;
                        if (!value.every((item: string) => {
                            if (item === '*') return true; // allow wildcard only entry
                            return domainRegex.test(item.trim());
                        })) {
                            return 'Valid domains or subdomains only';
                        }
                        return null;
                    }
                ]
            };
        }
    },
    methods: {
        async open() {
            if (!this.isNew) {
                await this.getAPIKey();
            } else {
                this.reset();
                this.validator.reset();
            }
            this.show_modal = true;
        },
        close() {
            this.show_modal = false;
        },
        async getAPIKey() {
            const { data } = await this.$API.get(`/api/api-keys/${this.apiKeyPrefix}`);
            this.api_key = { ...default_api_key, ...omit(data, ['key', 'created_at', 'modified_at']) };
        },
        async saveAPIKey() {
            const is_valid = await this.validator.validate();

            if (is_valid) {
                let status;
                let data: Record<string, any> = {};
                const new_value: Record<string, any> = cloneDeep(this.api_key);
                
                if (this.isNew) {
                    ({ status, data } = await this.$API.post('/api/api-keys', { api_key: new_value }));
                }
                else {
                    ({ status } = await this.$API.patch(`/api/api-keys/${this.apiKeyPrefix}`, { api_key: new_value }));
                }
                
                if (status < 300) {
                    this.$toast.add({
                        severity: 'success',
                        summary: 'API Key Saved',
                        detail: 'The API key was successfully saved',
                        life: 3000
                    });
                    this.$emit('refreshList');
                    this.$emit('saveNew', data.key);
                    this.close();
                }
            }
        },
        reset() {
            this.api_key = { ...default_api_key };
        }
    }
});
</script>

<style scoped lang="less">

</style>