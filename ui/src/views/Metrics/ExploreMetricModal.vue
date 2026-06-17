<template>
    <Dialog v-model:visible="show_modal" modal class="bordered w-full max-w-160">
        <template #header>
            <div class="flex-row">
                <Icon type="Insights" color="brand" size="24px"/>
                <strong>Explore Metric: {{ metric.name }}</strong>
            </div>
        </template>
        <template v-if="loading">
            <div class="flex items-center w-full min-h-50 loading">
                <ProgressSpinner :loading="loading" strokeWidth="3" />
            </div>
        </template>
        <template v-else>
            <div class="filters flex-row justify-between mb-2">
                <div class="inline-flex-row">
                    <div class="control-group mb-0! w-45">
                        <div class="inner">
                            <label class="control-label">Date Range:</label>
                            <div class="controls">
                                <div class="field">
                                    <InputGroup>
                                        <DatePicker fluid v-model="query.date_range" selection-mode="range" :number-of-months="2"/>
                                        <InputGroupAddon class="date-menu-button" tabindex="0" @click="toggleDateMenu">
                                            <Icon type="Calendar Today" color="gray" size="20px"/>
                                        </InputGroupAddon>
                                    </InputGroup>
                                    <Popover ref="date_menu" class="date-range-popover">
                                        <div class="flex flex-col min-w-16">
                                            <template v-for="option in date_range_options" :key="option.label">
                                                <div :class="['date-menu-option', 'flex-row', {selected: isEqual(query.date_range, option.value) }]" tabindex="0" @click="applyDateRange(option.value)">
                                                    <Icon type="Calendar Today" size="18px"/>
                                                    {{ option.label }}
                                                </div>
                                            </template>
                                        </div>
                                    </Popover>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="control-group mb-0!">
                        <div class="inner">
                            <label class="control-label">Data Segment:</label>
                            <div class="controls">
                                <div class="field" @click="toggleSegmentMenu">
                                    <InputGroup tabindex="0" class="segment-field">
                                        <InputText v-model="segmentCount" placeholder="Default Segment" readonly/>
                                        <InputGroupAddon class="cursor-pointer">
                                            <Icon type="Filter List" size="20px"/>
                                        </InputGroupAddon>
                                    </InputGroup>
                                    <Popover ref="segment_menu" class="segment-popover min-w-25" :dismissable="false">
                                        <div class="flex flex-col gap-1">
                                            <div v-for="segment in segment_options" :key="segment.property">
                                                <Select fluid v-model="query.segments[segment.property]" :options="segment.values" show-clear :placeholder="segment.property" />
                                            </div>
                                        </div>
                                    </Popover>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="control-group mb-0! w-25">
                        <div class="inner">
                            <label class="control-label">Display As:</label>
                            <div class="controls">
                                <div class="field">
                                    <Select fluid v-model="query.group_by" :options="grouping_options" option-label="label" option-value="value" />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="control-group">
                        <div class="inner">
                            <label class="control-label">&nbsp;</label>
                            <div class="controls">
                                <div class="field">
                                    <Button label="Apply" @click="getSeriesData"/>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="rounded-xl p-2 bg-gray-100">
                <div class="rollup-metrics flex-row gap-4">
                    <div class="metric-card">
                        <div class="metric-content">
                            <div class="label">Events Logged</div>
                            <div class="value">{{ num(+stats.events) }}</div>
                        </div>
                        <div class="icon">
                            <div class="icon-wrapper">
                                <Icon type="Attribution" color="brand" size="36px"/>
                            </div>
                        </div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-content">
                            <div class="label">Tests Served</div>
                            <div class="value">{{ num(+stats.tests) }}</div>
                        </div>
                        <div class="icon">
                            <div class="icon-wrapper">
                                <Icon type="Fact Check" color="brand" size="36px"/>
                            </div>
                        </div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-content">
                            <div class="label">Variations Served</div>
                            <div class="value">{{ num(+stats.variations) }}</div>
                        </div>
                        <div class="icon">
                            <div class="icon-wrapper">
                                <Icon type="Layers" color="brand" size="36px"/>
                            </div>
                        </div>
                    </div>
                </div>
                <Card class="data-card">
                    <template #content>
                        <div class="chart-wrapper border-b border-b-gray-200 px-3 py-1">
                            <Chart ref="series_chart" type="line" class="w-full" :data="formatted_series_data" :options="seriesChartOptions"/>
                            <div class="chart-tools flex-row justify-between py-2">
                                <div class="flex-row">
                                    <Select v-model="chart_value" :options="chart_value_options" option-label="label" option-value="value" placeholder="Select Metric to Display" />
                                    <Button outlined label="Reset Zoom" @click="resetSeriesChartZoom">
                                        <template #icon>
                                            <Icon type="Fullscreen" size="20px"/>
                                        </template>
                                    </Button>
                                </div>
                                <div>
                                </div>
                            </div>
                        </div>
                        <div class="table-data p-3">
                            <DataTable :value="series_data" sort-field="ts" :sort-order="-1" striped-rows row-hover>
                                <ColumnGroup type="header">
                                    <Row>
                                        <Column header="Period" field="ts" sortable :rowspan="2"/>
                                        <Column v-if="query.group_by === 'test_id'" header="Test ID" :rowspan="2"/>
                                        <Column header="Periodic" header-class="border-l border-l-gray-300 border-b-gray-300" :colspan="4"/>
                                        <Column header="Cumulative" header-class="border-l border-l-gray-300 border-b-gray-300" :colspan="4"/>
                                    </Row>
                                    <Row>
                                        <Column header="Sessions" header-class="border-l border-l-gray-300 text-right" class="text-right" field="ts_sessions"/>
                                        <Column header="Events" header-class="text-right" class="text-right" field="ts_events"/>
                                        <Column header="Rate" header-class="text-right" class="text-right" field="ts_rate">
                                            <template #body="row">
                                                {{ percentage(row.data.ts_rate) }}
                                            </template>
                                        </Column>
                                        <Column header="Value" header-class="text-right" class="text-right" field="ts_event_value">
                                            <template #body="row">
                                                {{ metric.type === 'currency' ? currency(row.data.ts_event_value) : num(row.data.ts_event_value) }}
                                            </template>
                                        </Column>
                                        <Column header="Sessions" header-class="border-l border-l-gray-300 text-right" class="text-right" field="sessions"/>
                                        <Column header="Events" header-class="text-right" class="text-right" field="events"/>
                                        <Column header="Rate" header-class="text-right" class="text-right" field="rate">
                                            <template #body="row">
                                                {{ percentage(row.data.rate) }}
                                            </template>
                                        </Column>
                                        <Column header="Value" header-class="text-right" class="text-right" field="event_value">
                                            <template #body="row">
                                                {{ metric.type === 'currency' ? currency(row.data.event_value) : num(row.data.event_value) }}
                                            </template>
                                        </Column>
                                    </Row>
                                </ColumnGroup>
                                <Column field="ts" header="Period">
                                    <template #body="row">
                                        {{ dayjs(row.data.ts).format('MM/DD/YYYY h:mmA') }}
                                    </template>
                                </Column>
                                <Column v-if="query.group_by === 'test_id'" field="test_id" header="Test ID">
                                    <template #body="row">
                                        {{ row.data.test_id || 'No Test' }}
                                    </template>
                                </Column>
                                <Column field="ts_sessions" header="Sessions" header-class="text-right" class="border-l border-l-gray-200 text-right">
                                    <template #body="row">
                                        {{ num(row.data.ts_sessions) }}
                                    </template>
                                </Column>
                                <Column field="ts_events" header="Events" header-class="text-right" class="text-right">
                                    <template #body="row">
                                        {{ num(row.data.ts_events) }}
                                    </template>
                                </Column>
                                <Column field="ts_rate" header="Rate" header-class="text-right" class="text-right">
                                    <template #body="row">
                                        {{ percentage(row.data.ts_rate) }}
                                    </template>
                                </Column>
                                <Column field="ts_variation_score" header="Value" header-class="text-right" class="text-right">
                                    <template #body="row">
                                        {{ metricValueFormat(row.data.ts_variation_score) }}
                                    </template>
                                </Column>
                                <Column field="sessions" header="Sessions" header-class="text-right" class="border-l border-l-gray-200 text-right">
                                    <template #body="row">
                                        {{ num(row.data.sessions) }}
                                    </template>
                                </Column>
                                <Column field="events" header="Events" header-class="text-right" class="text-right">
                                    <template #body="row">
                                        {{ num(row.data.events) }}
                                    </template>
                                </Column>
                                <Column field="rate" header="Rate" header-class="text-right" class="text-right">
                                    <template #body="row">
                                        {{ percentage(row.data.rate) }}
                                    </template>
                                </Column>
                                <Column field="event_value" header="Value" header-class="text-right" class="text-right">
                                    <template #body="row">
                                        {{ metricValueFormat(row.data.variation_score) }}
                                    </template>
                                </Column>
                            </DataTable>
                        </div>
                    </template>
                </Card>
            </div>
        </template>
    </Dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import dayjs from '@lib/dayjs';
