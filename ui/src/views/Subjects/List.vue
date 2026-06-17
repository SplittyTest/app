<template>
	<div class="page">
		<div class="flex items-center justify-between mb-[2em]">
			<hgroup class="flex items-center gap-2">
				<div class="page-icon bg-brand">
					<Icon type="Devices" color="white" size="28px"/>
				</div>
				<h1>Test Subjects</h1>
			</hgroup>
			<div v-if="$sessionStore.minRole('tester')" class="controls">
				<Button label="New Test Subject" @click="newSubject()">
					<template #icon>
						<Icon type="Add"/>
					</template>
				</Button>
			</div>
		</div>
		<div class="page-content">
			<div class="subject-grid flex gap-5 flex-wrap">
				<template v-for="subject in subjects" :key="subject.id">
					<TestSubjectCard :subject="subject" @delete="getSubjects"/>
				</template>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { sortBy, startCase } from 'lodash-es';
import TestSubjectCard from './SubjectCard.vue';

export default defineComponent({
	name: 'TestSubjects',
	components: {
		TestSubjectCard
	},
	data() {
		return {
			subjects: [] as any[],
			subject_menus: {},
		}
	},
	methods: {
		startCase,
		async getSubjects() {
			const { data } = await this.$API.get(`/api/subjects`);
			this.subjects = sortBy(data, 'name');
			await this.$sessionStore.getSubjectsAsOptions();
		},
		newSubject() {
			this.$router.push(`/subjects/edit/new`);
		}
	},
	async beforeMount() {
		await this.getSubjects();
	}
});
</script>

<style scoped lang="less">
h2 {
	color: var(--color-white);
}
</style>