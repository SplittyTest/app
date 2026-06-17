<template>
    <Card class="w-sm overflow-hidden hover:outline-3 outline-brand-200">
        <template #title>
            <div class="leading-2.5">
                <strong>{{test.name}}</strong>
            </div>
        </template>
        <template #subtitle>
            <div class="section-id font-mono text-sm text-accent-500">{{ test.section_id }}</div>
        </template>
        <template #content>
            <div class="test-status flex-row mb-[10px]">
                <template v-if="['complete', 'archived'].includes(test.status)">
                    <template v-if="test.outcome === 'win'">
                        <Icon type="emoji-events" color="yellow" size="36px"/>
                    </template>
                    <template v-else-if="test.outcome === 'loss'">
                        <Icon type="sentiment-very-dissatisfied" color="red" size="36px"/>
                    </template>
                    <template v-else-if="test.outcome === 'discard'">
                        <Icon type="cancel" color="gray" size="36px"/>
                    </template>
                    <template v-else>
                        <Icon :type="statusInfo.icon" :color="statusInfo.icon_color" size="36px"/>
                    </template>
                </template>
                <template v-else>
                    <Icon :type="statusInfo.icon" :color="statusInfo.icon_color" size="36px"/>
                </template>
                <div class="status-date text-sm text-gray-400">
                    <strong class="text-black">{{ statusInfo.verb }} {{ dayjs(statusInfo.date).format('ddd, MMM D, YYYY [&bull;] h:mmA') }}</strong><br />
                    {{ dayjs(statusInfo.date).fromNow() }}
                </div>
            </div>
            <p class="description mb-[1em]">{{ test.description }}</p>
            <div class="settings mb-[1em]">
                <div v-if="!test.auto_optimize" class="optimization settings-icon bg-accent-500" v-tooltip.top="'Standard Test'">
                    <Icon type="Balance" color="white" size="20px"/>
                </div>
                <div v-else class="optimization settings-icon bg-accent-500" v-tooltip.top="'Auto-Optimized'">
                    <Icon type="Auto Mode" color="white" size="20px"/>
                </div>
                <div v-if="Array.isArray(test.data_segments) && test.data_segments.length" class="segmentation settings-icon bg-accent-500" v-tooltip.top="'Segmented'">
                    <Icon type="Splitscreen" color="white" size="20px"/>
                </div>
            </div>
            <div class="variations">
                <div v-for="variation in testVariations" :class="['variation', 'flex-row', 'split', variation.mode || 'consideration']">
                    <div class="label items-center w-full mr-1" v-text-overflow-marquee>{{ variation.description }}</div>
                    <div class="value">{{ variation.conversion_rate || '--' }}</div>
                </div>
            </div>
        </template>
        <template #footer>
            <div class="flex items-center w-full gap-2">
                <ButtonGroup class="w-full">
                    <Button variant="outlined" class="flex-auto" @click="$router.push(`/split-tests/${test.subject_id}/test/${test.id}`)">View Test Details</Button>
                    <Button variant="outlined" @click="toggle">
                        <template #icon>
                            <Icon type="More-Horiz" size="20px"/>
                        </template>
                    </Button>
                </ButtonGroup>
                <Menu ref="menu" id="menu" :model="testMenu" :popup="true">
                    <template #item="{ item }">
                        <div class="popup-menu-item flex-row">
                            <div class="icon-box">
                                <Icon :type="item.icon" color="white" size="16px"/>
                            </div>
                            {{ item.label }}
                        </div>
                    </template>
                </Menu>
            </div>
        </template>
    </Card>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import dayjs from '@lib/dayjs';
import currency from '@lib/utils/currency';
import { useEventBus } from '@lib/utils/eventBus';
import percentage from '@lib/utils/percentage';
import { set } from 'lodash-es';
import type { MenuItem } from 'primevue/menuitem';
import type { ConfirmationOptions } from 'primevue/confirmationoptions';

const emitter = useEventBus();

