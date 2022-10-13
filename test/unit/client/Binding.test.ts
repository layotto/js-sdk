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
import { strict as assert } from 'assert';
import { Client } from '../../../src';

describe('client/Binding.test.ts', () => {
  let client: Client;
  beforeAll(async () => {
    client = new Client();
  });

  it('should invoke success', async () => {
    const res = await client.binding.invoke({
      name: 'http',
      operation: 'get',
      data: '😄ok，你好',
      metadata: { token: '123' },
    });
    // console.log(Buffer.from(res.data).toString());
    assert.equal(Buffer.from(res.data).toString(), 'Hello Koa')
    assert.equal(res.metadata.statusCode, '200');
  });
});
