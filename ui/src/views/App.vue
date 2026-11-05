<template>
	<router-view v-slot="{ Component }">
		<transition name="route" mode="out-in">
			<component :is="Component"/>
		</transition>
	</router-view>
</template>

<script lang="ts">
import { useSessionStore } from '@/stores/session';
import { mapStores } from 'pinia';
import { defineComponent } from 'vue';

export default defineComponent({
	name: 'SplittyTest',
	computed: {
		...mapStores(useSessionStore)
	},
	async beforeMount() {
		await this.sessionStore.init();
	}
});
</script>