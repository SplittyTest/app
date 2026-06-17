<template>
	<router-view v-slot="{ Component }">
		<transition name="route" mode="out-in">
			<component :is="Component"/>
		</transition>
	</router-view>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { mapStores } from 'pinia';
import { useSessionStore } from '@/stores/Session';

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