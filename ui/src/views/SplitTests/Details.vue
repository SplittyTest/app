<template>
	<div class="page">
		<div class="flex items-center justify-between mb-3">
			<div class="left flex items-center gap-2">
				<div class="back-button" tabindex="-1" @click="backToTests">
					<Icon type="arrow-back" color="white" size="24px"/>
				</div>
				<hgroup>
					<div class="flex-row">
						<h1 class="mr-1">{{ test?.name }}</h1>
					</div>
					<div class="breadcrumbs text-white opacity-75"><router-link :to="`/split-tests/${subject.id}`">{{ subject.name }}</router-link> <span class="m-0.5">/</span> {{ test?.section_id }}</div>
				</hgroup>
			</div>
			<div class="right flex-row">
				<div v-if="test?.strategy === 'auto_optimize'" class="settings-icon bg-accent-500" v-tooltip.top="'Auto-Optimized Test'">
					<Icon type="Auto Mode" color="white" size="24px"/>
				</div>
				<div v-else class="settings-icon bg-accent-500" v-tooltip.top="'Standard Test'">
					<Icon type="balance" color="white" size="24px"/>
				</div>
				<div v-if="test?.data_segments?.length" class="settings-icon bg-accent-500" v-tooltip.top="'Segmented'">
					<Icon type="splitscreen" color="white" size="24px"/>
				</div>
			</div>
		</div>
		<div class="page-content">
			<div class="description text-white">{{ test?.description }}</div>
			<Card :class="['mt-2', test.outcome]">
				<template #content>
					<div class="flex items-center justify-between gap-1">
						<div v-if="test.status === 'complete'" class="status flex items-center gap-2 text-sm">
							<template v-if="test.outcome === 'win'">
								<div class="icon-circle bg-green-700!">
									<Icon type="Emoji Events" color="white" size="24px"/>
								</div>
								<div>
									<strong class="text-lg text-green-700">This test was marked as a win</strong>
									<p class="mb-0.5! text-gray-500">{{ test.notes }}</p>
									<div class="text-xs text-gray-700/50"><strong>Complete</strong> - Ended on {{ dayjs(test.ended_at).format('ddd, MMM D, YYYY [at] h:mm:ssA') }}</div>
								</div>
							</template>
							<template v-if="test.outcome === 'loss'">
								<div class="icon-circle bg-red-700!">
									<Icon type="Thumb Down" color="white" size="24px"/>
								</div>
								<div>
									<strong class="text-lg text-red-700">This test was marked as a loss</strong>
									<p class="mb-0.5! text-gray-500">{{ test.notes }}</p>
									<div class="text-xs text-gray-700/50"><strong>Complete</strong> - Ended on {{ dayjs(test.ended_at).format('ddd, MMM D, YYYY [at] h:mm:ssA') }}</div>
								</div>
							</template>
							<template v-if="test.outcome === 'discard'">
								<div class="icon-circle bg-gray-700!">
									<Icon type="Clear" color="white" size="24px"/>
								</div>
								<div>
									<strong class="text-lg">This test was marked as discarded</strong>
									<p class="mb-0.5! text-gray-500">{{ test.notes }}</p>
									<div class="text-xs text-gray-400"><strong>Complete</strong> - Ended on {{ dayjs(test.ended_at).format('ddd, MMM D, YYYY [at] h:mm:ssA') }}</div>
								</div>
							</template>
						</div>
						<div v-else class="status flex-row text-sm">
							<Icon :type="currentStatus.icon" :color="currentStatus.icon_color" size="36px"/>
							<span><strong>{{ currentStatus.status }}</strong> - {{ currentStatus.verb }} {{ dayjs(currentStatus.date).format('ddd, MMM D, YYYY [at] h:mm:ssA') }}</span>
						</div>
						<div v-if="$sessionStore.minRole('tester')" class="settings flex gap-1">
							<Button outlined v-if="['queued', 'paused'].includes(test.status)" v-tooltip.top="'Start Test'" @click="startTest">
								<template #icon>
									<Icon type="Play Arrow" color="brand" size="22px"/>
								</template>
							</Button>
							<Button outlined v-if="test.status === 'active'" v-tooltip.top="'Pause Test'" @click="pauseTest">
								<template #icon>
									<Icon type="Pause" color="brand" size="20px"/>
								</template>
							</Button>
							<Button outlined v-if="['active', 'paused'].includes(test.status)" v-tooltip.top="'Stop Test'" @click="stopTest">
								<template #icon>
									<Icon type="Stop" color="brand" size="22px"/>
								</template>
							</Button>
							<Button outlined v-if="test.status === 'complete'" v-tooltip.top="'Archive Test'" @click="archiveTest">
								<template #icon>
									<Icon type="Archive" color="brand" size="20px"/>
								</template>
							</Button>
							<div class="self-stretch mx-1 border-l border-gray-300"/>
							<Button v-tooltip.top="'Edit Test'" @click="editTest">
								<template #icon>
									<Icon type="Edit" color="white" size="18px"/>
								</template>
							</Button>
							<Button v-tooltip.top="'Duplicate Test'" @click="duplicateTest">
								<template #icon>
									<Icon type="Content Copy" color="white" size="18px"/>
								</template>
							</Button>
						</div>
					</div>
				</template>
			</Card>
			<Card class="mt-2">
				<template #header>
					<div class="p-2 border-b border-gray-200">
						<div class="flex items-center justify-between">
							<div class="flex-row">
								<div class="icon-wrapper">
									<Icon type="analytics" size="24px" color="purple"/>
								</div>
								<div>
									<h2>{{ test.decision_metric.name }}</h2>
								</div>
							</div>
							
							<div class="flex-row">
								<div class="segment-label">Data View:</div>
								<SelectButton v-model="data_view" :allow-empty="false" :options="data_view_options" option-label="label" option-value="value" />
								<Button outlined v-if="data_view === 'series'" v-tooltip.top="'Reset Zoom'" @click="resetSeriesChartZoom()">
									<template #icon>
										<Icon type="Fullscreen" size="20px"/>
									</template>
								</Button>
								<div>
									<Button label="Explore Metrics" @click="showMetricsModal()">
										<template #icon>
											<Icon type="Insights" size="20px"/>
										</template>
									</Button>
								</div>
							</div>
						</div>
					</div>
				</template>
				<template #content>
					<div class="variation-chart">
						<template v-if="data_view === 'default'">
							<Chart ref="default_chart" type="bar" :data="defaultChartData" :options="defaultChartOptions" :plugins="chart_plugins" :height="defaultChartHeight"/>
						</template>
						<template v-else>
							<Chart ref="series_chart" type="line" :data="seriesChartData" :options="seriesChartOptions" :height="80"/>
						</template>
					</div>
				</template>
				<template #footer>
					<div v-if="test.data_segments?.length > 0" class="segmentation">
						<div class="inline-flex-row">
							<div>Data Segment:</div>
							<div v-for="(segment, index) in (test.data_segments as string[])" :key="index" class="control-group mb-0!">
								<div class="inner">
									<div class="controls">
										<div class="field">
											<Select class="min-w-20" v-model="segments[index as number]" show-clear :default-value="''" :options="segment_options[index as number]" :placeholder="segment"/>
										</div>
									</div>
								</div>
							</div>
							<Button v-tooltip.right="'View Segment Data'" @click="viewSegmentData">
								<template #icon>
									<Icon type="Arrow Forward" size="20px"/>
								</template>
							</Button>
						</div>
					</div>
				</template>
			</Card>
			<Card class="mt-2">
				<template #header>
					<div class="flex items-center justify-between p-2 pb-0">
						<div class="flex-row">
							<Icon type="list-alt" size="24px" color="purple"/><h2>Variation Details</h2>
						</div>
						<div v-if="fillable" class="flex-row mr-2">
							<ToggleSwitch v-model="show_filled_stats"/>
							<span>Enable Data Smoothing</span>
						</div>
					</div>
				</template>
				<template #content>
					<div class="variations p-1">
						<DataTable
							:value="test.variations"
							:row-class="(data) => data.status"
						>
							<Column header="Variation">
								<template #body="row">
									<div class="name text-lg font-bold">{{ row.data.description }}</div>
									<div class="variation-id text-xs text-gray-400">{{ row.data.id }}</div>
								</template>
							</Column>
							<Column header="Views" class="text-right">
								<template #body="row">
									{{ variationStats(row.data.id).view_count_string }}<span v-if="variationStats(row.data.id).filled" class="filled-stats">*</span>
								</template>
							</Column>
							<Column header="Events" class="text-right">
								<template #body="row">
									{{ variationStats(row.data.id).event_count_string }}<span v-if="variationStats(row.data.id).filled" class="filled-stats">*</span>
								</template>
							</Column>
							<Column header="Rate" class="text-right">
								<template #body="row">
									{{ variationStats(row.data.id).event_rate_string }}<span v-if="variationStats(row.data.id).filled" class="filled-stats">*</span>
								</template>
							</Column>
							<Column header="Value" class="text-right">
								<template #body="row">
									<div>{{ variationStats(row.data.id).variation_score_string }}<span v-if="variationStats(row.data.id).filled" class="filled-stats">*</span></div>
									<div v-if="row.data.id.at(-1) !== 'A'" :class="['text-sm', deltaTrend(row.data)]">{{ delta(row.data) }}</div>
								</template>
							</Column>
							<Column v-if="test.strategy === 'auto_optimize'" header="Status" class="text-center">
								<template #body="row">
									<template v-if="test.strategy === 'auto_optimize'">{{ row.data.status === 'paused' ? 'Paused' : startCase(variationStats(row.data.id).mode || 'unknown') }}</template>
									<template v-else>{{ startCase(row.data.status) }}</template>
								</template>
							</Column>
							<Column v-if="test.strategy === 'standard'" :header="`Confidence (${percentage(test.confidence_interval, 0)})`" class="text-center">
								<template #body="row">
									<template v-if="variationStats(row.data.id).mode === 'exploration'">
										<Icon type="Check" color="green" size="20px"/>
									</template>
								</template>
							</Column>
							<Column header="Actions" class="text-center">
								<template #body="row">
									<div class="inline-flex-row">
										<Button outlined v-tooltip.top="'View Variation Data'" @click="showVariationData(row.data)">
											<template #icon>
												<Icon type="File Open" color="brand" size="18px"/>
											</template>
										</Button>
										<Button v-if="test.section.preview_url" outlined v-tooltip.top="'Preview Variation'" @click="previewVariation(row.data.id)">
											<template #icon>
												<Icon type="Open in Browser" size="20px"/>
											</template>
										</Button>
										<Button v-if="$sessionStore.minRole('tester') && test.status === 'active' && row.data.status === 'active' && row.data.id !== `${test.id}-A`" outlined v-tooltip.top="'Pause Variation'" @click="pauseVariation(row.data)">
											<template #icon>
												<Icon type="Pause" size="20px"/>
											</template>
										</Button>
									</div>
								</template>
							</Column>
						</DataTable>
						<div v-if="show_filled_stats" class="caveat mt-1"><span class="filled-stats">*</span>Stats have been altered to smooth the data based on expected performance</div>
					</div>
				</template>
			</Card>
			<div class="flex gap-2 mt-2">
				<div class="self-stretch" style="flex: 2 0;">
					<Card class="comments">
						<template #header>
							<div class="flex-row p-2 pb-0">
								<Icon type="Chat" size="24px" color="purple"/>
								<h2>Comments</h2>
							</div>
						</template>
						<template #content>
							<div v-if="!comments.length" class="no-comments">
								<div><Icon type="Feedback" color="gray" size="36px"/></div>
								<div>Start a conversation by adding a comment below.</div>
							</div>
							<div v-for="comment in comments" class="comment">
								<div class="user-info">
									<p class="user font-bold mb-1">{{ comment.first_name }} {{ comment.last_name }}</p>
									<div>
										<div class="text-sm">{{ dayjs(comment.created_at).format('MMM D, YYYY [at] h:mmA') }}</div>
										<div class="text-xs text-gray-400">{{ dayjs(comment.created_at).fromNow() }}</div>
									</div>
								</div>
								<div class="comment-body">
									<div class="comment-content markdown" v-html="md(comment.content)"></div>
									<div v-if="comment.modified_at" class="text-xs text-gray-400 mt-0.5">Edited on {{ dayjs(comment.modified_at).format('MMM D, YYYY [at] h:mmA') }}</div>
									<div v-if="comment.user_id === sessionStore.user?.id" class="tools flex items-center">
										<ButtonGroup>
											<Button outlined @click="editComment(comment.id)" v-tooltip.top="'Edit Comment'">
												<template #icon>
													<Icon type="Edit" color="brand" size="20px"/>
												</template>
											</Button>
											<ConfirmDelete outlined icon-color="red" @accept="deleteComment(comment.id)" v-tooltip.top="'Delete Comment'"/>
										</ButtonGroup>
									</div>
								</div>
							</div>
							<CommentModal ref="comment_modal" :test-id="test.id" :comment="selected_comment" @save="getComments" />
						</template>
						<template #footer>
							<div class="text-right">
								<Button size="small" label="Add Comment" @click="newComment()">
									<template #icon>
										<Icon type="add" size="18px" color="white"/>
									</template>
								</Button>
							</div>
						</template>
					</Card>
				</div>
				<div class="flex-1">
					<Card class="p-2">
						<template #header>
							<div class="flex-row">
								<Icon type="Schedule" size="24px" color="purple"/>
								<h2>Test History</h2>
							</div>
						</template>
						<template #content>
							<div v-if="!status_logs.length" class="no-data-message">
								<div class="message-icon flex items-center">
									<Icon type="info" color="white" size="24px"/>
								</div>
								There is no history for this test.
							</div>
							<Timeline :value="status_logs" class="mt-2">
								<template #opposite="status_log">
									<div class="text-xs">{{ dayjs(status_log.item.created_at).format('MM/DD/YYYY [&bull;] h:mm:ssA') }}</div>
									<div class="text-xs text-gray-400">{{ dayjs(status_log.item.created_at).fromNow() }}</div>
								</template>
								<template #content="status_log">
									<div class="status-message mb-0.5 text-sm leading-2" v-html="statusMessage(status_log.item)"></div>
									<div class="user text-gray-400 text-xs mb-2">Triggered by {{ status_log.item?.data?.user_name }}</div>
								</template>
							</Timeline>
						</template>
					</Card>
				</div>
			</div>
		</div>
		<VariationDataModal/>
		<MetricsModal ref="metrics_modal" :test="test" :test-segments="metricsSegments"/>
	</div>
