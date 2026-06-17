<template>
	<div class="page">
		<div class="flex items-center justify-between mb-[2em]">
			<hgroup class="flex items-center gap-2">
				<div class="page-icon bg-brand">
					<Icon type="Group" color="white" size="28px"/>
				</div>
				<h1>Audiences</h1>
			</hgroup>
			<div class="controls">
				<Button label="New Audience" @click="newAudience()">
					<template #icon>
						<Icon type="Add"/>
					</template>
				</Button>
			</div>
		</div>
		<div class="page-content">
			<div class="audience-list">
				<Card>
					<template #header>
						<div class="p-2 pb-0">
							<div class="control-group">
								<div class="inner">
									<div class="controls">
										<div class="field">
											<MultiSelect class="w-25" v-model="subject_filter" :show-toggle-all="false" :options="$sessionStore.subject_options" option-label="label" option-value="value" placeholder="Filter by Subject"/>
										</div>
									</div>
								</div>
							</div>
						</div>
					</template>
					<template #content>
						<DataTable
							:value="filteredAudiences"
							:rows="25"
							sort-field="name"
							:sort-order="1"
							paginator
						>
							<template #empty>
								<div class="flex flex-col items-center gap-4 py-8">
									<template v-if="audiences.length === 0">
										<Icon type="Groups" size="48px" color="gray-400"/>
										<div class="text-center text-gray-500">
											<h2 class="text-lg!">No Audiences Yet</h2>
											<p class="text-sm">Create audiences to target specific groups of users in your split tests.</p>
										</div>
										<Button label="New Audience" @click="newAudience()">
											<template #icon>
												<Icon type="Add"/>
											</template>
										</Button>
									</template>
									<template v-else>
										<Icon type="Search Off" size="48px" color="gray-400"/>
										<div class="text-center text-gray-500">
											<h2 class="text-lg!">No Audiences Found</h2>
											<p class="text-sm">Try adjusting your filters to find the audience you're looking for.</p>
										</div>
									</template>
								</div>
							</template>
							<Column header="Audience" sortable field="name">
								<template #body="{data: audience}">
									<strong class="text-lg!">{{ audience.name }}</strong><br>
									<span class="description">{{ audience.description }}</span>
								</template>
							</Column>
							<Column header="Subject" sortable field="subject">
								<template #body="{data: audience}">
									{{ audience.subject_name }}
								</template>
							</Column>
							<Column header="Filters">
								<template #body="{data: audience}">
									{{ audience.filters.length }} filter(s)
								</template>
							</Column>
							<Column>
								<template #body="{data: audience}">
									<div class="flex justify-end gap-1">
										<Button v-tooltip.top="'Edit Audience'" @click="editAudience(audience.id)">
											<template #icon>
												<Icon type="Edit" color="white" size="20px"/>
											</template>
										</Button>
										<Button v-tooltip.top="'Clone Audience'" @click="duplicateAudience(audience.id)">
											<template #icon>
												<Icon type="Content Copy" color="white" size="20px"/>
											</template>
										</Button>
										<ConfirmDelete :id="audience.id" message="Are you sure you want to delete this audience?" @accept="deleteAudience(audience)"/>
									</div>
								</template>
							</Column>
						</DataTable>
					</template>
				</Card>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { startCase } from 'lodash-es';
import ConfirmDelete from '@/components/ConfirmDelete.vue';

export default defineComponent({
	name: 'AudiencesList',
	components: {
		ConfirmDelete
	},
	data() {
		return {
			audiences: [
				{
					id: 1,
					name: 'Mobile Users',
					description: 'Users accessing the site from a mobile device',
					subject_id: 'my_website',
					subject_name: 'My Website',
					filters: [
						{
							property: 'device',
							operator: 'equals',
							value: 'mobile'
						}
					]
				},
				{
					id: 2,
					name: 'Desktop Users',
					description: 'Users accessing the site from a desktop device',
					subject_id: 'my_website',
					subject_name: 'My Website',
					filters: [
						{
							property: 'device',
							operator: 'equals',
							value: 'desktop'
						}
					]
				},
				{
					id: 3,
					name: 'New Users',
					description: 'Users who have visited the site for the first time',
					subject_id: 'my_website',
					subject_name: 'My Website',
					filters: [
						{
							property: 'visit_count',
							operator: 'equals',
							value: 1
						}
					]
				}
			] as any[],
			subject_filter: [] as any[],
			subject_options: [] as any[]
		}
	},
	computed: {
		filteredAudiences() {
			if (this.subject_filter.length === 0) return this.audiences;
			return this.audiences.filter((audience) => {
				return this.subject_filter.includes(audience.subject_id);
			});
		}
	},
	methods: {
		startCase,
		async getAudiences() {
			const { data } = await this.$API.get('/api/audiences');
			this.audiences = data.map((row: any) => {
				row.subject_name = row.subject_id ? this.$sessionStore.subject_options.find((option: any) => option.value === row.subject_id)?.label : '';
				return row;
			});
		},
		newAudience() {
			this.$router.push({ name: 'AudienceCreate' });
		},
		editAudience(audience_id: number) {
			this.$router.push({ name: 'AudienceEdit', params: { audience_id } });
		},
		duplicateAudience(audience_id: number) {
			this.$router.push({ name: 'AudienceCreate', query: { duplicate_audience_id: audience_id } });
		},
		async deleteAudience(audience: any) {
			await this.$API.delete(`/api/audiences/${audience.id}`);
			this.$emit('delete', audience.id);
			await this.getAudiences();
			this.$toast.add({
				severity: 'success',
				summary: 'Audience Deleted',
				detail: `The audience '${audience.name}' was deleted.`,
				life: 5000
			});
		}
	},
	async beforeMount() {
		await this.getAudiences();
	}
});
</script>

<style lang="less" scoped>
:deep(.p-datatable-tbody > tr > td) {
	font-size: 0.875rem;
}
</style>