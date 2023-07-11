import { strict as assert } from 'node:assert';
import { Client } from '../../../src';

describe('Cryption.test.ts', () => {
  let client: Client;
  const componentName = 'cryption_demo';

  beforeAll(() => {
    client = new Client('34904', '127.0.0.1', { cryption: { componentName } });
  });

  it('should encrypt and decrypt success', async () => {
    const encryptResult1 = await client.cryption.encrypt({
      plainText: 'hello layotto 😄 你好',
    });
    // {
    //   cipherText: 'TmpnNFl6RmtOxxxxxxxx1ZXMvY2xtZzM2V0k9',
    //   keyId: 'xxx-665f-486a-9529-xxx',
    //   keyVersionId: 'xxx-6950-407a-91d9-xxx',
    //   requestId: '63969176-4659-4059-8593-cd2f7ea2282b'
    // }
    console.log(encryptResult1);
    assert(encryptResult1.cipherText);
    assert.equal(typeof encryptResult1.cipherText, 'string');
    const encryptResult2 = await client.cryption.encrypt({
      plainText: 'hello layotto 😄 你好',
    });
    console.log(encryptResult2);
    assert.notEqual(encryptResult2.cipherText, encryptResult1.cipherText);
    assert.equal(encryptResult2.keyId, encryptResult1.keyId);

    const decryptResult1 = await client.cryption.decrypt({
      cipherText: encryptResult1.cipherText,
    });
    // {
    //   plainText: <Buffer 68 65 6c 6c 6f 20 6c 61 79 6f 74 74 6f 20 f0 9f 98 84 20 e4 bd a0 e5 a5 bd>,
    //   keyId: 'xxx-665f-486a-9529-xxx',
    //   keyVersionId: 'xxx-6950-407a-91d9-xxx',
    //   requestId: 'ecf966e9-027e-4f1f-993f-1685f1bcd7e7'
    // }
    console.log(decryptResult1);
    assert(Buffer.isBuffer(decryptResult1.plainText));
    assert.equal(decryptResult1.plainText.toString(), 'hello layotto 😄 你好');

    const decryptResult2 = await client.cryption.decrypt({
      cipherText: encryptResult2.cipherText,
    });
    assert.equal(decryptResult2.plainText.toString(), decryptResult1.plainText.toString());
  });
});
