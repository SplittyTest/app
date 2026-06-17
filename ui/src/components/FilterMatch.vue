<template>
    <div class="filter-match">
        <div class="groups">
            <div v-for="(condition_group, group_index) in local_filter" :key="group_index" class="condition-group">
                <div v-for="(condition, condition_index) in condition_group" :key="group_index + '-' + condition_index" class="control-group">
                    <div class="inner">
                        <div class="controls gap-1!">
                            <div class="field">
                                <FieldValidation :name="`traffic_filter_${group_index}_${condition_index}`" :value="condition" v-slot="{ error_message }" :validator="validator" :rules="validationRules.filter">
                                    <InputGroup>
                                        <InputText fluid v-model="condition.property" :invalid="!!error_message" placeholder="Property name" />
                                        <Select fluid v-model="condition.strategy" :options="strategy_options" option-label="label" option-value="value" :invalid="!!error_message" />
                                        <InputText fluid v-model="condition.value" :invalid="!!error_message" placeholder="Value - Parsed as JSON" />
                                    </InputGroup>
                                    <FormError :error="error_message"/>
                                </FieldValidation>
                            </div>
                            <div class="field fit">
                                <Button :severity="isNegated(condition.not)" @click="condition.not = !condition.not" v-tooltip.top="'Invert Condition'">
                                    <template #icon>
                                        <template v-if="condition.not">
                                            <Icon type="flaky" color="white" size="20px"/>
                                        </template>
                                        <template v-else>
                                            <Icon type="flaky" size="20px"/>
                                        </template>
                                    </template>
                                </Button>
                            </div>
                            <div class="field fit">
                                <Button v-tooltip.top="'Add Condition'" @click="addCondition(group_index as number, condition_index as number)">
                                    <template #icon>
                                        <Icon type="add" size="18px"/>
                                    </template>
                                </Button>
                            </div>
                            <div class="field fit">
                                <Button v-tooltip.top="'Remove Condition'" @click="removeCondition(group_index as number, condition_index as number)">
                                    <template #icon>
                                        <Icon type="remove" size="18px"/>
                                    </template>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="or">
                    <span>OR</span>
                </div>
            </div>
        </div>
        <Button label="Add Condition Group" @click="addGroup()">
            <template #icon>
                <Icon type="add-box" color="white" size="24px"/>
            </template>
        </Button>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useFormValidator } from '@splitty-test/validation';
import { isEqual } from 'lodash-es';

export default defineComponent({
    name : 'FilterMatch',
    emits: [
        'update:modelValue'
    ],
    props : {
        modelValue: {
            type: Array,
            default() {
                return [];
            }
        },
        validator: {
            type: Object,
            default() {
                return useFormValidator();
            }
        }
    },
    data() {
        return {
            local_filter: [] as any,
            strategy_options: [
                { label: 'between', value: 'between' },
                { label: 'equals', value: 'equals' },
                { label: 'greater than or equals', value: 'greater_than_or_equals' },
                { label: 'greater than', value: 'greater_than' },
                { label: 'in any IP range', value: 'in_any_ip_range' },
                { label: 'includes', value: 'includes' },
                { label: 'intersects', value: 'intersects' },
                { label: 'is nil', value: 'is_nil' },
                { label: 'is null', value: 'is_null' },
                { label: 'is undefined', value: 'is_undefined' },
                { label: 'less than or equals', value: 'less_than_or_equals' },
                { label: 'less than', value: 'less_than' },
                { label: 'matches all', value: 'matches_all' },
                { label: 'matches some', value: 'matches_some' },
                { label: 'matches', value: 'matches' },
                { label: 'within', value: 'within' },
            ],
        };
    },
    computed: {
        validationRules() {
            return {
                filter: [
                    (condition: any) => {
                        if (condition) {
                            if (!condition.property) return 'A property is required';
                            if (!condition.value) return 'A value is required';
                        }
                        return null;
                    }
                ]
            };
        }
    },
    watch: {
        modelValue: {
            handler(new_value: any) {
                if (isEqual(new_value, this.local_filter)) return;
                this.local_filter = new_value.map((condition_group: any[]) => {
                    return condition_group.map((condition: any) => {
                        try {
                            condition.value = JSON.stringify(condition.value);
                        }
                        catch(err) {
                            // Unable to stringify the value
                        }
                        return condition;
                    });
                });
            },
            deep: true,
            immediate: true
        },
        local_filter: {
            handler(new_value: any) {
                this.$emit('update:modelValue', new_value);
            },
            deep: true
        },
    },
    methods: {
        isNegated(negate: boolean) {
            if (negate) {
                return 'warn';
            }
            return 'secondary';
        },
        addGroup() {
            this.local_filter.push([
                {
                    property: null,
                    strategy: 'equals',
                    value: null,
                    negate: false,
                }
            ]);
        },
        removeGroup(index: number) {
            this.local_filter.splice(index, 1);
        },
        addCondition(index: number, condition_index: number) {
            this.local_filter[index]?.splice(condition_index + 1, 0, {
                property: null,
                strategy: 'equals',
                value: null,
                negate: false,
            });
        },
        removeCondition(index: number, condition_index: number) {
            if (this.validator) {
                this.validator.fields[`traffic_filter_${index}_${condition_index}`]?.reset();
                this.validator.removeField(`traffic_filter_${index}_${condition_index}`);
            }
            if (this.local_filter[index]?.length === 1) {
                this.removeGroup(index);
            }
            else {
                this.local_filter[index]?.splice(condition_index, 1);
            }
        },
    }
});
</script>

<style scoped lang="less">
.condition-group {
    .or {
        border-top: 1px solid var(--color-gray-200);
        color: var(--color-gray-400);
        font-size: 0.75em;
        margin-bottom: 1.5em;
        position: relative;
        width: 100%;
    
        span {
            background-color: var(--color-white);
            display: inline-block;
            left: 50%;
            margin: -9px auto 0;
            padding: 0 5px;
            position: absolute;
            transform: translateX(-50%);
        }
    }

    &:last-child .or {
        display: none;
    }
}
</style>