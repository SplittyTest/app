<template>
    <Dialog v-model:visible="show_modal" dismissable-mask modal class="metrics-modal w-full max-w-140 bordered">
        <template #header>
            <div class="flex-row">
                <Icon type="Analytics" color="purple" size="24px"/>
                <div>
                    <strong>Metrics Explorer</strong>
                </div>
            </div>
        </template>
        <div v-if="testSegments.properties?.length > 0" class="segmentation mb-2">
            <div class="inline-flex-row">
                <div>Data Segment:</div>
                <div v-for="(segment, index) in (testSegments.properties as string[])" :key="index" class="control-group mb-0!">
                    <div class="inner">
                        <div class="controls">
                            <div class="field">
                                <Select class="min-w-20" v-model="segments[segment]" show-clear :default-value="''" :options="testSegments.options[index as number]" :placeholder="segment"/>
                            </div>
                        </div>
                    </div>
                </div>
                <Button v-tooltip.right="'View Segment Data'" @click="getMetricsData">
                    <template #icon>
                        <Icon type="Arrow Forward" size="20px"/>
                    </template>
                </Button>
            </div>
        </div>
        <DataTable
            :value="metrics"
            row-group-mode="subheader"
            group-rows-by="metric_name"
            row-hover
            :loading="loading"
        >
            <template #loading>
                <div class="loading-mask">
                    <ProgressSpinner :loading="loading" strokeWidth="3"/>
                </div>
            </template>
            <template #empty>
                <div class="flex flex-col items-center gap-2 py-10">
                    <Icon type="Analytics" color="gray" size="48px"/>
                    <div class="text-gray-500">No additional metrics found for this test.</div>
                </div>
            </template>
            <Column field="metric_name" header="Metric"/>
            <Column field="variation_name" header="Variation"/>
            <Column field="views" header="Views" header-class="text-right" class="text-right">
                <template #body="row">
                    {{  num(row.data.views) }}
                </template>
            </Column>
            <Column field="events" header="Events" header-class="text-right" class="text-right">
                <template #body="row">
                    {{  num(row.data.events) }}
                </template>
            </Column>
            <Column field="rate" header="Rate" header-class="text-right" class="text-right">
                <template #body="row">
                    {{  percentage(row.data.rate) }}
                </template>
            </Column>
            <Column field="value" header="Value" header-class="text-right" class="text-right">
                <template #body="row">
                    {{  formatAs(row.data.display_type, row.data.value) }}
                </template>
            </Column>
            <Column field="range" header="Compare" header-class="text-center" class="min-w-12">
                <template #body="row">
                    <div class="bar-container">
                        <div class="bar" :style="chartBarStyle(row.data)">
                            <div class="marker"/>
                        </div>
                    </div>
                </template>
            </Column>
            <template #groupheader="row">
                <div class="flex itmes-center justify-between">
                    <strong>{{ row.data.metric_name }}</strong>
                    <div class="clickable" tabindex="0" @click="openSeriesDataModal(row.data.metric_id)">View Series Data</div>
                </div>
            </template>
        </DataTable>
        <MetricsSeriesDataModal ref="series_data_modal" :test-id="test.id" :metric="selected_metric" :segments="formattedSegments"/>
    </Dialog>
</template>

<script lang="ts">
import currency from '@/lib/utils/currency';
import num from '@/lib/utils/num';
import percentage from '@/lib/utils/percentage';
import { round } from 'lodash-es';
import { defineComponent } from 'vue';
import MetricsSeriesDataModal from './MetricsSeriesDataModal.vue';

export default defineComponent({
    name : 'MetricsModal',
    components: {
        MetricsSeriesDataModal
    },
    props: {
        test: {
            type: Object,
            default: () => {
                return {}
            }
        },
        testSegments: {
            type: Object,
            default: () => {
                return {
                    properties: [],
                    options: []
                }
            }
        }   
    },
    data() {
        return {
            loading: false,
            show_modal : false,
			segments: {} as Record<string, string>,
            selected_metric: null as any,
            metrics: [] as any[],
        };
    },
    computed: {
        formattedSegments() {
            const segments = this.test?.data_segments || [];
            return segments.map((segment: string) => {
                return this.segments[segment] || '';
            });
        }
    },
    methods: {
        currency,
        num,
        percentage,
        formatAs(format: string, value: number) {
            if (format === 'currency') {
                return currency(value);
            }
            if (format === 'percent') {
                return percentage(value);
            }
            return num(value);
        },
        async open() {
            this.show_modal = true;
            await this.getMetricsData();
        },
        chartBarStyle(row: any) {
            if (!row.position) return {};
            return {
                'margin-left': `${round(row.position[0] * 100)}%`,
                width: `${round((row.position[1] - row.position[0]) * 100)}%`
            };
        },
        async getMetricsData() {
            this.loading = true;
            const { data: result } = await this.$API.get(`/api/tests/${this.$route.params.test_id}/metrics`, {
                params: {
                    segments: this.formattedSegments
                }
            });
            this.metrics = result;
            this.loading = false;
        },
        openSeriesDataModal(metric_id: string) {
            const metric = this.metrics.find((metric: any) => {
                return metric.metric_id === metric_id;
            });
            const series_modal_instance = this.$refs.series_data_modal as InstanceType<typeof MetricsSeriesDataModal>;
            series_modal_instance.open(metric);
        }
    }
});
</script>

<style lang="less">
.metrics-modal {
    .p-datatable-table-container[data-p="empty"] thead {
        display: none;
    }

    .p-datatable-empty-message td {
        background-color: var(--color-gray-50);
        border-radius: calc(var(--border-radius) / 2);
        border: 0;
    }

    th.text-right,
    th.text-center {
        .p-datatable-column-header-content span {
            width: 100%;
        }
    }

    .p-datatable-row-group-header td {
        background-color: var(--color-gray-50);
        border-top: 1px solid var(--color-gray-400);
    }

    .bar-container {
        height: 16px;
        position: relative;
        width: 100%;

        .bar {
            background-color: var(--color-brand);
            height: 100%;
            position: absolute;

            .marker {
                border-left: 1px solid var(--color-white);
                height: 100%;
                left: 50%;
                opacity: 0.3;
                position: absolute;
                width: 0;
            }
        }
    }
}
</style>