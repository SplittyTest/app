<template>
    <Dialog v-model:visible="show_modal" modal style="min-width: 800px;">
        <template #header>
            <div class="flex items-center gap-2">
                <Icon type="Comment" color="purple" size="24px"/>
                <strong>Comment</strong>
            </div>
        </template>
        <div class="control-group">
            <div class="inner">
                <div class="controls">
                    <div class="field">
                        <FieldValidation name="content" :value="comment.content" v-slot="{ error_message }" :validator="validator" :rules="validationRules.content">
                            <Textarea fluid v-model="comment.content" autofocus auto-resize class="min-h-[250px]" :invalid="!!error_message" @keydown="handleKeydown" />
                            <FormError :error="error_message"/>
                        </FieldValidation>
                    </div>
                </div>
            </div>
        </div>
        <template #footer>
            <div class="flex-row">
                <Button severity="secondary" text @click="show_modal = false">Cancel</Button>
                <Button @click="saveComment">Save Comment</Button>
            </div>
        </template>
    </Dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { FieldValidation, rules, useFormValidator } from '@splitty-test/validation';
import { emitter } from '@/lib/utils/eventBus';
import { cloneDeep } from 'lodash-es';

export default defineComponent({
    name : 'CommentModal',
    emits: [
        'save'
    ],
    props: {
        testId: {
            type: String
        }
    },
    data() {
        return {
            show_modal: false,
            comment: {
                id: null,
                content: ''
            },
            validator: useFormValidator()
        };
    },
    computed: {
        validationRules() {
            return {
                content: [
                    rules.required('A comment is required')
                ]
            };
        }
    },
    methods: {
        open(comment?: any) {
            this.$nextTick(() => {
                if (comment) {
                    this.comment = cloneDeep(comment);
                }
                else {
                    this.comment = {
                        id: null,
                        content: ''
                    }
                }
                this.validator.reset();
                this.show_modal = true;
            });
        },
        close() {
            this.show_modal = false;
        },
        handleKeydown(event: KeyboardEvent) {
            if (event.metaKey || event.ctrlKey) {
                if (event.key === 'Enter') {
                    this.saveComment();
                }
            }
        },
        async saveComment() {
            const is_valid = await this.validator.validate();
            if (is_valid) {
                const comment: Record<string, any> = {
                    test_id: this.testId,
                    content: this.comment.content
                };

                if (this.comment.id) {
                    comment.id = this.comment.id;
                    comment.modified_at = new Date();
                    
                    await this.$API.patch(`/api/comments/${this.comment.id}`, { comment });
                    this.$toast.add({
                        severity: 'success',
                        summary: 'Comment Updated',
                        detail: 'The comment was successfully updated.',
                        life: 5000
                    });
                }
                else {
                    await this.$API.post(`/api/comments`, { comment });
                    this.$toast.add({
                        severity: 'success',
                        summary: 'Comment Added',
                        detail: 'The comment was successfully posted.',
                        life: 5000
                    });
                }

                this.$emit('save');
                this.close();
            }
        }
    },
    mounted() {
        emitter.on('openCommentModal', (comment: any) => {
			this.open(comment);
        });
    },
    beforeUnmount() {
        emitter.off('openCommentModal');
    }
});
</script>