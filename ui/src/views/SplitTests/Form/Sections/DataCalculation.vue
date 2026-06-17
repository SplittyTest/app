<template>
    <div class="test-form-section data-calculation" :class="{disabled: test.status !== 'pending'}">
        <p>Finalize test settings and optimize its performance...</p>
        <!-- Segmentation -->
        <div class="control-group alt">
            <div class="inner">
               <strong class="text-accent-500">Segmentation</strong>
               <p class="text-gray-500 text-sm mb-1!">You can configure this test so the results are calculated across different segments. Fewer segments with fewer possible values is better. Enter the name of up to 3 data properties to use as segments.</p>
               <div class="controls">
                   <div class="field">
                       <FieldValidation name="data_segments" :value="test.data_segments" v-slot="{ error_message }" :validator="validator" :rules="validationRules.data_segments">
                           <Chips fluid v-model="test.data_segments" unique :invalid="!!error_message" placeholder="Up to 3 optional properties..." />
                           <FormError :error="error_message"/>
                       </FieldValidation>
                   </div>
               </div>
           </div>
       </div>

        <!-- Calculation Interval -->
        <div class="control-group alt">
            <div class="inner">
                <FieldValidation name="calculation_interval" :value="test.calculation_interval" v-slot="{ error_message }" :validator="validator" :rules="validationRules.calculation_interval">
                    <div class="controls">
                        <div class="field alt-label max-w-[75%]">
                            <strong>Minimum Calculation Interval</strong>
                            <div class="description">Set a minimum number of seconds to wait before recalculating the results of a test. This helps reduce the load on the server.</div>
                        </div>
                        <div class="field max-w-[20%]">
                            <InputGroup>
                                <InputNumber fluid v-model="test.calculation_interval" :invalid="!!error_message" class="input-right"/>
                                <InputGroupAddon class="text-sm">sec</InputGroupAddon>
                            </InputGroup>
                        </div>
                    </div>
                    <FormError :error="error_message"/>
                </FieldValidation>
            </div>
        </div>

        <!-- Min Views -->
        <div class="control-group alt">
            <div class="inner">
                <FieldValidation name="min_views" :value="test.min_views" v-slot="{ error_message }" :validator="validator" :rules="validationRules.min_views">
                    <div class="controls">
                        <div class="field alt-label max-w-[75%]">
                            <strong>Minimum Required Views</strong>
                            <div class="description">The minimum amount of views required before calculating the true conversion rate of a test. This number ensures enough visitors have viewed your test before you make a decision.</div>
                        </div>
                        <div class="field max-w-[20%]">
                            <InputNumber fluid v-model="test.min_views" :invalid="!!error_message" class="input-right"/>
                        </div>
                    </div>
                    <FormError :error="error_message"/>
                </FieldValidation>
            </div>
        </div>

        <!-- Expected Decision Metric Rate -->
        <div class="control-group alt">
            <div class="inner">
                <FieldValidation name="expected_decision_metric_rate" :value="test.expected_decision_metric_rate" v-slot="{ error_message }" :validator="validator" :rules="validationRules.expected_decision_metric_rate">
                    <div class="controls">
                        <div class="field alt-label max-w-[75%]">
                            <strong>Expected Decision Metric Rate</strong>
                            <div class="description">Set this value to the expected rate of your decision metric. This helps in evaluating the performance of your test more accurately.</div>
                        </div>
                        <div class="field max-w-[20%]">
                            <InputGroup>
                                <InputNumber fluid v-model.number="expectedDecisionMetricRate" :min="0" :min-fraction-digits="0" :max-fraction-digits="3" :invalid="!!error_message" class="input-right"/>
                                <InputGroupAddon>%</InputGroupAddon>
                            </InputGroup>
                        </div>
                    </div>
                    <FormError :error="error_message"/>
                </FieldValidation>
            </div>
        </div>

    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { rules } from '@splitty-test/validation';

export default defineComponent({
    name : 'SplitTestFormDataCalculation',
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
        return {};
    },
    computed: {
        expectedDecisionMetricRate: {
            get() {
                return this.test.expected_decision_metric_rate * 100;
            },
            set(new_value: number) {
                this.test.expected_decision_metric_rate = new_value * 0.01;
            }
        },
        validationRules() {
            return {
                data_segments: [
                    (value: any) => {
                        if (this.test.strategy === 'auto_optimize') {
                            return rules.maxLength(3, 'A maximum of 3 segmentation properties can be used for auto-optimization')(value);
                        }
                        return null;
                    }
                ],
                expected_decision_metric_rate: [
                    rules.minValue(0.001, 'An expected decision metric value is required')
                ],
                calculation_interval: [
                    rules.required('A calculation interval is required'),
                    rules.minValue(1, 'The calculation interval must be greater than 0')
                ],
                min_views: [
                    rules.required('A value for minimum views is required'),
                    rules.minValue(1, 'This value must be 1 or greater (at least 1000 is recommended)')
                ],
                min_conversion_views: [
                    (value: any) => {
                        if (this.test.auto_pause_variations) {
                            return rules.required('A value greater than 0 is required', { min: 1 })(value);
                        }
                        return null;
                    }
                ],
            };
        },
    }
});
</script>