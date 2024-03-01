import { throws, deepStrictEqual } from "assert";
import { encode, decode, DecodeError } from "@msgpack/msgpack";

describe("prototype pollution", () => {
  context("__proto__ exists as a map key", () => {
    const o = {
      foo: "bar",
    };
    // override __proto__ as an enumerable property
    Object.defineProperty(o, "__proto__", {
      value: new Date(0),
      enumerable: true,
    });
    const encoded = encode(o);

    it("raises DecodeError in decoding", () => {
      throws(() => {
        decode(encoded);
      }, new DecodeError("The key __proto__ is not allowed"));
    });

    it("succeeds with useMap enabled", () => {
      const decoded = decode(encoded, { useMap: true });
      const expected = new Map<string, unknown>([
        ["foo", "bar"],
        ["__proto__", new Date(0)],
      ]);
      deepStrictEqual(decoded, expected);
    });
  });
});
