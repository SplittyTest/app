<template>
    <div class="test-form-section metrics">
        <p>Add the metrics you would like to track for this test...</p>
        <Fieldset legend="Decision Metric" class="decision-metric mb-2">
            <p class="text-sm text-gray-500">The decision metric is the key metric you want this test to affect. This metric will be displayed prominently in the test results. If this test is auto-optimized, it will use this metric to determine the best variation.</p>
            <div class="decision-metric">
                <FieldValidation name="decision_metric_id" :value="test.decision_metric_id" v-slot="{ error_message }" :validator="validator" :rules="validationRules.decision_metric_id">
                    <div class="control-group">
                        <div class="inner">
                            <div class="controls">
                                <template v-if="test.decision_metric_id">
                                    <div class="field">
                                        <div class="selected-metric mb-0!">
                                            <div>
                                                <div class="name">{{ decisionMetric.name }}</div>
                                                <div class="description">{{ decisionMetric.description }}</div>
                                            </div>
                                            <div class="event-type">
                                                <span>{{ decisionMetric.event_type }}</span>
                                            </div>
                                            <div class="strategy">
                                                <div class="h-flex">
                                                    {{ decisionMetric.strategy }}
                                                </div>
                                            </div>
                                            <div class="remove">
                                                <Button rounded text severity="danger" v-tooltip.top="'Remove Decision Metric'" :disabled="!isPending" @click="removeDecisionMetric">
                                                    <template #icon><Icon type="Delete" color="red" size="20px"/></template>
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </template>
                                <template v-else-if="isPending">
                                    <div class="field">
                                        <Button size="small" label="Select Decision Metric" @click="openMetricModal('decision')">
                                            <template #icon>
                                                <Icon type="Add" size="20px"/>
                                            </template>
                                        </Button>
                                    </div>
                                </template>
                            </div>
                        </div>
                    </div>
                    <FormError :error="error_message"/>
                </FieldValidation>
            </div>
        </Fieldset>
        <Fieldset legend="Other Tracked Metrics">
            <p class="text-sm text-gray-500">These are additional metrics you want to monitor in the test details. They will not affect the test's optimization but will provide valuable insights and can be viewed in the test results.</p>
            <div class="tracked-metrics mb-1.5">
                <div v-for="metric in trackedMetrics" class="selected-metric">
                    <div>
                        <div class="name">{{ metric.name }}</div>
                        <div class="description">{{ metric.description }}</div>
                    </div>
                    <div class="event-type">
                        <span>{{ metric.event_type }}</span>
                    </div>
                    <div class="strategy">
                        <div class="h-flex">
                            {{ metric.strategy }}
                        </div>
                    </div>
                    <div class="remove">
                        <Button rounded text severity="danger" v-tooltip.top="'Remove Tracked Metric'" :disabled="!isPending" @click="removeMetric(metric.id)">
                            <template #icon><Icon type="Delete" color="red" size="20px"/></template>
                        </Button>
                    </div>
                </div>
            </div>  
            <Button size="small" label="Track a Metric" :disabled="!isPending" @click="openMetricModal('tracked')">
                <template #icon>
                    <Icon type="Add" size="20px"/>
                </template>
            </Button>
        </Fieldset>
    </div>
    <Dialog v-model:visible="show_modal" modal class="w-full max-w-76 bordered">
        <template #header>
            <div class="h-flex">
                <Icon type="Analytics" size="24px"/>
                Add {{ title(metric_type) }} Metric
            </div>
        </template>
        <p class="text-gray-400">Select one of the available metrics to add to your test...</p>
        <div class="metric-options">
            <template v-if="availableMetrics.length === 0">
                <p class="no-results"><Icon type="info" color="gray" size="20px"/>No metrics available</p>
            </template>
            <div v-for="metric in availableMetrics" :key="metric.id" class="metric-option" tabindex="0" @click="addMetric(metric.id)">
                <div>
                    <div class="name">{{ metric.name }}</div>
                    <div class="description">{{ metric.description }}</div>
                </div>
                <div class="event-type">
                    <span>{{ metric.event_type }}</span>
                </div>
                <div class="strategy">
                    <div class="h-flex">
                        <Icon type="Psychology" color="brand" size="24px"/>
                        {{ metric.strategy }}
                    </div>
                </div>
            </div>
        </div>
    </Dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { rules } from '@splitty-test/validation';
