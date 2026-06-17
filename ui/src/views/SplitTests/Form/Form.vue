<template>
    <div class="page max-w-120">
        <hgroup class="flex items-center gap-2 mb-3">
            <div class="page-icon bg-brand">
                <Icon type="Science" color="white" size="28px"/>
            </div>
            <h1>{{ is_new ? 'New Split Test' : 'Edit Split Test' }}</h1>
        </hgroup>
        <div class="page-content">
            <div class="test-form basis-full">
                <template v-if="test.status === 'complete'">
                    <!-- TEST OUTCOME -->
                    <Card :class="['mb-2', test.outcome]">
                        <template #content>
                            <div class="control-group alt">
                                <div class="inner">
                                    <div class="controls">
                                        <div class="field fit">
                                            <template v-if="test.outcome === 'win'">
                                                <div class="icon-circle bg-green-700!">
                                                    <Icon type="Emoji Events" color="white" size="24px"/>
                                                </div>
                                            </template>
                                            <template v-if="test.outcome === 'loss'">
                                                <div class="icon-circle bg-red-700!">
                                                    <Icon type="Thumb Down" color="white" size="24px"/>
                                                </div>
                                            </template>
                                            <template v-if="test.outcome === 'discard'">
                                                <div class="icon-circle bg-gray-700!">
                                                    <Icon type="Clear" color="white" size="24px"/>
                                                </div>
                                            </template>
                                        </div>
                                        <div class="field alt-label">
                                            <strong>This Test is Complete</strong>
                                            <div class="description">This test was ended on {{ dateFormat(test.ended_at, 'MMM DD, YYYY [at] h:mm A') }}</div>
                                        </div>
                                        <div class="field fit">
                                            <Select v-model="test.outcome" :options="outcome_options" option-label="label" option-value="value" placeholder="Select an outcome" />
                                        </div>
                                    </div>
                                    <template v-if="test.outcome === 'win' || test.outcome === 'loss'">
                                        <div class="test-outcome-notes">
                                            <label class="control-label">Test Notes:</label>
                                            <div class="field">
                                                <Textarea fluid v-model="test.notes" placeholder="Outcome notes..." auto-resize />
                                            </div>
                                        </div>
                                    </template>
                                </div>
                            </div>
                        </template>
                        <template #footer>
                            <div class="flex items-center justify-between">
                                <div>
                                    <Button size="small" severity="secondary" label="Duplicate This Test" @click="duplicateTest()">
                                        <template #icon>
                                            <Icon type="Content Copy" size="18px"/>
                                        </template>
                                    </Button>
                                </div>
                                <div class="inline-flex items-center gap-2">
                                    <Button size="small"  text severity="secondary" @click="$router.go(-1)">Cancel</Button>
                                    <Button size="small" label="Save Test" @click="saveTest()">
                                        <template #icon>
                                            <Icon type="Check" size="20px"/>
                                        </template>
                                    </Button>
                                </div>
                            </div>
                        </template>
                    </Card>
                </template>
                <Card>
                    <template #content>
                        <div class="flex items-start gap-2">
                            <div class="sections-list flex-1 p-1 pt-2.5">
                                <Button fluid text label="Details" :class="{selected: current_section === 'details'}" @click="current_section = 'details'">
                                    <template #icon>
                                        <Icon type="info" color="brand" size="24px"/>
                                    </template>
                                </Button>
                                <Button fluid text label="Audiences" :class="{selected: current_section === 'audiences'}" @click="current_section = 'audiences'">
                                    <template #icon>
                                        <Icon type="Group" color="brand" size="20px"/>
                                    </template>
                                </Button>
                                <Button fluid text label="Metrics" :class="{selected: current_section === 'metrics'}" @click="current_section = 'metrics'">
                                    <template #icon>
                                        <Icon type="Analytics" color="brand" size="20px"/>
                                    </template>
                                </Button>
                                <Button fluid text label="Variations" :class="{selected: current_section === 'variations'}" @click="current_section = 'variations'">
                                    <template #icon>
                                        <Icon type="Layers" color="brand" size="20px"/>
                                    </template>
                                </Button>
                                <Button fluid text label="Strategy" :class="{selected: current_section === 'strategy'}" @click="current_section = 'strategy'">
                                    <template #icon>
                                        <Icon type="Emoji Objects" color="brand" size="20px"/>
                                    </template>
                                </Button>
                                <Button fluid text label="Data Calculation" :class="{selected: current_section === 'data_calculation'}" @click="current_section = 'data_calculation'">
                                    <template #icon>
                                        <Icon type="Calculate" color="brand" size="20px"/>
                                    </template>
                                </Button>
                                <Button fluid text label="Safeguards" :class="{selected: current_section === 'safeguards'}" @click="current_section = 'safeguards'">
                                    <template #icon>
                                        <Icon type="Shield" color="brand" size="20px"/>
                                    </template>
                                </Button>
                            </div>
                            <div class="form flex-4 p-1">
                                <BlockUI :blocked="['complete', 'archived'].includes(test.status)">
                                    <Accordion v-model:value="current_section">
                                        <AccordionPanel value="details">
                                            <AccordionHeader>
                                                <div class="section-heading">
                                                    Test Details
                                                </div>
                                            </AccordionHeader>
                                            <AccordionContent>
                                                <Details :test="test" :validator="validator" />
                                            </AccordionContent>
                                        </AccordionPanel>
                                        <AccordionPanel value="audiences">
                                            <AccordionHeader>
                                                <div class="section-heading">
                                                    <Icon v-if="isLocked" type="Lock" color="gray" size="20px"/> Audiences
                                                </div>
                                            </AccordionHeader>
                                            <AccordionContent :pt="{ content: { class: { disabled: isLocked } } }">
                                                <Audiences :test="test" :validator="validator" />
                                            </AccordionContent>
                                        </AccordionPanel>
                                        <AccordionPanel value="metrics">
                                            <AccordionHeader>
                                                <div class="section-heading">
                                                    <Icon v-if="isLocked" type="Lock" color="gray" size="20px"/> Metrics
                                                </div>
                                            </AccordionHeader>
                                            <AccordionContent :pt="{ content: { class: { disabled: isLocked } } }">
                                                <Metrics :test="test" :validator="validator" />
                                            </AccordionContent>
                                        </AccordionPanel>
                                        <AccordionPanel value="variations">
                                            <AccordionHeader>
                                                <div class="section-heading">
                                                    <Icon v-if="isLocked" type="Lock" color="gray" size="20px"/> Variations
                                                </div>
                                            </AccordionHeader>
                                            <AccordionContent :pt="{ content: { class: { disabled: isLocked } } }">
                                                <Variations :test="test" :validator="validator" />
                                            </AccordionContent>
                                        </AccordionPanel>
                                        <AccordionPanel value="strategy">
                                            <AccordionHeader>
                                                <div class="section-heading">
                                                    <Icon v-if="isLocked" type="Lock" color="gray" size="20px"/> Strategy
                                                </div>
                                            </AccordionHeader>
                                            <AccordionContent :pt="{ content: { class: { disabled: isLocked } } }">
                                                <Strategy :test="test" :validator="validator" />
                                            </AccordionContent>
                                        </AccordionPanel>
                                        <AccordionPanel value="data_calculation">
                                            <AccordionHeader>
                                                <div class="section-heading">
                                                    <Icon v-if="isLocked" type="Lock" color="gray" size="20px"/> Data Calculation
                                                </div>
                                            </AccordionHeader>
                                            <AccordionContent :pt="{ content: { class: { disabled: isLocked } } }">
                                                <DataCalculation :test="test" :validator="validator" />
                                            </AccordionContent>
                                        </AccordionPanel>
                                        <AccordionPanel value="safeguards" class="border-b-0">
                                            <AccordionHeader>
                                                <div class="section-heading">
                                                    Safeguards
                                                </div>
                                            </AccordionHeader>
                                            <AccordionContent>
                                                <Safeguards :test="test" :validator="validator" />
                                            </AccordionContent>
                                        </AccordionPanel>
                                    </Accordion>
                                </BlockUI>
                            </div>
                        </div>
                    </template>
                    <template #footer>
                        <div class="flex items-center justify-between">
                            <div>
                                <template v-if="!is_new">
                                    <Button label="Duplicate This Test" @click="duplicateTest()">
                                        <template #icon>
                                            <Icon type="Content Copy" color="white" size="18px"/>
                                        </template>
                                    </Button>
                                </template>
                            </div>
                            <div class="inline-flex items-center gap-2">
                                <Button text severity="secondary" @click="$router.go(-1)">Cancel</Button>
                                <Button label="Save Test" @click="saveTest()">
                                    <template #icon>
                                        <Icon type="Check" size="20px"/>
                                    </template>
                                </Button>
                            </div>
                        </div>
                    </template>
                </Card>
            </div>
        </div>
        <Dialog v-model:visible="show_error_modal" modal class="w-full max-w-40 tight">
            <template #header>
                <div class="flex-row">
                    <Icon type="Error" color="red" size="20px"/>
                    <strong>Oops!</strong>
                </div>
            </template>
            <p class="text-sm">Please fix the following errors before saving...</p>
            <ul class="form-errors">
                <li v-for="error in error_messages" :key="error">{{ error }}</li>
            </ul>
        </Dialog>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { cloneDeep, pick } from 'lodash-es';
