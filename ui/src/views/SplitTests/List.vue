<template>
	<div class="page">
		<div class="flex-row split mb-2">
			<hgroup class="flex items-center gap-2 mb-0">
				<div class="page-icon bg-brand">
					<Icon type="Fact Check" color="white" size="28px"/>
				</div>
				<div class="page-heading">
					<h1>Split Tests</h1>
					<div class="font-bold">{{ subject.name }}</div>
				</div>
			</hgroup>
			<div v-if="$sessionStore.minRole('tester')" class="flex items-center">
				<Button label="New Split Test" @click="newSplitTest()">
					<template #icon>
						<Icon type="Add"/>
					</template>
				</Button>
			</div>
		</div>
		<div class="rollup-metrics flex-row gap-4">
			<div class="metric-card">
				<div class="metric-content">
					<div class="label">Active Tests</div>
					<div class="value">{{ activeTests.length }}</div>
				</div>
				<div class="icon">
					<div class="icon-wrapper">
						<Icon type="Play Circle" color="brand" size="36px"/>
					</div>
				</div>
			</div>
			<div class="metric-card">
				<div class="metric-content">
					<div class="label">Pending Tests</div>
					<div class="value">{{ pendingTests.length }}</div>
				</div>
				<div class="icon">
					<div class="icon-wrapper">
						<Icon type="Pending" color="brand" size="36px"/>
					</div>
				</div>
			</div>
			<div class="metric-card">
				<div class="metric-content">
					<div class="label">Active Test Participations</div>
					<div class="value">{{ num(sumBy(activeTests, test => testParticipations(test) || 0)) }}</div>
				</div>
				<div class="icon">
					<div class="icon-wrapper">
						<Icon type="Attribution" color="brand" size="36px"/>
					</div>
				</div>
			</div>
		</div>
		<div class="page-content">
			<div class="page-filters">
				<div class="control-group w-25">
					<div class="inner">
						<div class="controls">
							<div class="field">
								<MultiSelect fluid v-model="page_filters.subject_id" :show-toggle-all="false" :options="subjectOptions" option-label="label" option-value="value" multiple clearable show-clear placeholder="Filter by Subject"/>
							</div>
						</div>
					</div>
				</div>
				<div class="control-group w-25">
					<div class="inner">
						<div class="controls">
							<div class="field">
								<MultiSelect fluid v-model="page_filters.created_by" :show-toggle-all="false" :options="userOptions" option-label="label" option-value="value" multiple clearable show-clear placeholder="Filter by User"/>
							</div>
						</div>
					</div>
				</div>
				<Button v-tooltip.right="'Clear Filters'" @click="clearPageFilters">
					<template #icon>
						<Icon type="Filter Alt Off" color="white" size="20px"/>
					</template>
				</Button>
			</div>

			<!-- Active Tests -->
			<Card class="tests-card">
				<template #header>
					<div class="flex-row">
						<Icon type="Play Circle" color="brand" size="32px"/>
						<h2>Active and Pending Tests</h2>
					</div>
				</template>
				<template #content>
					<template v-for="test in activeTests" :key="test.id">
						<div class="test active">
							<div class="status">
								<template v-if="test.status === 'active'">
									<div class="status-icon bg-brand-500" v-tooltip.top="'Active'">
										<Icon type="Play Arrow" color="white" size="32px"/>
									</div>
								</template>
								<template v-else-if="test.status === 'paused'">
									<div class="status-icon bg-gray-300" v-tooltip.top="'Paused'">
										<Icon type="Pause" color="white" size="28px"/>
									</div>
								</template>
							</div>
							<div class="info">
								<div class="name text-lg font-bold">{{ test.name }}</div>
								<div class="description">{{  test.description || 'No description available' }}</div>
								<div class="started-on text-gray-400 text-xs mt-0.25">Started on {{ useDateFormat(test.started_at, 'MMM D, YYYY') }} - {{ useTimeAgo(test.started_at) }}</div>
							</div>
							<div class="options flex justify-start gap-1">
								<div v-if="test.strategy !== 'auto_optimize'" class="optimization settings-icon bg-accent-500" v-tooltip.top="'Standard Test'">
									<Icon type="Balance" color="white" size="20px"/>
								</div>
								<div v-else class="optimization settings-icon bg-accent-500" v-tooltip.top="'Auto-Optimized'">
									<Icon type="Auto Mode" color="white" size="20px"/>
								</div>
								<div v-if="Array.isArray(test.data_segments) && test.data_segments.length" class="segmentation settings-icon bg-accent-500" v-tooltip.top="'Segmented'">
									<Icon type="Splitscreen" color="white" size="20px"/>
								</div>
							</div>
							<div class="subject">
								<div class="text-xs text-gray-400 font-bold">Section</div>
								<div class="subject-id">{{ test.subject_id }}</div>
								<div class="section-id">{{ test.section_id }}</div>
							</div>
							<div class="metric">
								<div class="text-xs text-gray-400 font-bold">Decision Metric</div>
								<div>{{ test.decision_metric?.event_type || 'Unknown' }}</div>
								<div :class="trend(testMetricDelta(test)!, test.decision_metric?.sorting_type)">{{ percentage(testMetricDelta(test)!) || '--' }}</div>
							</div>
							<div class="participations">
								<div class="text-xs text-gray-400 font-bold">Participations</div>
								<div>{{ num(testParticipations(test) || 0) }}</div>
							</div>
							<div class="tools">
								<div class="flex justify-end gap-1">
									<Button v-tooltip.top="'Explore Test Data'" @click="viewSplitTestDetails(test.id)">
										<template #icon>
											<Icon type="Assessment" color="white" size="24px"/>
										</template>
									</Button>
									<template v-if="$sessionStore.minRole('tester')">
										<template v-if="test.status === 'active'">
											<Button v-tooltip.top="'Pause Test'" @click="pauseSplitTest(test)">
												<template #icon>
													<Icon type="Pause" color="white" size="20px"/>
												</template>
											</Button>
										</template>
										<template v-if="test.status === 'paused'">
											<Button v-tooltip.top="'Resume Test'" @click="startSplitTest(test)">
												<template #icon>
													<Icon type="Play Arrow" color="white" size="24px"/>
												</template>
											</Button>
										</template>
										<template v-if="test.status !== 'pending'">
											<Button v-tooltip.top="'Stop Test'" @click="stopSplitTest(test)">
												<template #icon>
													<Icon type="Stop" color="white" size="24px"/>
												</template>
											</Button>
										</template>
									</template>
								</div>
							</div>
						</div>
					</template>
					<template v-for="test in pendingTests" :key="test.id">
						<div class="test pending">
							<div class="status">
								<div class="status-icon bg-brand-200" v-tooltip.top="'Pending'">
									<Icon type="Hourglass Top" color="white" size="24px"/>
								</div>
							</div>
							<div class="info">
								<div class="name text-lg font-bold">{{ test.name }}</div>
								<div class="description">{{  test.description || 'No description available' }}</div>
								<div class="started-on text-gray-400 text-xs mt-0.25">Created on {{ useDateFormat(test.created_at, 'MMM D, YYYY') }} - {{ useTimeAgo(test.started_at) }}</div>
							</div>
							<div class="options flex justify-start gap-1">
								<div v-if="!test.auto_optimize" class="optimization settings-icon bg-accent-500" v-tooltip.top="'Standard Test'">
									<Icon type="Balance" color="white" size="20px"/>
								</div>
								<div v-else class="optimization settings-icon bg-accent-500" v-tooltip.top="'Auto-Optimized'">
									<Icon type="Auto Mode" color="white" size="20px"/>
								</div>
								<div v-if="Array.isArray(test.data_segments) && test.data_segments.length" class="segmentation settings-icon bg-accent-500" v-tooltip.top="'Segmented'">
									<Icon type="Splitscreen" color="white" size="20px"/>
								</div>
							</div>
							<div class="subject">
								<div class="text-xs text-gray-400 font-bold">Section</div>
								<div class="subject-id">{{ test.subject_id }}</div>
								<div class="section-id">{{ test.section_id }}</div>
							</div>
							<div class="metric">
								<div class="text-xs text-gray-400 font-bold">Decision Metric</div>
								<div>{{ test.decision_metric?.event_type || 'Unknown' }}</div>
							</div>
							<div class="blank"></div>
							<div class="tools">
								<template v-if="$sessionStore.minRole('tester')">
									<div class="flex justify-end gap-1">
										<Button v-tooltip.top="'Edit Test'" @click="$router.push(`split-tests/edit/${test.id}`)">
											<template #icon>
												<Icon type="Mode Edit" color="white" size="20px"/>
											</template>
										</Button>
										<Button v-tooltip.top="'Start Test'" @click="startSplitTest(test)">
											<template #icon>
												<Icon type="Play Arrow" color="white" size="24px"/>
											</template>
										</Button>
									</div>
								</template>
							</div>
						</div>
					</template>
					<div v-if="!activeTests.length && !pendingTests.length" class="no-tests-message">
						<div class="message-icon flex items-center">
							<Icon type="info" color="gray" size="24px"/>
						</div>
						There are no active or paused tests that match the current filters
					</div>
				</template>
			</Card>
			
			<!-- Completed Tests -->
			<Card class="tests-card">
				<template #header>
					<div class="flex items-center justify-between">
						<div class="flex flex-initial justify-start gap-4">
							<div class="flex-row">
								<Icon type="Check Circle" color="brand" size="32px"/>
								<h2>Completed Tests</h2>
							</div>
						</div>
						<div class="filters flex-initial flex-row justify-end gap-2!">
							<div class="control-group flex-auto! mb-0!">
								<div class="inner">
									<div class="controls items-center gap-1!">
										<div class="field fit">
											<div class="text-sm">Completed on:</div>
										</div>
										<div class="field">
											<InputGroup>
												<DatePicker class="w-20" v-model="completed_test_filters.ended_at" selection-mode="range" date-format="m/dd/yy" size="small" @hide="getCompletedTests()" />
												<InputGroupAddon class="bg-brand-500 cursor-default" @click="toggleFilterOptions">
													<Icon type="Date Range" color="white" size="16px"/>
												</InputGroupAddon>
											</InputGroup>
										</div>
									</div>
								</div>
								<Menu ref="date_options_menu" :model="date_presets" :popup="true">
									<template #item="{ item }">
										<div class="popup-menu-item flex-row gap-0.5!">
											<Icon :type="item.icon" color="brand" size="18px"/>
											{{ item.label }}
										</div>
									</template>
								</Menu>
							</div>
							<div class="control-group mb-0!">
								<div class="inner">
									<div class="controls">
										<div class="field">
											<MultiSelect fluid v-model="completed_test_filters.outcome" :max-selected-labels="1" :show-toggle-all="false" :options="outcome_options" option-label="label" option-value="value" clearable show-clear placeholder="Filter by Outcome" size="small"/>
										</div>
									</div>
								</div>
							</div>
							<ArchiveToggle v-model="show_archived" />
						</div>
					</div>
				</template>
				<template #content>
					<template v-for="test in completedTests" :key="test.id">
						<div :class="['test', test.status]">
							<div class="outcome">
								<template v-if="test.outcome === 'win'">
									<div class="status-icon bg-lime-500" v-tooltip.top="'Win'">
										<Icon type="Emoji Events" color="white" size="28px"/>
									</div>
								</template>
								<template v-if="test.outcome === 'loss'">
									<div class="status-icon bg-red-500" v-tooltip.top="'Loss'">
										<Icon type="Thumb Down" color="white" size="24px"/>
									</div>
								</template>
								<template v-if="test.outcome === 'discard'">
									<div class="status-icon bg-gray-500" v-tooltip.top="'Discarded'">
										<Icon type="Close" color="white" size="24px"/>
									</div>
								</template>
							</div>
							<div class="info">
								<div class="name text-lg font-bold">{{ test.name }}</div>
								<div class="description">{{  test.description || 'No description available' }}</div>
								<div class="started-on text-gray-400 text-xs mt-0.25">Ended on {{ useDateFormat(test.ended_at, 'MMM D, YYYY') }} - {{ useTimeAgo(test.ended_at) }}</div>
							</div>
							<div class="options flex justify-start gap-1">
								<div v-if="!test.auto_optimize" class="optimization settings-icon bg-accent-500" v-tooltip.top="'Standard Test'">
									<Icon type="Balance" color="white" size="20px"/>
								</div>
								<div v-else class="optimization settings-icon bg-accent-500" v-tooltip.top="'Auto-Optimized'">
									<Icon type="Auto Mode" color="white" size="20px"/>
								</div>
								<div v-if="Array.isArray(test.data_segments) && test.data_segments.length" class="segmentation settings-icon bg-accent-500" v-tooltip.top="'Segmented'">
									<Icon type="Splitscreen" color="white" size="20px"/>
								</div>
							</div>
							<div class="subject">
								<div class="text-xs text-gray-400 font-bold">Section</div>
								<div class="subject-id">{{ test.subject_id }}</div>
								<div class="section-id">{{ test.section_id }}</div>
							</div>
							<div class="metric">
								<div class="text-xs text-gray-400 font-bold">Decision Metric</div>
								<div>{{ test.decision_metric?.event_type || 'Unknown' }}</div>
							</div>
							<div class="participations">
								<div class="text-xs text-gray-400 font-bold">Participations</div>
								<div>{{ num(testParticipations(test) || 0) }}</div>
							</div>
							<div class="tools">
								<div class="flex justify-end gap-1">
									<Button v-tooltip.top="'Explore Test Data'" @click="viewSplitTestDetails(test.id)">
										<template #icon>
											<Icon type="Assessment" color="white" size="24px"/>
										</template>
									</Button>
									<template v-if="$sessionStore.minRole('tester')">
										<template v-if="test.status === 'complete'">
											<Button v-tooltip.top="'Archive Test'" @click="archiveSplitTest(test)">
												<template #icon>
													<Icon type="Archive" color="white" size="20px"/>
												</template>
											</Button>
										</template>
										<template v-if="test.status === 'archived'">
											<Button v-tooltip.top="'Unarchive Test'" @click="unarchiveSplitTest(test)">
												<template #icon>
													<Icon type="Unarchive" color="white" size="20px"/>
												</template>
											</Button>
											<Button v-tooltip.top="'Delete Test'" @click="deleteSplitTest(test)">
												<template #icon>
													<Icon type="Delete" color="white" size="20px"/>
												</template>
											</Button>
										</template>
									</template>
								</div>
							</div>
						</div>
					</template>
					<div v-if="!completedTests.length" class="no-tests-message">
						<div class="message-icon flex items-center">
							<Icon type="info" color="gray" size="24px"/>
						</div>
						There are no completed tests that match the current filters
					</div>
				</template>
			</Card>
			
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { forIn, isEqual, isUndefined, remove, set, sortBy, sumBy, uniqBy } from 'lodash-es';
import ArchiveToggle from '@/components/ArchiveToggle.vue';
import FilterToggle from '@/components/FilterToggle.vue';
import { title } from '@lib/filters';
import { useDateFormat, useTimeAgo } from '@vueuse/core';
import dayjs from 'dayjs';
import { useEventBus } from '@lib/utils/eventBus';
import num from '@/lib/utils/num';
import percentage from '@/lib/utils/percentage';
import type { ConfirmationOptions } from 'primevue/confirmationoptions';