export default defineComponent({
    name : 'TestCard',
    emits: [
        'delete'
    ],
    props : {
        test: {
            type: Object,
            required: true
        },
    },
    data() {
        return {};
    },
    computed: {
        statusInfo() {
            if (this.test.status === 'queued') {
                return {
                    icon: 'schedule',
                    icon_color: 'blue',
                    verb: 'Created on',
                    date: this.test.created_at
                }
            }
            if (this.test.status_log) {
                if (this.test.status_log?.data?.status === 'active') {
                    return {
                        icon: 'play-circle',
                        icon_color: 'green',
                        verb: 'Started on',
                        date: this.test.status_log.created_at
                    };
                }
                if (this.test.status_log?.data?.status === 'paused') {
                    return {
                        icon: 'pause-circle',
                        icon_color: 'gray',
                        verb: 'Paused on',
                        date: this.test.status_log.created_at
                    };
                }
                if (this.test.status_log?.data?.status === 'unpaused') {
                    return {
                        icon: 'play-circle',
                        icon_color: 'green',
                        verb: 'Resumed on',
                        date: this.test.status_log.created_at
                    };
                }
                if (this.test.status_log?.data?.status === 'complete') {
                    return {
                        icon: 'stop-circle',
                        icon_color: 'red',
                        verb: 'Stopped on',
                        date: this.test.status_log.created_at
                    };
                }
                if (this.test.status_log?.data?.status === 'archived') {
                    return {
                        icon: 'remove-circle',
                        icon_color: 'purple',
                        verb: 'Archived on',
                        date: this.test.status_log.created_at
                    };
                }
            }
            return {};
        },
        testVariations() {
            return this.test.variations
                .map((variation: any) => {
                    if (this.test.results) {
                        let conversion_rate = this.test.results[variation.id]?.default?.conversion_rate || 0;
                        if (this.test.conversion_value_type === 'percent') {
                            conversion_rate = percentage(conversion_rate);
                        }
                        if (this.test.conversion_value_type === 'currency') {
                            conversion_rate = currency(conversion_rate);
                        }
                        variation.conversion_rate = conversion_rate;
                        variation.mode = this.test.results[variation.id]?.default?.mode || 0;
                    }
                    return variation;
                })
                .filter((variation: any) => {
                    return variation.status === 'active';
                });
        },
        testMenu() {
            const menu: MenuItem[] = [];

            // Start test
            if (this.test.status === 'queued') {
                menu.push({ 
                    label: 'Start Test',
                    icon: 'play-arrow',
                    command: this.startTest
                });
            }
            
            // Pause Test
            if (this.test.status === 'active') {
                menu.push({ 
                    label: 'Pause Test',
                    icon: 'pause',
                    command: this.pauseTest
                });
            }
            
            // Resume Test
            if (this.test.status === 'paused') {
                menu.push({ 
                    label: 'Resume Test',
                    icon: 'play-arrow',
                    command: this.startTest
                });
            }

            // Stop Test
            if (['active', 'paused'].includes(this.test.status)) {
                menu.push({ 
                    label: 'Stop Test',
                    icon: 'stop',
                    command: this.stopTest
                });
            }

            // Archive Test
            if (['queued', 'complete'].includes(this.test.status)) {
                menu.push({ 
                    label: 'Archive Test',
                    icon: 'archive',
                    command: this.archiveTest
                });
            }

            // Push items that are always available
            menu.push(
                // Edit Test
                {
                    label: 'Edit Test',
                    icon: 'edit',
                    command: this.editTest
                },

                // Duplicate Test
                {
                    label: 'Duplicate Test',
                    icon: 'content-copy',
                    command: this.duplicateTest
                }
            );

            // Delete Test
            if (['queued', 'archived'].includes(this.test.status)) {
                menu.push({ 
                    label: 'Delete Test',
                    icon: 'delete',
                    command: this.deleteTest
                });
            }

            return menu;
        }
    },
    methods: {
        dayjs,
        currency,
        percentage,
        toggle(event: MouseEvent) {
            const menu_instance = this.$refs.menu as any;
			menu_instance.toggle(event);
		},
        async startTest() {
            const { data } = await this.$API.patch(`/api/tests/${this.test.id}/status`, {
                status: 'active'
            });
            if (data.timestamp) {
                this.test.status = 'active';
                set(this.test, 'status_log.data.status', 'active');
                set(this.test, 'status_log.created_at', data.timestamp);
                this.$toast.add({
                    severity: 'success',
                    summary: 'Test Started',
                    detail: `The test '${this.test.name}' was started.`,
                    life: 5000
                });
            }
        },
        async pauseTest() {
            const { data } = await this.$API.patch(`/api/tests/${this.test.id}/status`, {
                status: 'paused'
            });
            if (data.timestamp) {
                this.test.status = 'paused';
                set(this.test, 'status_log.data.status', 'paused');
                set(this.test, 'status_log.created_at', data.timestamp);
                this.$toast.add({
                    severity: 'success',
                    summary: 'Test Paused',
                    detail: `The test '${this.test.name}' was paused.`,
                    life: 5000
                });
            }
        },
        async stopTest() {
            this.$confirm.require({
                group: 'dialog' as ConfirmationOptions['group'],
                severity: 'danger',
                header: 'Stop Test',
                message: `Are you sure you want to stop the test <strong>${this.test.name}</strong>? Once a test has been stopped, it cannot be restarted.`,
                acceptProps: {
                    label: 'Stop Test',
                    severity: 'danger'
                },
                accept: async () => {
                    const { data } = await this.$API.patch(`/api/tests/${this.test.id}/status`, {
                        status: 'complete'
                    });
                    if (data.timestamp) {
                        // Trigger the outcome modal
                        emitter.emit('openOutcomeModal', {
                            test_id: this.test.id,
                            test_name: this.test.name
                        });

                        this.test.status = 'complete';
                        set(this.test, 'status_log.data.status', 'complete');
                        set(this.test, 'status_log.created_at', data.timestamp);
                        this.$toast.add({
                            severity: 'success',
                            summary: 'Test Stopped',
                            detail: `The test '${this.test.name}' was stopped.`,
                            life: 5000
                        });
                    }
                },
                rejectProps: {
                    label: 'Cancel',
                    severity: 'secondary'
                },
            } as ConfirmationOptions);
        },
        async archiveTest() {
            const { data } = await this.$API.patch(`/api/tests/${this.test.id}/status`, {
                status: 'archived'
            });
            if (data.timestamp) {
                this.test.status = 'archived';
                set(this.test, 'status_log.data.status', 'archived');
                set(this.test, 'status_log.created_at', data.timestamp);
                this.$toast.add({
                    severity: 'success',
                    summary: 'Test Archived',
                    detail: `The test '${this.test.name}' was archived.`,
                    life: 5000
                });
            }
        },
        editTest() {
            this.$router.push(`/split-tests/${this.test.subject_id}/test/${this.test.id}/edit`);
        },
        duplicateTest() {
            this.$router.push(`/split-tests/${this.test.subject_id}/test/new?duplicate_test_id=${this.test.id}`);
        },
        async deleteTest() {
            this.$confirm.require({
                group: 'dialog',
                severity: 'danger',
                header: 'Delete Test',
                message: `Are you sure you want to delete the test <strong>${this.test.name}</strong>? This cannot be undone.`,
                acceptProps: {
                    label: 'Delete Test',
                    severity: 'danger'
                },
                accept: async () => {
                    await this.$API.delete(`/api/tests/${this.test.id}`);
                    this.$emit('delete', this.test.id);
                    this.$toast.add({
                        severity: 'success',
                        summary: 'Test Deleted',
                        detail: `The test '${this.test.name}' was deleted.`,
                        life: 5000
                    });
                },
                rejectProps: {
                    label: 'Cancel',
                    severity: 'secondary'
                },
            } as ConfirmationOptions);
        }
    }
});
</script>

<style scoped lang="less">
.test-status {
	border-top: 1px solid var(--color-gray-200);
	border-bottom: 1px solid var(--color-gray-200);
	padding: 10px 0;

    .status-date {
        line-height: 1.35em;
    }
}

.settings {
	align-items: center;
	display: flex;
	gap: 5px;
}

:deep(.p-inputicon) {
	margin-top: -12px;
}

.variation {
	border-bottom: 1px solid var(--color-gray-200);
	font-size: 0.875em;
	height: 2.5em;
	padding: 0 0.5em;

	&:last-child {
		border-bottom: 0;
	}
    
    &.exploration {
        color: var(--color-orange-300);
    }
}

:deep(.icon-box) {
    align-items: center;
    background-color: var(--color-alt);
    border-radius: 5px;
    display: flex;
    justify-content: center;
    padding: 0.25em;
}
</style>