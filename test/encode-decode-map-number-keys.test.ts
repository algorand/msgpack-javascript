/* eslint-disable @typescript-eslint/naming-convention */
import { deepStrictEqual, equal } from "assert";
import { encode } from "../src/encode";
import { decode } from "../src/decode";

const exampleMap = {
  1: "1",
  "102": "102",
  a: "a",
  20: "20",
} as Record<number | string, string>;

function getExpectedMsgPack(
  key1: Uint8Array,
  value1: Uint8Array,
  key2: Uint8Array,
  value2: Uint8Array,
  key3: Uint8Array,
  value3: Uint8Array,
  key4: Uint8Array,
  value4: Uint8Array,
) {
  return new Uint8Array([
    // fixmap of length 4: https://github.com/msgpack/msgpack/blob/master/spec.md#map-format-family
    0b10000100,
    ...key1,
    ...value1,
    ...key2,
    ...value2,
    ...key3,
    ...value3,
    ...key4,
    ...value4,
  ]);
}

describe("map-with-number-keys", () => {
  it(`encodes numeric keys as numbers when forced`, () => {
    const expected = getExpectedMsgPack(
      // This is the order Object.keys returns
      encode(1),
      encode("1"),
      encode(20),
      encode("20"),
      encode(102),
      encode("102"),
      encode("a"),
      encode("a"),
    );

    const encoded = encode(exampleMap, { forceNumericMapKeys: true });

    equal(Buffer.from(encoded).toString("hex"), Buffer.from(expected).toString("hex"));
    deepStrictEqual(decode(encoded), exampleMap);
  });

  it(`encodes numeric keys as strings when not forced`, () => {
    const expected = getExpectedMsgPack(
      // This is the order Object.keys returns
      encode("1"),
      encode("1"),
      encode("20"),
      encode("20"),
      encode("102"),
      encode("102"),
      encode("a"),
      encode("a"),
    );

    const encoded = encode(exampleMap);

    equal(Buffer.from(encoded).toString("hex"), Buffer.from(expected).toString("hex"));
    deepStrictEqual(decode(encoded), exampleMap);
  });

  it(`encodes numeric keys as strings with sorting`, () => {
    const expected = getExpectedMsgPack(
      encode("1"),
      encode("1"),
      encode("102"),
      encode("102"),
      encode("20"),
      encode("20"),
      encode("a"),
      encode("a"),
    );

    const encoded = encode(exampleMap, { sortKeys: true });

    equal(Buffer.from(encoded).toString("hex"), Buffer.from(expected).toString("hex"));
    deepStrictEqual(decode(encoded), exampleMap);
  });

  it(`encodes numeric keys as numbers with sorting`, () => {
    const expected = getExpectedMsgPack(
      encode(1),
      encode("1"),
      encode(20),
      encode("20"),
      encode(102),
      encode("102"),
      encode("a"),
      encode("a"),
    );

    const encoded = encode(exampleMap, { sortKeys: true, forceNumericMapKeys: true });

    equal(Buffer.from(encoded).toString("hex"), Buffer.from(expected).toString("hex"));
    deepStrictEqual(decode(encoded), exampleMap);
  });
});