import { hash } from 'hash-it';
import { ulid } from 'ulid';
import { dateFormat } from '@lib/filters';
import { useConfirm } from 'primevue/useconfirm';
import { useFormValidator } from '@splitty-test/validation';
import Audiences from './Sections/Audiences.vue';
import Details from './Sections/Details.vue';
import Metrics from './Sections/Metrics.vue';
import Variations from './Sections/Variations.vue';
import Strategy from './Sections/Strategy.vue';
import DataCalculation from './Sections/DataCalculation.vue';
import Safeguards from './Sections/Safeguards.vue';

// Fallback ID for new tests
const new_test_ulid = ulid();

export default defineComponent({
    name: 'SplitTestForm',
    components: {
        Details,
        Audiences,
        Metrics,
        Variations,
        Strategy,
        DataCalculation,
        Safeguards,
    },
    data() {
        return {
            current_section: 'details',
            test: {
                id: new_test_ulid,
                name: '',
                subject_id: this.$route.params.subject_id || null,
                section_id: null,
                description: '',
                preview_url: null as string | null,
                weight: 1,
                audiences: {
                    included: [] as any[],
                    excluded: [] as any[]
                },
                variations: [
                    {
                        id: `${new_test_ulid}-A`,
                        description: 'Control',
                        data: {} as Record<string, any>,
                        weight: 1,
                        status: 'active'
                    }
                ],
                decision_metric_id: null as string | null,
                confidence_interval: 0.95,
                strategy: 'standard',
                data_segments: [] as string[],
                min_views: 1000,
                expected_decision_metric_rate: 1,
                metrics: [] as any[],
                calculation_interval: 300,
                rolling_window_type: 'days',
                rolling_window: 30,
                exploration_percentage: 0.1,
                exploration_threshold: 0.7,
                auto_pause_variations: false,
                min_decision_metric_views: 100,
                losing_percentage_threshold: 0.3,
                status: 'pending',
                ended_at: null as string | null,
                outcome: null as string | null,
                notes: null as string | null,
            },
            outcome_options: [
                { label: 'Marked as Win', value: 'win' },
                { label: 'Marked as Loss', value: 'loss' },
                { label: 'Marked as Discarded', value: 'discard' },
            ],
            hash: null as number | null,
            is_new: false,
            validator: useFormValidator(),
            error_messages: [] as string[],
            show_error_modal: false,
        }
    },
    computed: {
        isLocked() {
            return this.test.status !== 'pending';
        }
    },
    methods: {
        dateFormat,
        async saveTest() {
            const is_valid = await this.validator.validate();

            if (is_valid) {
                if (this.is_new) {
                    const new_test = cloneDeep(this.test);

                    const { data } = await this.$API.post('/api/tests', { test: new_test });
                    if (data.id) {
                        this.$toast.add({
                            severity: 'success',
                            summary: 'Test Saved',
                            detail: 'The test was successfully saved and added to your queued tests',
                            life: 5000
                        });
                        this.$router.push(`/split-tests/${this.$route.params.subject_id}`);
                    }
                }
                else {
                    let updated_test: Partial<typeof this.test> = cloneDeep(this.test);

                    if (this.isLocked) {
                        // Only allow changes to certain fields if the test was already started
                        updated_test = pick(updated_test, ['name', 'description', 'auto_pause_variations', 'min_decision_metric_views', 'losing_percentage_threshold', 'notes', 'outcome']);
                    }

                    const { data } = await this.$API.patch(`/api/tests/${this.$route.params.test_id}`, { test: updated_test });
                    if (data.id) {
                        this.$toast.add({
                            severity: 'success',
                            summary: 'Test Updated',
                            detail: 'The test was successfully updated',
                            life: 5000
                        });
                        this.$router.push('/split-tests');
                    }
                }
            }
            else {
                this.error_messages = this.validator.getErrors().all;
                this.show_error_modal = true;
            }
            this.hash = hash(this.test);
        },
        duplicateTest() {
            this.$router.push({
                name: 'SplitTestCreate',
                query: {
                    duplicate_test_id: this.test.id
                }
            });
        },
    },
    async beforeMount() {
        // Check if this is a new test
        this.is_new = !this.$route.params.test_id;

        // Check if we are duplicating another test
        const test_id = this.$route.params.test_id || this.$route.query.duplicate_test_id || null;
        if (test_id) {
            try {
                const { data } = await this.$API.get(`/api/tests/${test_id}`);
                if (data) {
                    this.test = data;
    
                    if (this.is_new) {
                        this.test.id = new_test_ulid;
                        this.test.name += ' (Copy)';
                        this.test.status = 'pending';
                        this.test.outcome = null;
                        this.test.notes = '';
                        
                        // Update the variation_ids
                        this.test.variations = this.test.variations.map((variation) => {
                            const [old_test_id, variation_id] = variation.id.split('-');
                            if (old_test_id !== new_test_ulid) {
                                variation.id = `${new_test_ulid}-${variation_id}`;
                            }
                            variation.status = 'active';
                            return variation;
                        });
                    }
                }
            } catch (err) {
                console.error(err);
            }
        }
        this.hash = hash(this.test);
    },
    beforeRouteLeave(to, from, next) {
        const confirm = useConfirm()

        if (hash(this.test) !== this.hash) {
            confirm.require({
                group: 'confirmation',
                severity: 'danger',
                icon: 'Error',
                header: 'You Have Unsaved Changes',
                message: 'Some of the test data has been modified. Are you sure you want to leave? You will lose any changes.',
                acceptProps: {
                    label: 'Leave Without Saving',
                    severity: 'danger'
                },
                accept: () => {
                    next();
                },
                rejectProps: {
                    label: 'Stay Here'
                },
                reject: () => {
                    // Do nothing
                }
            } as any);
        }
        else {
            next();
        }
    }
});
</script>