</template>

<script lang="ts">
import { useSessionStore } from '@/stores/Session';
import ConfirmDelete from '@components/ConfirmDelete.vue';
import dayjs from '@lib/dayjs';
import currency from '@lib/utils/currency';
import { useEventBus } from '@lib/utils/eventBus';
import num from '@lib/utils/num';
import percentage from '@lib/utils/percentage';
import CommentModal from '@/views/SplitTests/Modals/CommentModal.vue';
import MetricsModal from '@/views/SplitTests/Modals/MetricsModal.vue';
import VariationDataModal from '@/views/SplitTests/Modals/VariationDataModal.vue';
import { useMagicKeys } from '@vueuse/core';
import { hash } from 'hash-it';
import { cloneDeep, every, get, isNaN, startCase } from 'lodash-es';
import { marked } from 'marked';
import { mapStores } from 'pinia';
import type Chart from 'primevue/chart';
import type { ConfirmationOptions } from 'primevue/confirmationoptions';
import { defineComponent } from 'vue';

const emitter = useEventBus();

export default defineComponent({
	name: 'TestDetails',
	components: {
		CommentModal,
		ConfirmDelete,
		MetricsModal,
		VariationDataModal
	},
	data() {
		return {
			data_view: 'default',
			data_view_options: [
				{label: 'Default', value: 'default'},
				{label: 'Series', value: 'series'},
			],
			subject: {} as any,
			test: {
				id: '01KPEW303G8T1BVY0HQK409QQ5',
				name: 'My Test',
				decision_metric: {
					name: 'Conversion Rate'
				},
				variations: [] as any[],
			} as any,
			test_result: null as any,
			series_data: {} as any,
			status_logs: [] as any[],
			comments: [] as any[],
			segment: 'default',
			segments: [] as string[],
			segment_options: [] as string[][],	
			selected_comment: {},
			selected_variation: {},
			show_filled_stats: false,
			chart_plugins: [
				{
					id: 'centerline',
					afterDatasetsDraw(chart: any) {
						const { ctx } = chart;
						ctx.save();
						chart.getDatasetMeta(0).data.forEach((data_point: any) => {
							ctx.save();
							ctx.beginPath();
							ctx.moveTo(data_point.x - (data_point.width / 2), data_point.y - (data_point.height / 2));
							ctx.lineTo(data_point.x - (data_point.width / 2), data_point.y + (data_point.height / 2));
							ctx.lineWidth = 2;
							ctx.setLineDash([2, 4]);
							ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
							ctx.stroke();
							ctx.restore();
						});
					}
				},
				{
					id: 'variationLabel',
					afterDatasetsDraw(chart: any) {
						const { ctx, data } = chart;
						ctx.save();
						chart.getDatasetMeta(0).data.forEach((data_point: any, index: number) => {
							ctx.textBaseline = 'middle';
							ctx.font = 'bold 12px sans-serif';
							ctx.fillStyle = 'white';
							ctx.fillText(data.labels[index], data_point.x - data_point.width + 15, data_point.y);
						});
					}
				}
			],
			commentShortcut: useMagicKeys()['Ctrl+Shift+C']
		};
	},
	computed: {
		fillable() {
			const results = get(this.test_result, `${this.segment}`, {});
			return this.test.variations?.some((v: any) => {
				const stats = results[v.id];
				return stats.view_count < this.test.min_views;
			});
		},
		defaultChartHeight() {
			return this.test.variations?.length * 10 + 20;
		},
		defaultChartData() {
			return {
				labels: this.test.variations?.map((v: any) => v.description),
				datasets: [
					{
						label: this.segment,
						value: this.test.variations?.map((v: any) => {
							return this.variationStats(v.id).variation_score || null;
						}),
						value_string: this.test.variations?.map((v: any) => {
							return this.variationStats(v.id).variation_score_string || null;
						}),
						mode: this.test.variations?.map((v: any) => {
							return this.variationStats(v.id).mode || null;
						}),
						data: this.test.variations?.map((v: any) => {
							return this.variationStats(v.id).variation_score_range || [0, 1];
						}),
						backgroundColor: this.test.variations?.map((v: any) => {
							if (this.variationStats(v.id).mode === 'exploration') {
								return '#29A1AA'; // Exploration
							}
							else if (this.variationStats(v.id).mode === 'paused') {
								return '#CCCCCC'; // Paused
							}
							else if (this.variationStats(v.id).mode === 'failed') {
								return '#FF3B30'; // Failed
							}
							return '#90BE6D'; // Consideration
						})
					}
				]
			}
		},
		defaultChartOptions() {
			return {
				indexAxis: 'y',
				responsive: true,
				elements: {
					bar: {
						borderWidth: 0
					}
				},
				plugins: {
					legend: {
						display: false
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
						yAlign: 'center',
						callbacks: {
							title: (tooltipItems: any) => {
								return tooltipItems[0].label;
							},
							label: (context: any) => {
								// Value formatting is already applied
								return context.dataset.value_string[context.dataIndex];
							},
							footer: (tooltipItems: any) => {
								const mode = tooltipItems[0].dataset.mode[tooltipItems[0].dataIndex];
								if (this.test.strategy === 'auto_optimize') {
									return '- ' + (startCase(mode) || 'Consideration');
								}
								return mode === 'exploration' ? '- Statistically Significant' : '';
							}
						}
					}
				},
				scales: {
					x: {
						ticks: {
							callback: (value: number) => {
								if (this.test.decision_metric.type === 'percent') {
									return percentage(value);
								}
								else if (this.test.decision_metric.type === 'currency') {
									return currency(value);
								}
								else {
									return num(value);
								}
							}
						},
						beginAtZero: false,
						grace: 0.01
					},
					y: {
						ticks: {
							callback: (value: number, index: number) => {
								const split_variation_id = this.test.variations[index].id.split('-');
								return split_variation_id[1];
							}
						}
					}
				},
			}
		},
		seriesChartData() {
			const colors = ['#29a1aa', '#ffb740', '#df711b', '#90be6d', '#7046a2'];

			const labels = this.series_data[this.segment]?.[Object.keys(this.series_data[this.segment])[0]].map((variation_data: any) => {
				return dayjs(variation_data.ts).toDate();
			}) || [];

			const series_data: any[] = [];
			Object.keys(this.series_data[this.segment]).sort().forEach((variation_id, index) => {
				series_data.push({
					label: variation_id,
					data: this.series_data[this.segment][variation_id].map((row: any) => {
						if (this.show_filled_stats) {
							return row.filled_variation_score || row.variation_score;
						}
						return row.variation_score;
					}),
					backgroundColor: colors[index],
					borderColor: colors[index],
				});
			});

			return {
				labels,
				datasets: series_data
			}
		},
		seriesChartOptions() {
			return {
				responsive: true,
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
								})).sort((a, b) => a.text.localeCompare(b.text)); // Sort legend labels alphabetically
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
								if (this.test.decision_metric.type === 'percent') {
									return `${label.slice(-1)}: ${percentage(context.formattedValue)}`;
								}
								else if (this.test.decision_metric.type === 'currency') {
									return `${label.slice(-1)}: ${currency(context.formattedValue)}`;
								}
								else {
									return `${label.slice(-1)}: ${num(context.formattedValue)}`;
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
								if (this.test.decision_metric.type === 'percent') {
									return percentage(value);
								}
								else if (this.test.decision_metric.type === 'currency') {
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
		currentStatus() {
			if (this.test.status === 'queued') {
				return {
					status: 'Queued',
					icon: 'schedule',
                    icon_color: 'blue',
					verb: 'Created on',
                    date: this.test.created_at
                }
            }
            else {
				const log: any = this.status_logs[0];
                if (log?.data?.status === 'active') {
                    return {
						status: 'Running',
                        icon: 'play-circle',
                        icon_color: 'green',
                        verb: 'Started on',
                        date: log.created_at
                    };
                }
                if (log?.data?.status === 'paused') {
                    return {
						status: 'Paused',
                        icon: 'pause-circle',
                        icon_color: 'gray',
                        verb: 'Paused on',
                        date: log.created_at
                    };
                }
                if (log?.data?.status === 'unpaused') {
                    return {
						status: 'Running',
                        icon: 'play-circle',
                        icon_color: 'green',
                        verb: 'Resumed on',
                        date: log.created_at
                    };
                }
                if (log?.data?.status === 'complete') {
                    return {
						status: 'Complete',
                        icon: 'stop-circle',
                        icon_color: 'red',
                        verb: 'Stopped on',
                        date: log.created_at
                    };
                }
                if (log?.data?.status === 'archived') {
                    return {
						status: 'Archived',
                        icon: 'remove-circle',
                        icon_color: 'purple',
                        verb: 'Archived on',
                        date: log.created_at
                    };
                }
            }
            return {};
		},
		metricsSegments() {
			return {
				properties: this.test.data_segments || [],
				options: this.segment_options
			}
		},
		...mapStores(useSessionStore)
	},
	watch: {
		show_filled_stats(new_value, old_value) {
			if (new_value !== old_value) {
				if (this.data_view === 'default') {
					const chart_instance = this.$refs.default_chart as InstanceType<typeof Chart>;
					chart_instance.getChart().update();
				}
				else {
					const chart_instance = this.$refs.series_chart as InstanceType<typeof Chart>;
					chart_instance.getChart().update();
				}
			}
		},
		data_view: {
			handler(new_value, old_value) {
				if (new_value !== old_value) {
					if (new_value === 'series' && !this.series_data[this.segment]) {
						// Get the series data for the selected segment
						this.getSeriesDataForSegment();
					}
				}
			}
		},
		commentShortcut(new_value) {
			if (new_value) {
				this.newComment();
			}
		}
	},
	methods: {
		currency,
		dayjs,
		md(v: string) {
			return marked.parse(v);
		},
		num,
		percentage,
		startCase,
		backToTests() {
			this.$router.go(-1);
		},
		// Reload the data for the selected segment
		viewSegmentData() {
			this.segments = this.segments.map((s) => {
				if (s === null) {
					return '';
				}
				return s;
			});
			if (every(this.segments, (s) => s === '')) {
				this.segment = 'default';
			} else {
				this.segment = hash(this.segments).toString();
			}

			this.getSeriesDataForSegment();
		},
		// Format the test stats for the selected viewing options
		variationStats(variation_id: string) {
			const stats = cloneDeep(get(this.test_result, `${this.segment}.${variation_id}`, {}));
			
			stats.filled = false;
			if (this.show_filled_stats) {
				if (stats.view_count < this.test.min_views) {
					stats.filled = true;
				}
				stats.view_count = stats.filled_view_count || 0;
				stats.event_count = stats.filled_event_count || 0;
				stats.event_rate = stats.filled_event_rate || 0;
				stats.event_value = stats.filled_event_value || 0;
				stats.variation_score = stats.filled_variation_score || 0;
				stats.variation_score_range = stats.filled_variation_score_range || [0, 1];
				stats.mode = stats.filled_mode || stats.mode || 'consideration';
			}

			stats.view_count_string = num(stats.view_count);
			stats.event_count_string = num(stats.event_count);
			stats.event_rate_string = percentage(stats.event_rate);
			if (this.test.decision_metric.type === 'percent') {
				stats.event_value_string = num(stats.event_value);
				stats.variation_score_string = percentage(stats.variation_score || 0);
			}
			else if (this.test.decision_metric.type === 'currency') {
				stats.event_value_string = currency(stats.event_value || 0);
				stats.variation_score_string = currency(stats.variation_score || 0);
			}
			else {
				stats.event_value_string = num(stats.event_value || 0);
				stats.variation_score_string = num(stats.variation_score || 0);
			}

			return stats;
		},
		// Get the delta between the variation and the control group
		delta(variation: any) {
			const control_stats = this.variationStats(`${this.test.id}-A`);
			const variation_stats = this.variationStats(variation.id);

			if (parseFloat(control_stats.variation_score) === 0) {
				return '--';
			}

			const delta = (variation_stats.variation_score / control_stats.variation_score) - 1;
			if (isNaN(delta)) {
				return '--';
			}
			if (delta > 0) {
				return '+' + percentage(delta);
			}
			return percentage(delta);
		},
		// Get the color for the delta trend
		deltaTrend(variation: any) {
			const control_stats = this.variationStats(`${this.test.id}-A`);
			const variation_stats = this.variationStats(variation.id);

			if (control_stats.variation_score === 0) {
				return 'text-gray-400';
			}

			const delta = (variation_stats.variation_score / control_stats.variation_score) - 1;

			if (delta > 0) {
				if (this.test.decision_metric.sorting_type === 'min') {
					return 'text-red-500';
				}
				return 'text-green-500';
			}
			else if (delta < 0) {
				if (this.test.decision_metric.sorting_type === 'min') {
					return 'text-green-500';
				}
				return 'text-red-500';
			}
			else {
				return 'text-gray-400';
			}
		},
		// Display the metrics modal
		showMetricsModal() {
			const metrics_modal_instance = this.$refs.metrics_modal as InstanceType<typeof MetricsModal>;
				metrics_modal_instance.open();
		},
		// Display the modal with variation data
		showVariationData(variation: any) {
			this.selected_variation = variation;
			emitter.emit('openVariationDataModal', variation);
		},
		// Open the variation in a new window
		previewVariation(variation_id: string) {
			const preview_url = this.test.section.preview_url.replaceAll('{{test_id}}', this.test.id).replaceAll('{{variation_id}}', variation_id);
			window.open(preview_url, '_blank');
		},
		// Pause an active variation
		pauseVariation(variation: any) {
			let unpause_msg = '';
			if (!this.sessionStore.settings?.allow_unpausing_variations) {
				unpause_msg = ' Once a variation is paused, it may not be unpaused.';
			}
			this.$confirm.require({
                group: 'confirmation',
                header: 'Pause Variation',
				icon: 'pause-circle',
                message: `Are you sure you want to pause the variation <strong>${variation.description}</strong>?${unpause_msg}`,
                acceptProps: {
                    label: 'Pause Variation',
                },
                accept: async () => {
					const variations = cloneDeep(this.test.variations).map((v: any) => {
						if (variation.id === v.id) {
							v.status = 'paused';
						}
						return v;
					});

                    const { data } = await this.$API.patch(`/api/tests/${this.test.id}`, {
						test: {
							variations
						}
                    });
                    if (data) {
						this.test.variations = variations;
                        this.$toast.add({
                            severity: 'success',
                            summary: 'Variation Paused',
                            detail: `The variation '${variation.description}' was stopped.`,
                            life: 5000
                        });
                    }
                },
                rejectProps: {
                    label: 'Cancel',
                    severity: 'secondary'
                },
            });
		},
		// Get all the test details
		async getTestDetails() {
			const { data: result } = await this.$API.get(`/api/tests/${this.$route.params.test_id}/details`);
			this.test = result.test;
			this.test_result = result.data;
			this.comments = result.comments;
			this.status_logs = result.status_logs;
			this.segment_options = result.segments.filter((s: string[]) => s.length > 1).map((o: string[]) => o.filter((i: string) => i !== ''));
			this.segments = this.segment_options.map((segment_option) => '');
			this.viewSegmentData();
		},
		// Get a list of status changes for the test
		async getStatusLogs() {
			const { data } = await this.$API.get(`/api/status-logs/${this.$route.params.test_id}`);
			this.status_logs = data;
		},
		// Get the time series data for the selected segment
		async getSeriesDataForSegment() {
			const { data } = await this.$API.get(`/api/tests/${this.test.id}/series-data`, {
				params: {
					segments: this.segments
				}
			});
			this.series_data[this.segment] = data;
		},
		resetSeriesChartZoom() {
			const chart_instance = this.$refs.series_chart as InstanceType<typeof Chart>;
			chart_instance.getChart().resetZoom();
		},
		// Edit the current test
		editTest() {
			this.$router.push(`/split-tests/edit/${this.test.id}`);
		},
		// Duplicate the current test
		duplicateTest() {
			this.$router.push(`/split-tests/edit/new?duplicate_test_id=${this.test.id}`);
		},
		// Start the current test if it is not already active
		async startTest() {
            const { data } = await this.$API.patch(`/api/tests/${this.test.id}/status`, {
                status: 'active'
            });
            if (data.timestamp) {
                this.test.status = 'active';
				this.getStatusLogs();
                this.$toast.add({
                    severity: 'success',
                    summary: 'Test Started',
                    detail: `The test '${this.test.name}' was started.`,
                    life: 5000
                });
            }
        },
		// Pause the current test if it is active
        async pauseTest() {
            const { data } = await this.$API.patch(`/api/tests/${this.test.id}/status`, {
                status: 'paused'
            });
            if (data.timestamp) {
                this.test.status = 'paused';
				this.getStatusLogs();
                this.$toast.add({
                    severity: 'success',
                    summary: 'Test Paused',
                    detail: `The test '${this.test.name}' was paused.`,
                    life: 5000
                });
            }
        },
		// Stop the current test if it is active or paused. Once stopped, a test cannot be restarted.
        async stopTest() {
            this.$confirm.require({
                group: 'confirmation',
                severity: 'danger',
                header: 'Stop Test',
                message: `Are you sure you want to stop the test <strong>${this.test.name}</strong>? Once a test has been stopped, it cannot be restarted.`,
                acceptProps: {
                    label: 'Stop Test',
                    severity: 'danger'
                },
                accept: async () => {
                    const { data } = await this.$API.patch(`/api/tests/${this.test.id}/status`, {
                        status: 'complete'
                    });
                    if (data.timestamp) {
                        // Trigger the outcome modal
                        emitter.emit('openOutcomeModal', {
                            test_id: this.test.id,
                            test_name: this.test.name
                        });

                        this.test.status = 'complete';
						this.getStatusLogs();
                        this.$toast.add({
                            severity: 'success',
                            summary: 'Test Stopped',
                            detail: `The test '${this.test.name}' was stopped.`,
                            life: 5000
                        });
                    }
                },
                rejectProps: {
                    label: 'Cancel',
                    severity: 'secondary'
                },
            } as ConfirmationOptions);
        },
		// Archive a completed test to remove it from the main list of tests. Archived tests can be viewed in the archived tests section, but cannot be edited or restarted.
        async archiveTest() {
            const { data } = await this.$API.patch(`/api/tests/${this.test.id}/status`, {
                status: 'archived'
            });
            if (data.timestamp) {
                this.test.status = 'archived';
				this.getStatusLogs();
                this.$toast.add({
                    severity: 'success',
                    summary: 'Test Archived',
                    detail: `The test '${this.test.name}' was archived.`,
                    life: 5000
                });
            }
        },
		// Get the comments for the test and display them in the comments section
		async getComments() {
			const { data } = await this.$API.get(`/api/comments/test/${this.$route.params.test_id}`);
			this.comments = data;
		},
		// Open the comment modal to create a new comment
		async newComment() {
			emitter.emit('openCommentModal');
		},
		// Open the comment modal to edit an existing comment
		async editComment(comment_id: string) {
			const comment = this.comments.find((comment) => {
				return comment.id === comment_id;
			});
			emitter.emit('openCommentModal', comment);
		},
		// Delete a comment and refresh the comments section
		async deleteComment(comment_id: string) {
			await this.$API.delete(`/api/comments/${comment_id}`);
			this.getComments();
			this.$toast.add({
				severity: 'success',
				summary: 'Comment Deleted',
				detail: `The comment was deleted.`,
				life: 5000
			});
		},
		// Format the status change messages for the test history section
		statusMessage(status_log: any) {
			if (status_log?.type === 'variation') {
				const variation = this.test.variations.find((v: any) => {
					return v.id === status_log?.data?.variation_id;
				});
				if (variation) {
					return `The variation "${variation.description}" was changed to ${status_log?.data?.mode} for the segment ${status_log?.data?.segment || 'unknown'}.`;
				}
			}
			return `The test status was changed to <strong>${status_log?.data?.status}.</strong>`;
		}
	},
	async beforeMount() {
		await this.getTestDetails();
		const { data: subject } = await this.$API.get(`/api/subjects/${this.test.subject_id}`);
		this.subject = subject;
	}
});
</script>

<style scoped lang="less">
:deep(.p-card) {
	&.win {
		background-color: #E5F2E3;
    }
    &.loss {
		background-color: var(--color-red-50);
    }
    &.discard {
		background-color: var(--color-gray-100);
    }
	
	&.win, &.loss, &.discard {
		border: 3px solid white;
	}
}

hgroup {
	line-height: 1.25;
}

h2 {
	font-size: 1em;
	font-weight: 700;
	text-transform: uppercase;	
}

.settings-icon {
	height: 50px;
	width: 50px;
}

:deep(.p-datatable-column-title) {
	width: 100%;
}

.back-button {
	align-items: center;
	background-color: rgba(0,0,0,0.15);
	border-radius: 25px;
	cursor: pointer;
	display: inline-flex;
	height: 50px;
	justify-content: center;
	width: 50px;

	&:hover {
		background-color: rgba(0,0,0,0.25);
	}
}

:deep(tr.paused) {
	background-color: var(--color-gray-100);
	color: var(--color-gray-400);
	font-style: italic;
}

:deep(.filled-stats) {
	color: var(--color-alt);
	font-size: 0.875em;
	margin: 0 2px;
	vertical-align: top;
}

.segmentation {
	border-top: 1px solid var(--color-gray-200);
	margin: 1rem calc(-1 * var(--p-card-body-padding)) calc(-1 * var(--p-card-body-padding));
	padding: var(--p-card-body-padding);
}

.no-comments {
	align-items: center;
	background-color: var(--color-gray-100);
	border: 1px solid var(--gray-300);
	border-radius: 5px;
	color: var(--color-gray-400);
	display: flex;
	flex-direction: column;
	gap: 2;
	justify-content: center;
	padding: 4em;
	width: 100%;
}

.comment {
	border-bottom: 1px solid var(--color-gray-200);
	display: grid;
	gap: 2em;
	grid-template-columns: 200px 1fr;
	padding: 2em;

	.comment-body {
		position: relative;

		.tools {
			display: none;
			position: absolute;
			top: 0;
			right: 0;
		}
	}
	
	&:hover {
		background-color: var(--color-gray-50);
		
		.tools {
			display: block;
		}
	}
}
</style>