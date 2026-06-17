<template>
    <div class="test-form-section audiences">
        <p>Select targeted audiences to serve this test to...</p>
        <Message severity="error" v-if="!test.subject_id">
            <template #icon>
                <Icon type="Error" color="red" size="20px"/>
            </template>
            A subject must be selected to select an audience for this test
        </Message>
        <FieldSet legend="Included Audiences" class="mb-2">
            <div class="included-audiences">
                <div class="h-flex mb-1 text-sm text-gray-400">
                    <Icon type="Info" color="brand" size="20px"/>
                    Add audiences you want this test served to. If no audiences are included, the test will serve to all traffic.
                </div>
                <div class="audiences mb-1.5">
                    <div class="no-results" v-if="!includedAudiences.length">This test will serve to all traffic since no audiences have been selected</div>
                    <div class="audience" v-for="audience in includedAudiences">
                        <div class="audience-details">
                            <div class="name">{{ audience.name }}</div>
                            <div class="description">{{  audience.description }}</div>
                        </div>
                        <div class="filters">
                            <div class="filter-count">{{ audience.filters.length }} filter(s)</div>
                        </div>
                        <div class="remove">
                            <Button rounded text severity="danger" v-tooltip.top="'Remove Audience'" @click="removeAudience('included', audience.id)">
                                <template #icon><Icon type="Delete" color="red" size="20px"/></template>
                            </Button>
                        </div>
                    </div>
                </div>
                <Button size="small" label="Include an Audience" @click="openAudienceModal('included')">
                    <template #icon>
                        <Icon type="Add" size="20px"/>
                    </template>
                </Button>
            </div>
        </FieldSet>
        <Fieldset legend="Excluded Audiences">
                <div class="h-flex mb-1 text-sm text-gray-400">
                    <Icon type="Info" color="brand" size="20px"/>
                    Excluded audiences will override any matches to the included audiences that are selected above.
                </div>
                <div class="excluded-audiences">
                <div class="audiences mb-1.5">
                    <div class="no-results" v-if="!excludedAudiences.length">No audiences will be excluded from this test</div>
                    <div class="audience" v-for="audience in excludedAudiences">
                        <div class="audience-details">
                            <div class="name">{{ audience.name }}</div>
                            <div class="description">{{  audience.description }}</div>
                        </div>
                        <div class="filters">
                            <div class="filter-count">{{ audience.filters.length }} filter(s)</div>
                        </div>
                        <div class="remove">
                            <Button rounded text severity="danger" v-tooltip.top="'Remove Audience'" @click="removeAudience('excluded', audience.id)">
                                <template #icon><Icon type="Delete" color="red" size="20px"/></template>
                            </Button>
                        </div>
                    </div>
                </div>
                <Button size="small" label="Exclude an Audience" @click="openAudienceModal('excluded')">
                    <template #icon>
                        <Icon type="Add" size="20px"/>
                    </template>
                </Button>
            </div>
        </Fieldset>
    </div>
    <Dialog v-model:visible="show_modal" modal class="w-full max-w-76 bordered">
        <template #header>
            <div class="h-flex">
                <Icon type="Group Add" size="24px"/>
                Add {{ title(audience_group) }} Audience
            </div>
        </template>
        <p class="text-gray-400">Select an audience below to add it to the test...</p>
        <div class="audience-options">
            <template v-if="availableAudiences.length === 0">
                <p class="no-results"><Icon type="info" color="gray" size="20px"/>No audiences available</p>
            </template>
            <div v-for="audience in availableAudiences" :key="audience.id" class="audience-option" @tabindex="-1" @click="addAudience(audience.id)">
                <div class="audience-details">
                    <div class="name">{{ audience.name }}</div>
                    <div class="description">{{ audience.description }}</div>
                </div>
                <div>{{ audience.filters.length }} filter(s)</div>
            </div>
        </div>
    </Dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { rules } from '@splitty-test/validation';
import { title } from '@lib/filters';

export default defineComponent({
    name : 'SplitTestFormAudiences',
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
            audience_group: 'included',
            audiences: [] as any[],
            show_modal: false
        };
    },
    computed: {
        subjectId() {
            return this.test.subject_id;
        },
        availableAudiences() {
            return this.audiences.filter((audience: any) => {
                return !this.test.audiences.included.includes(audience.id) && !this.test.audiences.excluded.includes(audience.id);
            });
        },
        includedAudiences() {
            return this.audiences.filter((audience: any) => this.test.audiences.included.includes(audience.id));
        },
        excludedAudiences() {
            return this.audiences.filter((audience: any) => this.test.audiences.excluded.includes(audience.id));
        },
        validationRules() {
            return {
                audience: [
                    rules.minLength(1, 'At least one audience is required')
                ]
            };
        },
    },
    watch: {
        async subjectId(new_value: string, old_value: string) {
            if (new_value !== old_value) {
                await this.fetchAudiences();

                // Reset the audiences
                if (old_value !== null) {
                    this.test.audiences = {
                        included: [],
                        excluded: []
                    };
                }
            }
        }
    },
    methods: {
        title,
        async fetchAudiences() {
            if (!this.test.subject_id) return;
            const { data } = await this.$API.get('/api/audiences', {
                params: {
                    filter: {
                        subject_id: this.test.subject_id
                    }
                }
            });
            this.audiences = data;
        },
        openAudienceModal(audience_group: 'included' | 'excluded') {
            this.audience_group = audience_group;
            this.show_modal = true;
        },
        addAudience(audience_id: string) {
            this.test.audiences[this.audience_group].push(audience_id);
            this.show_modal = false;
        },
        removeAudience(type: 'included' | 'excluded', audience_id: string) {
            const index = this.test.audiences[type].findIndex((id: string) => id === audience_id);
            if (index !== -1) {
                this.test.audiences[type].splice(index, 1);
            }
        }
    },
    created() {
        this.fetchAudiences();
    }
});
</script>

<style lang="less" scoped>
.p-fieldset {
    background-color: var(--color-gray-50);
}

.audience,
.audience-option {
    align-items: center;
    background-color: var(--color-white);
    border: 1px solid var(--color-gray-300);
    border-radius: 4px;
    box-shadow: var(--box-shadow);
    cursor: default;
    display: grid;
    grid-template-columns: 3fr 1fr max-content;
    margin-bottom: 0.5em;
    padding: 10px 20px;

    .audience-details {
        .name {
            font-weight: bold;
        }
        .description {
            font-size: 0.875em;
            color: var(--color-gray-500);
        }
    }

    .filters {
        align-items: center;
        color: var(--color-gray-500);
        display: inline-flex;
        gap: 0.5em;
    }

    .remove {
        align-items: center;
        color: var(--color-gray-500);
        display: inline-flex;
        justify-content: end;
    }

    &:hover {
        background-color: var(--color-brand-highlight);
        border-color: var(--color-brand-50);
    }
}
</style>