<template>
    <div id="private" class="page">
        <CustomToast/>
        <CustomConfirm/>
        <ConfirmPopup/>
        <OutcomeModal />
        <Toolbar/>
        <div id="main">
            <div id="content">
                <Suspense>
                    <router-view v-slot="{ Component }">
                        <transition name="page" mode="out-in">
                            <component :is="Component" :key="$route.name"/>
                        </transition>
                    </router-view>
                </Suspense>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import CustomConfirm from '@components/CustomConfirm.vue';
import CustomToast from '@components/CustomToast.vue';
import Toolbar from '@components/Toolbar.vue';
import OutcomeModal from '@/views/SplitTests/Modals/OutcomeModal.vue';
import { mapStores } from 'pinia';
import { useSessionStore } from '@/stores/Session';

export default defineComponent({
    name: 'PrivateWrapper',
    components: {
        CustomConfirm,
        CustomToast,
        OutcomeModal,
        Toolbar
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

<style lang="less">
#private {
    background: var(--color-app-background);
    background: var(--app-background);
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: auto;
    width: 100%;
}

#main {
    display: flex;
    flex: 1 0;
    flex-direction: row;
    padding: 2em 3em;
}

#content {
    display: flex;
    flex: 1 0;
    flex-direction: column;
    margin: 0 auto;
    max-width: 1600px;
    padding: 2em;
}
</style>