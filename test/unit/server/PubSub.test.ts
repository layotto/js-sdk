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
import { execSync } from 'node:child_process';
import { Server, Client, utils } from '../../../src';

// 目前是先启动了 layotto，所以有时序问题，先跳过
describe.skip('server/PubSub.test.ts', () => {
  let server: Server;
  let client: Client;
  const topic1 = 'topic1';
  beforeAll(async () => {
    client = new Client();
    await client.hello.sayHello();
    server = new Server();
    server.pubsub.addPubSubSubscription('redis', topic1);
    await server.start();
  });

  afterAll(async () => {
    await server.close();
  });

  it('should subscribe a topic work', async () => {
    let lastData;
    server.pubsub.subscribe('redis', topic1, async (data, request) => {
      console.log('topic event data: %j, request: %o', data, request);
      lastData = data;
    });

    const cmd = `ts-node ${process.cwd()}/test/unit/server/publishClient.ts`;
    const buf = execSync(cmd);
    console.log(cmd, buf.toString());

    for (let i = 0; i < 20; i++) {
      await utils.sleep(1000);
      if (lastData) break;
    }
    assert(lastData);
  }, 20000);
});
