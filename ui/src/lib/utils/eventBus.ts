import mitt, { type EventType } from 'mitt';

export interface GlobalEvents extends Record<EventType, unknown> {}

export const emitter = mitt<GlobalEvents>();
export function useEventBus() {
	return emitter;
}
