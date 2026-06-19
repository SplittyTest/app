<template>
    <div class="page">
        <hgroup class="flex items-center gap-2 mb-3">
            <div class="page-icon bg-brand">
                <Icon type="Analytics" color="white" size="28px"/>
            </div>
            <h1>{{ is_new ? 'New Metric' : 'Edit Metric' }}</h1>
        </hgroup>
        <div class="page-content">
            <Card class="max-w-76">
                <template #content>
                    <div class="metric-form">
                        <div class="control-group">
                            <div class="inner">
                                <label class="control-label">Subject:</label>
                                <div class="controls">
                                    <div class="field">
                                        <FieldValidation name="subject_id" :value="metric.subject_id" el=".p-select-label" v-slot="{ error_message }" :validator="validator" :rules="validationRules.subject_id">
                                            <Select fluid v-model="metric.subject_id" :options="$sessionStore.subject_options" option-label="label" option-value="value" placeholder="Select Subject"/>
                                            <FormError :error="error_message"/>
                                        </FieldValidation>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="control-group">
                            <div class="inner">
                                <label class="control-label">Name:</label>
                                <div class="controls">
                                    <div class="field">
                                        <FieldValidation name="name" :value="metric.name" v-slot="{ error_message }" :validator="validator" :rules="validationRules.name">
                                            <InputText fluid v-model="metric.name" :invalid="!!error_message" autofocus />
                                            <FormError :error="error_message"/>
                                        </FieldValidation>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="control-group">
                            <div class="inner">
                                <label class="control-label">Description:</label>
                                <div class="controls">
                                    <div class="field">
                                        <FieldValidation name="description" :value="metric.description" v-slot="{ error_message }" :validator="validator" :rules="validationRules.description">
                                            <Textarea fluid v-model="metric.description" :invalid="!!error_message"/>
                                            <FormError :error="error_message"/>
                                        </FieldValidation>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="control-group">
                            <div class="inner">
                                <label class="control-label">Event Type:</label>
                                <div class="controls">
                                    <div class="field">
                                        <FieldValidation name="event_type" :value="eventType" v-slot="{ error_message }" :validator="validator" :rules="validationRules.event_type">
                                            <InputText fluid v-model="eventType" :invalid="!!error_message" autofocus />
                                            <FormError :error="error_message"/>
                                        </FieldValidation>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <Fieldset legend="Strategy" class="mb-1.5">
                            <p class="text-sm">What strategy should be used when calculating the values for this metric?</p>
                            <FieldValidation name="strategy" :value="metric.strategy" el=".p-select-label" v-slot="{ error_message }" :validator="validator" :rules="validationRules.strategy">
                                <div class="grid grid-cols-2 gap-1.5">
                                    <div v-for="option in strategy_options" :key="option.value" :class="['strategy-option', {selected: metric.strategy === option.value}]">
                                        <div :for="`strategy-${option.value}`" @click="selectStrategy(option.value)">
                                            <div class="strategy-label">{{ option.label }}</div>
                                            <div class="strategy-description">{{ option.description }}</div>
                                        </div>
                                    </div>
                                </div>
                                <FormError :error="error_message"/>
                            </FieldValidation>
                            <div class="control-group mt-1">
                                <div class="inner">
                                    <label class="control-label">Session Event Strategy:</label>
                                    <div class="controls">
                                        <div class="field">
                                            <Select fluid v-model="metric.session_strategy" :options="session_strategy_options" option-label="label" option-value="value">
                                                <template #option="{ option }">
                                                    <div class="option">
                                                        <div><strong>{{ option.label }}</strong></div>
                                                        <div class="text-sm text-gray-400">{{ option.description }}</div>
                                                    </div>
                                                </template>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Fieldset>
                        <div class="control-group alt">
                            <div class="inner">
                                <div class="controls">
                                    <div class="field alt-label">
                                        <strong>Display As</strong>
                                        <div class="text-sm text-gray-400">How should the value be displayed in reporting?</div>
                                    </div>
                                    <div class="field max-w-25">
                                        <FieldValidation name="type" :value="metric.type" el=".p-select-label" v-slot="{ error_message }" :validator="validator" :rules="validationRules.type">
                                            <Select fluid v-model="metric.type" :options="type_options" option-label="label" option-value="value" placeholder="Select Number Type"/>
                                            <FormError :error="error_message"/>
                                        </FieldValidation>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="control-group alt">
                            <div class="inner">
                                <div class="controls">
                                    <div class="field alt-label">
                                        <strong>Result Sorting</strong>
                                        <div class="text-sm text-gray-400">How should results be sorted?</div>
                                    </div>
                                    <div class="field max-w-25">
                                        <FieldValidation name="sorting_type" :value="metric.sorting_type" el=".p-select-label" v-slot="{ error_message }" :validator="validator" :rules="validationRules.sorting_type">
                                            <Select fluid v-model="metric.sorting_type" :options="sorting_type_options" option-label="label" option-value="value" placeholder="Select Sorting Type"/>
                                            <FormError :error="error_message"/>
                                        </FieldValidation>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="control-group alt">
                            <div class="inner">
                                <div class="controls">
                                    <div class="field alt-label">
                                        <strong>Default Value</strong>
                                        <div class="text-sm text-gray-400">This value will be used if no value is passed to an event</div>
                                    </div>
                                    <div class="field max-w-15">
                                        <FieldValidation name="default_value" :value="metric.default_value" el=".p-select-label" v-slot="{ error_message }" :validator="validator" :rules="validationRules.default_value">
                                            <InputNumber fluid v-model="metric.default_value" :min-fraction-digits="0" placeholder="Enter Default Value" class="input-right"/>
                                            <FormError :error="error_message"/>
                                        </FieldValidation>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="control-group alt">
                            <div class="inner">
                                <div class="controls">
                                    <div class="field alt-label">
                                        <strong>Idle Logging</strong>
                                        <div class="description">Log events in the DB even if no test was served to the user</div>
                                    </div>
                                    <div class="field fit pr-1">
                                        <ToggleSwitch v-model="metric.idle_logging"/>
                                    </div>
                                </div>
                                <template v-if="metric.idle_logging">
                                    <FieldValidation name="idle_logging_percentage" :value="metric.idle_logging_percentage" v-slot="{ error_message }" :validator="validator" :rules="validationRules.idle_logging_percentage">
                                        <div class="controls group-settings">
                                            <div class="field alt-label max-w-[75%]">
                                                <strong>Idle Logging Percentage</strong>
                                                <div class="description">The percentage of events to log when no test was served to the user</div>
                                            </div>
                                            <div class="field max-w-[20%]">
                                                <InputGroup>
                                                    <InputNumber fluid v-model.number="idleLoggingPercentage" :min="1" :max="100" :max-fraction-digits="2" :invalid="!!error_message" class="input-right"/>
                                                    <InputGroupAddon>%</InputGroupAddon>
                                                </InputGroup>
                                            </div>
                                        </div>
                                        <FormError :error="error_message"/>
                                    </FieldValidation>
                                </template>
                            </div>
                        </div>
                    </div>
                </template>
                <template #footer>
                    <div class="flex-row justify-end">
                        <Button text severity="secondary" label="Cancel" @click="$router.push('/metrics')" />
                        <Button label="Save Metric" @click="saveMetric()">
                            <template #icon>
                                <Icon type="Check" color="white" size="20px"/>
                            </template>
                        </Button>
                    </div>
                </template>
            </Card>
        </div>
    </div>
