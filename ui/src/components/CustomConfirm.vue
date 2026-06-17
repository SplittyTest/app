<template>
    <ConfirmDialog group="confirmation">
        <template #container="{ message, acceptCallback, rejectCallback }">
            <div class="confirm-container max-w-40 w-full">
                <div class="header">
                    <Icon :type="message.icon || 'help'" :color="severityColor(message.severity)" size="24px"/>{{ message.header || 'Are you sure?' }}
                </div>
                <div class="message-body">
                    <div class="w-full text-center" v-html="message.message"></div>
                </div>
                <div class="footer justify-center">
                    <Button :severity="message.rejectProps?.severity || 'secondary'" @click="rejectCallback">{{ message.rejectProps?.label || 'Cancel' }}</Button>
                    <Button :severity="message.acceptProps?.severity || 'success'" @click="acceptCallback">{{ message.acceptProps?.label || 'Confirm' }}</Button>
                </div>
            </div>
        </template>
    </ConfirmDialog>
</template>

<script>
export default {
    name : 'CustomConfirmDialog',
    methods: {
        severityColor(severity) {
            switch(severity) {
                case 'danger':
                    return 'red';
                    break;
                case 'warn':
                    return 'yellow';
                    break;
                case 'info':
                    return 'blue';
                    break;
                case 'success':
                    return 'green';
                    break;
                case 'secondary':
                    return 'gray';
                    break;
                case 'help':
                    return 'purple';
                    break;
                default:
                    return 'brand';
                    break;
            }
        }
    }
}
</script>

<style scoped lang="less">
.confirm-container {
    .header {
        align-items: center;
        border-bottom: 1px solid var(--color-gray-200);
        display: flex;
        font-weight: bold;
        gap: 10px;
        padding: 0.75em 1em;
    }

    .message-body {
        color: var(--color-gray-600);
        padding: 1em;
    }

    .footer {
        display: flex;
        gap: 1em;
        padding: 1em;
    }
}
</style>