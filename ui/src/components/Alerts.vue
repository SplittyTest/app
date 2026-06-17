<template>
    <Drawer v-model:visible="show_drawer" position="right" class="!w-full md:!w-80 lg:!w-[30rem]">
        <template #header>
            <hgroup>
                <h2>Alerts</h2>
            </hgroup>
        </template>
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
    </Drawer>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
    name : 'Alerts',
    data() {
        return {
            show_drawer: false
        };
    }
});
</script>