<template>
    <div class="subject-form-section">
        <div class="control-group alt">
            <div class="inner">
                <div class="controls">
                    <div class="field alt-label max-w-[75%]">
                        <strong>Testing Enabled</strong>
                        <div class="description">Allow tests to run on this test subject</div>
                    </div>
                    <div class="field max-w-5">
                        <ToggleSwitch fluid v-model="subject.testing_enabled"/>
                    </div>
                </div>
                 <div v-if="subject.testing_enabled" class="controls group-settings">
                    <div class="field alt-label">
                        <strong>Max Concurrent Tests</strong>
                        <div class="description">The maximum number of tests that can concurrently run across all sections of this test subject</div>
                    </div>
                    <div class="field max-w-6">
                        <InputNumber fluid v-model="subject.max_concurrent_tests" class="input-center"/>
                    </div>
                </div>
            </div>
        </div>
        <div class="control-group alt">
            <div class="inner">
                <div class="controls">
                    <div class="field alt-label max-w-[75%]">
                        <strong>Log Untracked Events</strong>
                        <div class="description">Log registered events that are not being tracked by a test</div>
                    </div>
                    <div class="field max-w-5">
                        <ToggleSwitch fluid v-model="subject.settings.log_untracked_events"/>
                    </div>
                </div>
            </div>
        </div>
        <div class="control-group alt">
            <div class="inner">
                <div class="controls">
                    <div class="field alt-label max-w-[75%]">
                        <strong>Log Unknown Events</strong>
                        <div class="description">Enable logging of unregistered events for this test subject</div>
                    </div>
                    <div class="field max-w-5">
                        <ToggleSwitch fluid v-model="subject.settings.log_unknown_events"/>
                    </div>
                </div>
                <div v-if="subject.settings.log_unknown_events" class="controls group-settings">
                    <div class="field alt-label max-w-[75%]">
                        <strong>Unknown Events Idle Logging</strong>
                        <div class="description">Log unknown events even when a test is not active</div>
                    </div>
                    <div class="field max-w-5">
                        <ToggleSwitch fluid v-model="subject.settings.unknown_events_idle_logging"/>
                    </div>
                </div>
                <div v-if="subject.settings.log_unknown_events && subject.settings.unknown_events_idle_logging" class="controls group-settings">
                    <div class="field alt-label max-w-[75%]">
                        <strong>Unknown Events Logging Percentage</strong>
                        <div class="description">Only log unknown events this percentage of the time</div>
                    </div>
                    <div class="field max-w-[15%]">
                        <InputGroup>
                            <InputNumber fluid v-model.number="unknownEventLoggingPercentage" :min="1" :max="100" class="input-right"/>
                            <InputGroupAddon>%</InputGroupAddon>
                        </InputGroup>
                    </div>
                </div>
            </div>
        </div>

    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
    name: 'SubjectFormSections',
    props: {
        subject: {
            type: Object,
            required: true,
        },
        validator: {
            type: Object,
            required: true,
        }
    },
    data() {
        return {};
    },
    computed: {
        unknownEventLoggingPercentage: {
            get() {
                return this.subject.settings.unknown_events_idle_logging_percentage * 100;
            },
            set(value: number) {
                this.subject.settings.unknown_events_idle_logging_percentage = value * 0.01;
            }
        }
    }
});
</script>