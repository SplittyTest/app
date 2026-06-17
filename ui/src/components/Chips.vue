<template>
	<AutoComplete v-model="localValue" multiple :typeahead="false" @blur="handleBlur" @input="handleInput" />
</template>

<script>
import { compact, uniq } from 'lodash-es';

export default {
	name: 'InputChips',
	emits: ['update:modelValue'],
	props: {
		separator: {
			type: RegExp,
			default() {
				return /\s|,/;
			},
		},
		modelValue: {
			type: Array,
			default() {
				return [];
			},
		},
		unique: {
			type: Boolean,
			default: false,
		},
	},
	computed: {
		localValue: {
			get() {
				return this.modelValue;
			},
			set(new_value) {
				this.$emit('update:modelValue', new_value);
			},
		},
	},
	methods: {
		handleBlur(event) {
			if (event.target.value.length > 0) {
				let new_value = this.localValue.concat([event.target.value]);
				if (this.unique) {
					new_value = uniq(new_value);
				}
				this.localValue = new_value;
				event.target.value = '';
			}
		},
		handleInput(event) {
			this.applyValue(event.target.value, event.target);
		},
		applyValue(value, target) {
			if (value.length > 0 && this.separator.test(value)) {
				let new_value = value;
				const split_values = value.split(this.separator);
				const compact_values = compact(split_values);
				new_value = this.localValue.concat(compact_values);
				if (this.unique) {
					new_value = uniq(new_value);
				}
				this.localValue = new_value;
				target.value = '';
			}
		},
	},
};
</script>