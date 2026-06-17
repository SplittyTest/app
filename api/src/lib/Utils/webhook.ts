import { EE } from '@lib/EE';

export async function sendWebhook(event: string, data: any) {
	// Defer the execution to the event emitter to ensure the main thread is not blocked
	EE.emit('webhook', { event, data });
}