import { title } from '@lib/filters';
import { sortBy } from 'lodash-es';

export default defineComponent({
    name : 'SplitTestFormMetrics',
    props : {
        test : {
            type : Object,
            required : true,
        },
        validator : {
            type : Object,
            required : true,
        }
    },
    data() {
        return {
            metric_type: 'decision' as 'decision' | 'tracked',
            metrics: [] as any[],
            show_modal: false
        };
    },
    computed: {
        isPending() {
            return this.test.status === 'pending';
        },
        subjectId() {
            return this.test.subject_id;
        },
        availableMetrics() {
            return sortBy(this.metrics.filter((metric) => {
                return metric.id !== this.test.decision_metric_id && !this.test.metrics.includes(metric.id);
            }), ['name']);
        },
        decisionMetric() {
            return this.metrics.find((metric: any) => {
                return metric.id === this.test.decision_metric_id;
            }) || {};
        },
        trackedMetrics() {
            return this.metrics.filter((metric: any) => {
                return this.test.metrics.includes(metric.id);
            });
        },
        validationRules() {
            return {
                decision_metric_id: [
                    rules.required('A decision metric is required')
                ]
            };
        },
    },
    watch: {
        async subjectId(new_value: string, old_value: string) {
            if (new_value !== old_value) {
                await this.fetchMetrics();

                // Reset the metrics
                if (old_value !== null) {
                    this.test.decision_metric_id = null;
                    this.test.metrics = [];
                }
            }
        }
    },
    methods: {
        title,
        async fetchMetrics() {
            if (!this.test.subject_id) return;
            const { data } = await this.$API.get('/api/metrics', {
                params: {
                    filter: {
                        subject_id: this.test.subject_id
                    }
                }
            });
            this.metrics = data;
        },
        openMetricModal(type: 'decision' | 'tracked') {
            this.metric_type = type;
            this.show_modal = true;
        },
        addMetric(metric_id: string) {
            if (this.metric_type === 'tracked') {
                this.test.metrics.push(metric_id);
            }
            else {
                this.test.decision_metric_id = metric_id;
            }
            this.show_modal = false;
        },
        removeDecisionMetric() {
            this.test.decision_metric_id = null;
        },
        removeMetric(metric_id: string) {
            const index = this.test.metrics.findIndex((test_metric: string) => test_metric === metric_id);
            if (index !== -1) {
                this.test.metrics.splice(index, 1);
            }
        }
    }
});
</script>

<style lang="less" scoped>
.p-fieldset {
    background-color: var(--color-gray-50);

    &.decision-metric {
        background-color: var(--color-brand-background);
        border-color: var(--color-brand-100);
    }
}

.selected-metric,
.metric-option {
    align-items: center;
    background-color: var(--color-white);
    border: 1px solid var(--color-gray-300);
    border-radius: 4px;
    box-shadow: var(--box-shadow);
    cursor: pointer;
    display: grid;
    grid-template-columns: 2fr 1fr auto;
    gap: 2em;
    margin-top: 0.5em;
    padding: 10px 20px;
    transition: background-color 0.2s ease;

    &:hover {
        background-color: var(--color-brand-highlight);
        border-color: var(--color-brand-100);
    }

    .name {
        color: var(--color-gray-700);
        font-weight: var(--font-weight-bold);
    }

    .description {
        color: var(--color-gray-500);
        font-size: var(--text-sm);
    }

    .event-type {
        color: var(--color-brand);
        font-family: var(--font-mono);
        font-size: small;
        
        span {
            background-color: var(--color-brand-highlight);
            border: 1px solid var(--color-brand-100);
            border-radius: 3px;
            padding: 0 0.25em;
        }
    }

    .strategy {
        padding: 0 2em;
        text-transform: capitalize;
    }
}

.selected-metric {
    grid-template-columns: 3fr 1fr 1fr auto;
    margin-bottom: 0.5em;
    margin-top: 0;
}
</style>