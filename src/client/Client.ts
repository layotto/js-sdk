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

import { debuglog } from 'node:util';
import { AsyncLocalStorage } from 'node:async_hooks';
import { ChannelCredentials } from '@grpc/grpc-js';
import { RuntimeClient } from '../../proto/runtime/v1/runtime_grpc_pb';
import { ObjectStorageServiceClient } from '../../proto/extension/v1/s3/oss_grpc_pb';
import { CryptionServiceClient } from '../../proto/extension/v1/cryption/cryption_grpc_pb';
import { State } from './State';
import { Hello } from './Hello';
import { Invoker } from './Invoker';
import { Lock } from './Lock';
import { Sequencer } from './Sequencer';
import { Configuration } from './Configuration';
import { PubSub } from './PubSub';
import { File } from './File';
import { Binding } from './Binding';
import { Oss, OssOptions } from './Oss';
import { Cryption, CryptionOptions } from './Cryption';
import type { CreateMetadataHook } from './API';

const debug = debuglog('layotto:client:main');

export interface ClientOptions {
  ossEnable?: boolean;
  oss?: OssOptions;
  cryption?: CryptionOptions;
  logger?: Console;
  localStorage?: AsyncLocalStorage<any>;
  createMetadataHook?: CreateMetadataHook;
}

export class Client {
  readonly host: string;
  readonly port: string;
  protected readonly localStorage?: AsyncLocalStorage<any>;
  protected readonly logger: Console;
  protected readonly createMetadataHook?: CreateMetadataHook;
  protected readonly _runtime: RuntimeClient;
  private readonly _address: string;
  private readonly _ossClient: ObjectStorageServiceClient;
  private readonly _ossOptions: OssOptions;
  private readonly _cryptionClient: CryptionServiceClient;
  private readonly _cryptionOptions: CryptionOptions;
  private _hello: Hello;
  private _state: State;
  private _invoker: Invoker;
  private _lock: Lock;
  private _sequencer: Sequencer;
  private _configuration: Configuration;
  private _pubsub: PubSub;
  private _file: File;
  private _binding: Binding;
  private _oss: Oss;
  private _cryption: Cryption;

  constructor(port: string = process.env.runtime_GRPC_PORT ?? '34904',
              host: string = process.env.runtime_GRPC_HOST ?? '127.0.0.1',
              options?: ClientOptions) {
    this.host = host;
    this.port = port;
    let address = `${this.host}:${this.port}`;
    // Support UDS
    if (this.host.startsWith('unix://')) {
      address = this.host;
    }
    this._address = address;
    this.localStorage = options?.localStorage;
    this.logger = options?.logger ?? global.console;
    this.createMetadataHook = options?.createMetadataHook;
    const clientCredentials = ChannelCredentials.createInsecure();
    this._runtime = new RuntimeClient(this._address, clientCredentials);
    debug('Start connection to %o', this._address);
    if (options?.ossEnable || options?.oss) {
      this._ossOptions = options?.oss || {};
      this._ossClient = new ObjectStorageServiceClient(this._address, clientCredentials);
    }
    if (options?.cryption?.componentName) {
      this._cryptionOptions = options.cryption;
      this._cryptionClient = new CryptionServiceClient(this._address, clientCredentials);
    }
  }

  protected get initAPIOptions() {
    return {
      localStorage: this.localStorage,
      logger: this.logger,
      createMetadataHook: this.createMetadataHook,
    };
  }

  get hello() {
    if (!this._hello) {
      this._hello = new Hello(this._runtime, this.initAPIOptions);
    }
    return this._hello;
  }

  get state() {
    if (!this._state) {
      this._state = new State(this._runtime, this.initAPIOptions);
    }
    return this._state;
  }

  get invoker() {
    if (!this._invoker) {
      this._invoker = new Invoker(this._runtime, this.initAPIOptions);
    }
    return this._invoker;
  }

  get lock() {
    if (!this._lock) {
      this._lock = new Lock(this._runtime, this.initAPIOptions);
    }
    return this._lock;
  }

  get sequencer() {
    if (!this._sequencer) {
      this._sequencer = new Sequencer(this._runtime, this.initAPIOptions);
    }
    return this._sequencer;
  }

  get configuration() {
    if (!this._configuration) {
      this._configuration = new Configuration(this._runtime, this.initAPIOptions);
    }
    return this._configuration;
  }

  get pubsub() {
    if (!this._pubsub) {
      this._pubsub = new PubSub(this._runtime, this.initAPIOptions);
    }
    return this._pubsub;
  }

  get file() {
    if (!this._file) {
      this._file = new File(this._runtime, this.initAPIOptions);
    }
    return this._file;
  }

  get binding() {
    if (!this._binding) {
      this._binding = new Binding(this._runtime, this.initAPIOptions);
    }
    return this._binding;
  }

  get oss() {
    if (!this._oss) {
      if (!this._ossClient) {
        throw new Error('client not enable oss');
      }
      this._oss = new Oss(this._ossClient, this._ossOptions, this.initAPIOptions);
    }
    return this._oss;
  }

  /**
   * Create new oss client instance
   */
  createOSSClient(options: OssOptions = {}) {
    const ossClient = new ObjectStorageServiceClient(this._address, ChannelCredentials.createInsecure());
    return new Oss(ossClient, options, this.initAPIOptions);
  }

  get cryption() {
    if (!this._cryption) {
      if (!this._cryptionClient) {
        throw new Error('client not enable cryption');
      }
      this._cryption = new Cryption(this._cryptionClient, this._cryptionOptions, this.initAPIOptions);
    }
    return this._cryption;
  }
}
