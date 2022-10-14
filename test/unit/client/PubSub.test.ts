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
import { describe, beforeAll, it } from 'vitest';
import { Client } from '../../../src';

describe('client/PubSub.test.ts', () => {
  let client: Client;
  beforeAll(async () => {
    client = new Client();
    await client.hello.sayHello();
  });

  it('should publish a topic work', async () => {
    const pubsubName = 'redis';
    const topic = 'topic1-client-unit';
    const value = `bar, from js-sdk, ${Date()}`;

    await client.pubsub.publish({
      pubsubName, topic, data: { value },
    });
  });
});
