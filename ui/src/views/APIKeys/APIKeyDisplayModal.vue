<template>
    <Dialog v-model:visible="show_modal" modal class="bordered w-full max-w-65">
        <template #header>
            <div class="flex-row">
                <Icon type="Key" size="20px"/>
                <strong>API Key</strong>
            </div>
        </template>
        <div>
            <div class="text-gray-500 mb-2">The API key value is only shown at the time of creation or regeneration. If you lose the key, you will need to generate a new one.</div>
            <InputGroup>
                <InputText fluid v-model="new_api_key" disabled class="text-sm" />
                <InputGroupAddon>
                    <Button label="Copy" @click="copyAPIKeyToClipboard"/>
                </InputGroupAddon>
            </InputGroup>
        </div>
        <template #footer>
            <div class="flex w-full justify-center">
                <Button label="Close" @click="closeKeyModal"/>
            </div>
        </template>
    </Dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import copyToClipboard from 'clipboard-copy';

export default defineComponent({
    name : 'APIKeyDisplayModal',
    data() {
        return {
            show_modal: false,
            new_api_key: '',
        };
    },
    methods: {
        open(api_key: string) {
            this.new_api_key = api_key;
            this.show_modal = true;
        },
        copyAPIKeyToClipboard() {
            copyToClipboard(this.new_api_key);
            this.$toast.add({
                severity: 'success',
                summary: 'API Key Copied',
                detail: 'The API key was copied to your clipboard',
                life: 3000
            });
        },
        closeKeyModal() {
            this.show_modal = false;
            this.new_api_key = '';
        }
    }
});
</script>