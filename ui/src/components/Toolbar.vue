<template>
    <div id="toolbar" class="flex items-center justify-between">
        <div class="left flex flex-[1_0] items-center justify-start gap-2">
            <div class="branding">
                <img src="/images/splitty-test-logo.svg?876876" alt="Splitty Test">
            </div>
        </div>
        <div class="center flex flex-[0_0_auto] items-center justify-center">
            <Navigation/>
        </div>
        <div class="right flex flex-[1_0] items-center justify-end">
            <div class="tools flex items-center gap-[10px]">
                <div class="documentation" v-tooltip.left="'Documentation'">
                    <div class="documentation-button" tabindex="-1" @click="openDocs">
                        <Icon type="Book" size="24px"/>
                    </div>
                </div>
                <!-- ALERTS WILL BE ADDED LATER -->
                <!-- <div class="alerts">
                    <div class="toolbar-button" @click="openAlertsDrawer()">
                        <OverlayBadge severity="danger" :value="alertCount" size="small" :class="{none: alertCount === 0}">
                            <Icon type="Notifications" size="24px"/>
                        </OverlayBadge>
                    </div>
                    <Alerts ref="alerts_drawer"/>
                </div> -->
                <div class="profile">
                    <div class="toolbar-button" tabindex="-1" @click="toggleAccountMenu">
                        <Icon type="Account Circle" color="alt" size="28px"/>
                    </div>
                    <Popover ref="account_menu">
                        <div class="account-menu">
                            <ul>
                                <li class="heading font-bold text-sm mb-[5px]">
                                    {{ $sessionStore.user?.first_name }} {{ $sessionStore.user?.last_name }}
                                </li>
                                <li class="menu-item" @click="editProfile()">
                                    <div class="flex-row">
                                        <Icon type="Account Box" size="18px"/>
                                        <div class="flex-1">Edit Profile</div>
                                    </div>
                                </li>
                                <li class="menu-item" @click="logout">
                                    <div class="flex-row">
                                        <Icon type="Logout" size="18px"/>
                                        <div class="flex-1">Logout</div>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </Popover>
                </div>
            </div>
        </div>
        <UserFormModal ref="profile_modal" :user-id="$sessionStore.user.id" />
    </div>
</template>

<script lang="ts">
import type Popover from 'primevue/popover';
import UserFormModal from '@views/Users/UserFormModal.vue';
import { defineComponent } from 'vue';
import Navigation from '@components/Navigation.vue';
import type Alerts from './Alerts.vue';

export default defineComponent({
    name: 'Toolbar',
    components: {
        Navigation,
        UserFormModal,
    },
    computed: {
        alertCount() {
            return this.$sessionStore.alertCount;
        },
    },
    methods: {
        toggleAccountMenu(event: MouseEvent) {
            const account_menu_instance = this.$refs.account_menu as InstanceType<typeof Popover>;
            account_menu_instance.toggle(event);
        },
        openAlertsDrawer() {
            const alerts_drawer_instance = this.$refs.alerts_drawer as InstanceType<typeof Alerts>;
            alerts_drawer_instance.show_drawer = true;
        },
        openDocs() {
            window.open('https://splittytest.com', '_blank');
        },
        editProfile() {
            const profile_modal_instance = this.$refs.profile_modal as InstanceType<typeof UserFormModal>;
            profile_modal_instance.open();
        },
        async logout() {
            await this.$sessionStore.logout();
            this.$router.push('/login');
        }
    }
});
</script>

<style scoped lang="less">
#toolbar {
    background-color: var(--color-white);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    height: 100px;
    padding: 0 2em;
    position: sticky;
    top: 0;
    z-index: 999;
}

.branding img {
    height: 60px;
}

:deep(.p-overlaybadge) {
    display: inline-flex;
}

.documentation-button,
.toolbar-button {
    align-items: center;
    border-radius: 20px;
    cursor: default;
    display: flex;
    justify-content: center;
    height: 40px;
    width: 40px;

    &:hover {
        background-color: var(--color-gray-100);
    }
}

:deep(.p-overlaybadge.none) {
    .p-badge {
        display: none;
    }
}

.account-menu {
    min-width: 180px;

    .heading {
        border-bottom: 1px solid var(--color-gray-200);
        height: 2em;
    }

    .menu-item {
        cursor: pointer;

        & > div {
            height: 2em;
        }

        &:hover {
            color: var(--color-brand);
        }
    }
}
</style>