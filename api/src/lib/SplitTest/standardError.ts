// Get the standard error of an average
export function avg(standard_deviation: number, n: number) {
	return standard_deviation / Math.sqrt(n);
}

// Get the standard error of the median
export function median(standard_deviation: number, n: number) {
	return (standard_deviation / Math.sqrt(n)) * 1.2533;
}

// Get the standard error of a rate
export function rate(p: number, n: number) {
	return Math.sqrt((p * (1 - p)) / n);
}

// Get the standard error of a sum
export function sum(standard_deviation: number, n: number) {
	return (standard_deviation / Math.sqrt(n)) * n;
}
