<template>
    <div class="settings-form">
        <div class="flex items-center justify-between mb-3">
            <hgroup class="flex items-center gap-2">
                <div class="page-icon bg-accent small">
                    <Icon type="Key" color="white" size="20px"/>
                </div>
                <h2>API Keys</h2>
            </hgroup>
            <div class="flex-row">
                <Button label="New API Key" @click="editAPIKey('new')">
                    <template #icon>
                        <Icon type="Add" color="white" size="20px"/>
                    </template>
                </Button>
            </div>
        </div>
        <Datatable
            :value="api_keys"
            sortable
            sort-field="name"
            :sort-order="1"
            :rows="25"
            paginator
        >
            <template #empty>
                <div class="flex flex-col items-center gap-4 py-8">
                    <Icon type="Key" size="48px" color="gray-400"/>
                    <div class="text-center text-gray-500">
                        <h2 class="text-lg!">No API Keys Yet</h2>
                        <p class="text-sm">Create API keys to start running tests on a subject.</p>
                    </div>
                    <Button label="New API Key" @click="editAPIKey('new')">
                        <template #icon>
                            <Icon type="Add"/>
                        </template>
                    </Button>
                </div>
            </template>
            <Column field="name" header="Name" sortable>
                <template #body="{ data: api_key }">
                    <strong class="text-lg">{{ api_key.name }}</strong>
                    <div class="text-sm text-gray-400">{{ api_key.prefix }}-???</div>
                </template>
            </Column>
            <Column field="subject_id" header="Subject" sortable>
                <template #body="{ data: api_key }">
                    {{ subjectName(api_key.subject_id) }}
                </template>
            </Column>
            <Column field="status" header="Status" sortable header-class="text-center" class="text-center">
                <template #body="{ data: api_key }">
                    {{ title(api_key.status) }}
                </template>
            </Column>
            <Column field="created_at" header="Created At" sortable header-class="text-center" class="text-center">
                <template #body="{ data: api_key }">
                    {{ dateFormat(api_key.created_at) }}
                </template>
            </Column>
            <Column>
                <template #body="{data: api_key}">
                    <div class="flex justify-end gap-1">
                        <Button v-tooltip.top="'Edit API Key'" @click="editAPIKey(api_key.prefix)">
                            <template #icon>
                                <Icon type="Edit" color="white" size="20px"/>
                            </template>
                        </Button>
                        <Button v-tooltip.top="'Generate New Key'" @click="generateNewKey(api_key.prefix)">
                            <template #icon>
                                <Icon type="Lock Reset" color="white" size="24px"/>
                            </template>
                        </Button>
                        <ConfirmDelete v-tooltip.top="'Delete API Key'" :id="api_key.prefix" message="Are you sure you want to delete this API key?" @accept="deleteAPIKey(api_key.prefix)"/>
                    </div>
                </template>
            </Column>
        </Datatable>
        <ApiKeyFormModal :api-key-prefix="selected_api_key_prefix" ref="api_key_modal" @saveNew="openDisplayModal" @refreshList="getAPIKeys(true)"/>
        <APIKeyDisplayModal ref="api_key_display_modal"/>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { dateFormat, title } from '@lib/filters';
import ApiKeyFormModal from './APIKeyFormModal.vue';
import APIKeyDisplayModal from './APIKeyDisplayModal.vue';

export default defineComponent({
    name : 'APIKeysList',
    components: {
        ApiKeyFormModal,
        APIKeyDisplayModal
    },
    data() {
        return {
            api_keys: [] as any[],
            selected_api_key_prefix: null as string | null,
            show_key_modal: false,
            new_api_key: '' as string,
        };
    },
    methods: {
        dateFormat,
        title,
        async getAPIKeys(refresh = false) {
            if (refresh) {
                const { data } = await this.$API.get('/api/api-keys?refresh=true');
                this.api_keys = data;
            }
            else {  
                const { data } = await this.$API.get('/api/api-keys');
                this.api_keys = data;
            }
        },
        subjectName(subject_id: string) {
            const subject = this.$sessionStore.subject_options.find((option: any) => {
                return option.value === subject_id;
            });
            return subject ? subject.label : 'Unknown';
        },
        editAPIKey(api_key_prefix: string) {
            this.selected_api_key_prefix = api_key_prefix;
            this.$nextTick(() => {
                const api_key_modal_instance = this.$refs.api_key_modal as InstanceType<typeof ApiKeyFormModal>;
                api_key_modal_instance.open();
            });
        },
        async generateNewKey(api_key_prefix: string) {
            this.$confirm.require({
                group: 'confirmation',
                header: 'Generate New Key',
                message: 'Are you sure you want to generate a new key? This will invalidate the existing key.',
                acceptProps: {
                    label: 'Generate New Key',
                    severity: 'danger'
                },
                accept: async () => {
                    const { status, data } = await this.$API.patch(`/api/api-keys/${api_key_prefix}/generate`);
                    
                    this.$nextTick(() => {
                        const api_key_display_modal_instance = this.$refs.api_key_display_modal as InstanceType<typeof APIKeyDisplayModal>;
                        api_key_display_modal_instance.open(data.key);
                    });

                    if (status < 300) {
                        this.$toast.add({
                            severity: 'success',
                            summary: 'API Key Updated',
                            detail: 'The API key was successfully updated',
                            life: 3000
                        });
                    }
                }
            });
        },
        openDisplayModal(api_key: string) {
            const api_key_display_modal_instance = this.$refs.api_key_display_modal as InstanceType<typeof APIKeyDisplayModal>;
            api_key_display_modal_instance.open(api_key);
        },
        async deleteAPIKey(api_key_prefix: string) {
            const { status } = await this.$API.delete(`/api/api-keys/${api_key_prefix}`);
            this.getAPIKeys(true);

            if (status < 300) {
                this.$toast.add({
                    severity: 'success',
                    summary: 'API Key Deleted',
                    detail: 'The API key was successfully deleted',
                    life: 3000
                });
            }
        },
    },
    beforeMount() {
        this.getAPIKeys();
    },
});
</script>

<style lang="less">

</style>