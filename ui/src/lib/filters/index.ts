import { startCase } from 'lodash-es';
import dayjs from '@lib/dayjs';

function dateFormat(value: any, format = 'MMM D, YYYY') {
	if (dayjs(value).isValid()) {
		return dayjs(value).format(format);
	}
	return value;
}

function title(value: string) {
	return startCase(value);
}

export { dateFormat, startCase, title };