</template>

<script lang="ts">
import { cloneDeep, snakeCase } from 'lodash-es';
import { useFormValidator, rules } from '@splitty-test/validation';

const default_metric = {
    id: null as string | null,
    name: '' as string,
    description: '' as string,
    subject_id: null as string | null,
    event_type: '' as string,
    strategy: 'rate' as 'rate' | 'sum' | 'avg' | 'median',
    session_strategy: 'all' as string,
    type: 'percent' as 'percent' | 'number' | 'currency',
    default_value: 1 as number,
    sorting_type: 'max' as 'max' | 'min',
    idle_logging: false as boolean,
    idle_logging_percentage: 1 as number
};

export default {
    name : 'MetricForm',
    data() {
        return {
            metric: cloneDeep(default_metric) as any,
            is_new: false,
            strategy_options: [
                { label: 'Rate', value: 'rate', description: 'The sum of the values over the total count' },
                { label: 'Sum', value: 'sum', description: 'The total sum of the values' },
                { label: 'Average', value: 'avg', description: 'The average value across all entries' },
                { label: 'Median', value: 'median', description: 'The median value across all entries' }
            ],
            session_strategy_options: [
                { label: 'All Events', value: 'all', description: 'Count all session events and sum the event values' },
                { label: 'First Event', value: 'unique_first', description: 'Only count one event per session and use the first event value' },
                { label: 'Last Event', value: 'unique_last', description: 'Only count one event per session and use the last event value' },
                { label: 'Unique Sum', value: 'unique_sum', description: 'Only count one event per session and sum the event values' },
                { label: 'Unique Average', value: 'unique_avg', description: 'Only count one event per session and use the average event values' },
                { label: 'Unique Median', value: 'unique_median', description: 'Only count one event per session and use the median event value' }
            ],
            type_options: [
                { label: 'Percent', value: 'percent' },
                { label: 'Number', value: 'number' },
                { label: 'Currency', value: 'currency' }
            ],
            sorting_type_options: [
                { label: 'Larger value is better', value: 'max' },
                { label: 'Smaller value is better', value: 'min' }
            ],
            validator: useFormValidator()
        };
    },
    computed: {
        eventType: {
            get() {
                return this.metric.event_type;
            },
            set(value: string) {
                this.metric.event_type = snakeCase(value);
            }
        },
        idleLoggingPercentage: {
            get() {
                return this.metric.idle_logging_percentage * 100;
            },
            set(new_value: number) {
                this.metric.idle_logging_percentage = new_value * 0.01;
            }
        },
        validationRules() {
            return {
                subject_id: [
                    rules.required('A subject is required')
                ],
                name: [
                    rules.required('An name is required')
                ],
                description: [
                    rules.required('A description is required')
                ],
                event_type: [
                    rules.required('An event type is required')
                ],
                strategy: [
                    rules.required('A strategy is required')
                ],
                type: [
                    rules.required('A number type is required')
                ],
                default_value: [
                    rules.required('A default value is required')
                ],
                sorting_type: [
                    rules.required('A sorting type is required')
                ]
            }
        },
    },
    methods: {
        selectStrategy(value: string) {
            this.metric.strategy = value;
        },
        async getMetric(metric_id: string) {
            const { data } = await this.$API.get(`/api/metrics/${metric_id}`);
            this.metric = data;
        },
        async saveMetric() {
            const is_valid = await this.validator.validate();

            if (is_valid) {
                let status;
                const new_value: Record<string, any> = cloneDeep(this.metric);
                if (this.is_new) {
                    ({ status } = await this.$API.post('/api/metrics', { metric: new_value }));
                }
                else {
                    ({ status } = await this.$API.patch(`/api/metrics/${this.metric.id}`, { metric: new_value }));
                }
                
                if (status < 300) {
                    this.$toast.add({
                        severity: 'success',
                        summary: 'Metric saved',
                        detail: 'The metric was successfully saved',
                        life: 3000
                    });
                    this.$router.push({ name: 'MetricsList' });
                }
            }
        }
    },
    async beforeMount() {
        if (this.$route.params.metric_id) {
            await this.getMetric(this.$route.params.metric_id as string);
        }
        else {
            this.is_new = true;

            if (this.$route.query.duplicate_metric_id) {
                await this.getMetric(this.$route.query.duplicate_metric_id as string);
                this.metric.id = null;
                this.metric.name = `${this.metric.name} (Copy)`;
            }
        }
    }
}
</script>

<style lang="less" scoped>
.page {
    margin: 0 auto;
    max-width: 760px;
    width: 100%;
}

.strategy-option {
    background-color: var(--color-stone-100);
    border: 2px solid transparent;
    border-radius: 4px;
    cursor: pointer;
    padding: 0.75rem 1rem;
    
    .strategy-label {
        color: var(--color-gray-500);
        font-weight: var(--font-weight-bold);
    }
    .strategy-description {
        color: var(--color-gray-400);
        font-size: 0.875rem;
    }

    &:hover {
        border-color: var(--color-stone-300);
    }

    &.selected {
        background-color: var(--color-brand-highlight);
        border-color: var(--color-brand-300);
        
        .strategy-description {
            color: var(--color-brand-500);
        }

        .strategy-label {
            color: var(--color-accent);
        }
    }
}
</style>