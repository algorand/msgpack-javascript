/**
 * From https://github.com/kawanet/msgpack-test-js/blob/master/lib/exam.js
 */

import { Type, TypeKey } from "./type";

export type Suite = Record<TypeKey, any> & { msgpack: Array<string> };

const binary = Type.getType("binary");

export class Exam {
  src: Suite;
  msgpack?: Array<Buffer>;

  constructor(src: Suite) {
    this.src = src ?? ({} as Suite);
  }

  getMsgpacks(): Array<Buffer> {
    return this.msgpack || (this.msgpack = this.parseAllMsgpack(this.src));
  }

  getTypes(filter?: Record<TypeKey, boolean>): Array<Type> {
    const src = this.src;

    return (
      (Object.keys(src) as Array<TypeKey>)
        .filter((type) => {
          return !filter || filter[type];
        })
        .map(function (type) {
          return Type.getType(type);
        })
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        .filter((x) => !!x)
    );
  }

  getValue(type: Type | TypeKey): any {
    if (!(type instanceof Type)) {
      type = Type.getType(type);
    }
    return type.parse(this.src[type.name]);
  }

  matchMsgpack(encoded: Buffer): boolean {
    return this.getMsgpacks().some(function (check) {
      return binary.compare(encoded, check);
    });
  }

  matchValue(value: any): boolean {
    return this.getTypes().some((type) => {
      return type.compare(value, this.getValue(type));
    });
  }

  stringify(idx: number | Type | TypeKey): string {
    if (typeof idx === "number") {
      return this.src.msgpack[idx]!;
    }

    const type = idx instanceof Type ? idx : Type.getType(idx);

    if (type) {
      return JSON.stringify(this.src[type.name]);
    }

    throw new Error(`${idx} not supported`);
  }

  private parseAllMsgpack(src: Suite): Array<Buffer> {
    return src.msgpack.map((r) => binary.parse(r));
  }
}
