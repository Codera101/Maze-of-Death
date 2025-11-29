/** @format */

const {
	Directions,
	getNextPosition,
	isValidDirection,
} = require("../src/models/Direction");

describe("Direction", () => {
	describe("Directions enum", () => {
		test("should have all four cardinal directions defined", () => {
			expect(Directions.U).toBe("U");
			expect(Directions.D).toBe("D");
			expect(Directions.L).toBe("L");
			expect(Directions.R).toBe("R");
		});

		test("should be frozen and immutable", () => {
			expect(Object.isFrozen(Directions)).toBe(true);

			// Attempting to modify should not change the object (silent failure in non-strict mode)
			const originalValue = Directions.U;
			Directions.U = "modified";
			expect(Directions.U).toBe(originalValue);
		});

		test("should not allow adding new properties", () => {
			// In non-strict mode, adding properties to frozen object fails silently
			Directions.NewDirection = "N";
			expect(Directions.NewDirection).toBeUndefined();
		});

		test("should have exactly 4 directions", () => {
			const keys = Object.keys(Directions);
			expect(keys.length).toBe(4);
		});
	});

	describe("multiple moves", () => {
		test("should handle consecutive moves in same direction", () => {
			let position = { x: 0, y: 0 };

			position = getNextPosition(position, Directions.R);
			expect(position).toEqual({ x: 1, y: 0 });

			position = getNextPosition(position, Directions.R);
			expect(position).toEqual({ x: 2, y: 0 });

			position = getNextPosition(position, Directions.R);
			expect(position).toEqual({ x: 3, y: 0 });
		});

		test("should handle moves in different directions", () => {
			let position = { x: 5, y: 5 };

			position = getNextPosition(position, Directions.U);
			expect(position).toEqual({ x: 5, y: 4 });

			position = getNextPosition(position, Directions.R);
			expect(position).toEqual({ x: 6, y: 4 });

			position = getNextPosition(position, Directions.D);
			expect(position).toEqual({ x: 6, y: 5 });

			position = getNextPosition(position, Directions.L);
			expect(position).toEqual({ x: 5, y: 5 });
		});

		test("should return to origin after circular movement", () => {
			let position = { x: 10, y: 10 };
			const original = { ...position };

			position = getNextPosition(position, Directions.U);
			position = getNextPosition(position, Directions.R);
			position = getNextPosition(position, Directions.D);
			position = getNextPosition(position, Directions.L);

			expect(position).toEqual(original);
		});

		describe("edge cases", () => {
			test("should not mutate the original position object", () => {
				const current = { x: 5, y: 5 };
				const originalX = current.x;
				const originalY = current.y;

				getNextPosition(current, Directions.U);

				expect(current.x).toBe(originalX);
				expect(current.y).toBe(originalY);
			});

			test("should work with large coordinate values", () => {
				const current = { x: 1000, y: 1000 };
				const next = getNextPosition(current, Directions.R);

				expect(next).toEqual({ x: 1001, y: 1000 });
			});
		});

		describe("invalid direction handling", () => {
			test("should throw error for invalid direction string", () => {
				const current = { x: 5, y: 5 };

				expect(() => {
					getNextPosition(current, "INVALID");
				}).toThrow("Invalid direction: INVALID");
			});
		});
	});

	describe("isValidDirection", () => {
		test("should return true for valid Up direction", () => {
			expect(isValidDirection("U")).toBe(true);
			expect(isValidDirection("D")).toBe(true);
			expect(isValidDirection("L")).toBe(true);
			expect(isValidDirection("R")).toBe(true);
		});

		test("should return false for lowercase valid directions", () => {
			expect(isValidDirection("u")).toBe(false);
			expect(isValidDirection("d")).toBe(false);
			expect(isValidDirection("l")).toBe(false);
			expect(isValidDirection("r")).toBe(false);
		});

		test("should return false for invalid string", () => {
			expect(isValidDirection("INVALID")).toBe(false);
			expect(isValidDirection("X")).toBe(false);
			expect(isValidDirection("N")).toBe(false);
		});
		test("should return false for empty string", () => {
			expect(isValidDirection("")).toBe(false);
		});
	});
});
