/**
 * From https://github.com/kawanet/msgpack-test-js/blob/master/lib/group.js
 */

import suite from "./msgpack-test-suite";
import { Exam, Suite } from "./exam";
import { TypeKey } from "./type";

export class Group {
  name: keyof typeof suite;

  constructor(name: keyof typeof suite) {
    this.name = name;
  }

  static getGroups(): Array<Group> {
    return (Object.keys(suite) as Array<keyof typeof suite>).sort().map((s) => new Group(s));
  }

  getExams(filter?: Record<TypeKey, boolean>): Array<Exam> {
    const name = this.name;
    const array = suite[name];

    return array
      .map((x) => new Exam(x as Suite))
      .filter(function (exam) {
        return !filter || exam.getTypes(filter).length;
      });
  }

  toString(): string {
    return this.name;
  }
}

export function getExams(filter?: Record<TypeKey, boolean>): Array<Exam> {
  return Group.getGroups().flatMap((group) => group.getExams(filter));
}
