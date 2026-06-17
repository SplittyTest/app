<template>
    <div class="filter-toggle" :class="{show: modelValue}" tabindex="-1" @click="toggle" v-tooltip.top="'Show/Hide Filters'">
        <div class="archive-icon">
            <template v-if="modelValue">
                <div class="flex">
                    <Icon type="filter-alt" color="white" size="24px"/>
                </div>
            </template>
            <template v-else>
                <div class="flex">
                    <Icon type="filter-alt-off" color="white" size="24px"/>
                </div>
            </template>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
    name : 'FilterToggle',
    props : {
        modelValue: Boolean,
        height: {
            type: String,
            default: '40px'
        }
    },
    methods: {
        toggle() {
            this.$emit('update:modelValue', !this.modelValue);
        }
    }
});
</script>

<style scoped lang="less">
.filter-toggle {
    align-items: center;
    background-color: rgba(0,0,0,0.15);
    border-radius: 5px;
    cursor: default;
    display: inline-flex;
    height: 42px;
    margin-right: 1em;
    padding: 0 0.75em;
    
    .filter-icon {
        display: block;
        height: 24px;
        width: 24px;
    }

    &.show {
        background-color: var(--color-accent-600);
    }
}

</style>