import currency from '@/lib/utils/currency';
import num from '@/lib/utils/num';
import percentage from '@/lib/utils/percentage';
import { every, groupBy, isEqual, uniq } from 'lodash-es';
import { hash } from 'hash-it';
import type Chart from 'primevue/chart';

export default defineComponent({
    name : 'ExploreMetricModal',
    props : {
        metricId: {
            type: String
        }
    },
    data() {
        return {
            loading: false,
            show_modal: false,
            query: {
                date_range: [dayjs().startOf('day').subtract(12, 'weeks').toDate(), dayjs().endOf('day').toDate()],
                group_by: 'aggregate' as string,
                segments: {} as any,
                control: false,
            },
            metric: {
                id: null as string | null,
                subject_id: null as string | null,
                name: null as string | null,
                description: null as string | null,
                event_type: null as string | null,
                strategy: 'rate' as 'rate' | 'sum' | 'avg' | 'median',
                type: null as string | null,
                default_value: null as any,
                sorting_type: 'max' as 'max' | 'min',
                created_at: null as Date | null,
            },
            chart_value: 'variation_score' as string,
            chart_value_options: [
                { label: 'Periodic Sessions', value: 'ts_sessions' },
                { label: 'Periodic Events', value: 'ts_events' },
                { label: 'Periodic Rate', value: 'ts_rate' },
                { label: 'Periodic Variation Score', value: 'ts_variation_score' },
                { label: 'Cumulative Sessions', value: 'sessions' },
                { label: 'Cumulative Events', value: 'events' },
                { label: 'Cumulative Rate', value: 'rate' },
                { label: 'Cumulative Variation Score', value: 'variation_score' },
            ],
            segment_options: [] as any[],
            grouping_options: [
            { label: 'Aggregate All', value: 'aggregate' },
            { label: 'Segment by Split Tests', value: 'test_id' },
            { label: 'Control Only', value: 'control' },
            ],
            date_range_options: [
            {
                label: 'This Week',
                value: [dayjs().startOf('week').toDate(), dayjs().endOf('week').toDate()]
            },
            {
                label: 'Last Week',
                value: [dayjs().startOf('week').subtract(1, 'week').toDate(), dayjs().endOf('week').subtract(1, 'week').toDate()]
            },
            {
                label: 'This Month',
                value: [dayjs().startOf('month').toDate(), dayjs().endOf('month').toDate()]
            },
            {
                label: 'Last Month',
                value: [dayjs().startOf('month').subtract(1, 'month').toDate(), dayjs().endOf('month').subtract(1, 'month').toDate()]
            },
            {
                label: 'Last 7 days',
                value: [dayjs().startOf('day').subtract(6, 'days').toDate(), dayjs().endOf('day').toDate()]
            },
            {
                label: 'Last 14 days',
                value: [dayjs().startOf('day').subtract(13, 'days').toDate(), dayjs().endOf('day').toDate()]
            },
            {
                label: 'Last 30 days',
                value: [dayjs().startOf('day').subtract(29, 'days').toDate(), dayjs().endOf('day').toDate()]
            },
            {
                label: 'Last 90 days',
                value: [dayjs().startOf('day').subtract(89, 'days').toDate(), dayjs().endOf('day').toDate()]
            }
            ],
            series_data: {} as any,
            formatted_series_data: {
                labels: [] as any[],
                datasets: [] as any[]
            },
            stats: {} as any
        };
    },
    computed: {
        segmentCount() {
            const count = Object.keys(this.query.segments).filter((key) => this.query.segments[key]).length;
            return count > 0 ? `${count} Segment${count > 1 ? 's' : ''}` : '';
        },
        segment() {
            this.query.segments = Object.keys(this.query.segments).map((key: string) => {
				const s = this.query.segments[key];
				if (s === null) {
					return '';
				}
				return s;
			});
			if (every(this.query.segments, (s) => s === '')) {
				return 'default';
			} else {
				return hash(this.query.segments).toString();
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
                                if (
                                    this.chart_value.includes('rate') ||
                                    (
                                        this.chart_value.includes('variation_score') &&
                                        this.metric.type === 'percent'
                                    )
                                ) {
                                    return `${label}: ${percentage(context.formattedValue)}`;
                                }
                                else if (
                                    this.chart_value.includes('variation_score') &&
                                    this.metric.type === 'currency'
                                ) {
                                    return `${label}: ${currency(context.formattedValue)}`;
                                }
                                else {
                                    return `${label}: ${context.formattedValue}`;
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
                                return dayjs(this.formatted_series_data.labels[value]).format('MM/DD/YYYY h:mmA');
                            }
                        }
                    },
                    y: {
                        ticks: {
                            callback: (value: number) => {
                                if (
                                    this.chart_value.includes('rate') ||
                                    (
                                        this.chart_value.includes('variation_score') &&
                                        this.metric.type === 'percent'
                                    )
                                ) {
                                    return percentage(value);
                                }
                                else if (
                                    this.chart_value.includes('variation_score') &&
                                    this.metric.type === 'currency'
                                ) {
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
        }
    },
    watch: {
        chart_value() {
            this.formatSeriesChartData();
        }
    },
    methods: {
        currency,
        dayjs,
        isEqual,
        num,
        percentage,
        metricValueFormat(value: number) {
            if (this.metric?.type === 'percent') {
                return percentage(value);
            }
            else if (this.metric?.type === 'currency') {
                return currency(value);
            }
            else {
                return num(value);
            }
        },
        async open() {
            if (this.metricId) {
                this.loading = true;
                this.show_modal = true;
                await this.getMetric();
                await this.getSegments();
                await this.getSeriesData();
                this.loading = false;
            }
            else {
                this.$toast.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No metric selected to explore.',
                    life: 5000
                });
            }
        },
        close() {
            this.show_modal = false;
        },
        async getMetric() {
            const { data } = await this.$API.get(`/api/metrics/${this.metricId}`);
            this.metric = data;
        },
        async getSegments() {
            const { data } = await this.$API.get(`/api/metrics/${this.metric.id}/segments`, {
                params: {
                    date_range: this.query.date_range
                }
            });
            this.segment_options = data;
        },
        toggleDateMenu(event: MouseEvent) {
            const date_menu_instance = this.$refs.date_menu as any;
            date_menu_instance.toggle(event);
        },
        applyDateRange(date_range: any) {
            this.query.date_range = date_range;
            this.toggleDateMenu(new MouseEvent('click')); // Close the menu after selecting a date range
        },
        toggleSegmentMenu(event: MouseEvent) {
            const segment_menu_instance = this.$refs.segment_menu as any;
            segment_menu_instance.toggle(event);
        },
        resetSeriesChartZoom() {
			const chart_instance = this.$refs.series_chart as InstanceType<typeof Chart>;
			chart_instance.getChart().resetZoom();
		},
        async getSeriesData() {
            const params: Record<string, any> = {
                date_range: this.query.date_range,
                segments: this.query.segments,
            };

            if (this.query.group_by === 'test_id') {
                params.group_by = 'test_id';
            } else if (this.query.group_by === 'control') {
                params.control = true;
            }

            const { data } = await this.$API.get(`/api/metrics/${this.metric.id}/series-data`, { params });
            this.stats = data.stats;
            this.series_data = data.series;

            this.formatSeriesChartData();
        },
        formatSeriesChartData() {
            const colors = ['#29a1aa', '#ffb740', '#df711b', '#90be6d', '#7046a2'];
            
            const labels = uniq(this.series_data.map((row: any) => {
                return dayjs(row.ts).format();
            }) || []);

            let series_data: any[] = [];

            // Grouped by Test ID
            if (this.query.group_by === 'test_id') {
                let grouped_data: any = groupBy(this.series_data, 'test_id');
                
                Object.keys(grouped_data).forEach((test_id, index) => {
                    series_data.push({
                        label: test_id,
                        data: grouped_data[test_id].map((row: any) => row[this.chart_value]),
                        backgroundColor: colors[index],
                        borderColor: colors[index],
                    });
                });
            }

            // Aggregate all data or control data
            else {
                series_data = [{
                    label: 'All Data',
                    data: this.series_data.map((row: any) => row[this.chart_value]),
                    backgroundColor: colors[0],
                    borderColor: colors[0],
                }];
            }
            
            this.formatted_series_data = {
                labels,
                datasets: series_data
            };
        }
    }
});
</script>

<style scoped lang="less">
.date-menu-button {
    cursor: pointer;
}

.date-menu-option {
    border-radius: calc(var(--border-radius) / 2);
    cursor: default;
    font-size: var(--text-sm);
    padding: 0.5rem 0.75rem;
    
    &:hover {
        background-color: var(--color-gray-100);
    }
    
    &.selected {
        background-color: var(--color-brand-100);
    }
}

.segment-field input {
    cursor: pointer;
}

:deep(.data-card .p-card-body) {
    padding: 0;
}

:deep(.p-chart) {
	aspect-ratio: 5/2;
}
</style>