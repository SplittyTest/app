<template>
    <div class="settings-form">
        <div class="flex items-center justify-between mb-3">
            <hgroup class="flex items-center gap-2">
                <div class="page-icon bg-accent small">
                    <Icon type="webhook" color="white" size="20px"/>
                </div>
                <h2>Webhooks</h2>
            </hgroup>
            <div class="flex-row">
                <Button label="New Webhook" @click="editWebhook('new')">
                    <template #icon>
                        <Icon type="Add" color="white" size="20px"/>
                    </template>
                </Button>
            </div>
        </div>
        <Datatable
            :value="webhooks"
            sortable
            sort-field="name"
            :sort-order="1"
            :rows="25"
            paginator
        >
            <template #empty>
                <div class="flex flex-col items-center gap-4 py-8">
                    <Icon type="Webhook" size="48px" color="gray-400"/>
                    <div class="text-center text-gray-500">
                        <h2 class="text-lg!">No Webhooks Yet</h2>
                        <p class="text-sm">Create webhooks to trigger events from your tests.</p>
                    </div>
                    <Button label="New Webhook" @click="editWebhook('new')">
                        <template #icon>
                            <Icon type="Add"/>
                        </template>
                    </Button>
                </div>
            </template>
            <Column field="name" header="Name" sortable>
                <template #body="{ data: webhook }">
                    <strong class="text-lg">{{webhook.name}}</strong><br>
                    <div class="text-sm text-gray-400">{{ webhook.url }}</div>
                </template>
            </Column>
            <Column field="subject_id" header="Subject" sortable>
                <template #body="{ data: webhook }">
                    {{ subjectName(webhook.subject_id) }}
                </template>
            </Column>
            <Column field="events" header="Events">
                <template #body="{ data: webhook }">
                    <div v-for="event in webhook.events" class="text-sm">{{ event }}</div>
                </template>
            </Column>
            <Column field="active" header="Active" header-class="text-center" class="text-center">
                <template #body="{ data: webhook }">
                    <Icon v-if="webhook.active" type="Check" color="green" size="24px"/>
                </template>
            </Column>
            <Column>
                <template #body="{data: webhook}">
                    <div class="flex justify-end gap-1">
                        <Button v-tooltip.top="'Edit Webhook'" @click="editWebhook(webhook.id)">
                            <template #icon>
                                <Icon type="Edit" color="white" size="20px"/>
                            </template>
                        </Button>
                        <ConfirmDelete v-tooltip.top="'Delete Webhook'" :id="webhook.id" message="Are you sure you want to delete this webhook?" @accept="deleteWebhook(webhook.id)"/>
                    </div>
                </template>
            </Column>
        </Datatable>
        <WebhookFormModal ref="webhook_form_modal" :webhook-id="selected_webhook_id" @refreshList="getWebhooks(true)"/>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import WebhookFormModal from './WebhookFormModal.vue';

export default defineComponent({
    name : 'Webhooks',
    components: {
        WebhookFormModal
    },
    data() {
        return {
            selected_webhook_id: 'new',
            webhooks: []
        };
    },
    computed: {
        
    },
    methods: {
        subjectName(subject_id: string) {
            const subject = this.$sessionStore.subject_options.find((option: any) => {
                return option.value === subject_id;
            });
            return subject ? subject.label : 'Unknown';
        },
        async getWebhooks(refresh = false) {
            if (refresh) {
                const { data } = await this.$API.get('/api/webhooks?refresh=true');
                this.webhooks = data;
            }
            else {  
                const { data } = await this.$API.get('/api/webhooks');
                this.webhooks = data;
            }
        },
        editWebhook(webhook_id: string) {
            this.selected_webhook_id = webhook_id;

            this.$nextTick(() => {
                const webhook_modal_instance = this.$refs.webhook_form_modal as InstanceType<typeof WebhookFormModal>;
                webhook_modal_instance.open();
            });
        },
        deleteWebhook(webhook_id: string) {
            this.$API.delete(`/api/webhooks/${webhook_id}`).then(() => {
                this.getWebhooks(true);
            });
        }
    },
    beforeMount() {
        this.getWebhooks();
    },
});
</script>

<style lang="less">

</style>