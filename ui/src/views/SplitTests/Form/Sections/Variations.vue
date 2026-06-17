<template>
    <div class="test-form-section variations">
        <p>Add variations to your test to see how different changes impact your metrics...</p>
        <div class="variations">
            <div v-for="variation in sortedVariations" class="variation">
                <div class="details">
                    <div class="description">{{ variation.description }}</div>
                    <div class="id">{{ variation.id }}</div>
                </div>
                <div class="preview">
                    <div class="h-flex gap-4!">
                        <div v-if="preview_url" class="icon-wrapper clickable" v-tooltip.top="'Preview Variation'" @click="previewVariation(variation)">
                            <Icon type="Open in Browser" size="24px"/>
                        </div>
                        <div class="icon-wrapper clickable" v-tooltip.top="{value: `<pre class='data-preview'>${JSON.stringify(variation.data, null, 2)}</pre>`, escape: false}">
                            <Icon type="Manage Search" size="24px"/>
                        </div>
                    </div>
                </div>
                <div class="tools h-flex">
                    <div class="tool">
                        <Button text rounded v-tooltip.top="'Edit Variation'" @click="editVariation(variation.id)">
                            <template #icon>
                                <Icon type="Edit" size="20px"/>
                            </template>
                        </Button>
                    </div>
                    <div class="tool">
                        <ConfirmDelete
                            text
                            rounded
                            v-tooltip.top="endsWith(variation.id, '-A') ? 'Cannot Delete Control' : 'Delete Variation'"
                            :icon-color="endsWith(variation.id, '-A') ? 'gray' : 'red'"
                            @accept="deleteVariation(variation.id)"
                            :disabled="endsWith(variation.id, '-A')"
                        />
                    </div>
                </div>
            </div>
            <div class="mt-1.5">
                <Button size="small" label="Add Variation" @click="newVariation">
                    <template #icon>
                        <Icon type="Add" size="20px"/>
                    </template>
                </Button>
            </div>
        </div>
    </div>
    <Dialog v-model:visible="show_modal" :close-on-escape="false" modal class="w-full max-w-60 bordered">
        <template #closebutton>
            <Button text rounded v-tooltip.top="'Close'" @click="closeModal">
                <template #icon>
                    <Icon type="Close" color="gray" size="20px"/>
                </template>
            </Button>
        </template>
        <template #header>
            <div class="h-flex">
                <Icon type="Layers" size="24px"/>
                Edit Variation
            </div>
        </template>
        <div class="variation-form" @keydown.esc.stop="closeModal" tabindex="-1">
            <div class="control-group">
                <div class="inner">
                    <label class="control-label">Variation ID:</label>
                    <div class="controls">
                        <div class="field">
                            <InputText fluid v-model="selected_variation.id" disabled />
                        </div>
                    </div>
                </div>
            </div>
            <div class="control-group">
                <div class="inner">
                    <label class="control-label">Description:</label>
                    <div class="controls">
                        <div class="field">
                            <InputText fluid v-model="selected_variation.description" autofocus />
                        </div>
                    </div>
                </div>
            </div>
            <div class="control-group">
                <div class="inner">
                    <label class="control-label">Variation Data:</label>
                    <div class="controls">
                        <div class="field">
                            <JsonEditor :max-lines="20" v-model="selected_variation.data"/>
                        </div>
                    </div>
                </div>
            </div>
            <div class="control-group alt">
                <div class="inner">
                    <div class="controls">
                        <div class="field alt-label">
                            <strong>Variation Frequency</strong>
                            <div class="text-sm text-gray-400">How often this variation is shown to users</div>
                        </div>
                        <div class="field fit">
                            <InputGroup>
                                <InputNumber fluid v-model.number="selected_variation.weight" :min="0" class="input-right max-w-6"/>
                                <InputGroupAddon>x</InputGroupAddon>
                            </InputGroup>
                        </div>
                    </div>
                </div>
            </div>
            <div class="control-group">
                <div class="inner">
                    <label class="control-label">Status:</label>
                    <div class="controls">
                        <div class="field">
                            <Select fluid v-model="selected_variation.status" :options="status_options" option-label="label" option-value="value" placeholder="Select a status..." />
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <template #footer>
            <div class="h-flex gap-2 justify-end">
                <Button text @click="closeModal">Cancel</Button>
                <Button label="Save Variation" @click="saveVariation(selected_variation)">
                    <template #icon>
                        <Icon type="Check" size="20px"/>
                    </template>
                </Button>
            </div>
        </template>
    </Dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { title } from '@lib/filters';
import { cloneDeep, endsWith, sortBy } from 'lodash-es';
import { hash } from 'hash-it';

const default_variation = {
    id: null as string | null,
    description: null as string | null,
    data: {} as Record<string, any>,
    weight: 1,
    status: 'active'
};

