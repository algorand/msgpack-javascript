/**
 * From: https://github.com/kawanet/msgpack-test-js/blob/master/lib/type.js
 */

import Int64 from "msg-int64";
import { MsgTimestamp } from "msg-timestamp";
import { MsgExt } from "msg-ext";

export type TypeKey =
  | "array"
  | "bignum"
  | "binary"
  | "bool"
  | "ext"
  | "map"
  | "nil"
  | "number"
  | "string"
  | "timestamp";

function parseBignum(str: string) {
  let value = str;
  const orig = (value += "");
  const parser = value.startsWith("-") ? Int64.MsgInt64 : Int64.MsgUInt64;
  value = value.replace(/0x/, "");
  const radix = value !== orig ? 16 : 10;
  return new parser(value, radix);
}

function parseBinary(str: string) {
  const array = str ? str.split(/[^0-9a-fA-F]+/g).map(parseHex) : [];
  return Buffer.from ? Buffer.from(array) : new Buffer(array);
}

function parseExt(array: any) {
  const type = array[0];
  const buffer = parseBinary(array[1]);
  return new MsgExt(buffer, type);
}

function parseHex(str: string) {
  return parseInt(str, 16) || 0;
}

function parseTimestamp(array: any) {
  return MsgTimestamp.from(array[0], array[1]);
}

function compareBinary(a: any, b: any) {
  if (!a) {
    return false;
  }
  if (!b) {
    return false;
  }

  const aLen = a.length;
  const bLen = b.length;
  if (aLen !== bLen) {
    return false;
  }

  return [].every.call(a, function (value, idx) {
    return value === b[idx];
  });
}

function compareExt(a: any, b: any) {
  if (!a) {
    return false;
  }
  if (!b) {
    return false;
  }

  return a.type === b.type && compareBinary(a.buffer, b.buffer);
}

function compareString(a: any, b: any) {
  return "" + a === "" + b;
}

function compareNumber(a: any, b: any) {
  return +a === +b;
}

function compareStrict(a: any, b: any) {
  return a === b;
}

function compareDeep(a: any, b: any) {
  return (
    JSON.stringify(a, ((_obj: any, _key: string, value: any) =>
      typeof value === "bigint" ? `BIGINT:${value}` : value) as (this: any, key: string, value: any) => any) ===
    JSON.stringify(b, ((_obj: any, _key: string, value: any) =>
      typeof value === "bigint" ? `BIGINT:${value}` : value) as (this: any, key: string, value: any) => any)
  );
}

function compareMap(a: any, b: any) {
  if (!a) {
    return false;
  }
  if (!b) {
    return false;
  }

  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) {
    return false;
  }

  return [].every.call(aKeys, function (key) {
    return key in b && compareDeep(a[key], b[key]);
  });
}

export class Type {
  static types: Record<TypeKey, Type> = {
    array: new Type("array", compareDeep),
    bignum: new Type("bignum", compareString, parseBignum),
    binary: new Type("binary", compareBinary, parseBinary),
    bool: new Type("bool"),
    ext: new Type("ext", compareExt, parseExt),
    map: new Type("map", compareMap),
    nil: new Type("nil"),
    number: new Type("number", compareNumber),
    string: new Type("string", compareString),
    timestamp: new Type("timestamp", compareString, parseTimestamp),
  };

  name: TypeKey;
  comparer?: (a: any, b: any) => boolean;
  parser?: (value: any) => any;

  constructor(name: TypeKey, comparer?: (a: any, b: any) => boolean, parser?: (value: any) => any) {
    this.name = name;
    this.comparer = comparer;
    this.parser = parser;
  }

  static getType(type: TypeKey): Type {
    return Type.types[type];
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  compare(a: any, b: any): boolean {
    return this.comparer?.(a, b) ?? compareStrict(a, b);
  }

  parse(value: any): any {
    return this.parser ? this.parser(value) : value;
  }

  toString(): string {
    return this.name;
  }
}
