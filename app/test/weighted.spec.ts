import { afterEach, describe, it, expect, vi } from "vitest";
import { weightedIndex } from "../src/weighted";

const stubRandom = (value: number) => vi.spyOn(Math, "random").mockReturnValue(value);

describe("weightedIndex", () => {
	afterEach(() => vi.restoreAllMocks());

	it("respects the boundary between weights", () => {
		stubRandom(0);
		expect(weightedIndex([70, 30])).toBe(0);
		stubRandom(0.69);
		expect(weightedIndex([70, 30])).toBe(0);
		stubRandom(0.7);
		expect(weightedIndex([70, 30])).toBe(1);
	});

	it("returns the last index at the top of the range", () => {
		stubRandom(0.9999999);
		expect(weightedIndex([70, 30])).toBe(1);
	});

	it("never picks a zero-weight entry", () => {
		stubRandom(0);
		expect(weightedIndex([0, 1])).toBe(1);
	});

	it("handles a single element", () => {
		stubRandom(0.5);
		expect(weightedIndex([5])).toBe(0);
	});

	it("selects the correct bucket with three weights", () => {
		const cases: [number, number][] = [
			[0, 0],
			[0.16, 0],
			[0.17, 1],
			[0.49, 1],
			[0.5, 2],
			[0.99, 2],
		];
		for (const [random, expected] of cases) {
			stubRandom(random);
			expect(weightedIndex([1, 2, 3])).toBe(expected);
		}
	});

	it("skips a zero weight in the middle", () => {
		stubRandom(0.5);
		expect(weightedIndex([1, 0, 1])).toBe(2);
		stubRandom(0.49);
		expect(weightedIndex([1, 0, 1])).toBe(0);
	});

	it("works with weights that don't sum to 100", () => {
		stubRandom(0.5);
		expect(weightedIndex([1, 1])).toBe(1);
		stubRandom(0.49);
		expect(weightedIndex([1, 1])).toBe(0);
	});
});
