<template>
	<div class="page">
		<div class="flex items-center justify-between mb-[2em]">
			<hgroup class="flex items-center gap-2">
				<div class="page-icon bg-brand">
					<Icon type="Devices" color="white" size="28px"/>
				</div>
				<h1>Metrics</h1>
			</hgroup>
			<div v-if="$sessionStore.minRole('tester')" class="controls">
				<Button label="New Metric" @click="newMetric()">
					<template #icon>
						<Icon type="Add"/>
					</template>
				</Button>
			</div>
		</div>
		<div class="page-content">
			<div class="metric-list">
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
							:value="filteredMetrics"
							:rows="25"
							sort-field="name"
							:sort-order="1"
							paginator
						>
							<template #empty>
								<div class="flex flex-col items-center gap-4 py-8">
									<template v-if="metrics.length === 0">
										<Icon type="Analytics" size="48px" color="gray-400"/>
										<div class="text-center text-gray-500">
											<h2 class="text-lg!">No Metrics Yet</h2>
											<p class="text-sm">Create metrics to target specific groups of users in your split tests.</p>
										</div>
										<Button label="New Metric" @click="newMetric()">
											<template #icon>
												<Icon type="Add"/>
											</template>
										</Button>
									</template>
									<template v-else>
										<Icon type="Search Off" size="48px" color="gray-400"/>
										<div class="text-center text-gray-500">
											<h2 class="text-lg!">No Metrics Found</h2>
											<p class="text-sm">Try adjusting your filters to find the metric you're looking for.</p>
										</div>
									</template>
								</div>
							</template>
							<Column header="Metric" sortable field="name">
								<template #body="{data: metric}">
									<strong class="text-lg!">{{ metric.name }}</strong><br>
									<span class="description">{{ metric.description }}</span>
								</template>
							</Column>
							<Column header="Subject" sortable field="subject">
								<template #body="{data: metric}">
									{{ metric.subject_name }}
								</template>
							</Column>
							<Column header="Event" sortable field="event_type">
								<template #body="{data: metric}">
									{{ metric.event_type }}
								</template>
							</Column>
							<Column header="Strategy">
								<template #body="{data: metric}">
									{{ metric.strategy }}
								</template>
							</Column>
							<Column>
								<template #body="{data: metric}">
									<div class="flex justify-end gap-1">
										<Button v-tooltip.top="'Explore Metric'" @click="exploreMetric(metric.id)">
											<template #icon>
												<Icon type="Insights" color="white" size="24px"/>
											</template>
										</Button>
										<template v-if="$sessionStore.minRole('tester')">
											<Button v-tooltip.top="'Edit Metric'" @click="editMetric(metric.id)">
												<template #icon>
													<Icon type="Edit" color="white" size="20px"/>
												</template>
											</Button>
											<Button v-tooltip.top="'Clone Metric'" @click="duplicateMetric(metric.id)">
												<template #icon>
													<Icon type="Content Copy" color="white" size="20px"/>
												</template>
											</Button>
											<ConfirmDelete :id="metric.id" message="Are you sure you want to delete this metric?" @accept="deleteMetric(metric)"/>
										</template>
									</div>
								</template>
							</Column>
						</DataTable>
					</template>
				</Card>
			</div>
		</div>
		<ExploreMetricModal ref="explore_metric_modal" :metric-id="selected_metric_id" />
	</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { startCase } from 'lodash-es';
import ExploreMetricModal from '@views/Metrics/ExploreMetricModal.vue';

export default defineComponent({
	name: 'Metrics',
	components: {
		ExploreMetricModal
	},
	data() {
		return {
			metrics: [] as any[],
			subject_filter: [] as any[],
			subject_options: [] as any[],
			selected_metric_id: undefined as string | undefined
		}
	},
	computed: {
		filteredMetrics() {
			if (this.subject_filter.length === 0) return this.metrics;
			return this.metrics.filter((metric) => {
				return this.subject_filter.includes(metric.subject_id);
			});
		}
	},
	methods: {
		startCase,
		async getMetrics() {
			const { data } = await this.$API.get('/api/metrics');
			this.metrics = data.map((row: any) => {
				row.subject_name = row.subject_id ? this.$sessionStore.subject_options.find((option: any) => option.value === row.subject_id)?.label : '';
				return row;
			});
		},
		newMetric() {
			this.$router.push({ name: 'MetricCreate' });
		},
		editMetric(metric_id: number) {
			this.$router.push({ name: 'MetricEdit', params: { metric_id } });
		},
		duplicateMetric(metric_id: number) {
			this.$router.push({ name: 'MetricCreate', query: { duplicate_metric_id: metric_id } });
		},
		async deleteMetric(metric: any) {
			await this.$API.delete(`/api/metrics/${metric.id}`);
			this.$emit('delete', metric.id);
			await this.getMetrics();
			this.$toast.add({
				severity: 'success',
				summary: 'Metric Deleted',
				detail: `The metric '${metric.name}' was deleted.`,
				life: 5000
			});
		},
		exploreMetric(metric_id: string) {
			this.selected_metric_id = metric_id;
			this.$nextTick(() => {
				const explore_metric_modal_instance = this.$refs.explore_metric_modal as typeof ExploreMetricModal;
				explore_metric_modal_instance.open();
			});
		}
	},
	async beforeMount() {
		await this.getMetrics();
	}
});
</script>

<style lang="less" scoped>
:deep(.p-datatable-tbody > tr > td) {
	font-size: 0.875rem;
}
</style>