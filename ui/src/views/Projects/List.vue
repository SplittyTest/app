<template>
	<div class="page">
		<div class="flex flex-wrap items-center justify-between gap-2 mb-[2em]">
			<hgroup class="flex items-center gap-2">
				<div class="page-icon bg-brand">
					<Icon type="Devices" color="white" size="28px"/>
				</div>
				<h1>Projects</h1>
			</hgroup>
			<div v-if="$sessionStore.minRole('tester')" class="controls">
				<Button label="New Project" @click="newProject()">
					<template #icon>
						<Icon type="Add"/>
					</template>
				</Button>
			</div>
		</div>
		<div class="page-content">
			<div class="project-grid flex gap-5 flex-wrap">
				<template v-for="project in projects" :key="project.id">
					<TestProjectCard :project="project" @delete="getProjects"/>
				</template>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
import { sortBy, startCase } from 'lodash-es';
import { defineComponent } from 'vue';
import TestProjectCard from './ProjectCard.vue';

export default defineComponent({
	name: 'TestProjects',
	components: {
		TestProjectCard
	},
	data() {
		return {
			projects: [] as any[],
			project_menus: {},
		}
	},
	methods: {
		startCase,
		async getProjects() {
			const { data } = await this.$API.get(`/api/projects`);
			this.projects = sortBy(data, 'name');
			await this.$sessionStore.getProjectsAsOptions();
		},
		newProject() {
			this.$router.push(`/projects/edit/new`);
		}
	},
	async beforeMount() {
		await this.getProjects();
	}
});
</script>

<style scoped lang="less">
h2 {
	color: var(--color-white);
}
</style>