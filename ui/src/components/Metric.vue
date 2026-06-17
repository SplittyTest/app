<template>
    <Card>
        <template #header>
            {{ heading }}
        </template>
        <template #content>
            <div v-if="icon" class="icon">
                <Icon :type="icon" size="24px"/>
            </div>
            {{ value }}
        </template>
    </Card>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
    name : 'MetricCard',
    props : {
        type: {
            type: String,
            default: 'string'
        },
        heading: String,
        icon: {
            type: String,
            default: ''
        },
        value: {
            type: [Number, String, Boolean, Date, null]
        }
    },
    computed: {
        value(): void {
            switch(this.type) {
                case 'string':
                    return this.value;
                    break;
            }
        }
    }
});
</script>