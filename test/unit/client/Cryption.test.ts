import { strict as assert } from 'node:assert';
import { Client } from '../../../src';

describe.skip('Cryption.test.ts', () => {
  let client: Client;
  const componentName = 'cryption_demo';

  beforeAll(() => {
    client = new Client('34904', '127.0.0.1', { cryptionEnable: true });
  });

  it('should encrypt and decrypt success', async () => {
    const encryptResult = await client.cryption.encrypt({
      componentName,
      plainText: 'hello layotto 😄 你好',
    });
    // {
    //   cipherText: 'TmpnNFl6RmtOxxxxxxxx1ZXMvY2xtZzM2V0k9',
    //   keyId: 'xxx-665f-486a-9529-xxx',
    //   keyVersionId: 'xxx-6950-407a-91d9-xxx',
    //   requestId: '63969176-4659-4059-8593-cd2f7ea2282b'
    // }
    // console.log(encryptResult);
    assert(encryptResult.cipherText);
    assert.equal(typeof encryptResult.cipherText, 'string');
    const decryptResult = await client.cryption.decrypt({
      componentName,
      cipherText: encryptResult.cipherText,
    });
    // {
    //   plainText: <Buffer 68 65 6c 6c 6f 20 6c 61 79 6f 74 74 6f 20 f0 9f 98 84 20 e4 bd a0 e5 a5 bd>,
    //   keyId: 'xxx-665f-486a-9529-xxx',
    //   keyVersionId: 'xxx-6950-407a-91d9-xxx',
    //   requestId: 'ecf966e9-027e-4f1f-993f-1685f1bcd7e7'
    // }
    assert(Buffer.isBuffer(decryptResult.plainText));
    assert.equal(decryptResult.plainText.toString(), 'hello layotto 😄 你好');
  });
});
