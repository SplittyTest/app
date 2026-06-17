<template>
    <Button severity="danger" :outlined="outlined" :text="text" :rounded="rounded" :label="label" :disabled="disabled" @click="confirmDelete($event)">
        <template v-if="icon" #icon>
            <Icon :type="icon" :color="iconColor" size="20px"/>
        </template>
    </Button>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
    name : 'ConfirmDelete',
    emits: [
        'accept',
        'reject'
    ],
    props : {
        label: String,
        disabled: {
            type: Boolean
        },
        icon: {
            type: String,
            default: 'Delete'
        },
        iconColor: {
            type: String,
            default: 'white',
        },
        outlined: {
            type: Boolean,
            default: false
        },
        text: {
            type: Boolean,
            default: false,
        },
        rounded: {
            type: Boolean,
            default: false,
        },
        message: {
            type: String,
            default: 'Are you sure you want to proceed?'
        },
        acceptOptions: {
            type: Object,
            default() {
                return {
                    label: 'Delete',
                    severity: 'danger'
                };
            }
        },
        rejectOptions: {
            type: Object,
            default() {
                return {
                    label: 'Cancel',
                    severity: 'secondary',
                    outlined: true
                };
            }
        },
    },
    methods: {
        confirmDelete(event: MouseEvent) {
            this.$confirm.require({
                target: event.currentTarget as HTMLElement,
                message: this.message,
                accept: () => {
                    this.$emit('accept');
                },
                acceptProps: this.acceptOptions,
                reject: () => {
                    this.$emit('reject');
                },
                rejectProps: this.rejectOptions,
            });
        }
    }
});
</script>