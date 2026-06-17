<template>
    <div class="settings-form">
        <hgroup class="flex items-center gap-2 mb-[2em]">
            <div class="page-icon bg-accent small">
                <Icon type="Tune" color="white" size="20px"/>
            </div>
            <h2>General Settings</h2>
        </hgroup>
        <div class="form-fields min-h-50">
            <div class="control-group alt">
                <div class="inner">
                    <div class="controls">
                        <div class="field alt-label max-w-[75%]">
                            <strong>Locale</strong>
                            <div class="description">Enter the locale string for your country to format data accordingly</div>
                        </div>
                        <div class="field text-right">
                            <FieldValidation name="locale" :value="settings.locale" v-slot="{ error_message }" :validator="validator" :rules="validationRules.locale">
                                <InputText fluid v-model="settings.locale" class="text-center max-w-10" placeholder="en-US"/>
                                <FormError :error="error_message"/>
                            </FieldValidation>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="control-group alt">
                <div class="inner">
                    <div class="controls">
                        <div class="field alt-label max-w-[75%]">
                            <strong>Currency</strong>
                            <div class="description">Enter the currency code for your region to format data accordingly</div>
                        </div>
                        <div class="field text-right">
                            <FieldValidation name="currency" :value="settings.currency" v-slot="{ error_message }" :validator="validator" :rules="validationRules.currency">
                                <InputText fluid v-model="settings.currency" class="text-center max-w-10" placeholder="USD"/>
                                <FormError :error="error_message"/>
                            </FieldValidation>
                        </div>
                    </div>
                </div>
            </div>

            <div class="control-group alt">
                <div class="inner">
                    <strong class="text-accent">Filtered IP Addresses</strong>
                    <div class="text-sm text-stone-400 mb-1">Enter IP addresses or CIDR ranges to exclude from test traffic...</div>
                    <div class="controls">
                        <div class="field">
                            <FieldValidation name="filtered_ips" :value="settings.filtered_ips" v-slot="{ error_message }" :validator="validator" :rules="validationRules.filtered_ips">
                                <Chips fluid v-model="settings.filtered_ips" placeholder="e.g. 192.168.0.1 or 192.168.0.0/24"/>
                                <FormError :error="error_message"/>
                            </FieldValidation>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="actions flex justify-end gap-1">
            <Button label="Reset" text @click="resetSettings">
                <template #icon>
                    <Icon type="Refresh" size="20px"/>
                </template>
            </Button>
            <Button label="Save Settings" @click="saveSettings">
                <template #icon>
                    <Icon type="Check" size="20px"/>
                </template>
            </Button>
        </div>
        
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useFormValidator } from '@splitty-test/validation';
import { cloneDeep } from 'lodash-es';

export default defineComponent({
    name : 'GeneralSettings',
    data() {
        return {
            settings: {
                locale: 'en-US',
                currency: 'USD',
                filtered_ips: [],
            },
            validator: useFormValidator()
        };
    },
    computed: {
        validationRules() {
            return {
                locale: [
                    (value: string) => {
                        const localeRegex = /^[a-z]{2}-[A-Z]{2}$/;
                        if (!localeRegex.test(value)) {
                            return 'Locale must be in the format xx-XX (e.g. en-US)';
                        }
                        return null;
                    }
                ],
                currency: [
                    (value: string) => {
                        const currencyRegex = /^[A-Z]{3}$/;
                        if (!currencyRegex.test(value)) {
                            return 'Currency must be a 3-letter code (e.g. USD)';
                        }
                        return null;
                    }
                ],
                filtered_ips: [
                    (value: string[]) => {
                        const ipRegex = /^(?:\d{1,3}\.){3}\d{1,3}(?:\/\d{1,2})?$/;
                        if (!value.every((item: string) => ipRegex.test(item))) {
                            return 'Valid IP addresss or CIDR ranges only';
                        }
                        return null;
                    }
                ]
            };
        }
    },
    methods: {
        async getSettings() {
            const { data } = await this.$API.get('/api/settings');
            this.settings = data;
        },
        async resetSettings() {
            await this.getSettings();
        },
        async saveSettings() {
            const is_valid = await this.validator.validate();

            if (is_valid) {
                let status;
                const new_value: Record<string, any> = cloneDeep(this.settings);
                ({ status } = await this.$API.patch('/api/settings', { settings: new_value }));
                
                if (status < 300) {
                    this.$toast.add({
                        severity: 'success',
                        summary: 'Settings saved',
                        detail: 'The settings were successfully saved',
                        life: 3000
                    });
                }
            }
        }
    },
    async beforeMount() {
        await this.getSettings();
    }
});
</script>

<style scoped lang="less">

</style>