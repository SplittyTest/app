<template>
    <div class="archive-toggle" :class="{show: modelValue}" :style="style" tabindex="-1" @click="toggle" v-tooltip.top="tooltip">
        <div class="archive-icon">
            <template v-if="modelValue">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <title>archive-eye</title>
                    <path
                        d="M21 7H3V3H21V7M9.14 19.75C9.32 20.19 9.54 20.61 9.78 21H4V8H20V13.55C19.06 13.19 18.05 13 17 13C13.5 13 10.43 15.06 9.14 18.25L8.85 19L9.14 19.75M9 13H15V11.5C15 11.22 14.78 11 14.5 11H9.5C9.22 11 9 11.22 9 11.5V13M17 18C16.44 18 16 18.44 16 19S16.44 20 17 20 18 19.56 18 19 17.56 18 17 18M23 19C22.06 21.34 19.73 23 17 23S11.94 21.34 11 19C11.94 16.66 14.27 15 17 15S22.06 16.66 23 19M19.5 19C19.5 17.62 18.38 16.5 17 16.5S14.5 17.62 14.5 19 15.62 21.5 17 21.5 19.5 20.38 19.5 19Z" />
                </svg>
            </template>
            <template v-else>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <title>archive-off</title>
                    <path
                        d="M10.2 7L6.2 3H21V7H10.2M20 8H11.2L20 16.8V8M20 19.35V19.34L8.66 8H8.66L7.66 7H7.66L2.39 1.73L1.11 3L3 4.89V7H5.11L6.11 8H4V21H19.11L20.84 22.73L22.11 21.46L20 19.35Z" />
                </svg>
            </template>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
    name : 'ArchiveToggle',
    props : {
        modelValue: Boolean,
        style: {
            type: Object,
            default() {
                return {};
            }
        },
        tooltip: {
            type: String,
            default: 'Show/Hide Archived'
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
.archive-toggle {
    align-items: center;
    background-color: rgba(0,0,0,0.15);
    border-radius: 15px;
    display: inline-flex;
    height: 30px;
    padding: 0 0.75em;
    
    .archive-icon {
        display: block;
        fill: white;
        height: 18px;
        width: 18px;
    }

    &.show {
        background-color: var(--color-accent-500);
    }
}
</style>