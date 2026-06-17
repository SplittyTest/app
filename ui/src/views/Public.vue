<template>
    <div id="public" class="page bg-gray-100">
        <CustomToast/>
        <router-view v-slot="{ Component }">
            <transition name="page" mode="out-in">
                <component :is="Component"/>
            </transition>
        </router-view>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import CustomToast from '@components/CustomToast.vue';
import { mapStores } from 'pinia';
import { useSessionStore } from '@/stores/Session';

export default defineComponent({
    name : 'PublicWrapper',
    components: {
        CustomToast
    },
    computed: {
        ...mapStores(useSessionStore)
    },
    methods: {
        displayFlashMessage() {
            const flash_config = this.sessionStore.getFlashMessage();
            if (flash_config) {
                this.$toast.add(flash_config);
            }
        },
    },
    mounted() {
        this.displayFlashMessage();
    },
    beforeRouteUpdate() {
		this.displayFlashMessage();
	}
});
</script>

<style lang="less" scoped>
#public {
    align-items: center;
    background: var(--color-app-background);
    background: var(--app-background);
    display: flex;
    height: 100%;
    justify-content: center;
    width: 100%;
}
</style>