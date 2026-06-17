<template>
    <Dialog v-model:visible="show_modal" modal class="w-full max-w-70">
        <template #header>
            <div class="flex-row">
                <Icon type="Webhook" size="20px"/>
                <strong>{{ isNew ? 'New Webhook' : 'Edit Webhook' }}</strong>
            </div>
        </template>

        <!-- START FORM -->
        <div class="control-group">
            <div class="inner">
                <label class="control-label">Name:</label>
                <div class="controls">
                    <div class="field">
                        <FieldValidation name="name" :value="webhook.name" v-slot="{ error_message }" :validator="validator" :rules="validationRules.name">
                            <InputText fluid v-model="webhook.name"/>
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
                        <FieldValidation name="subject_id" :value="webhook.subject_id" v-slot="{ error_message }" :validator="validator" :rules="validationRules.subject_id">
                            <Select fluid v-model="webhook.subject_id" :options="$sessionStore.subject_options" option-label="label" option-value="value" placeholder="Select a subject"/>
                            <FormError :error="error_message"/>
                        </FieldValidation>
                    </div>
                </div>
            </div>
        </div>
        <div class="control-group">
            <div class="inner">
                <label class="control-label">Event Types:</label>
                <div class="controls">
                    <div class="field">
                        <MultiSelect
                            fluid
                            v-model="webhook.events"
                            :options="event_options"
                            option-label="label"
                            option-value="value"
                            :max-selected-labels="1"
                            :show-toggle-all="false"
                            placeholder="Select event triggers..."
                        >
                            <template #option="{ option }">
                                <div class="ml-1">
                                    <strong>{{option.label}}</strong>
                                    <div class="text-sm text-gray-400">{{option.description}}</div>
                                </div>
                            </template>
                        </MultiSelect>
                    </div>
                </div>
            </div>
        </div>

        <div class="request-settings bg-gray-50 border border-gray-200 p-2 pt-1.5 mt-3 mb-1 rounded-lg">
            <h3 class="font-bold mb-1">Request Settings</h3>
            <div class="control-group">
                <div class="inner">
                    <div class="controls">
                        <div class="field max-w-12">
                            <label class="control-label">Method:</label>
                            <Select fluid v-model="webhook.method" :options="method_options" option-label="label" option-value="value"/>
                        </div>
                        <div class="field">
                            <label class="control-label">URL:</label>
                            <InputText fluid v-model="webhook.url" placeholder="https://"/>
                        </div>
                    </div>
                </div>
            </div>
            <Fieldset legend="Headers" class="mb-2">
                <div class="headers">
                    <template v-for="(header, index) in webhook_headers" :key="index">
                        <div class="control-group mb-1!">
                            <div class="inner">
                                <div class="controls gap-1!">
                                    <div class="field">
                                        <FieldValidation :name="`header_${index}_key`" :value="header.key" v-slot="{ error_message }" :validator="validator" :rules="validationRules.header_key">
                                            <InputText fluid v-model="header.key" placeholder="Header Key"/>
                                            <FormError :error="error_message"/>
                                        </FieldValidation>
                                    </div>
                                    <div class="field">
                                        <FieldValidation :name="`header_${index}_value`" :value="header.value" v-slot="{ error_message }" :validator="validator" :rules="validationRules.header_value">
                                            <InputText fluid v-model="header.value" placeholder="Header Value"/>
                                            <FormError :error="error_message"/>
                                        </FieldValidation>
                                    </div>
                                    <div class="field fit">
                                        <Button @click="removeHeader(index)">
                                            <template #icon>
                                                <Icon type="Close" color="white" size="24px"/>
                                            </template>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </template>
                </div>
                 <Button label="Add Header" @click="addHeader">
                    <template #icon>
                        <Icon type="Add" size="20px"/>
                    </template>
                </Button>
            </Fieldset>

            <div class="control-group">
                <div class="inner">
                    <label class="control-label">Extend Payload:</label>
                    <div class="controls">
                        <div class="field">
                            <JsonEditor :max-lines="20" v-model="webhook.body"/>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <Fieldset legend="Data Filters" class="mb-2">
            <FilterMatch v-model="webhook.filters" :validator="validator" />
        </Fieldset>

        <div class="control-group p-2 border border-gray-200 rounded-lg">
            <div class="inner">
                <div class="controls">
                    <div class="field">
                        <div class="flex-row">
                            <ToggleSwitch input-id="active" v-model="webhook.active"/>
                            <label for="active">Enable Webhook</label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <!-- END FORM -->

        <template #footer>
            <div class="flex-row gap-2 justify-end">
                <Button label="Cancel" text @click="close"/>
                <Button label="Save" @click="saveWebhook"/>
            </div>
        </template>
    </Dialog>
