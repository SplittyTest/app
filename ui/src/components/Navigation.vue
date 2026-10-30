<template>
    <!-- Vertical list, used in the slide-out menu on smaller screens -->
    <nav v-if="vertical" class="navigation-vertical" aria-label="Main">
        <ul>
            <li v-for="item in filteredNav" :key="item.route">
                <router-link :to="item.route" class="vertical-item" @click="$emit('navigate')">
                    <Icon :type="item.icon" color="brand" size="26px"/>
                    <span>{{ item.label }}</span>
                </router-link>
            </li>
        </ul>
    </nav>
    <nav v-else id="navigation" aria-label="Main">
        <MenuBar :model="filteredNav" breakpoint="0px">
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
    props: {
        vertical: {
            type: Boolean,
            default: false,
        },
    },
    emits: ['navigate'],
    data() {
        return {
            nav: [
                { label: 'Projects', icon: 'Devices', route: '/projects', role: 'viewer' },
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

// Wide screens with room to spare get tighter items so everything fits on one line
@media (max-width: 1279px) {
    .nav-item {
        padding: 10px 12px;
    }
}

.navigation-vertical {
    ul {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .vertical-item {
        align-items: center;
        border-radius: var(--border-radius);
        color: var(--color-gray-600);
        display: flex;
        font-weight: 500;
        gap: 14px;
        padding: 12px 14px;

        &:hover {
            background-color: var(--color-gray-100);
            text-decoration: none;
        }

        &.router-link-active {
            background-color: var(--color-brand-highlight);
            color: var(--color-gray-900);
            font-weight: 600;
        }
    }
}
</style>
