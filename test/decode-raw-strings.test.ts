import assert from "assert";
import { encode, decode } from "../src";
import type { DecoderOptions } from "../src";

describe("decode with rawBinaryStringValues specified", () => {
  const options = { rawBinaryStringValues: true } satisfies DecoderOptions;

  it("decodes string values as binary", () => {
    const actual = decode(encode("foo"), options);
    const expected = Uint8Array.from([0x66, 0x6f, 0x6f]);
    assert.deepStrictEqual(actual, expected);
  });

  it("decodes invalid UTF-8 string values as binary", () => {
    const invalidUtf8String = Uint8Array.from([
      61, 180, 118, 220, 39, 166, 43, 68, 219, 116, 105, 84, 121, 46, 122, 136, 233, 221, 15, 174, 247, 19, 50, 176,
      184, 221, 66, 188, 171, 36, 135, 121,
    ]);
    const encoded = Uint8Array.from([
      196, 32, 61, 180, 118, 220, 39, 166, 43, 68, 219, 116, 105, 84, 121, 46, 122, 136, 233, 221, 15, 174, 247, 19, 50,
      176, 184, 221, 66, 188, 171, 36, 135, 121,
    ]);

    const actual = decode(encoded, options);
    assert.deepStrictEqual(actual, invalidUtf8String);
  });

  it("decodes map string keys as strings", () => {
    const actual = decode(encode({ key: "foo" }), options);
    const expected = { key: Uint8Array.from([0x66, 0x6f, 0x6f]) };
    assert.deepStrictEqual(actual, expected);
  });

  it("ignores maxStrLength", () => {
    const lengthLimitedOptions = { ...options, maxStrLength: 1 } satisfies DecoderOptions;

    const actual = decode(encode("foo"), lengthLimitedOptions);
    const expected = Uint8Array.from([0x66, 0x6f, 0x6f]);
    assert.deepStrictEqual(actual, expected);
  });

  it("respects maxBinLength", () => {
    const lengthLimitedOptions = { ...options, maxBinLength: 1 } satisfies DecoderOptions;

    assert.throws(() => {
      decode(encode("foo"), lengthLimitedOptions);
    }, /max length exceeded/i);
  });
});

describe("decode with rawBinaryStringKeys specified", () => {
  const options = { rawBinaryStringKeys: true, useMap: true } satisfies DecoderOptions;

  it("errors if useMap is not enabled", () => {
    assert.throws(() => {
      decode(encode({ key: "foo" }), { rawBinaryStringKeys: true });
    }, new Error("rawBinaryStringKeys is only supported when useMap is true"));
  });

  it("decodes map string keys as binary", () => {
    const actual = decode(encode({ key: "foo" }), options);
    const expected = new Map([[Uint8Array.from([0x6b, 0x65, 0x79]), "foo"]]);
    assert.deepStrictEqual(actual, expected);
  });

  it("decodes invalid UTF-8 string keys as binary", () => {
    const invalidUtf8String = Uint8Array.from([
      61, 180, 118, 220, 39, 166, 43, 68, 219, 116, 105, 84, 121, 46, 122, 136, 233, 221, 15, 174, 247, 19, 50, 176,
      184, 221, 66, 188, 171, 36, 135, 121,
    ]);
    const encodedMap = Uint8Array.from([
      129, 217, 32, 61, 180, 118, 220, 39, 166, 43, 68, 219, 116, 105, 84, 121, 46, 122, 136, 233, 221, 15, 174, 247,
      19, 50, 176, 184, 221, 66, 188, 171, 36, 135, 121, 163, 97, 98, 99,
    ]);
    const actual = decode(encodedMap, options);
    const expected = new Map([[invalidUtf8String, "abc"]]);
    assert.deepStrictEqual(actual, expected);
  });

  it("decodes string values as strings", () => {
    const actual = decode(encode("foo"), options);
    const expected = "foo";
    assert.deepStrictEqual(actual, expected);
  });

  it("ignores maxStrLength", () => {
    const lengthLimitedOptions = { ...options, maxStrLength: 1 } satisfies DecoderOptions;

    const actual = decode(encode({ foo: 1 }), lengthLimitedOptions);
    const expected = new Map([[Uint8Array.from([0x66, 0x6f, 0x6f]), 1]]);
    assert.deepStrictEqual(actual, expected);
  });

  it("respects maxBinLength", () => {
    const lengthLimitedOptions = { ...options, maxBinLength: 1 } satisfies DecoderOptions;

    assert.throws(() => {
      decode(encode({ foo: 1 }), lengthLimitedOptions);
    }, /max length exceeded/i);
  });
});

describe("decode with rawBinaryStringKeys and rawBinaryStringValues", () => {
  const options = { rawBinaryStringValues: true, rawBinaryStringKeys: true, useMap: true } satisfies DecoderOptions;

  it("errors if useMap is not enabled", () => {
    assert.throws(() => {
      decode(encode({ key: "foo" }), { rawBinaryStringKeys: true, rawBinaryStringValues: true });
    }, new Error("rawBinaryStringKeys is only supported when useMap is true"));
  });

  it("decodes map string keys and values as binary", () => {
    const actual = decode(encode({ key: "foo" }), options);
    const expected = new Map([[Uint8Array.from([0x6b, 0x65, 0x79]), Uint8Array.from([0x66, 0x6f, 0x6f])]]);
    assert.deepStrictEqual(actual, expected);
  });

  it("decodes invalid UTF-8 string keys and values as binary", () => {
    const invalidUtf8String = Uint8Array.from([
      61, 180, 118, 220, 39, 166, 43, 68, 219, 116, 105, 84, 121, 46, 122, 136, 233, 221, 15, 174, 247, 19, 50, 176,
      184, 221, 66, 188, 171, 36, 135, 121,
    ]);
    const encodedMap = Uint8Array.from([
      129, 217, 32, 61, 180, 118, 220, 39, 166, 43, 68, 219, 116, 105, 84, 121, 46, 122, 136, 233, 221, 15, 174, 247,
      19, 50, 176, 184, 221, 66, 188, 171, 36, 135, 121, 217, 32, 61, 180, 118, 220, 39, 166, 43, 68, 219, 116, 105, 84,
      121, 46, 122, 136, 233, 221, 15, 174, 247, 19, 50, 176, 184, 221, 66, 188, 171, 36, 135, 121,
    ]);
    const actual = decode(encodedMap, options);
    const expected = new Map([[invalidUtf8String, invalidUtf8String]]);
    assert.deepStrictEqual(actual, expected);
  });
});
