/*
 * Copyright 2021 Layotto Authors
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Simplify } from 'type-fest';

export type KV<Type> = {
  [key: string]: Type;
};

export type RequestWithMeta<T> = Simplify<T & {
  requestMeta?: KV<string>;
}>;

export type Map<Type> = {
  set(k: Type, v: Type): unknown;
};

export function convertArrayToKVString(items: [string, string][]) {
  const kv: KV<string> = {};
  for (const [key, value] of items) {
    kv[key] = value;
  }
  return kv;
}

export interface Logger {
  info(message?: any, ...optionalParams: any[]): void;
  warn(message?: any, ...optionalParams: any[]): void;
  error(message?: any, ...optionalParams: any[]): void;
}
