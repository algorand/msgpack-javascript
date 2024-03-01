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
      [Number.MIN_SAFE_INTEGER, 1],
      [-100, 2],
      [-0.5, 3],
      [0, 4],
      [1, 5],
      [2, 6],
      [11.11, 7],
      [Number.MAX_SAFE_INTEGER, 8],
      [NaN, 9],
    ]);
    // TODO: test positive and negative infinity
    const actual = decode(encode(input), options);
    assert.deepStrictEqual(actual, input);
  });

  context("Numeric map keys with IntMode", () => {
    const input = encode(
      new Map<number | bigint, number>([
        [BigInt(Number.MIN_SAFE_INTEGER) - BigInt(1), 0],
        [Number.MIN_SAFE_INTEGER, 1],
        [-100, 2],
        [-0.5, 3],
        [0, 4],
        [1, 5],
        [2, 6],
        [11.11, 7],
        [Number.MAX_SAFE_INTEGER, 8],
        [BigInt(Number.MAX_SAFE_INTEGER) + BigInt(1), 9],
        [NaN, 10],
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
      const expectedSubset = new Map<number, number>([
        [Number.MIN_SAFE_INTEGER, 1],
        [-100, 2],
        [-0.5, 3],
        [0, 4],
        [1, 5],
        [2, 6],
        [11.11, 7],
        [Number.MAX_SAFE_INTEGER, 8],
        [NaN, 10],
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
        [BigInt(Number.MIN_SAFE_INTEGER) - BigInt(1), 0],
        [Number.MIN_SAFE_INTEGER, 1],
        [-100, 2],
        [-0.5, 3],
        [0, 4],
        [1, 5],
        [2, 6],
        [11.11, 7],
        [Number.MAX_SAFE_INTEGER, 8],
        [BigInt(Number.MAX_SAFE_INTEGER) + BigInt(1), 9],
        [NaN, 10],
      ]);
      assert.deepStrictEqual(actual, expected);
    });

    it("decodes with IntMode.BIGINT", () => {
      const actual = decode(input, { ...options, intMode: IntMode.BIGINT });
      const expected = new Map<number | bigint, bigint>([
        [BigInt(Number.MIN_SAFE_INTEGER) - BigInt(1), BigInt(0)],
        [BigInt(Number.MIN_SAFE_INTEGER), BigInt(1)],
        [BigInt(-100), BigInt(2)],
        [-0.5, BigInt(3)],
        [BigInt(0), BigInt(4)],
        [BigInt(1), BigInt(5)],
        [BigInt(2), BigInt(6)],
        [11.11, BigInt(7)],
        [BigInt(Number.MAX_SAFE_INTEGER), BigInt(8)],
        [BigInt(Number.MAX_SAFE_INTEGER) + BigInt(1), BigInt(9)],
        [NaN, BigInt(10)],
      ]);
      assert.deepStrictEqual(actual, expected);
    });

    it("decodes with IntMode.AS_ENCODED", () => {
      const actual = decode(input, { ...options, intMode: IntMode.AS_ENCODED });
      const expected = new Map<number | bigint, number>([
        [BigInt(Number.MIN_SAFE_INTEGER) - BigInt(1), 0],
        [BigInt(Number.MIN_SAFE_INTEGER), 1],
        [-100, 2],
        [-0.5, 3],
        [0, 4],
        [1, 5],
        [2, 6],
        [11.11, 7],
        [BigInt(Number.MAX_SAFE_INTEGER), 8],
        [BigInt(Number.MAX_SAFE_INTEGER) + BigInt(1), 9],
        [NaN, 10],
      ]);
      assert.deepStrictEqual(actual, expected);
    });
  });
});
