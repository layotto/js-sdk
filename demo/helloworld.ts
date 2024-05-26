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
import { Client } from 'layotto';

const client = new Client();
assert(client);

async function main() {
  try {
    const hello = await client.hello.sayHello({
      serviceName: 'helloworld',
      name: 'js-sdk',
    });
    console.log('%s', hello);
  } catch (err) {
    console.error('sayHello error: %s', err);
  }
  client.close();
}

main();
