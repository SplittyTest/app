<template>
    <Dialog v-model:visible="show_modal" dismissable-mask modal class="w-full max-w-150 bordered">
        <template #header>
			<div class="flex-row">
				<Icon type="Analytics" color="purple" size="24px"/>
				<div>
					<strong>Series Data: {{ metric.metric_name }}</strong>
				</div>
			</div>
        </template>
		<div class="modal-content">
			<div v-if="loading" class="loading-mask">
				<ProgressSpinner :loading="loading" strokeWidth="3" class="m-4" v-if="loading"/>
			</div>
			<div class="flex-row items-start!">
				<div class="chart flex-auto">
					<Chart ref="series_chart" type="line" class="w-full" :data="seriesChartData" :options="seriesChartOptions"/>
				</div>
			</div>
		</div>
		<template #footer>
			<div class="toolbar flex justify-end">
				<Button outlined label="Reset Zoom" @click="resetSeriesChartZoom">
					<template #icon>
						<Icon type="Fullscreen" size="20px"/>
					</template>
				</Button>
			</div>
		</template>
    </Dialog>
</template>

<script lang="ts">
import currency from '@/lib/utils/currency';
import num from '@/lib/utils/num';
import percentage from '@/lib/utils/percentage';
import dayjs from 'dayjs';
import type Chart from 'primevue/chart';
import { defineComponent } from 'vue';

export default defineComponent({
    name : 'MetricsSeriesDataModal',
    props : {
        testId: {
            type: String,
            required: true
        },
        segments: {
            type: Array,
            required: true
        }
    },
    data() {
        return {
            show_modal: false,
            metric: null as any,
            series_data: {} as any,
            loading: false,
        };
    },
    computed: {
        seriesChartData() {
			const colors = ['#29a1aa', '#ffb740', '#df711b', '#90be6d', '#7046a2'];

			const labels = this.series_data?.[Object.keys(this.series_data)[0]].map((variation_data: any) => {
				return dayjs(variation_data.ts).toDate();
			}) || [];

			const series_data: any[] = [];
			if (this.series_data) {
				Object.keys(this.series_data).sort().forEach((variation_id, index) => {
					series_data.push({
						label: variation_id,
						data: this.series_data[variation_id].map((row: any) => {
							return row.variation_score;
						}),
						backgroundColor: colors[index],
						borderColor: colors[index],
					});
				});
			}

			return {
				labels,
				datasets: series_data
			}
		},
		seriesChartOptions() {
			return {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: {
						display: true,
						labels: {
							generateLabels: (chart: any) => {
								return chart.data.datasets.map((dataset: any, i: number) => ({
									datasetIndex: i,
									fillStyle: dataset.borderColor,
									hidden: !chart.isDatasetVisible(i),
									lineWidth: dataset.borderWidth ?? 2,
									strokeStyle: dataset.borderColor,
									text: (dataset.label ?? '').slice(-1),
								})).sort((a: any, b: any) => a.text.localeCompare(b.text)); // Sort legend labels alphabetically
							},
							padding: 30,
						}
					},
					tooltip: {
						titleFont: {
							size: 14,
							weight: 'bold'
						},
						bodyFont: {
							size: 12,
							weight: 'normal'
						},
						padding: 10,
						xAlign: 'center',
						yAlign: 'bottom',
						callbacks: {
							title: (tooltipItems: any) => {
								return dayjs(tooltipItems[0].label).format('MM/DD/YYYY h:mmA');
							},
							label: (context: any) => {
								const label = context.dataset.label ?? '';
								if (this.metric?.display_type === 'percent') {
									return `${label.slice(-1)}: ${percentage(context.parsed.y)}`;
								}
								else if (this.metric?.display_type === 'currency') {
									return `${label.slice(-1)}: ${currency(context.parsed.y)}`;
								}
								else {
									return `${label.slice(-1)}: ${num(context.parsed.y)}`;
								}
							}
						}
					},
					zoom: {
						pan: {
							enabled: true,
							mode: 'xy',
						},
						zoom: {
							enabled: true,
							mode: 'xy',
							wheel: {
								enabled: true,
							},
							pinch: {
								enabled: true
							}
						}
					}
				},
				scales: {
					x: {
						ticks: {
							autoSkip: true,
							maxTicksLimit: 6,
							callback: (value: number) => {
								return dayjs(this.seriesChartData.labels[value]).format('MM/DD/YYYY h:mmA');
							}
						}
					},
					y: {
						ticks: {
							callback: (value: number) => {
								if (this.metric?.display_type === 'percent') {
									return percentage(value);
								}
								else if (this.metric?.display_type === 'currency') {
									return currency(value);
								}
								else {
									return num(value);
								}
							}
						},
						beginAtZero: false,
						grace: 0.001
					}
				},
			}
		},
    },
    methods: {
        currency,
        num,
        percentage,
        async open(metric: any) {
            this.metric = metric;
            await this.getSeriesDataForSegment(metric.metric_id);
            this.show_modal = true;
        },
        close() {
            this.show_modal = false;
        },
        // Get the time series data for the selected segment
		async getSeriesDataForSegment(metric_id: string) {
			this.loading = true;
			const { data } = await this.$API.get(`/api/tests/${this.testId}/series-data`, {
				params: {
                    metric_id,
					segments: this.segments
				}
			});
			this.series_data = data;
			this.loading = false;
		},
        resetSeriesChartZoom() {
            const chart_instance = this.$refs.series_chart as InstanceType<typeof Chart>;
            chart_instance.getChart().resetZoom();
        },
    }
});
</script>

<style lang="less" scoped>
.modal-content {
	position: relative;

	.loading-mask {
		align-items: center;
		background: rgba(255, 255, 255, 0.7);
		display: flex;
		height: 100%;
		justify-content: center;
		left: 0;
		position: absolute;
		top: 0;
		width: 100%;
		z-index: 10;
	}
}

:deep(.p-chart) {
	aspect-ratio: 5/2;
}
</style>