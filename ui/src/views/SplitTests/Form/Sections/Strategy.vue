<template>
    <div class="test-form-section strategy">
        <p>Select a testing strategy to use for this test...</p>
        <div class="strategy-select grid grid-cols-2 gap-1.5">
            <div v-for="option in strategy_options" :key="option.value" :class="['strategy-option', {selected: test.strategy === option.value}]">
                <div :for="`strategy-${option.value}`" @click="selectStrategy(option.value)">
                    <div class="flex-row">
                        <div>
                            <div class="strategy-label">{{ option.label }}</div>
                            <div class="strategy-description">{{ option.description }}</div>
                        </div>
                        <div class="strategy-icon">
                            <Icon :type="option.icon" color="white" size="28px"/>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div v-if="test.strategy === 'standard'" class="mt-1">
            <Fieldset legend="Standard Settings" class="bg-gray-50">
                <div class="control-group alt borderless">
                    <div class="inner">
                        <div class="controls">
                            <div class="field alt-label">
                                <strong>Target Confidence Interval</strong>
                                <div class="description">The minimum confidence interval to target when displaying significance for a variation</div>
                            </div>
                            <div class="field fit">
                                <Select fluid v-model="test.confidence_interval" :options="confidence_interval_options" option-label="label" option-value="value" :disabled="test.status !== 'pending'" />
                            </div>
                        </div>
                    </div>
                </div>
            </Fieldset>
        </div>
        <div v-if="test.strategy === 'auto_optimize'" class="auto-optimize-settings mt-1">
            <Fieldset legend="Auto-Optimize Settings" class="bg-gray-50">
                <div class="control-group alt borderless separated">
                    <div class="inner">
                        <FieldValidation name="rolling_window" :value="test.rolling_window" v-slot="{ error_message }" :validator="validator" :rules="validationRules.rolling_window">
                            <div class="controls">
                                <div class="field alt-label">
                                    <strong>Rolling Window</strong>
                                    <div class="description">Set the number of days or views to lookback when auto-calculating the results of a test</div>
                                </div>
                                <div class="field max-w-21">
                                    <InputGroup>
                                        <InputNumber fluid v-model="test.rolling_window" :invalid="!!error_message" :disabled="test.status !== 'pending'" class="input-right max-w-10"/>
                                        <Select v-model="test.rolling_window_type" :disabled="test.status !== 'pending'" :options="rolling_window_type_options" option-label="label" option-value="value"/>
                                    </InputGroup>
                                </div>
                            </div>
                            <FormError :error="error_message"/>
                        </FieldValidation>
                    </div>
                </div>
                <div class="control-group alt borderless separated">
                    <div class="inner">
                        <div class="controls">
                            <div class="field alt-label">
                                <strong>Exploration Percentage</strong>
                                <div class="description">The percentage of traffic to allocate to under-performing variations for exploration purposes</div>
                            </div>
                            <div class="field fit">
                                <InputGroup>
                                    <InputNumber fluid v-model.number="explorationPercentage" :min="0" :max="100" :disabled="test.status !== 'pending'" class="input-right max-w-8"/>
                                    <InputGroupAddon>%</InputGroupAddon>
                                </InputGroup>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="control-group alt borderless">
                    <div class="inner">
                        <div class="controls">
                            <div class="field alt-label">
                                <strong>Exploration Threshold (Confidence)</strong>
                                <div class="description">Set a variation to exploration mode if its performance falls below this confidence interval threshold</div>
                            </div>
                            <div class="field fit">
                                <Select fluid v-model="test.exploration_threshold" :options="confidence_interval_options" option-label="label" option-value="value" :disabled="test.status !== 'pending'" />
                            </div>
                        </div>
                    </div>
                </div>
            </Fieldset>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { rules } from '@splitty-test/validation';

export default defineComponent({
    name : 'SplitTestFormStrategy',
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
            strategy_options: [
                { label: 'Standard', value: 'standard', description: 'Manually allocate traffic and analyze results without auto-optimization', icon: 'Balance' },
                { label: 'Auto-Optimize', value: 'auto_optimize', description: 'Allow the system to automatically allocate more traffic to better performing variations', icon: 'Auto Mode' },
            ],
            rolling_window_type_options: [
                { label: 'views', value: 'views' },
                { label: 'days', value: 'days' },
            ],
            confidence_interval_options: [
                { label: '70%', value: 0.7 },
                { label: '80%', value: 0.8 },
                { label: '90%', value: 0.9 },
                { label: '95%', value: 0.95 },
                { label: '99%', value: 0.99 },
            ],
        };
    },
    computed: {
        explorationPercentage: {
            get() {
                return this.test.exploration_percentage * 100;
            },
            set(new_value: number) {
                this.test.exploration_percentage = new_value * 0.01;
            }
        },
        validationRules() {
            return {
                rolling_window: [
                    (value: any) => {
                        if (this.test.strategy === 'auto_optimize') {
                            return rules.required('A rolling window value is required', { min: 1 })(value);
                        }
                        return null;
                    }
                ],
                exploration_percentage: [
                    (value: any) => {
                        if (this.test.strategy === 'auto_optimize') {
                            return rules.required('An exploration percentage of at least 1% is required', { min: 0.01 })(value);
                        }
                        return null;
                    }
                ],
            };
        },
    },
    methods: {
        selectStrategy(value: string) {
            if (this.test.status === 'pending') {
                this.test.strategy = value;
            }
        },
    }
});
</script>

<style lang="less" scoped>
.strategy-option {
    border: 2px solid var(--color-gray-200);
    border-radius: 6px;
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

    .strategy-icon {
        align-items: center;
        background-color: var(--color-gray-300);
        border-radius: 6px;
        display: flex;
        height: 50px;
        justify-content: center;
        min-width: 50px;
        width: 50px;
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

        .strategy-icon {
            background-color: var(--color-accent);
        }
    }
}
</style>