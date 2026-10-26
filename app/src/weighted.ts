// Picks an index with probability proportional to its weight.
export function weightedIndex(weights: number[]): number {
	let r = Math.random() * weights.reduce((a, b) => a + b, 0);
	for (let i = 0; i < weights.length; i++) {
		r -= weights[i];
		if (r < 0) return i;
	}
	return weights.length - 1;
}
