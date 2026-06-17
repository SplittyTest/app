<template>
    <nav id="navigation">
        <MenuBar :model="filteredNav">
            <template #item="{ item }">
                <router-link :to="item.route">
                    <div class="nav-item">
                        <div class="nav-icon">
                            <Icon :type="item.icon" color="brand" size="32px"/>
                        </div>
                        <div class="nav-label">
                            {{ item.label }}
                        </div>
                    </div>
                </router-link>
            </template>
        </MenuBar>
    </nav>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
    name: 'Navigation',
    data() {
        return {
            nav: [
                { label: 'Subjects', icon: 'Devices', route: '/subjects', role: 'viewer' },
                { label: 'Split Tests', icon: 'Fact Check', route: '/split-tests', role: 'viewer' },
                { label: 'Metrics', icon: 'Analytics', route: '/metrics', role: 'viewer' },
                { label: 'Audiences', icon: 'Group', route: '/audiences', role: 'tester' },
                { label: 'Settings', icon: 'Settings-Applications', route: '/settings', role: 'tester' },
            ]
        }
    },
    computed: {
        filteredNav() {
            return this.nav.filter(item => this.$sessionStore.minRole(item.role));
        }
    }
});
</script>

<style scoped lang="less">
:deep(.p-menubar) {
    border: none;
    display: inline-block;
    margin: 0 auto;

    .nav-label {
        color: var(--color-gray-400);
    }
}

:deep(.router-link-active) {
    display: inline-block;
    font-weight: 600;

    .nav-label {
        color: var(--color-gray-900);
    }
}

.nav-item {
    align-items: center;
    display: flex;
    flex-direction: column;
    height: 80px;
    justify-content: center;
    padding: 10px 20px;
}

.nav-label {
    color: var(--color-gray-500);
    font-size: 0.875rem;
}

:deep(.p-menubar-item-content) {
    border-radius: var(--border-radius) !important;
    
    a:hover {
        text-decoration: none;
    }
}
</style>