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
import { strict as assert } from 'node:assert';
import { Client } from '../../../src';
import { CreateMetadataHook } from '../../../src/client/API';
import { CustomClient } from './fixtures/CustomClient';

describe('test/unit/client/Client.test.ts', () => {
  let client: Client;
  beforeAll(async () => {
    client = new Client();
    const hello = await client.hello.sayHello();
    assert.equal(hello, 'greeting');
    const hello2 = await client.hello.sayHello({ name: 'js-sdk' });
    assert.equal(hello2, 'greeting, js-sdk');
  });

  it('should create a Client with default port', () => {
    assert.equal(client.port, '34904');
    assert(client.state);
  });

  afterAll(() => {
    client.close();
  });

  describe('custom Client', () => {
    let customClient: CustomClient;
    beforeAll(() => {
      const createMetadataHook: CreateMetadataHook = localStorage => {
        return {
          'x-localStorage': localStorage?.getStore() ?? 'not-exists',
          'x-foo': 'bar',
        };
      };

      customClient = new CustomClient({
        logger: console,
        createMetadataHook,
      });
    });

    it('should work', async () => {
      const hello = await customClient.hello.sayHello();
      assert.equal(hello, 'greeting');
      const hello2 = await customClient.hello.sayHello({ name: 'js-sdk' });
      assert.equal(hello2, 'greeting, js-sdk');
    });

    afterAll(() => {
      customClient.close();
    });
  });
});