<style lang="less" scoped>
:deep(.p-card) {    
    .alt-label .description {
        color: var(--color-gray-400);
    }

    &.win {
        .control-group {
            background-color: #E5F2E3;

            .alt-label strong {
                color: var(--color-green-700);
            }
        }
    }
    &.loss {
        .control-group {
            background-color: var(--color-red-50);

            .alt-label strong {
                color: var(--color-red-700);
            }
        }
    }
    &.discard {
        .control-group {
            background-color: var(--color-gray-100);

            .alt-label strong {
                color: var(--color-gray-700);
            }
        }
    }
}

.test-outcome-notes {
    border-top: 1px solid rgba(0,0,0,0.05);
    margin: 1em -1em -1em;
    padding: 1em;
}

:deep(.p-overlay-mask) {
    background-color: rgba(255, 255, 255, 0.5) !important;
}

.page {
    margin: 0 auto;
    width: 100%;
}

.sections-list {
    button {
        color: var(--color-gray-500);
        justify-content: flex-start;
        gap: 0.75em;
        margin-bottom: 0.25rem;;

        &.selected {
            background-color: var(--color-stone-100);
            color: var(--color-brand);
            font-weight: bold;
        }
    }
}

.form {
    border-left: 1px solid var(--color-gray-200);
    padding: 1em 1em 1em 0;
}

.section-heading {
    align-items: center;
    color: var(--color-brand);
    display: flex;
    font-size: 1.125em;
    gap: 0.75em;
    padding: 0 1em ;
}

:deep(.test-form-section) {
    padding: 1em;
}

:deep(.p-accordioncontent-content.disabled) {
    cursor: not-allowed !important;
    
    .test-form-section {
        opacity: 0.65;
        pointer-events: none;
    }
}

:deep(.p-card-footer) {
    border-top: 1px solid var(--color-gray-200);
    margin: 0 -20px -20px;
    padding: 20px;
    text-align: right;
}

:global(.p-dialog.tight .p-dialog-content) {
    padding: 0 var(--p-dialog-content-padding) var(--p-dialog-content-padding);
}

.form-errors {
    color: var(--color-red-400);
    font-size: var(--text-sm);
    list-style-type: disc;
    padding-left: 1.5em;
}
</style>