<template>
    <div class="settings-form">
        <div class="flex items-center justify-between mb-3">
            <hgroup class="flex items-center gap-2">
                <div class="page-icon bg-accent small">
                    <Icon type="Perm Identity" color="white" size="20px"/>
                </div>
                <h2>Users</h2>
            </hgroup>
            <div class="flex-row">
                <Button label="New User" @click="editUser('new')">
                    <template #icon>
                        <Icon type="Add" color="white" size="20px"/>
                    </template>
                </Button>
                <ArchiveToggle v-model="show_archived" :style="{ borderRadius: '6px', height: '42px' }"/>
            </div>
        </div>
        <div class="content">
            <Datatable
                :value="sortedUsers"
                :rows="25"
                sort-field="name"
                :sort-order="1"
                :row-class="rowClass"
                paginator
            >
                <Column field="first_name" header="Name" sortable>
                    <template #body="{ data: user }">
                        <strong class="text-lg">{{ user.first_name }} {{ user.last_name }}</strong>
                        <div class="text-sm text-gray-400">{{ user.email }}</div>
                    </template>
                </Column>
                <Column field="role" header="Role" sortable header-class="text-center" class="text-center">
                    <template #body="{ data: user }">
                        {{ title(user.role) }}
                    </template>
                </Column>
                <Column field="status" header="Status" sortable header-class="text-center" class="text-center status">
                    <template #body="{ data: user }">
                        {{ title(user.status) }}
                    </template>
                </Column>
                <Column field="last_login" header="Last Login" sortable header-class="text-center" class="text-center">
                    <template #body="{ data: user }">
                        {{ user.last_login ? dateFormat(user.last_login) : 'Never' }}
                    </template>
                </Column>
                <Column>
                    <template #body="{data: user}">
                        <div class="flex justify-end gap-1">
                            <Button v-tooltip.top="'Edit User'" @click="editUser(user.id)">
                                <template #icon>
                                    <Icon type="Edit" color="white" size="20px"/>
                                </template>
                            </Button>
                            <ConfirmDelete v-tooltip.top="'Delete User'" :id="user.id" message="Are you sure you want to delete this user?" @accept="deleteUser(user.id)"/>
                        </div>
                    </template>
                </Column>
            </Datatable>
        </div>
        <UserFormModal :user-id="selected_user_id" ref="user_modal" @refreshList="getUsers(true)"/>
    </div>
</template>

<script lang="ts">
import { dateFormat, title } from '@lib/filters';
import { defineComponent } from 'vue';
import UserFormModal from './UserFormModal.vue';
import ArchiveToggle from '@/components/ArchiveToggle.vue';

export default defineComponent({
    name : 'Users',
    components: {
        ArchiveToggle,
        UserFormModal,
    },
    data() {
        return {
            users: [] as any[],
            selected_user_id: 'new',
            show_archived: false
        };
    },
    computed: {
        sortedUsers(): any[] {
            return this.users.sort((a, b) => a.first_name.localeCompare(b.first_name))
                .filter((user) => {
                    if (this.show_archived) {
                        return true;
                    }
                    return user.status !== 'archived';
                });
        }
    },
    methods: {
        dateFormat,
        title,
        async getUsers(refresh = false) {
            if (refresh) {
                const { data } = await this.$API.get('/api/users?refresh=true');
                this.users = data;
            }
            else {
                const { data } = await this.$API.get('/api/users');
                this.users = data;
            }
        },
        editUser(user_id: string) {
            this.selected_user_id = user_id;
            this.$nextTick(() => {
                const user_modal_instance = this.$refs.user_modal as InstanceType<typeof UserFormModal>;
                user_modal_instance.open();
            });
        },
        async deleteUser(user_id: string) {
            const { status } = await this.$API.delete(`/api/users/${user_id}`);
            this.getUsers(true);

            if (status < 300) {
                this.$toast.add({
                    severity: 'success',
                    summary: 'User Deleted',
                    detail: 'The user was successfully deleted',
                    life: 3000
                });
            }
        },
        rowClass(user: any) {
            return user.status;
        }
    },
    async beforeMount() {
        if (this.$sessionStore.minRole('admin')) {
            await this.getUsers();
        }
    },
});
</script>

<style scoped lang="less">
:deep(.suspended .status) {
    color: var(--color-yellow-500);
}

:deep(.archived) {
    color: var(--color-gray-300);
    font-style: italic;
}
</style>