const emitter = useEventBus();

export default defineComponent({
	name : 'SplitTestsList',
	components: {
		ArchiveToggle,
		FilterToggle,
	},
	data() {
		return {
			subject: {} as any | null,
			incomplete_tests: [] as any[],
			complete_tests: [] as any[],
			show_archived: false,
			page_filters: {
				subject_id: [] as string[],
				created_by: [] as string[]
			},
			completed_test_filters: {
				ended_at: [dayjs().subtract(30, 'days').startOf('day').toDate(), dayjs().subtract(1, 'day').endOf('day').toDate()] as Date[],
				outcome: [] as string[]
			},
			completed_test_dates: [] as Date[],
			status_options: [
				{label: 'Queued', value: 'queued'},
				{label: 'Active', value: 'active'},
				{label: 'Paused', value: 'paused'},
				{label: 'Complete', value: 'complete'},
				{label: 'Archived', value: 'archived'},
			],
			outcome_options: [
				{label: 'Winning Tests', value: 'win'},
				{label: 'Losing Tests', value: 'loss'},
				{label: 'Discarded Tests', value: 'discard'},
			],
			date_presets: [
				{
					icon: 'Date Range',
					label: 'Today',
					command: this.setDateFilter([dayjs().startOf('day').toDate(), dayjs().endOf('day').toDate()])
				},
				{
					icon: 'Date Range',
					label: 'Yesterday',
					command: this.setDateFilter([dayjs().subtract(1, 'day').startOf('day').toDate(), dayjs().subtract(1, 'day').endOf('day').toDate()])
				},
				{
					icon: 'Date Range',
					label: 'Last 7 Days',
					command: this.setDateFilter([dayjs().subtract(7, 'days').startOf('day').toDate(), dayjs().subtract(1, 'day').endOf('day').toDate()])
				},
				{
					icon: 'Date Range',
					label: 'Last 30 Days',
					command: this.setDateFilter([dayjs().subtract(30, 'days').startOf('day').toDate(), dayjs().subtract(1, 'day').endOf('day').toDate()])
				},
				{
					icon: 'Date Range',
					label: 'Last 60 Days',
					command: this.setDateFilter([dayjs().subtract(60, 'days').startOf('day').toDate(), dayjs().subtract(1, 'day').endOf('day').toDate()])
				},
				{
					icon: 'Date Range',
					label: 'Last 3 Months',
					command: this.setDateFilter([dayjs().subtract(3, 'months').startOf('month').toDate(), dayjs().subtract(1, 'month').endOf('month').toDate()])
				}
			],
		};
	},
	computed: {
		subjectOptions() {
			return this.$sessionStore.subject_options;
		},
		userOptions() {
			return this.$sessionStore.user_options;
		},
		activeTests() {
			const filtered_active_tests = this.incomplete_tests.filter((test) => {
				if (this.page_filters.subject_id.length && !this.page_filters.subject_id.includes(test.subject_id)) {
					return false;
				}
				if (this.page_filters.created_by.length && !this.page_filters.created_by.includes(test.created_by)) {
					return false;
				}
				return test.status === 'active';
			});

			const filtered_paused_tests = this.incomplete_tests.filter((test) => {
				if (this.page_filters.subject_id.length && !this.page_filters.subject_id.includes(test.subject_id)) {
					return false;
				}
				if (this.page_filters.created_by.length && !this.page_filters.created_by.includes(test.created_by)) {
					return false;
				}
				return test.status === 'paused';
			});

			return [
				...sortBy(filtered_active_tests, (test) => {
					return new Date(test.started_at).getTime();
				}),
				...sortBy(filtered_paused_tests, (test) => {
					return new Date(test.started_at).getTime();
				})
			];
		},
		pendingTests() {
			return this.incomplete_tests.filter((test) => {
				if (this.page_filters.subject_id.length && !this.page_filters.subject_id.includes(test.subject_id)) {
					return false;
				}
				if (this.page_filters.created_by.length && !this.page_filters.created_by.includes(test.created_by)) {
					return false;
				}
				return test.status === 'pending';
			});
		},
		completedTests() {
			return this.complete_tests.filter((test) => {
				if (this.page_filters.subject_id.length && !this.page_filters.subject_id.includes(test.subject_id)) {
					return false;
				}
				if (this.page_filters.created_by.length && !this.page_filters.created_by.includes(test.created_by)) {
					return false;
				}
				if (this.completed_test_filters.outcome.length && !this.completed_test_filters.outcome.includes(test.outcome)) {
					return false;
				}
				if (this.show_archived) {
					return test.status === 'complete' || test.status === 'archived';
				}
				return test.status === 'complete';
			});
		}
	},
	methods: {
		num,
		percentage,
		sumBy,
		title,
		useDateFormat,
		useTimeAgo,
		toggleFilterOptions(event: MouseEvent) {
            const menu_instance = this.$refs.date_options_menu as any;
			menu_instance.toggle(event);
		},
		deleteTest(test_id: string) {
			remove(this.incomplete_tests, (test) => {
				return test.id === test_id;
			});
			remove(this.complete_tests, (test) => {
				return test.id === test_id;
			});
		},
		async getTests() {
			try {
				const { data: incomplete_tests } = await this.$API.get('/api/tests', {
					params: {
						status: ['queued', 'active', 'paused'],
					}
				});
				this.incomplete_tests = incomplete_tests;
				this.getCompletedTests();
			}
			catch (error) {
				this.$toast.add({
					severity: 'danger',
					summary: 'Error',
					detail: 'Unable to get tests.'
				});
			}
		},
		async getCompletedTests() {
			try {
				if (!isEqual(this.completed_test_filters.ended_at, this.completed_test_dates)) {
					this.completed_test_dates = this.completed_test_filters.ended_at.slice();
					const { data: completed_tests } = await this.$API.get('/api/tests', {
						params: {
							filter: {
								status: ['complete', 'archived'],
								ended_at: this.completed_test_filters.ended_at
							}
						}
					});
					this.complete_tests = completed_tests;
				}
			}
			catch (error) {
				this.$toast.add({
					severity: 'danger',
					summary: 'Error',
					detail: 'Unable to get completed tests.'
				});
			}
		},
		testMetricDelta(test: any) {
			if (!test.results || !test.results.default) return 0;
			const control = test.results.default[`${test.id}-A`];
			if (!control || typeof control.variation_score !== 'number') return 0;
			let best_delta: number | undefined;
			forIn(test.results.default, (variation: any, variation_id: string) => {
				if (variation_id === `${test.id}-A` || typeof variation.variation_score !== 'number') return;
				const delta = variation.variation_score / control.variation_score - 1;
				if (isUndefined(best_delta) || delta > best_delta) {
					best_delta = delta;
				}
			});
			return best_delta;
		},
		testParticipations(test: any) {
			if (!test.results || !test.results.default) return 0;
			let total_view_count = 0;
			forIn(test.results.default, (variation: any, variation_id: string) => {
				if (variation.view_count) {
					total_view_count += variation.view_count;
				}
			});
			return total_view_count
		},
		trend(delta: number, sort: string = 'max') {
			if (delta > 0) {
				if (sort === 'min') {
					return 'text-red-500';
				}
				return 'text-green-500';
			}
			if (delta < 0) {
				if (sort === 'min') {
					return 'text-green-500';
				}
				return 'text-red-500';
			}
			return 'text-gray-400';
		},
		clearPageFilters() {
			this.page_filters = {
				subject_id: [],
				created_by: [],
			};
		},
		newSplitTest() {
			this.$router.push(`/split-tests/edit/new`);
		},
		editSplitTest(test_id: string) {
			this.$router.push(`/split-tests/edit/${test_id}`);
		},
		duplicateSplitTest(test_id: string) {
            this.$router.push(`/split-tests/edit/new?duplicate_test_id=${test_id}`);
        },
		viewSplitTestDetails(test_id: string) {
			this.$router.push(`/split-tests/details/${test_id}`);
		},
		async startSplitTest(test: any) {
            const { data } = await this.$API.patch(`/api/tests/${test.id}/status`, {
                status: 'active'
            });
            if (data.timestamp) {
                test.status = 'active';
                set(test, 'status_log.data.status', 'active');
                set(test, 'status_log.created_at', data.timestamp);
                this.$toast.add({
                    severity: 'success',
                    summary: 'Test Started',
                    detail: `The test '${test.name}' was started.`,
                    life: 5000
                });
            }
        },
        async pauseSplitTest(test: any) {
            const { data } = await this.$API.patch(`/api/tests/${test.id}/status`, {
                status: 'paused'
            });
            if (data.timestamp) {
                test.status = 'paused';
                set(test, 'status_log.data.status', 'paused');
                set(test, 'status_log.created_at', data.timestamp);
                this.$toast.add({
                    severity: 'success',
                    summary: 'Test Paused',
                    detail: `The test '${test.name}' was paused.`,
                    life: 5000
                });
            }
        },
        async stopSplitTest(test: any) {
            this.$confirm.require({
                group: 'confirmation' as ConfirmationOptions['group'],
                severity: 'danger',
                header: 'Stop Test',
                message: `Are you sure you want to stop the test <strong>${test.name}</strong>? Once a test has been stopped, it cannot be restarted.`,
                acceptProps: {
                    label: 'Stop Test',
                    severity: 'danger'
                },
                accept: async () => {
                    const { data } = await this.$API.patch(`/api/tests/${test.id}/status`, {
                        status: 'complete'
                    });
                    if (data.timestamp) {
                        // Trigger the outcome modal
                        emitter.emit('openOutcomeModal', {
                            test_id: test.id,
                            test_name: test.name
                        });

                        test.status = 'complete';
                        set(test, 'status_log.data.status', 'complete');
                        set(test, 'status_log.created_at', data.timestamp);
                        this.$toast.add({
                            severity: 'success',
                            summary: 'Test Stopped',
                            detail: `The test '${test.name}' was stopped.`,
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
        async archiveSplitTest(test: any) {
            const { data } = await this.$API.patch(`/api/tests/${test.id}/status`, {
                status: 'archived'
            });
            if (data.timestamp) {
                test.status = 'archived';
                set(test, 'status_log.data.status', 'archived');
                set(test, 'status_log.created_at', data.timestamp);
                this.$toast.add({
                    severity: 'success',
                    summary: 'Test Archived',
                    detail: `The test '${test.name}' was archived.`,
                    life: 5000
                });
            }
        },
        async unarchiveSplitTest(test: any) {
            const { data } = await this.$API.patch(`/api/tests/${test.id}/status`, {
                status: 'complete'
            });
            if (data.timestamp) {
                test.status = 'complete';
                set(test, 'status_log.data.status', 'complete');
                set(test, 'status_log.created_at', data.timestamp);
                this.$toast.add({
                    severity: 'success',
                    summary: 'Test Unarchived',
                    detail: `The test '${test.name}' was unarchived.`,
                    life: 5000
                });
            }
        },
        async deleteSplitTest(test: any) {
            this.$confirm.require({
                group: 'confirmation' as ConfirmationOptions['group'],
                severity: 'danger',
                header: 'Delete Test',
                message: `Are you sure you want to delete the test <strong>${test.name}</strong>? This cannot be undone.`,
                acceptProps: {
                    label: 'Delete Test',
                    severity: 'danger'
                },
                accept: async () => {
                    await this.$API.delete(`/api/tests/${test.id}`);
                    this.$emit('delete', test.id);
                    this.$toast.add({
                        severity: 'success',
                        summary: 'Test Deleted',
                        detail: `The test '${test.name}' was deleted.`,
                        life: 5000
                    });
                },
                rejectProps: {
                    label: 'Cancel',
                    severity: 'secondary'
                },
            } as ConfirmationOptions);
        },
		setDateFilter(values: Date[]) {
			return () => {
				this.completed_test_filters.ended_at = values;
				this.getCompletedTests();
			};
		}
	},
	async beforeMount() {
		await this.getTests();
	},
	mounted() {
		if (this.$route.query.subject_id) {
			this.page_filters.subject_id = [this.$route.query.subject_id as string];
		}
	}
});
</script>

<style scoped lang="less">
.page-heading {
	margin-top: 3px;
}

.page-filters {
	align-items: end;
	display: flex;
	gap: 1em;
	margin-bottom: 1em;

	.control-group {
		flex: 0 0 auto;
		margin-bottom: 0;
	}
}

.tests-card {
	margin-bottom: 2em;

	:deep(.p-card-header) {
		border-bottom: 1px solid var(--color-gray-200);
		padding: 1em;

		h2 {
			font-size: 1.125rem;
			font-weight: bold;
		}
	}
}

.test {
	align-items: center;
	background-color: var(--color-white);
	border: 1px solid var(--color-gray-300);
	border-radius: calc(var(--border-radius) / 2);
	box-shadow: var(--box-shadow);
	color: var(--color-gray-600);
	display: grid;
	font-size: 0.875em;
	grid-auto-flow: column;
	grid-gap: 2em;
	grid-template-columns: auto 3fr 1fr 1fr 1fr 0.75fr 1.5fr;
	margin-bottom: 1em;
	padding: 1em 1.5em;

	&.pending {
		background-color: var(--color-gray-50);
	}
	
	&.archived {
		background-color: var(--color-gray-100);
		color: var(--color-gray-400);
		font-style: italic;
	}

	&:hover {
		background-color: var(--color-brand-highlight);
		border-color: var(--color-brand-300);
	}

	&:last-child {
		margin-bottom: 0;
	}

	@media (max-width: 768px) {
		display: flex;
		flex-direction: column;
	}
}

.status-icon {
	align-items: center;
	border-radius: 25px;
	display: flex;
	height: 50px;
	justify-content: center;
	padding-left: 2px;
	width: 50px;
}

.no-tests-message {
	align-items: center;
	background-color: var(--color-gray-100);
	border-radius: 5px;
	color: var(--color-gray-400);
	display: flex;
	gap: 10px;
	height: 4em;
	padding: 0 1.5em;
	width: 100%;
}

.table-view {
    align-items: center;
    background-color: rgba(0,0,0,0.15);
    border-radius: 15px;
	cursor: pointer;
    display: inline-flex;
    height: 30px;
    padding: 0 0.5625em;
}
</style>