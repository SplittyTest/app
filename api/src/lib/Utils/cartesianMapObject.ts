// Creates an collection with all possible unique combinations of the values in the input object
export default function cartesianMapObject(obj: Record<string, any[]>): Record<string, any>[] {
	// 1. Get key-value pairs from the object
	const entries = Object.entries(obj);

	// 2. Reduce the entries into a single array of combined objects
	return entries.reduce(
		(acc, [key, values]) => {
			// Force value to be an array if it's a primitive
			const valueArray = Array.isArray(values) ? values : [values];

			// Map and flatten existing combinations with the new values
			return acc.flatMap((accumulatedObj) =>
				valueArray.map((value) => ({
					...accumulatedObj,
					[key]: value,
				})),
			);
		},
		[{}], // Start with an array containing an empty object
	);
}
