<template>
    <div v-if="error" class="form-error">
        {{ error }}
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
    name : 'FormError',
    props : {
        error: String
    }
});
</script>

<style lang="less" scoped>
.form-error {
    color: var(--color-red-500);
    font-size: small;
}
</style>