import { strict as assert } from 'assert';
import { Client } from 'layotto';

const client = new Client();
assert(client);

async function main() {
  const pubsubName = 'pub_subs_demo';
  const topic = 'topic1';
  const value = `bar, from js-sdk, ${Date()}`;

  await client.pubsub.publish({
    pubsubName, topic, data: { value },
  });
}

main();
