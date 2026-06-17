<template>
    <div id="page" class="public">
        <Card class="w-sm">
            <template #title>
                <div class="flex-row">
                    <Icon type="Psychology Alt" color="brand" size="36px"/>
                    <h2>Forgot Your Password?</h2>
                </div>
            </template>
            <template #content>
                <p>If you can't remember your password, submit your email address below and we'll send you an email with a link to reset your password.</p>
                <form novalidate onsubmit="return false;">
                     <div class="control-group">
                        <div class="inner">
                            <div class="controls">
                                <div class="field">
                                    <FieldValidation name="email" :value="form.email" v-slot="{ error_message }" :validator="validator" :rules="emailRules">
                                        <Inputgroup>
                                            <InputgroupAddon>
                                                <Icon type="mail" size="24px"/>
                                            </InputgroupAddon>
                                            <InputText v-model="form.email" :invalid="!!error_message" class="w-full" placeholder="Email Address" autofocus />
                                        </Inputgroup>
                                        <FormError :error="error_message"/>
                                    </FieldValidation>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="control-group">
                        <div class="inner">
                            <div class="controls">
                                <div class="field">
                                    <Button type="submit" class="w-full" @click="handleSubmit">Submit</Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </template>
        </Card>
        <div class="back text-center text-sm mt-[1em]">
            <router-link to="/login" class="text-white">Back to Login</router-link>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useAPI } from '@lib/API';
import { useFormValidator, rules } from '@splitty-test/validation';

const $API = useAPI();

export default defineComponent({
    name : 'ForgotPassword',
    data() {
        return {
            form: {
                email: ''
            },
            validator: useFormValidator(),
            rules
        };
    },
    computed: {
        emailRules() {
            return [
                rules.required('An email address is required'),
                rules.email('Please enter a vlid email address')
            ];
        }
    },
    methods: {
        async handleSubmit() {
            const is_valid = await this.validator.validate();

            if (is_valid) {
                const { status } = await $API.post('/api/send-password-reset-email', this.form);
                if (status === 204) {
                    this.$toast.add({
                        severity: 'info',
                        summary: 'Email Reset Link Sent',
                        detail: 'If there is an account with that email address, you should receive an email with a link to reset your password.',
                        life: 5000
                    });
                }
            }

        }
    }
});
</script>

<style lang="less">

</style>