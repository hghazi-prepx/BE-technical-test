import { JObject } from 'package/utils/interfaces';
import { ILike, Not } from 'typeorm';

interface IWhereOptionsBuilder {
  equals(key: string, value: number | string | boolean): FilterService;
  substring(key: string, value: string): FilterService;
  notEquals(key: string, value: number | string | boolean): FilterService;
  startsWith(key: string, value: number | string | boolean): FilterService;
  build(): any;
}

export class FilterService implements IWhereOptionsBuilder {
  result: JObject = {};

  notEquals(key: string, value: number | string | boolean) {
    this.result[key] = Not(value);
    return this;
  }

  equals(key: string, value: number | string | boolean) {
    this.result[key] = value;
    return this;
  }

  substring(key: string, value: string) {
    this.result[key] = ILike(`%${value}%`);
    return this;
  }

  startsWith(key: string, value: string) {
    this.result[key] = ILike(`${value}%`);
    return this;
  }

  build() {
    return this.result;
  }
}
