import Logger, { createLogger } from 'bunyan';
import BunyanFormat from 'bunyan-format';
import config from 'config';

const c = config.get('log') as any;

const logger_config = {
	...c,
	stream: c.stream === 'short' ? BunyanFormat({ outputMode: 'short' }) : process.stdout,
}

const log = createLogger(logger_config);

export default log;
