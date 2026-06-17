<template>
    <Dialog v-model:visible="show_modal" modal class="w-full max-w-[600px]">
        <template #header>
            <div class="flex items-center gap-2">
                <div>
                    <div class="icon-circle">
                        <Icon type="leaderboard" color="white" size="24px"/>
                    </div>
                </div>
                <div class="font-bold text-lg">Test Outcome</div>
            </div>
        </template>
        <div class="control-group">
            <div class="inner">
                <label class="control-label">Outcome:</label>
                <div class="controls">
                    <div class="field">
                        <FieldValidation name="outcome" :value="test.outcome" v-slot="{ error_message }" el=".p-select-label" :validator="validator" :rules="validationRules.outcome">
                            <Select fluid v-model="test.outcome" :invalid="!!error_message" :options="outcome_options" option-label="label" option-value="value" placeholder="Select Test Outcome" />
                            <FormError :error="error_message"/>
                        </FieldValidation>
                    </div>
                </div>
            </div>
        </div>
        <div class="control-group">
            <div class="inner">
                <label class="control-label">Outcome Notes:</label>
                <div class="controls">
                    <div class="field">
                        <Textarea fluid v-model="test.notes" placeholder="Optional notes..." auto-resize />
                    </div>
                </div>
            </div>
        </div>
        <template #footer>
            <Button text severity="secondary" @click="close">Skip for Now</Button>
            <Button @click="saveOutcome">Save Outcome</Button>
        </template>
    </Dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useEventBus } from '@lib/utils/eventBus';
import { FieldValidation, rules, useFormValidator } from '@splitty-test/validation';

const emitter = useEventBus();

export default defineComponent({
    name : 'OutcomeModal',
    data() {
        return {
            show_modal: false,
            test: {
                id: null as string | null,
                name: '',
                outcome: null as string | null,
                notes: ''
            },
            outcome_options: [
                { label: 'Mark as Win', value: 'win' },
                { label: 'Mark as Loss', value: 'loss' },
                { label: 'Mark as Discarded', value: 'discard' },
            ],
            validator: useFormValidator()
        };
    },
    computed: {
        validationRules() {
            return {
                outcome: [
                    rules.required('A selected outcome is required')
                ]
            };
        }
    },
    methods: {
        open(test_id: string, test_name: string) {
            this.test = {
                id: test_id,
                name: test_name,
                outcome: null,
                notes: ''
            };
            this.show_modal = true;
        },
        close() {
            this.show_modal = false;
        },
        async saveOutcome() {
            const is_valid = await this.validator.validate();
            if (is_valid) {
                await this.$API.patch(`/api/tests/${this.test.id}`, {
                    test: {
                        outcome: this.test.outcome,
                        notes: this.test.notes
                    }
                });
                let message = 'The test outcome was successfully saved';
                switch (this.test.outcome) {
                    case 'win':
                        message = 'The test was marked as a win';
                        break;
                    case 'loss':
                        message = 'The test was marked as a loss';
                        break;
                    case 'discard':
                        message = 'The test was marked as discarded';
                        break;
                }
                this.$toast.add({
                    severity: 'success',
                    summary: 'Test Outcome Saved',
                    detail: message,
                    life: 5000
                });
                this.close();
            }
        }
    },
    mounted() {
        emitter.on('openOutcomeModal', (data: unknown) => {
            const payload = data as { test_id: string; test_name: string };
            this.open(payload.test_id, payload.test_name);
        });
    },
    beforeUnmount() {
        emitter.off('openOutcomeModal');
    }
});
</script>