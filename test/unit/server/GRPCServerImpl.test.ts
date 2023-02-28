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
import { execSync } from 'child_process';
import { Server, Client, utils } from '../../../src';
import GRPCServerImpl from './GRPCServerImpl';

const pubsubConfig = {
  sofamq: {
    subs: [
      {
        // topic 必填字段
        topic: 'TP_GO_DEMO',
        metadata: {
          // GROUP_ID 必填字段
          GROUP_ID: 'GID_GO_DEMO',
          // sofamq的 EVENTCODE 非必填，类似于 TAG, 按需使用，详见：https://help.aliyun.com/document_detail/146978.html
          EVENTCODE: 'EC_GNU_TEST',
          // SUB_LDC_SUBMODE 非必填字段，用于指令 ZONE, 默认值为 LOCAL
          SUB_LDC_SUBMODE: 'LOCAL',
        },
      },
    ],
    pubs: [
      {
        topic: 'TP_GO_DEMO',
        metadata: {
          // group 必填字段
          GROUP_ID: 'GID_GO_DEMO',
          // sofamq的 EVENTCODE 非必填，类似于 TAG, 按需使用，详见：https://help.aliyun.com/document_detail/146978.html
          EVENTCODE: 'EC_GNU_TEST',
          // POST_TIMEOUT 非必填字段，用于指定消息发送超时时间，单位为毫秒，默认值为 3000
          POST_TIMEOUT: '3000',
          // MESSAGE_ID 非必填字段，16位的一个uuid, 用于指定消息的唯一标识，如果不指定，会自动生成一个
          MESSAGE_ID: '1234567890',
          // ^committed$ 非必填字段，用于指定消息是否需要持久化，默认值为 true
          '^committed$': 'true',
          // EVENT_ID 非必填字段，16位的一个uuid, 用于指定消息的事件 ID，如果不指定，会自动生成一个
          EVENT_ID: '1234567890',
        },
      },
    ],
  },
};

describe.skip('server/GRPCServerImpl.test.ts', () => {
  let server: Server;
  let client: Client;
  const topic1 = 'topic1';
  beforeAll(async () => {
    client = new Client();
    await client.hello.sayHello();
    const serverImpl = new GRPCServerImpl(pubsubConfig);
    server = new Server('9999', serverImpl);
    await server.start();
  });

  afterAll(async () => {
    await server.close();
  });

  it('should subscribe a topic work', async () => {
    let lastData;
    server.pubsub.subscribe('redis', topic1, async data => {
      console.log('topic event data: %j', data);
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
