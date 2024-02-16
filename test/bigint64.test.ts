import assert from "assert";
import { encode, decode, IntMode, ExtensionCodec, DecodeError } from "../src";
import { getInt64, getUint64 } from "../src/utils/int";

describe("useBigInt64: true", () => {
  before(function () {
    if (typeof BigInt === "undefined") {
      this.skip();
    }
  });

  it("encodes and decodes 0n", () => {
    const value = BigInt(0);
    const encoded = encode(value, { forceBigIntToInt64: true });
    assert.deepStrictEqual(decode(encoded, { useBigInt64: true }), value);
  });

  it("encodes and decodes MAX_SAFE_INTEGER+1", () => {
    const value = BigInt(Number.MAX_SAFE_INTEGER) + BigInt(1);
    const encoded = encode(value, { forceBigIntToInt64: true });
    assert.deepStrictEqual(decode(encoded, { useBigInt64: true }), value);
  });

  it("encodes and decodes MIN_SAFE_INTEGER-1", () => {
    const value = BigInt(Number.MIN_SAFE_INTEGER) - BigInt(1);
    const encoded = encode(value, { forceBigIntToInt64: true });
    assert.deepStrictEqual(decode(encoded, { useBigInt64: true }), value);
  });

  it("encodes and decodes values with numbers and bigints - MIXED", () => {
    const value = {
      ints: [0, Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER],
      nums: [Number.NaN, Math.PI, Math.E, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY],
      bigints: [BigInt(Number.MAX_SAFE_INTEGER) + BigInt(1), BigInt(Number.MIN_SAFE_INTEGER) - BigInt(1)],
    };
    const encoded = encode(value, { forceBigIntToInt64: true });
    const decoded = decode(encoded, { intMode: IntMode.MIXED });
    assert.deepStrictEqual(decoded, value);
  });

  it("encodes and decodes values with numbers and bigints - AS_ENCODED", () => {
    const value = {
      ints: [0, Math.pow(2, 32) - 1, -1 * Math.pow(2, 31)],
      nums: [Number.NaN, Math.PI, Math.E, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY],
      bigints: [BigInt(0), BigInt(Number.MAX_SAFE_INTEGER) + BigInt(1), BigInt(Number.MIN_SAFE_INTEGER) - BigInt(1)],
    };
    const encoded = encode(value, { forceBigIntToInt64: true });
    const decoded = decode(encoded, { intMode: IntMode.AS_ENCODED });
    assert.deepStrictEqual(decoded, value);
  });
});
