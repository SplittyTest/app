<template>
    <div class="test-form-section settings">
        <p>Add safeguards to protect the overall business performance while running tests...</p>

        <!-- Performance Safeguards -->
        <Fieldset legend="Performance Safeguards">
            <p class="text-sm">The following settings help protect your business by allowing Splitty Test to take action in various scenarios where performance might be compromised.</p>
            <div class="control-group alt bg-white!">
                <div class="inner">
                    <div class="controls">
                        <div class="field alt-label max-w-[75%]">
                            <strong>Auto-Pause Variations</strong>
                            <div class="description">Allow Splitty Test to automatically pause a variation that is severely under-performing to protect against losses that could impact your business.</div>
                        </div>
                        <div class="field fit pr-1">
                            <ToggleSwitch v-model="test.auto_pause_variations"/>
                        </div>
                    </div>
                </div>
                <template v-if="test.auto_pause_variations">
                    <div class="auto-pause-settings mt-1">
                        <Fieldset legend="Auto-Pause Settings" class="bg-gray-50">
                            <div class="control-group alt borderless separated">
                                <div class="inner">
                                    <FieldValidation name="min_decision_metric_views" :value="test.min_decision_metric_views" v-slot="{ error_message }" :validator="validator" :rules="validationRules.min_decision_metric_views">
                                        <div class="controls">
                                            <div class="field alt-label max-w-[75%]">
                                                <strong>No Conversions Threshold</strong>
                                                <div class="description">Pause a variation if it does not have a conversion by the time it reaches this number of views</div>
                                            </div>
                                            <div class="field max-w-[20%]">
                                                <InputNumber fluid v-model="test.min_decision_metric_views" :invalid="!!error_message" class="input-right"/>
                                            </div>
                                        </div>
                                        <FormError :error="error_message"/>
                                    </FieldValidation>
                                </div>
                            </div>
                            <div class="control-group alt borderless">
                                <div class="inner">
                                    <FieldValidation name="losing_percentage_threshold" :value="test.losing_percentage_threshold" v-slot="{ error_message }" :validator="validator" :rules="validationRules.losing_percentage_threshold">
                                        <div class="controls items-center justify-between">
                                            <div class="field alt-label max-w-[75%]">
                                                <strong>Losing Percentage Threshold</strong>
                                                <div class="description">Pause a variation if it is losing to the control variation by this amount or more</div>
                                            </div>
                                            <div class="field max-w-[20%]">
                                                <InputGroup>
                                                    <InputNumber fluid v-model="losingPercentageThreshold" :min="1" :max="100" :max-fraction-digits="2" :invalid="!!error_message" class="input-right"/>
                                                    <InputGroupAddon>%</InputGroupAddon>
                                                </InputGroup>
                                            </div>
                                        </div>
                                        <FormError :error="error_message"/>
                                    </FieldValidation>
                                </div>
                            </div>
                        </Fieldset>
                    </div>
                </template>
            </div>
        </Fieldset>

    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { rules } from '@splitty-test/validation';

export default defineComponent({
    name : 'SplitTestFormSafeguards',
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
        losingPercentageThreshold: {
            get() {
                return this.test.losing_percentage_threshold * 100;
            },
            set(new_value: number) {
                this.test.losing_percentage_threshold = new_value * 0.01;
            }
        },
        validationRules() {
            return {
                min_decision_metric_views: [
                    (value: any) => {
                        if (this.test.auto_pause_variations) {
                            return rules.required('A minimum number of views is required', { min: 1 })(value);
                        }
                        return null;
                    }
                ],
                losing_percentage_threshold: [
                    (value: any) => {
                        if (this.test.auto_pause_variations) {
                            return rules.required('A threshold of at least 1% is required', { min: 0.01 })(value);
                        }
                        return null;
                    }
                ],
            };
        },
    }
});
</script>