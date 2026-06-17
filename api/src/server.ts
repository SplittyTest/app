import 'dotenv/config';
import config from 'config';
import DB from '@lib/DB';
import log from '@lib/Logger';
import dayjs from '@lib/dayjs';
import { createApp } from './app';

(async function (): Promise<void> {
	// Initialize the DB library
	await DB.Dict.connect();

	const app = await createApp(config.get('session.key'));

	// Gracefully handle shutdowns
	let shutting_down = false;
	const gracefulShutdown = async (err: Error) => {
		if (!shutting_down) {
			shutting_down = true;
			log.fatal('Initiating graceful shutdown...');
			log.fatal(err);
		}

		// Wait and close
		setTimeout(() => {
			process.exit(1);
		}, config.get('api.shutdown_grace_period'));
	};
	process.on('SIGTERM', gracefulShutdown).on('SIGINT', gracefulShutdown).on('uncaughtException', gracefulShutdown);

	// Start the server
	const api_port = config.get('api.port') as number;
	log.info(`SplittyTest API started at ${dayjs().format('ddd, MMM d, YYYY (h:mm:ssA z)')} on ${api_port}`);
	app.listen(api_port);
})();
