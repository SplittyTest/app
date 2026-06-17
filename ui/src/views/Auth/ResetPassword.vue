<template>
    <div id="page" class="public">
        <Card class="w-sm">
            <template #title>
                <div class="flex-row">
                    <Icon type="Lock" color="blue" size="36px"/>
                    <h2>Reset Your Password</h2>
                </div>
            </template>
            <template #content>
                <p>Enter and confirm your new password below, then return to the login page to sign in.</p>
                <form novalidate onsubmit="return false;">
                    <div class="control-group">
                        <div class="inner">
                            <div class="controls">
                                <div class="field">
                                    <FieldValidation name="password" :value="form.password" v-slot="{ error_message }" :validator="validator" :rules="passwordRules">
                                        <Inputgroup>
                                            <InputgroupAddon>
                                                <Icon type="Lock" size="24px"/>
                                            </InputgroupAddon>
                                            <Password v-model="form.password" :invalid="!!error_message" class="w-full" placeholder="Password" :feedback="false" autofocus />
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
                                    <FieldValidation name="confirm" :value="form.confirm" v-slot="{ error_message }" :validator="validator" :rules="confirmRules">
                                        <Inputgroup>
                                            <InputgroupAddon>
                                                <Icon type="Check Circle" size="24px"/>
                                            </InputgroupAddon>
                                            <Password v-model="form.confirm" :invalid="!!error_message" class="w-full" placeholder="Confirm Password" :feedback="false" autofocus />
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
    name : 'ResetPassword',
    data() {
        return {
            form: {
                user_id: this.$route.query.user,
                token: this.$route.query.token,
                password: '',
                confirm: ''
            },
            validator: useFormValidator(),
            rules
        };
    },
    computed: {
        passwordRules() {
            return [
                rules.required('A password is required'),
                rules.matchRegExp(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/, 'Your password is not secure enough')
            ];
        },
        confirmRules() {
            return [
                (value: any) => {
                    if (!this.form.password || value === this.form.password) {
                        return null;
                    }
                    return 'The value does not match';
                }
            ];
        }
    },
    methods: {
        async handleSubmit() {
            const is_valid = await this.validator.validate();

            if (is_valid) {
                const { data } = await $API.post('/api/reset-password', this.form);
                if (data?.user?.id) {
                    this.$toast.add({
                        severity: 'info',
                        summary: 'Password Set',
                        detail: 'Your password has been set. Please try logging in again with your new password.',
                        life: 5000
                    });
                    this.form = {
                        user_id: null,
                        token: null,
                        password: '',
                        confirm: ''
                    }
                }
            }

        }
    }
});
</script>