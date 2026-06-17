import log from '@lib/Logger';
import { EventEmitter } from 'eventemitter3';

export interface Event {
	trigger: string;
	handler: (data?: any) => void | Promise<void>;
	not_deferred?: boolean;
}

class STEventEmitter<T extends Event> {
	EE: EventEmitter;

	constructor(events: T[]) {
		this.EE = new EventEmitter();

		// Instantiate each event from #lib/events
		this.registerEvents(events);
	}

	registerEvents(events: T[]) {
		events.forEach((event) => {
			log.trace('Registering event:', event.trigger);
			this.EE.on(event.trigger, (data?: unknown) => {
				if (event.not_deferred) {
					void event.handler(data);
				} else {
					setImmediate(() => {
						void event.handler(data);
					});
				}
			});
		});
	}

	emit(event_name: string, data?: unknown) {
		log.trace({ event_name, data }, 'Emitting event...');
		this.EE.emit(event_name, data);
	}
}

export default STEventEmitter;
