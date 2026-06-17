<template>
    <div id="page" class="public">
        <Card class="w-sm">
            <template #content>
                <div class="branding">
                    <img src="/images/splitty-test-logo.svg" alt="Splitty Test" class="w-[80%] m-auto">
                </div>
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
                                            <InputText fluid v-model="form.email" :invalid="!!error_message" placeholder="Email Address" autofocus />
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
                                    <FieldValidation name="password" :value="form.password" v-slot="{ error_message }" :validator="validator" :rules="passwordRules">
                                        <Inputgroup>
                                            <InputgroupAddon>
                                                <Icon type="lock" size="24px"/>
                                            </InputgroupAddon>
                                            <Password fluid name="password" v-model="form.password" placeholder="Password" :invalid="!!error_message" :feedback="false"/>
                                        </Inputgroup>
                                        <FormError :error="error_message"/>
                                    </FieldValidation>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="control-group mb-[0]">
                        <div class="inner">
                            <div class="controls">
                                <div class="field">
                                    <Button type="submit" label="Login" class="w-full" @click="handleLogin"/>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </template>
        </Card>
        <div class="login-options text-center text-sm mt-[1em]">
            <div class="forgot-password">
                <router-link to="/forgot-password" class="text-white">I forgot my password</router-link>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useFormValidator, rules } from '@splitty-test/validation';


export default defineComponent({
    name : 'Login',
    data() {
        return {
            form: {
                email: '',
                password: '',
                remember: false
            },
            validator: useFormValidator(),
        };
    },
    computed: {
        emailRules() {
            return [
                rules.required('An email address is required'),
                rules.email('Please enter a valid email address')
            ];
        },
        passwordRules() {
            return [
                rules.required('A password is required')
            ];
        }
    },
    methods: {
        async handleLogin() {
            const is_valid = await this.validator.validate();
            if (is_valid) {
                const user = await this.$sessionStore.login(this.form);
                if (user) {
                    this.$router.push('/subjects');
                }
            }
        }
    }
})
</script>

<style lang="less" scoped>
.branding {
    padding: 0 0 1.5em;
}
</style>