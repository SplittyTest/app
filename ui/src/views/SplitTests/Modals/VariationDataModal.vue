<template>
    <Dialog v-model:visible="show_modal" dismissable-mask modal style="min-width: 960px;">
        <template #header>
            <div class="flex items-center gap-2">
                <div class="icon-box">
                    <Icon type="Data Object" color="white" size="32px"/>
                </div>
                <div>
                    <strong>{{ variation.description }}</strong><br/>
                    <div class="variation-id text-xs text-gray-400">{{ variation.id }}</div>
                </div>
            </div>
        </template>
        <JsonEditor v-model="variation.data" read-only/>
    </Dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import JsonEditor from '@components/JsonEditor.vue';
import { emitter } from '@/lib/utils/eventBus';

export default defineComponent({
    name : 'VariationDataModal',
    components: {
        JsonEditor
    },
    data() {
        return {
            show_modal: false,
            variation: {} as any
        };
    },
    mounted() {
        emitter.on('openVariationDataModal', (variation: any) => {
            this.variation = variation;
            this.show_modal = true;
        })
    },
    beforeUnmount() {
        emitter.off('openVariationDataModal');
    }
});
</script>

<style scoped lang="less">
.icon-box {
    background-color: var(--color-brand-400);
    border-radius: 5px;
    display: flex;
    padding: 0.25em;
}
</style>