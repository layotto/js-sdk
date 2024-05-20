import { strict as assert } from 'node:assert';
import { Readable } from 'node:stream';
import { createReadStream } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { Client } from '../../../src';

describe.skip('client/Oss.test.ts', () => {
  const client = new Client('34901', '127.0.0.1', { ossEnable: true });
  it('test put object', async () => {
    const hello = await client.oss.put({
      storeName: 'oss_demo',
      bucket: 'antsys-tnpmbuild',
      key: 'test.txt',
      body: Readable.from(Buffer.from('hello world')),
      contentLength: 11,
    });
    assert(hello);
    const res = await client.oss.get({
      storeName: 'oss_demo',
      bucket: 'antsys-tnpmbuild',
      // support prefix with `/`
      key: '/test.txt',
    });
    const buf: Uint8Array[] = [];
    for await (const chunk of res.object) {
      buf.push(chunk);
    }
    const data = Buffer.concat(buf).toString();
    assert(data === 'hello world');
  });

  it('test put empty file', async () => {
    const fileStream = createReadStream(path.join(__dirname, 'fixtures/empty-file.txt'));
    const hello = await client.oss.put({
      storeName: 'oss_demo',
      bucket: 'antsys-tnpmbuild',
      key: 'test-empty-file.txt',
      body: fileStream,
      contentLength: 0,
    });
    assert(hello);
    const res = await client.oss.get({
      storeName: 'oss_demo',
      bucket: 'antsys-tnpmbuild',
      key: 'test-empty-file.txt',
    });
    const buf: Uint8Array[] = [];
    for await (const chunk of res.object) {
      buf.push(chunk);
    }
    const data = Buffer.concat(buf).toString();
    assert.equal(data, '');
  });

  it('test put large object', async () => {
    const buf = new Array(1024);
    buf.fill(Buffer.alloc(1024).fill('a'));
    const hash = crypto.createHash('md5');
    for (const chunk of buf) {
      hash.update(chunk);
    }
    const digest = hash.digest('hex');


    await client.oss.put({
      storeName: 'oss_demo',
      bucket: 'antsys-tnpmbuild',
      key: 'test_large_object.txt',
      body: Readable.from(buf),
      contentLength: buf.length,
    });

    const res = await client.oss.get({
      storeName: 'oss_demo',
      bucket: 'antsys-tnpmbuild',
      key: 'test_large_object.txt',
    });
    const getHash = crypto.createHash('md5');
    for await (const chunk of res.object) {
      getHash.update(chunk);
    }
    const getDigest = getHash.digest('hex');
    assert(digest === getDigest);
  });

  it('test copy object', async () => {
    await client.oss.put({
      storeName: 'oss_demo',
      bucket: 'antsys-tnpmbuild',
      key: 'test_copy.txt',
      body: Readable.from(Buffer.from('hello world')),
      contentLength: 11,
    });
    const copyRes = await client.oss.copy({
      storeName: 'oss_demo',
      bucket: 'antsys-tnpmbuild',
      key: 'test_copy_target.txt',
      copySource: {
        copySourceBucket: 'antsys-tnpmbuild',
        copySourceKey: 'test_copy.txt',
      },
    });
    assert(copyRes.copyObjectResult?.etag);

    const res = await client.oss.get({
      storeName: 'oss_demo',
      bucket: 'antsys-tnpmbuild',
      key: 'test_copy_target.txt',
    });

    const buf: Uint8Array[] = [];
    for await (const chunk of res.object) {
      buf.push(chunk);
    }
    const data = Buffer.concat(buf).toString();
    assert(data === 'hello world');
  });

  it('test delete object', async () => {
    await client.oss.put({
      storeName: 'oss_demo',
      bucket: 'antsys-tnpmbuild',
      key: 'test_delete.txt',
      body: Readable.from(Buffer.from('hello world')),
      contentLength: 11,
    });
    const deleteRes = await client.oss.delete({
      storeName: 'oss_demo',
      bucket: 'antsys-tnpmbuild',
      key: 'test_delete.txt',
    });
    assert(deleteRes);
    await assert.rejects(async () => {
      await client.oss.get({
        storeName: 'oss_demo',
        bucket: 'antsys-tnpmbuild',
        key: 'test_delete.txt',
      });
    }, /NoSuchKey/);
  });

  it('test list object', async () => {
    const res = await client.oss.list({
      storeName: 'oss_demo',
      bucket: 'antsys-tnpmbuild',
      prefix: 'test_',
    });
    assert(res);
  });

  it('test new oss client', async () => {
    const ossClient = client.createOSSClient();
    const res = await ossClient.list({
      storeName: 'oss_demo',
      bucket: 'antsys-tnpmbuild',
      prefix: 'test_',
    });
    assert(res);
  });
});