export default defineComponent({
    name : 'SplitTestFormVariations',
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
            show_modal: false,
            preview_url: null as string | null,
            selected_variation: null as any,
            variation_hash: null as number | null,
            default_data: {},
            status_options: [
                { label: 'Active', value: 'active' },
                { label: 'Paused', value: 'paused' },
                { label: 'Archived', value: 'archived' },
            ]
        };
    },
    computed: {
        sortedVariations() {
            return sortBy(this.test.variations, 'id');
        },
        sectionId() {
            return this.test.section_id;
        }
    },
    watch: {
        sectionId: {
            handler(new_value, old_value) {
                if (new_value !== old_value) {
                    const subject = this.$sessionStore.subject_options.find((subject: any) => {
                        return subject.value === this.test.subject_id;
                    });

                    if (subject && Array.isArray(subject.sections) && subject.sections.length > 0) {
                        const section = subject.sections.find((section: any) => {
                            return section.value === new_value;
                        });

                        if (section) {
                            this.preview_url = section.preview_url;
                            this.default_data = cloneDeep(section.data);
                        }
                    }
                }
            },
            immediate: true
        }
    },
    methods: {
        endsWith,
        title,
        closeModal() {
            if (this.selected_variation && this.variation_hash) {
                const current_hash = hash(this.selected_variation);
                if (current_hash !== this.variation_hash) {
                    this.$confirm.require({
                        group: 'confirmation',
                        severity: 'danger',
                        icon: 'Error',
                        message: 'You have unsaved changes to this variation. Are you sure you want to discard them?',
                        header: 'Unsaved Changes',
                        acceptProps: {
                            label: 'Discard Changes',
                            severity: 'danger'
                        },
                        accept: () => {
                            this.show_modal = false;
                            this.selected_variation = null;
                            this.variation_hash = null;
                        },
                        rejectProps: {
                            label: 'Keep Editing'
                        }
                    } as any);
                    return;
                }
            }
            this.show_modal = false;
        },
        newVariation() {
            this.selected_variation = cloneDeep(default_variation);
            this.selected_variation.data = cloneDeep(this.default_data);

            // Find the next available letter for the variation ID
            const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            const existing_ids = this.test.variations.map((variation: any) => variation.id.substring(variation.id.length - 1)).sort();
            const last_id = existing_ids.length > 0 ? existing_ids[existing_ids.length - 1] : 'A';
            const next_letter = letters[letters.indexOf(last_id) + 1] || null;

            if (next_letter) {
                this.selected_variation.id = `${this.test.id}-${next_letter}`;
                this.selected_variation.description = `Variation ${next_letter}`;
            }

            this.variation_hash = hash(this.selected_variation);
            this.show_modal = true;
        },
        editVariation(variation_id: string) {
            const existing_variation = this.test.variations.find((v: any) => {
                return v.id === variation_id;
            });

            if (existing_variation) {
                this.selected_variation = cloneDeep(existing_variation);
                this.variation_hash = hash(this.selected_variation);
                this.show_modal = true;
            }
        },
        deleteVariation(variation_id: string) {
            const existing_variation_index = this.test.variations.findIndex((v: any) => {
                return v.id === variation_id;
            });

            if (existing_variation_index !== -1) {
                this.test.variations.splice(existing_variation_index, 1);
            }
        },
        saveVariation(variation: any) {
            const existing_variation = this.test.variations.find((v: any) => {
                return v.id === variation.id;
            });

            if (existing_variation) {
                Object.assign(existing_variation, variation);
            } else {
                this.test.variations.push(variation);
            }
            this.show_modal = false;
        },
        previewVariation(variation: any) {
            if (this.preview_url) {
                const url = this.preview_url.replaceAll('{{test_id}}', this.test.id).replaceAll('{{variation_id}}', variation.id);
                window.open(url, '_blank');
            }
        }
    }
});
</script>

<style lang="less" scoped>
.variation {
    align-items: center;
    background-color: var(--color-white);
    border: 1px solid var(--color-gray-300);
    border-radius: 4px;
    box-shadow: var(--box-shadow);
    cursor: pointer;
    display: grid;
    grid-template-columns: 4fr 1fr 1fr;
    gap: 1em;
    margin-top: 0.5em;
    padding: 10px 20px;
    transition: background-color 0.2s ease;

    .description {
        font-weight: var(--font-weight-bold);
    }

    .id {
        color: var(--color-gray-400);
        font-size: var(--text-xs);
    }

    .tools {
        border-left: 1px dotted var(--color-gray-400);
        padding-left: 2em;
    }

    .preview, .tools {
        text-align: center;
    }
}

.data-preview {
    font-size: var(--text-xs);
}
</style>