</template>

<script lang="ts">
import { cloneDeep } from 'lodash-es';
import { defineComponent } from 'vue';
import { useFormValidator, rules } from '@splitty-test/validation';

const default_webhook = {
    name: '',
    subject_id: null,
    events: [],
    url: 'https://',
    method: 'POST',
    headers: {},
    body: {},
    filters: [],
    active: true
};

export default defineComponent({
    name : 'WebhookFormModal',
    props : {
        webhookId: {
            type: String,
            required: true
        },
    },
    emits: ['refreshList'],
    data() {
        return {
            show_modal: false,
            webhook: cloneDeep(default_webhook),
            webhook_headers: [] as any[],
            event_options: [
                { label: 'Test Creation', value: 'test_create', description: 'When a new test is created' },
                { label: 'Test Status Change', value: 'test_status', description: 'When a test status changes (start, pause, stop)' },
                { label: 'Test Comment', value: 'test_comment', description: 'When a new comment is added to a test' },
                { label: 'Test Calculation', value: 'test_calculate', description: 'When the decision metric stats for a test are calculated' },
                { label: 'Variation Status Change', value: 'variation_status', description: 'When a variation status changes (active, paused, archived)' },
                { label: 'Variation Mode Change', value: 'variation_mode', description: 'When a variation mode changes (exploration, consideration, failure)' },
            ],
            method_options: [
                { label: 'POST', value: 'POST' },
                { label: 'GET', value: 'GET' },
            ],
            validator: useFormValidator()
        };
    },
    computed: {
        isNew() {
            return this.webhookId === 'new';
        },
        validationRules() {
            return {
                name: [
                    rules.required('A name is required')
                ],
                header_key: [
                    rules.required('A header key is required')
                ],
                header_value: [
                    rules.required('A header value is required')
                ]
            }
        },
    },
    methods: {
        async open() {
            if (!this.isNew) {
                await this.getWebhook();
            } else {
                this.reset();
                this.validator.reset();
            }
            this.show_modal = true;
        },
        close() {
            this.show_modal = false;
        },
        async getWebhook() {
            const { data } = await this.$API.get(`/api/webhooks/${this.webhookId}`);
            this.webhook = { ...default_webhook, ...data };
            if (this.webhook.headers && typeof this.webhook.headers === 'object') {
                this.webhook_headers = Object.entries(this.webhook.headers).map(([key, value]) => ({ key, value }));
            }
        },
        addHeader() {
            this.webhook_headers.push({ key: '', value: '' });
        },
        removeHeader(index: number) {
            this.webhook_headers.splice(index, 1);
            this.validator.fields[`header_${index}_key`].reset();
            this.validator.removeField(`header_${index}_key`);
            this.validator.fields[`header_${index}_value`].reset();
            this.validator.removeField(`header_${index}_value`);
        },
        async saveWebhook() {
            const is_valid = await this.validator.validate();

            if (is_valid) {
                let status;
                const new_value: Record<string, any> = cloneDeep(this.webhook);

                if (this.webhook_headers.length > 0) {
                    new_value.headers = {};
                    this.webhook_headers.forEach((header: any) => {
                        if (header.key) {
                            new_value.headers[header.key] = header.value;
                        }
                    });
                }

                if (this.isNew) {
                    ({ status } = await this.$API.post('/api/webhooks', { webhook: new_value }));
                }
                else {
                    ({ status } = await this.$API.patch(`/api/webhooks/${this.webhookId}`, { webhook: new_value }));
                }
                
                if (status < 300) {
                    this.$toast.add({
                        severity: 'success',
                        summary: 'Webhook Saved',
                        detail: 'The webhook was successfully saved',
                        life: 3000
                    });
                    this.$emit('refreshList');
                    this.close();
                }
            }
        },
        reset() {
            this.webhook = cloneDeep(default_webhook);
            this.webhook_headers = [];
        }
    }
});
</script>

<style lang="less">

</style>