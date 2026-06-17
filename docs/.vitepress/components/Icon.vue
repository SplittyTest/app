<template>
	<span :class="['material-icons-two-tone', 'align-text-top', 'mr-2', { spinning: loading }, color]" :style="{ 'font-size': size }">{{
	iconName
}}</span>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
	name: 'Icon',
	props: {
		loading: {
			type: Boolean,
		},
		size: {
			type: String,
			default: 'auto',
		},
		color: {
			type: String,
			default: ''
		},
		type: String,
	},
	computed: {
		iconName() {
			if (this.loading) {
				return 'refresh';
			}
			return this.type;
		}
	}
});
</script>

<style scoped lang="less">
@import url('https://fonts.googleapis.com/icon?family=Material+Icons+Two+Tone');

@keyframes spin {
	from {
		transform: rotate(0deg);
	}

	to {
		transform: rotate(360deg);
	}
}



.spinning {
	animation-duration: 500ms;
	animation-iteration-count: infinite;
	animation-name: spin;
	animation-timing-function: linear;
}

.rotate {
	transform: rotate(90deg);
}

.material-icons-two-tone {
	font-family: 'Material Icons Two Tone';
	font-weight: normal;
	font-style: normal;
	font-size: 24px;  /* Preferred icon size */
	display: inline-block;
	line-height: 1;
	text-transform: none;
	letter-spacing: normal;
	word-wrap: normal;
	white-space: nowrap;
	direction: ltr;

	/* Support for all WebKit browsers. */
	-webkit-font-smoothing: antialiased;
	/* Support for Safari and Chrome. */
	text-rendering: optimizeLegibility;

	/* Support for Firefox. */
	-moz-osx-font-smoothing: grayscale;

	/* Support for IE. */
	font-feature-settings: 'liga';
	
	&.white {
		color: transparent;
		background: var(--color-white);
		background-clip: text;
		-webkit-background-clip: text;
	}

	&.brand {
		filter: invert(53%) sepia(37%) saturate(799%) hue-rotate(136deg) brightness(94%) contrast(86%);
	}
	
	&.alt {
		filter: invert(86%) sepia(92%) saturate(317%) hue-rotate(32deg) brightness(81%) contrast(78%);
	}
	
	&.accent {
		filter: invert(34%) sepia(12%) saturate(5293%) hue-rotate(235deg) brightness(83%) contrast(84%);
	}

	&.gray {
		filter: invert(97%) sepia(60%) saturate(2%) hue-rotate(292deg) brightness(62%) contrast(95%);
	}

	&.green {
		filter: invert(49%) sepia(78%) saturate(516%) hue-rotate(110deg) brightness(100%) contrast(87%);
	}
	
	&.blue {
		filter: invert(33%) sepia(74%) saturate(3422%) hue-rotate(199deg) brightness(100%) contrast(107%);
	}
	
	&.purple {
		filter: invert(60%) sepia(28%) saturate(655%) hue-rotate(229deg) brightness(95%) contrast(83%);
	}

	&.red {
		filter: brightness(0) saturate(100%) invert(11%) sepia(75%) saturate(6580%) hue-rotate(9deg) brightness(104%) contrast(111%);
	}

	&.orange {
		filter: brightness(0) saturate(100%) invert(81%) sepia(49%) saturate(4108%) hue-rotate(341deg) brightness(103%) contrast(101%);
	}
	
	&.yellow {
		filter: brightness(0) saturate(100%) invert(66%) sepia(13%) saturate(6651%) hue-rotate(14deg) brightness(104%) contrast(102%);
	}
}

</style>