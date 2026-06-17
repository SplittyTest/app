import { useResizeObserver } from '@vueuse/core';

export const TextOverflowMarquee = {
	mounted(el: HTMLElement) {
		// Add the class
		el.classList.add('text-overflow-marquee');

		// Wrap the inner text in a span
		el.innerHTML = `<span>${el.innerHTML}</span>`;
		const span = el.querySelector('span') as HTMLElement;

		let width = 0;
		useResizeObserver(el, (instances) => {
			const [instance] = instances;
			if (instance) {
				width = instance.contentRect.width;
			}
			if (span.offsetWidth > width) {
				el.addEventListener('mouseover', () => {
					span.style.transform = `translateX(calc(${width}px - 100%))`;
				});

				el.addEventListener('mouseout', () => {
					span.style.transform = `translateX(0)`;
				});
			}
			span.style.width = `${width}px`;
		});
	},
};
