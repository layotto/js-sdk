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

import { AsyncLocalStorage } from 'node:async_hooks';
import { Metadata } from '@grpc/grpc-js';
import { KV, RequestWithMeta, Map } from '../types/common';
import { mergeMetadataToMap } from '../utils';

export type CreateMetadataHook = (localStorage?: AsyncLocalStorage<any>) => Record<string, string>;

export interface APIOptions {
  logger?: Console;
  localStorage?: AsyncLocalStorage<any>;
  /**
   * Setting more request metadata here, e.g.: tracing headers
   */
  createMetadataHook?: CreateMetadataHook;
}

export class API {
  protected readonly localStorage?: AsyncLocalStorage<any>;
  protected readonly logger: Console;
  #createMetadataHook?: CreateMetadataHook;

  constructor(options?: APIOptions) {
    this.localStorage = options?.localStorage;
    this.logger = options?.logger ?? global.console;
    this.#createMetadataHook = options?.createMetadataHook;
  }

  createMetadata(request: RequestWithMeta<{}>, defaultRequestMeta?: Record<string, string>): Metadata {
    const metadata = new Metadata();
    if (defaultRequestMeta) {
      for (const key in defaultRequestMeta) {
        metadata.add(key, defaultRequestMeta[key]);
      }
    }

    if (request.requestMeta) {
      for (const key of Object.keys(request.requestMeta)) {
        metadata.add(key, request.requestMeta[key]);
      }
    }

    if (this.#createMetadataHook) {
      const moreMetadata = this.#createMetadataHook(this.localStorage);
      for (const key in moreMetadata) {
        metadata.add(key, moreMetadata[key]);
      }
    }
    return metadata;
  }

  mergeMetadataToMap(map: Map<string>, ...metadatas: (KV<string> | undefined)[]) {
    mergeMetadataToMap(map, ...metadatas);
  }
}
