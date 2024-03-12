import assert from "assert";
import { encode, decode, DecoderOptions, IntMode } from "../src";

describe("decode with useMap specified", () => {
  const options = { useMap: true } satisfies DecoderOptions;

  it("decodes as Map with string keys", () => {
    let actual = decode(encode({}), options);
    let expected: Map<unknown, unknown> = new Map();
    assert.deepStrictEqual(actual, expected);

    actual = decode(encode({ a: 1 }), options);
    expected = new Map([["a", 1]]);
    assert.deepStrictEqual(actual, expected);

    actual = decode(encode({ a: 1, b: { c: true } }), options);
    expected = new Map<unknown, unknown>([
      ["a", 1],
      ["b", new Map([["c", true]])],
    ]);
    assert.deepStrictEqual(actual, expected);
  });

  it("decodes as Map with binary keys", () => {
    const input = new Map<Uint8Array, number>([
      [Uint8Array.from([]), 0],
      [Uint8Array.from([0, 1, 2, 3]), 1],
      [Uint8Array.from([4, 5, 6, 7]), 2],
    ]);
    const actual = decode(encode(input), options);
    assert.deepStrictEqual(actual, input);
  });

  it("decodes as Map with numeric keys", () => {
    const input = new Map<number, number>([
      [Number.NEGATIVE_INFINITY, 0],
      [Number.MIN_SAFE_INTEGER, 1],
      [-100, 2],
      [-0.5, 3],
      [0, 4],
      [1, 5],
      [2, 6],
      [11.11, 7],
      [Number.MAX_SAFE_INTEGER, 8],
      [Number.POSITIVE_INFINITY, 9],
      [NaN, 10],
    ]);
    const actual = decode(encode(input), options);
    assert.deepStrictEqual(actual, input);
  });

  context("Numeric map keys with IntMode", () => {
    const input = encode(
      new Map<number | bigint, number>([
        [Number.NEGATIVE_INFINITY, 0],
        [BigInt(Number.MIN_SAFE_INTEGER) - BigInt(1), 1],
        [Number.MIN_SAFE_INTEGER, 2],
        [-100, 3],
        [-0.5, 4],
        [0, 5],
        [1, 6],
        [2, 7],
        [11.11, 8],
        [Number.MAX_SAFE_INTEGER, 9],
        [BigInt(Number.MAX_SAFE_INTEGER) + BigInt(1), 10],
        [Number.POSITIVE_INFINITY, 11],
        [NaN, 12],
      ]),
    );

    it("decodes with IntMode.SAFE_NUMBER", () => {
      assert.throws(
        () => decode(input, { ...options, intMode: IntMode.SAFE_NUMBER }),
        /Mode is IntMode\.SAFE_NUMBER and value is not a safe integer/,
      );
    });

    it("decodes with IntMode.UNSAFE_NUMBER", () => {
      const actual = decode(input, { ...options, intMode: IntMode.UNSAFE_NUMBER });
      // Omit integers that exceed the safe range
      const expectedSubset = new Map<number, number>([
        [Number.NEGATIVE_INFINITY, 0],
        [Number.MIN_SAFE_INTEGER, 2],
        [-100, 3],
        [-0.5, 4],
        [0, 5],
        [1, 6],
        [2, 7],
        [11.11, 8],
        [Number.MAX_SAFE_INTEGER, 9],
        [Number.POSITIVE_INFINITY, 11],
        [NaN, 12],
      ]);
      assert.ok(actual instanceof Map);
      assert.strictEqual(actual.size, expectedSubset.size + 2);
      for (const [key, value] of expectedSubset) {
        assert.deepStrictEqual(actual.get(key), value);
      }
    });

    it("decodes with IntMode.MIXED", () => {
      const actual = decode(input, { ...options, intMode: IntMode.MIXED });
      const expected = new Map<number | bigint, number>([
        [Number.NEGATIVE_INFINITY, 0],
        [BigInt(Number.MIN_SAFE_INTEGER) - BigInt(1), 1],
        [Number.MIN_SAFE_INTEGER, 2],
        [-100, 3],
        [-0.5, 4],
        [0, 5],
        [1, 6],
        [2, 7],
        [11.11, 8],
        [Number.MAX_SAFE_INTEGER, 9],
        [BigInt(Number.MAX_SAFE_INTEGER) + BigInt(1), 10],
        [Number.POSITIVE_INFINITY, 11],
        [NaN, 12],
      ]);
      assert.deepStrictEqual(actual, expected);
    });

    it("decodes with IntMode.BIGINT", () => {
      const actual = decode(input, { ...options, intMode: IntMode.BIGINT });
      const expected = new Map<number | bigint, bigint>([
        [Number.NEGATIVE_INFINITY, BigInt(0)],
        [BigInt(Number.MIN_SAFE_INTEGER) - BigInt(1), BigInt(1)],
        [BigInt(Number.MIN_SAFE_INTEGER), BigInt(2)],
        [BigInt(-100), BigInt(3)],
        [-0.5, BigInt(4)],
        [BigInt(0), BigInt(5)],
        [BigInt(1), BigInt(6)],
        [BigInt(2), BigInt(7)],
        [11.11, BigInt(8)],
        [BigInt(Number.MAX_SAFE_INTEGER), BigInt(9)],
        [BigInt(Number.MAX_SAFE_INTEGER) + BigInt(1), BigInt(10)],
        [Number.POSITIVE_INFINITY, BigInt(11)],
        [NaN, BigInt(12)],
      ]);
      assert.deepStrictEqual(actual, expected);
    });

    it("decodes with IntMode.AS_ENCODED", () => {
      const actual = decode(input, { ...options, intMode: IntMode.AS_ENCODED });
      const expected = new Map<number | bigint, number>([
        [Number.NEGATIVE_INFINITY, 0],
        [BigInt(Number.MIN_SAFE_INTEGER) - BigInt(1), 1],
        [BigInt(Number.MIN_SAFE_INTEGER), 2],
        [-100, 3],
        [-0.5, 4],
        [0, 5],
        [1, 6],
        [2, 7],
        [11.11, 8],
        [BigInt(Number.MAX_SAFE_INTEGER), 9],
        [BigInt(Number.MAX_SAFE_INTEGER) + BigInt(1), 10],
        [Number.POSITIVE_INFINITY, 11],
        [NaN, 12],
      ]);
      assert.deepStrictEqual(actual, expected);
    });
  });
});
