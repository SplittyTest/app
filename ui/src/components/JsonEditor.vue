<template>
    <div class="code-editor-wrapper" :class="{ disabled }">
        <VAceEditor
            v-model:value="local_value"
            lang="json"
            theme="chrome"
            :disabled="disabled"
            :max-lines="maxLines"
            :min-lines="10"
            :options="mergedOptions"
            @init="mergedInit"
            @blur="blurHandler"
        />
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { isEqual, merge } from 'lodash-es';
import { VAceEditor} from 'vue3-ace-editor';
import '@lib/utils/ace.config';

export default defineComponent({
    name : 'JsonEditor',
    components: {
        VAceEditor
    },
    emits: [
        'update:modelValue'
    ],
    props : {
        modelValue: {
            type: [Array, Object, String, Number, Boolean, null],
            default() {
                return {};
            }
        },
        disabled: {
            type: Boolean,
            default: false
        },
        readOnly: {
            type: Boolean,
            default: false
        },
        options: {
            type: Object,
            default() {
                return {};
            }
        },
        maxLines: {
            type: Number,
            default: 30
        },
        init: {
            type: Function,
            default() {
                return () => {};
            }
        }
    },
    data() {
        return {
            local_value: JSON.stringify(this.modelValue, null, 2),
            default_options: {
                enableBasicAutocompletion: true,
                enableLiveAutocompletion: true,
                enableSnippets: true,
                fontSize: 12,
                highlightActiveLine: true,
                readOnly: this.disabled || this.readOnly,
                showPrintMargin: false,
                tabSize: 2,
                useWorker: true,
            }
        }
    },
    computed: {
        mergedOptions() {
            return merge({}, this.default_options, this.options)
        }
    },
    watch: {
        modelValue(new_value, old_value) {
            if (!isEqual(new_value, old_value)) {
                this.local_value = JSON.stringify(new_value, null, 2);
            }
        },
        disabled(new_value, old_value) {
            if (new_value !== old_value) {
                this.default_options.readOnly = new_value;
            }
        }
    },
    methods: {
        mergedInit(editor: any) {
            editor.container.style.lineHeight = "1.5";
            this.init(editor);
        },
        blurHandler() {
            const parsed_value = JSON.parse(this.local_value);
            this.$emit('update:modelValue', parsed_value);
        }
    }
});
</script>

<style lang="less" scoped>
.code-editor-wrapper {
    border: 1px solid var(--p-inputtext-border-color);
    border-radius: var(--p-inputtext-border-radius);
    box-shadow: var(--p-inputtext-shadow);
    overflow: hidden;

    &.disabled .ace_editor {
        opacity: 0.25;
    }
}
</style>