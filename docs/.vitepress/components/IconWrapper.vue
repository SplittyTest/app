<template>
	<div :class="['icon-wrapper', color]" :style="{ height: size, width: size }">
		<slot></slot>
	</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
	name: 'IconWrapper',
	props: {
		size: {
			type: String,
			default: '24px',
		},
		color: {
			type: String,
			default: ''
		},
		type: String,
	}
});
</script>

<style scoped lang="less">

.icon-wrapper {
	align-items: center;
	display: inline-flex;
	justify-content: center;
	margin-right: 0.5em;
	vertical-align: text-top;

	svg {
		height: 100%;
		width: 100%;
	}
}

.white {
	color: transparent;
	background: var(--color-white);
	background-clip: text;
	-webkit-background-clip: text;
}

.brand {
	filter: invert(53%) sepia(37%) saturate(799%) hue-rotate(136deg) brightness(94%) contrast(86%);
}

.alt {
	filter: invert(86%) sepia(92%) saturate(317%) hue-rotate(32deg) brightness(81%) contrast(78%);
}

.accent {
	filter: invert(34%) sepia(12%) saturate(5293%) hue-rotate(235deg) brightness(83%) contrast(84%);
}

.gray {
	filter: invert(97%) sepia(60%) saturate(2%) hue-rotate(292deg) brightness(62%) contrast(95%);
}

.green {
	filter: invert(49%) sepia(78%) saturate(516%) hue-rotate(110deg) brightness(100%) contrast(87%);
}

.blue {
	filter: invert(33%) sepia(74%) saturate(3422%) hue-rotate(199deg) brightness(100%) contrast(107%);
}

.purple {
	filter: invert(60%) sepia(28%) saturate(655%) hue-rotate(229deg) brightness(95%) contrast(83%);
}

.red {
	filter: brightness(0) saturate(100%) invert(11%) sepia(75%) saturate(6580%) hue-rotate(9deg) brightness(104%) contrast(111%);
}

.orange {
	filter: brightness(0) saturate(100%) invert(81%) sepia(49%) saturate(4108%) hue-rotate(341deg) brightness(103%) contrast(101%);
}

.yellow {
	filter: brightness(0) saturate(100%) invert(66%) sepia(13%) saturate(6651%) hue-rotate(14deg) brightness(104%) contrast(102%);
}

</style>