<template>
    <Dialog v-model:visible="show_modal" modal class="bordered w-full max-w-60">
        <template #header>
            <div class="flex-row">
                <Icon type="Perm Identity" size="20px"/>
                <strong>{{ isNew ? 'New User' : 'Edit User' }}</strong>
            </div>
        </template>

        <!-- START FORM -->
        <div class="control-group">
            <div class="inner">
                <label class="control-label">First Name:</label>
                <div class="controls">
                    <div class="field">
                        <FieldValidation name="first_name" :value="user.first_name" v-slot="{ error_message }" :validator="validator" :rules="validationRules.first_name">
                            <InputText fluid v-model="user.first_name"/>
                            <FormError :error="error_message"/>
                        </FieldValidation>
                    </div>
                </div>
            </div>
        </div>
        <div class="control-group">
            <div class="inner">
                <label class="control-label">Last Name:</label>
                <div class="controls">
                    <div class="field">
                        <FieldValidation name="last_name" :value="user.last_name" v-slot="{ error_message }" :validator="validator" :rules="validationRules.last_name">
                            <InputText fluid v-model="user.last_name"/>
                            <FormError :error="error_message"/>
                        </FieldValidation>
                    </div>
                </div>
            </div>
        </div>
        <div class="control-group">
            <div class="inner">
                <label class="control-label">Email:</label>
                <div class="controls">
                    <div class="field">
                        <FieldValidation name="email" :value="user.email" v-slot="{ error_message }" :validator="validator" :rules="validationRules.email">
                            <InputText fluid v-model="user.email"/>
                            <FormError :error="error_message"/>
                        </FieldValidation>
                    </div>
                </div>
            </div>
        </div>
        <div class="control-group">
            <div class="inner">
                <label class="control-label">Phone:</label>
                <div class="controls">
                    <div class="field">
                        <InputMask fluid v-model="user.phone" mask="(999) 999-9999" unmask placeholder="Optional Phone Number for MFA"/>
                    </div>
                </div>
            </div>
        </div>
        <Fieldset :legend="isNew ? 'Set Password' : 'Change Password'" class="bg-gray-50 mb-2">
            <p v-if="!isNew" class="flex-row gap-1! text-gray-400"><Icon type="Info" color="gray" size="20px"></Icon>Leave these fields blank to keep your current password</p>
            <template v-if="user.role === 'admin' || user.id === $sessionStore.user.id">
                <div class="control-group">
                    <div class="inner">
                        <label class="control-label">Current Password</label>
                        <div class="controls">
                            <div class="field">
                                <Password fluid v-model="old_password" toggle-mask placeholder="Current Password"/>
                            </div>
                        </div>
                    </div>
                </div>
            </template>
            <div class="control-group">
                <div class="inner">
                    <label class="control-label">Password:</label>
                    <div class="controls">
                        <div class="field">
                            <FieldValidation name="password" :value="password" v-slot="{ error_message }" :validator="validator" :rules="validationRules.password">
                                <Password fluid v-model="password" toggle-mask placeholder="New Password"/>
                                <FormError :error="error_message"/>
                            </FieldValidation>
                        </div>
                    </div>
                </div>
            </div>
            <div class="control-group">
                <div class="inner">
                    <label class="control-label">Confirm Password:</label>
                    <div class="controls">
                        <div class="field">
                            <FieldValidation name="confirm_password" :value="confirm_password" v-slot="{ error_message }" el=".p-password-input" :validator="validator" :rules="validationRules.confirm_password">
                                <Password fluid v-model="confirm_password" toggle-mask :input-props="{ autocomplete: 'new-password' }" placeholder="Confirm New Password"/>
                                <FormError :error="error_message"/>
                            </FieldValidation>
                        </div>
                    </div>
                </div>
            </div>
        </Fieldset>
        <template v-if="user.id !== $sessionStore.user.id">
            <div class="control-group">
                <div class="inner">
                    <label class="control-label">Role:</label>
                    <div class="controls">
                        <div class="field">
                            <Select fluid v-model="user.role" :options="role_options" option-label="label" option-value="value" placeholder="Select a Role"/>
                        </div>
                    </div>
                </div>
            </div>
            <div class="control-group">
                <div class="inner">
                    <label class="control-label">Status:</label>
                    <div class="controls">
                        <div class="field">
                            <Select fluid v-model="user.status" :options="status_options" option-label="label" option-value="value"/>
                        </div>
                    </div>
                </div>
            </div>
        </template>
        <!-- END FORM -->

        <template #footer>
            <div class="flex-row gap-2 justify-end">
                <Button label="Cancel" text @click="close"/>
                <Button label="Save" @click="saveUser"/>
            </div>
        </template>
    </Dialog>
