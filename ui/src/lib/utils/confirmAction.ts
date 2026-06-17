import { useConfirm } from 'primevue/useconfirm';

const confirm = useConfirm();

interface ConfirmEventOptions {
	message?: string;
	icon?: string;
	cancel_label?: string;
	confirm_label?: string;
	caution?: boolean;
	confirmCallback: () => void | Promise<void>;
	cancelCallback: () => void | Promise<void>;
}

export const confirmAction = (event: Event, options: ConfirmEventOptions) => {
	confirm.require({
		target: event.currentTarget as HTMLElement,
		message: options.message || 'Are you sure?',
		icon: `pi pi-${options.icon || 'question-circle'}`,
		rejectProps: {
			label: options.cancel_label || 'Cancel',
			severity: 'secondary',
			outlined: true,
		},
		acceptProps: {
			label: options.confirm_label || 'Confirm',
			severity: options.caution ? 'danger' : 'success',
		},
		accept: options.confirmCallback,
		reject: options.cancelCallback,
	});
};
