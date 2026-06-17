<template>
    <div class="page">
        <hgroup class="flex items-center gap-2 mb-[2em]">
            <div class="page-icon bg-brand">
                <Icon type="Settings" color="white" size="28px"/>
            </div>
            <h1>Settings</h1>
        </hgroup>
        <div class="page-content">
            <div class="flex justify-start gap-5">
                <div class="test-form w-full">
                    <Card class="settings-tabs">
                        <template #content>
                            <Tabs :value="current_tab" @update:value="updateRoute">
                                <TabList>
                                    <Tab value="general">General</Tab>
                                    <Tab value="api_keys">API Keys</Tab>
                                    <Tab value="webhooks">Webhooks</Tab>
                                    <template v-if="$sessionStore.minRole('admin')">
                                        <Tab value="users">Users</Tab>
                                    </template>
                                </TabList>
                                <TabPanels>
                                    <TabPanel value="general">
                                        <GeneralSettings/>
                                    </TabPanel>
                                    <TabPanel value="api_keys">
                                        <APIKeys/>
                                    </TabPanel>
                                    <TabPanel value="webhooks">
                                        <Webhooks/>
                                    </TabPanel>
                                    <template v-if="$sessionStore.minRole('admin')">
                                        <TabPanel value="users">
                                            <Users/>
                                        </TabPanel>
                                    </template>
                                </TabPanels>
                            </Tabs>
                        </template>
                    </Card>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import GeneralSettings from './General.vue';
import APIKeys from '@views/APIKeys/List.vue';
import Webhooks from '@views/Webhooks/List.vue';
import Users from '@views/Users/List.vue';

export default defineComponent({
    name : 'Settings',
    components : {
        GeneralSettings,
        APIKeys,
        Webhooks,
        Users,
    },
    data() {
        return {
            current_tab: this.$route.params.section as string || 'general',
        };
    },
    methods: {
        updateRoute(new_value: string | number) {
            this.$router.push({ params: { section: new_value } });
        }
    }
});
</script>

<style scoped lang="less">
.page {
    margin: 0 auto;
    max-width: 1200px;
    width: 100%;
}

:deep(.settings-tabs .p-card-body) {
    padding: 0;

    .p-tablist-tab-list,
    .p-tabpanels {
        background-color: transparent;
    }
}

:deep(.settings-form) {
    padding: 1em;
}
</style>