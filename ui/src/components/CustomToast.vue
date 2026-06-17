<template>
    <Toast position="bottom-right" :pt="options">
        <template #container="{ message, closeCallback }">
            <div :class="['toast-message', message.severity]">
                <div class="close-button" @click="closeCallback">
                    <Icon type="Close" size="20px"/>
                </div>
                <div class="message">
                    <div :class="['summary', {'with-detail': message.detail}]">{{ message.summary }}</div>
                    <div v-if="message.detail" class="detail">{{ message.detail }}</div>
                </div>
            </div>
        </template>
    </Toast>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
    name : 'CustomToast',
    data() {
        return {
            options: {
                transition: {
                    enterFromClass: 'toast-enter-from',
                    enterActiveClass: 'toast-enter-active',
                    leaveActiveClass: 'toast-leave-active',
                    leaveToClass: 'toast-leave-to',
                }
            }
        }
    },
});
</script>

<style scoped lang="less">
:global(.p-toast-message) {
    border-radius: 8px;
}

.toast-message {
    background-color: var(--color-gray-100);
    border: 5px solid rgba(255, 255, 255, 0.25);
    font-size: 0.875rem;
    border-radius: 8px;
    padding: 1rem 1.5rem;
    position: relative;

    .message {
        color: white;
        padding-right: 1rem;
    }

    .detail {
        line-height: 1.35em;
        margin-top: 0.5em;
    }

    .summary.with-detail {
        font-weight: bold;;
    }
    
    .close-button {
        align-items: center;
        border-radius: 15px;
        color: white;
        cursor: pointer;
        display: flex;
        height: 30px;
        justify-content: center;
        position: absolute;
        right: 0.5rem;
        top: 0.7rem;
        width: 30px;

        &:hover {
            background-color: var(--color-gray-500);
        }
    }

    &.danger {
        background-color: var(--color-red-700);

        .close-button:hover {
            background-color: var(--color-red-800);
        }
    }
    
    &.warn {
        background-color: var(--color-yellow-500);

        .close-button:hover {
            background-color: var(--color-yellow-600);
        }
    }
    
    &.success {
        background-color: var(--color-lime-500);

        .close-button:hover {
            background-color: var(--color-lime-600);
        }
    }
    
    &.info {
        background-color: var(--color-blue-500);

        .close-button:hover {
            background-color: var(--color-blue-600);
        }
    }
    
    &.help {
        background-color: var(--color-purple-700);

        .close-button:hover {
            background-color: var(--color-purple-800);
        }
    }
    
    &.secondary {
        background-color: var(--color-gray-300);

        .message,
        .close-button {
            color: var(--color-gray-600);
        }

        .close-button:hover {
            background-color: var(--color-gray-400);
        }
    }
    
    &.contrast {
        background-color: var(--color-gray-800);

        .message,
        .close-button {
            color: white;
        }

        .close-button:hover {
            background-color: var(--color-gray-700);
        }
    }
}
</style>