</template>

<script lang="ts">
import { cloneDeep, omit } from 'lodash-es';
import { defineComponent } from 'vue';
import { useFormValidator, rules } from '@splitty-test/validation';

const default_user = {
    id: null,
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: 'viewer',
    mfa: false,
    status: 'active',
};

export default defineComponent({
    name : 'UserModal',
    props : {
        userId: {
            type: String,
            required: false,
        }
    },
    emits: ['refreshList'],
    data() {
        return {
            show_modal: false,
            user: {
                ...default_user
            },
            old_password: '',
            password: '',
            confirm_password: '',
            role_options: [
                { label: 'Admin', value: 'admin' },
                { label: 'Tester', value: 'tester' },
                { label: 'Commenter', value: 'commenter' },
                { label: 'Viewer', value: 'viewer' },
            ],
            status_options: [
                { label: 'Active', value: 'active' },
                { label: 'Suspended', value: 'suspended' },
                { label: 'Archived', value: 'archived' },
            ],
            validator: useFormValidator()
        };
    },
    computed: {
        isNew() {
            return this.userId === 'new';
        },
        validationRules() {
            return {
                first_name: [
                    rules.required('A first name is required')
                ],
                last_name: [
                    rules.required('A last name is required')
                ],
                email: [
                    rules.required('An email is required'),
                    rules.email('A valid email is required')
                ],
                password: [
                    (value: string) => {
                        if (this.isNew && !value) {
                            return 'A password is required';
                        }
                        return null;
                    }
                ],
                confirm_password: [
                    (value: string) => {
                        if (this.password !== value) {
                            return 'Passwords do not match';
                        }
                        return null;
                    }
                ],
                role: [
                    rules.required('A role is required')
                ],
            }
        },
    },
    methods: {
        async open() {
            if (this.userId !== 'new') {
                await this.getUser();
            } else {
                this.reset();
                this.validator.reset();
            }
            this.show_modal = true;
        },
        close() {
            this.show_modal = false;
        },
        async getUser() {
            const { data } = await this.$API.get(`/api/users/${this.userId}`);
            this.user = { ...default_user, ...omit(data, ['password', 'last_login', 'created_at', 'modified_at']) };
        },
        async saveUser() {
            const is_valid = await this.validator.validate();

            if (is_valid) {
                let status;
                const new_value: Record<string, any> = cloneDeep(this.user);

                if (new_value.phone === '') {
                    new_value.phone = null;
                }

                if (this.isNew) {
                    new_value.password = this.password;
                    ({ status } = await this.$API.post('/api/users', { user: new_value }));
                }
                else {
                    if (this.password) {
                        new_value.password = this.password;
                        new_value.old_password = this.old_password;
                    }
                    ({ status } = await this.$API.patch(`/api/users/${this.user.id}`, { user: new_value }));
                }

                this.$sessionStore.checkAuth();
                
                if (status < 300) {
                    this.$toast.add({
                        severity: 'success',
                        summary: 'User Saved',
                        detail: 'The user was successfully saved',
                        life: 3000
                    });
                    this.$emit('refreshList');
                    this.close();
                }
            }
        },
        reset() {
            this.old_password = '';
            this.password = '';
            this.confirm_password = '';
            this.user = { ...default_user };
        }
    }
});
</script>

<style lang="less">

</style>