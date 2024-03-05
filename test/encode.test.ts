import assert from "assert";
import { encode, decode } from "@msgpack/msgpack";

describe("encode", () => {
  context("sortKeys", () => {
    it("cannonicalizes encoded binaries", () => {
      assert.deepStrictEqual(encode({ a: 1, b: 2 }, { sortKeys: true }), encode({ b: 2, a: 1 }, { sortKeys: true }));
    });
  });

  context("forceFloat32", () => {
    it("encodes numbers in float64 without forceFloat32", () => {
      assert.deepStrictEqual(encode(3.14), Uint8Array.from([0xcb, 0x40, 0x9, 0x1e, 0xb8, 0x51, 0xeb, 0x85, 0x1f]));
    });

    it("encodes numbers in float32 when forceFloat32=true", () => {
      assert.deepStrictEqual(encode(3.14, { forceFloat32: true }), Uint8Array.from([0xca, 0x40, 0x48, 0xf5, 0xc3]));
    });

    it("encodes numbers in float64 with forceFloat32=false", () => {
      assert.deepStrictEqual(
        encode(3.14, { forceFloat32: false }),
        Uint8Array.from([0xcb, 0x40, 0x9, 0x1e, 0xb8, 0x51, 0xeb, 0x85, 0x1f]),
      );
    });
  });

  context("forceFloat", () => {
    it("encodes integers as integers without forceIntegerToFloat", () => {
      assert.deepStrictEqual(encode(3), Uint8Array.from([0x3]));

      if (typeof BigInt !== "undefined") {
        assert.deepStrictEqual(encode(BigInt(3)), Uint8Array.from([0x3]));
      }
    });

    it("encodes integers as floating point when forceIntegerToFloat=true", () => {
      assert.deepStrictEqual(
        encode(3, { forceIntegerToFloat: true }),
        Uint8Array.from([0xcb, 0x40, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
      );

      if (typeof BigInt !== "undefined") {
        assert.deepStrictEqual(
          encode(BigInt(3), { forceIntegerToFloat: true }),
          Uint8Array.from([0xcb, 0x40, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
        );
      }
    });

    it("encodes integers as float32 when forceIntegerToFloat=true and forceFloat32=true", () => {
      assert.deepStrictEqual(
        encode(3, { forceIntegerToFloat: true, forceFloat32: true }),
        Uint8Array.from([0xca, 0x40, 0x40, 0x00, 0x00]),
      );

      if (typeof BigInt !== "undefined") {
        assert.deepStrictEqual(
          encode(BigInt(3), { forceIntegerToFloat: true, forceFloat32: true }),
          Uint8Array.from([0xca, 0x40, 0x40, 0x00, 0x00]),
        );
      }
    });

    it("encodes integers as integers when forceIntegerToFloat=false", () => {
      assert.deepStrictEqual(encode(3, { forceIntegerToFloat: false }), Uint8Array.from([0x3]));

      if (typeof BigInt !== "undefined") {
        assert.deepStrictEqual(encode(BigInt(3), { forceIntegerToFloat: false }), Uint8Array.from([0x3]));
      }
    });
  });

  context("ignoreUndefined", () => {
    it("encodes { foo: undefined } as is by default", () => {
      assert.deepStrictEqual(decode(encode({ foo: undefined, bar: 42 })), { foo: null, bar: 42 });
    });

    it("encodes { foo: undefined } as is with `ignoreUndefined: false`", () => {
      assert.deepStrictEqual(decode(encode({ foo: undefined, bar: 42 }, { ignoreUndefined: false })), {
        foo: null,
        bar: 42,
      });
    });

    it("encodes { foo: undefined } to {} with `ignoreUndefined: true`", () => {
      assert.deepStrictEqual(decode(encode({ foo: undefined, bar: 42 }, { ignoreUndefined: true })), { bar: 42 });
    });
  });

  context("ArrayBuffer as buffer", () => {
    const buffer = encode([1, 2, 3]);
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteLength);
    assert.deepStrictEqual(decode(arrayBuffer), decode(buffer));
  });

  context("forceBigIntToInt64", () => {
    if (typeof BigInt !== "undefined") {
      it("encodes bigints as integers without forceBigIntToInt64", () => {
        let input = BigInt(3);
        let expected = Uint8Array.from([0x03]);
        assert.deepStrictEqual(encode(input), expected);

        input = BigInt(-10);
        expected = Uint8Array.from([0xf6]);
        assert.deepStrictEqual(encode(input), expected);

        input = BigInt("0xffffffffffffffff");
        expected = Uint8Array.from([0xcf, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff]);
        assert.deepStrictEqual(encode(input), expected);
      });

      it("encodes bigints as int64 when forceBigIntToInt64=true", () => {
        let input = BigInt(3);
        let expected = Uint8Array.from([0xcf, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x03]);
        assert.deepStrictEqual(encode(input, { forceBigIntToInt64: true }), expected);

        input = BigInt(-10);
        expected = Uint8Array.from([0xd3, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xf6]);
        assert.deepStrictEqual(encode(input, { forceBigIntToInt64: true }), expected);

        input = BigInt("0xffffffffffffffff");
        expected = Uint8Array.from([0xcf, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff]);
        assert.deepStrictEqual(encode(input), expected);
      });
    }
  });

  context("Bigint that exceeds 64 bits", () => {
    if (typeof BigInt !== "undefined") {
      const MAX_UINT64_PLUS_ONE = BigInt("0x10000000000000000");
      assert.throws(() => encode(MAX_UINT64_PLUS_ONE), /Bigint is too large for uint64: 18446744073709551616$/);

      const MIN_INT64_MINUS_ONE = BigInt(-1) * BigInt("0x8000000000000001");
      assert.throws(() => encode(MIN_INT64_MINUS_ONE), /Bigint is too small for int64: -9223372036854775809$/);
    }
  });

  context("Map", () => {
    it("encodes string keys", () => {
      const m = new Map<string, number>([
        ["a", 1],
        ["b", 2],
      ]);
      const encoded = encode(m);
      const expected = Uint8Array.from([130, 161, 97, 1, 161, 98, 2]);
      assert.deepStrictEqual(encoded, expected);
    });

    it("encodes number keys", () => {
      const m = new Map<number, number>([
        [-9, 1],
        [1, 2],
        [2, 3],
      ]);
      const encoded = encode(m);
      const expected = Uint8Array.from([131, 247, 1, 1, 2, 2, 3]);
      assert.deepStrictEqual(encoded, expected);
    });

    it("encodes bigint keys", () => {
      const m = new Map<bigint, number>([
        [BigInt(-9), 1],
        [BigInt(1), 2],
        [BigInt(2), 3],
      ]);
      const encoded = encode(m);
      const expected = Uint8Array.from([131, 247, 1, 1, 2, 2, 3]);
      assert.deepStrictEqual(encoded, expected);
    });

    it("encodes binary keys", () => {
      const m = new Map<ArrayBufferLike, number>([
        [Uint8Array.from([]), 1],
        [Uint8Array.from([1, 2, 3, 4]), 2],
        [Int32Array.from([-1, 0, 1234]), 3],
      ]);
      const encoded = encode(m);
      const expected = Uint8Array.from([
        131, 196, 0, 1, 196, 4, 1, 2, 3, 4, 2, 196, 12, 255, 255, 255, 255, 0, 0, 0, 0, 210, 4, 0, 0, 3,
      ]);
      assert.deepStrictEqual(encoded, expected);
    });

    it("errors on unsupported key types", () => {
      assert.throws(() => {
        encode(new Map([[null, 1]]));
      }, new Error("Unsupported map key type: [object Null]"));
      assert.throws(() => {
        encode(new Map([[undefined, 1]]));
      }, new Error("Unsupported map key type: [object Undefined]"));
      assert.throws(() => {
        encode(new Map([[true, 1]]));
      }, new Error("Unsupported map key type: [object Boolean]"));
      assert.throws(() => {
        encode(new Map([[false, 1]]));
      }, new Error("Unsupported map key type: [object Boolean]"));
      assert.throws(() => {
        encode(new Map([[{}, 1]]));
      }, new Error("Unsupported map key type: [object Object]"));
      assert.throws(() => {
        encode(new Map([[[], 1]]));
      }, new Error("Unsupported map key type: [object Array]"));
    });

    context("sortKeys", () => {
      it("cannonicalizes encoded string keys", () => {
        const m1 = new Map<string, number>([
          ["a", 1],
          ["b", 2],
        ]);
        const m1Encoded = encode(m1, { sortKeys: true });
        const m2 = new Map<string, number>([
          ["b", 2],
          ["a", 1],
        ]);
        const m2Encoded = encode(m2, { sortKeys: true });
        assert.deepStrictEqual(m1Encoded, m2Encoded);

        const expected = Uint8Array.from([130, 161, 97, 1, 161, 98, 2]);
        assert.deepStrictEqual(m1Encoded, expected);
      });

      it("cannonicalizes encoded number keys", () => {
        const m1 = new Map<number, number>([
          [Number.NEGATIVE_INFINITY, 0],
          [-10, 1],
          [0, 2],
          [0.5, 3],
          [100, 4],
          [Number.POSITIVE_INFINITY, 5],
        ]);
        const m1Encoded = encode(m1, { sortKeys: true });
        const m2 = new Map<number, number>([
          [0.5, 3],
          [100, 4],
          [Number.POSITIVE_INFINITY, 5],
          [0, 2],
          [-10, 1],
          [Number.NEGATIVE_INFINITY, 0],
        ]);
        const m2Encoded = encode(m2, { sortKeys: true });
        assert.deepStrictEqual(m1Encoded, m2Encoded);
        const expected = Uint8Array.from([
          134, 203, 255, 240, 0, 0, 0, 0, 0, 0, 0, 246, 1, 0, 2, 203, 63, 224, 0, 0, 0, 0, 0, 0, 3, 100, 4, 203, 127,
          240, 0, 0, 0, 0, 0, 0, 5,
        ]);
        assert.deepStrictEqual(m1Encoded, expected);
      });

      it("errors in the presence of NaN", () => {
        const m = new Map<number, number>([
          [NaN, 1],
          [0, 2],
        ]);

        assert.throws(() => {
          encode(m, { sortKeys: true });
        }, new Error("Cannot sort map keys with NaN value"));
      });

      it("cannonicalizes encoded bigint keys", () => {
        const m1 = new Map<bigint, number>([
          [BigInt(-10), 1],
          [BigInt(0), 2],
          [BigInt(100), 3],
        ]);
        const m1Encoded = encode(m1, { sortKeys: true });
        const m2 = new Map<bigint, number>([
          [BigInt(100), 3],
          [BigInt(0), 2],
          [BigInt(-10), 1],
        ]);
        const m2Encoded = encode(m2, { sortKeys: true });
        assert.deepStrictEqual(m1Encoded, m2Encoded);

        const expected = Uint8Array.from([131, 246, 1, 0, 2, 100, 3]);
        assert.deepStrictEqual(m1Encoded, expected);
      });

      it("cannonicalizes encoded number and bigint keys", () => {
        const m1 = new Map<number | bigint, number>([
          [Number.NEGATIVE_INFINITY, 0],
          [BigInt(-10), 1],
          [-9, 2],
          [BigInt(0), 3],
          [0.5, 4],
          [BigInt(100), 5],
          [BigInt("0xffffffffffffffff"), 6],
          [Number.POSITIVE_INFINITY, 7],
        ]);
        const m1Encoded = encode(m1, { sortKeys: true });
        const m2 = new Map<number | bigint, number>([
          [0.5, 4],
          [BigInt(100), 5],
          [-9, 2],
          [Number.NEGATIVE_INFINITY, 0],
          [BigInt(0), 3],
          [Number.POSITIVE_INFINITY, 7],
          [BigInt("0xffffffffffffffff"), 6],
          [BigInt(-10), 1],
        ]);
        const m2Encoded = encode(m2, { sortKeys: true });
        assert.deepStrictEqual(m1Encoded, m2Encoded);

        const expected = Uint8Array.from([
          136, 203, 255, 240, 0, 0, 0, 0, 0, 0, 0, 246, 1, 247, 2, 0, 3, 203, 63, 224, 0, 0, 0, 0, 0, 0, 4, 100, 5, 207,
          255, 255, 255, 255, 255, 255, 255, 255, 6, 203, 127, 240, 0, 0, 0, 0, 0, 0, 7,
        ]);
        assert.deepStrictEqual(m1Encoded, expected);
      });

      it("cannonicalizes encoded binary keys", () => {
        const m1 = new Map<Uint8Array, number>([
          [Uint8Array.from([1]), 1],
          [Uint8Array.from([2]), 2],
        ]);
        const m1Encoded = encode(m1, { sortKeys: true });
        const m2 = new Map<Uint8Array, number>([
          [Uint8Array.from([2]), 2],
          [Uint8Array.from([1]), 1],
        ]);
        const m2Encoded = encode(m2, { sortKeys: true });
        assert.deepStrictEqual(m1Encoded, m2Encoded);

        const expected = Uint8Array.from([130, 196, 1, 1, 1, 196, 1, 2, 2]);
        assert.deepStrictEqual(m1Encoded, expected);
      });

      it("cannonicalizes encoded mixed keys", () => {
        const m1 = new Map<number | string | Uint8Array, number>([
          [1, 1],
          [2, 2],
          ["a", 3],
          ["b", 4],
          [Uint8Array.from([1]), 5],
          [Uint8Array.from([2]), 6],
        ]);
        const m1Encoded = encode(m1, { sortKeys: true });
        const m2 = new Map<number | string | Uint8Array, number>([
          ["b", 4],
          [Uint8Array.from([2]), 6],
          ["a", 3],
          [1, 1],
          [Uint8Array.from([1]), 5],
          [2, 2],
        ]);
        const m2Encoded = encode(m2, { sortKeys: true });
        assert.deepStrictEqual(m1Encoded, m2Encoded);

        const expected = Uint8Array.from([134, 1, 1, 2, 2, 161, 97, 3, 161, 98, 4, 196, 1, 1, 5, 196, 1, 2, 6]);
        assert.deepStrictEqual(m1Encoded, expected);
      });
    });
  });
});
