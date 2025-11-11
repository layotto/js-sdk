import { strict as assert } from 'node:assert';
import { Readable } from 'node:stream';
import { createReadStream } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { Client } from '../../../src';
import { randomUUID } from 'node:crypto';

describe.skip('client/Oss.test.ts', () => {
  const client = new Client('34904', '127.0.0.1', { ossEnable: true });

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

  it('test deleteObjects - batch delete', async () => {
    // Create test objects
    await client.oss.put({
      storeName: 'oss_demo',
      bucket: 'antsys-tnpmbuild',
      key: 'test_batch_delete_1.txt',
      body: Readable.from(Buffer.from('test1')),
      contentLength: 5,
    });
    await client.oss.put({
      storeName: 'oss_demo',
      bucket: 'antsys-tnpmbuild',
      key: 'test_batch_delete_2.txt',
      body: Readable.from(Buffer.from('test2')),
      contentLength: 5,
    });

    // Delete multiple objects
    const deleteRes = await client.oss.deleteObjects({
      storeName: 'oss_demo',
      bucket: 'antsys-tnpmbuild',
      objects: [
        { key: 'test_batch_delete_1.txt' },
        { key: 'test_batch_delete_2.txt' },
      ],
    });
    assert(deleteRes);
    assert(deleteRes.deletedList);
  });

  it('test isObjectExist', async () => {
    await client.oss.put({
      storeName: 'oss_demo',
      bucket: 'antsys-tnpmbuild',
      key: 'test_exist.txt',
      body: Readable.from(Buffer.from('exist')),
      contentLength: 5,
    });

    // Check existing object
    const existRes = await client.oss.isObjectExist({
      storeName: 'oss_demo',
      bucket: 'antsys-tnpmbuild',
      key: 'test_exist.txt',
    });
    assert.equal(existRes.fileExist, true);

    // Check non-existing object
    const notExistRes = await client.oss.isObjectExist({
      storeName: 'oss_demo',
      bucket: 'antsys-tnpmbuild',
      key: 'test_not_exist.txt',
    });
    assert.equal(notExistRes.fileExist, false);
  });

  it('test object tagging', async () => {
    await client.oss.put({
      storeName: 'oss_demo',
      bucket: 'antsys-tnpmbuild',
      key: 'test_tagging.txt',
      body: Readable.from(Buffer.from('test tagging')),
      contentLength: 12,
    });

    // Put tags
    const putTagRes = await client.oss.putObjectTagging({
      storeName: 'oss_demo',
      bucket: 'antsys-tnpmbuild',
      key: 'test_tagging.txt',
      tags: {
        env: 'test',
        team: 'dev',
      },
    });
    assert(putTagRes);

    // Get tags
    const getTagRes = await client.oss.getObjectTagging({
      storeName: 'oss_demo',
      bucket: 'antsys-tnpmbuild',
      key: 'test_tagging.txt',
    });
    assert(getTagRes.tagsMap);
    assert(getTagRes.tagsMap.length > 0);

    // Delete tags
    const deleteTagRes = await client.oss.deleteObjectTagging({
      storeName: 'oss_demo',
      bucket: 'antsys-tnpmbuild',
      key: 'test_tagging.txt',
    });
    assert(deleteTagRes);
  });

  it('test object ACL', async () => {
    await client.oss.put({
      storeName: 'oss_demo',
      bucket: 'antsys-tnpmbuild',
      key: 'test_acl.txt',
      body: Readable.from(Buffer.from('test acl')),
      contentLength: 8,
    });

    // Put ACL
    const putAclRes = await client.oss.putObjectCannedAcl({
      storeName: 'oss_demo',
      bucket: 'antsys-tnpmbuild',
      key: 'test_acl.txt',
      acl: 'private',
    });
    assert(putAclRes);

    // Get ACL
    const getAclRes = await client.oss.getObjectCannedAcl({
      storeName: 'oss_demo',
      bucket: 'antsys-tnpmbuild',
      key: 'test_acl.txt',
    });
    assert(getAclRes);
    assert(getAclRes.cannedAcl);
  });

  it('test multipart upload', async () => {
    // Create multipart upload
    const createRes = await client.oss.createMultipartUpload({
      storeName: 'oss_demo',
      bucket: 'antsys-tnpmbuild',
      key: 'test_multipart.txt',
    });
    assert(createRes.uploadId);
    const uploadId = createRes.uploadId;

    // Upload part 1
    const part1Data = Buffer.alloc(1024 * 1024).fill('a'); // 1MB
    const uploadPart1Res = await client.oss.uploadPart({
      storeName: 'oss_demo',
      bucket: 'antsys-tnpmbuild',
      key: 'test_multipart.txt',
      uploadId,
      partNumber: 1,
      body: Readable.from(part1Data),
      contentLength: part1Data.length,
    });
    assert(uploadPart1Res.etag);

    // Upload part 2
    const part2Data = Buffer.alloc(1024 * 1024).fill('b'); // 1MB
    const uploadPart2Res = await client.oss.uploadPart({
      storeName: 'oss_demo',
      bucket: 'antsys-tnpmbuild',
      key: 'test_multipart.txt',
      uploadId,
      partNumber: 2,
      body: Readable.from(part2Data),
      contentLength: part2Data.length,
    });
    assert(uploadPart2Res.etag);

    // List parts
    const listPartsRes = await client.oss.listParts({
      storeName: 'oss_demo',
      bucket: 'antsys-tnpmbuild',
      key: 'test_multipart.txt',
      uploadId,
    });
    assert(listPartsRes.partsList);
    assert.equal(listPartsRes.partsList.length, 2);

    // Complete multipart upload
    const completeRes = await client.oss.completeMultipartUpload({
      storeName: 'oss_demo',
      bucket: 'antsys-tnpmbuild',
      key: 'test_multipart.txt',
      uploadId,
      parts: [
        { etag: uploadPart1Res.etag, partNumber: 1 },
        { etag: uploadPart2Res.etag, partNumber: 2 },
      ],
    });
    assert(completeRes);
    assert(completeRes.etag);
  });

  it('test abort multipart upload', async () => {
    // Create multipart upload
    const createRes = await client.oss.createMultipartUpload({
      storeName: 'oss_demo',
      bucket: 'antsys-tnpmbuild',
      key: 'test_abort_multipart.txt',
    });
    assert(createRes.uploadId);
    const uploadId = createRes.uploadId;

    // Upload a part
    const partData = Buffer.alloc(1024 * 1024).fill('x');
    await client.oss.uploadPart({
      storeName: 'oss_demo',
      bucket: 'antsys-tnpmbuild',
      key: 'test_abort_multipart.txt',
      uploadId,
      partNumber: 1,
      body: Readable.from(partData),
      contentLength: partData.length,
    });

    // Abort multipart upload
    const abortRes = await client.oss.abortMultipartUpload({
      storeName: 'oss_demo',
      bucket: 'antsys-tnpmbuild',
      key: 'test_abort_multipart.txt',
      uploadId,
    });
    assert(abortRes);
  });

  it('test listMultipartUploads', async () => {
    // Create a multipart upload
    await client.oss.createMultipartUpload({
      storeName: 'oss_demo',
      bucket: 'antsys-tnpmbuild',
      key: 'test_list_multipart.txt',
    });

    // List multipart uploads
    const listRes = await client.oss.listMultipartUploads({
      storeName: 'oss_demo',
      bucket: 'antsys-tnpmbuild',
      prefix: 'test_list_',
    });
    assert(listRes);
  });

  it('test appendObject', async () => {
    const key = `test_append${randomUUID()}.txt`;
    // First append
    const append1Res = await client.oss.appendObject({
      storeName: 'oss_demo',
      bucket: 'antsys-tnpmbuild',
      key,
      body: Readable.from(Buffer.from('hello ')),
      // position: 0,
    });
    assert(append1Res);
    const nextPosition = append1Res.appendPosition;

    // Second append
    const append2Res = await client.oss.appendObject({
      storeName: 'oss_demo',
      bucket: 'antsys-tnpmbuild',
      key,
      body: Readable.from(Buffer.from('world')),
      position: nextPosition,
    });
    assert(append2Res);

    // Verify the content
    const res = await client.oss.get({
      storeName: 'oss_demo',
      bucket: 'antsys-tnpmbuild',
      key,
    });
    const buf: Uint8Array[] = [];
    for await (const chunk of res.object) {
      buf.push(chunk);
    }
    const data = Buffer.concat(buf).toString();
    assert.equal(data, 'hello world');
  });

  it('test uploadPartCopy', async () => {
    const key = `test_part_copy_source${randomUUID()}.txt`;
    // Create source object
    const sourceData = Buffer.alloc(2 * 1024 * 1024).fill('s'); // 5MB
    await client.oss.put({
      storeName: 'oss_demo',
      bucket: 'antsys-tnpmbuild',
      key,
      body: Readable.from(sourceData),
      contentLength: sourceData.length,
    });

    // Create multipart upload for destination
    const createRes = await client.oss.createMultipartUpload({
      storeName: 'oss_demo',
      bucket: 'antsys-tnpmbuild',
      key,
    });
    const uploadId = createRes.uploadId;

    // Copy part from source
    const copyPartRes = await client.oss.uploadPartCopy({
      storeName: 'oss_demo',
      bucket: 'antsys-tnpmbuild',
      key,
      uploadId,
      partNumber: 1,
      copySource: {
        copySourceBucket: 'antsys-tnpmbuild',
        copySourceKey: key,
      },
    });
    assert(copyPartRes);
    assert(copyPartRes.copyPartResult?.etag);

    // Complete multipart upload
    await client.oss.completeMultipartUpload({
      storeName: 'oss_demo',
      bucket: 'antsys-tnpmbuild',
      key,
      uploadId,
      parts: [
        { etag: copyPartRes.copyPartResult!.etag, partNumber: 1 },
      ],
    });
  });

  it('test head object', async () => {
    await client.oss.put({
      storeName: 'oss_demo',
      bucket: 'antsys-tnpmbuild',
      key: 'test_head.txt',
      body: Readable.from(Buffer.from('test head')),
      contentLength: 9,
    });

    const headRes = await client.oss.head({
      storeName: 'oss_demo',
      bucket: 'antsys-tnpmbuild',
      key: 'test_head.txt',
    });
    assert(headRes);
    console.log(headRes);
    // assert(headRes.contentLength);
    // assert.equal(headRes.contentLength, 9);
  });

  it('test signUrl', async () => {
    const signRes = await client.oss.signUrl({
      storeName: 'oss_demo',
      bucket: 'antsys-tnpmbuild',
      key: 'test_sign.txt',
      method: 'GET',
      expiredInSec: 3600,
    });
    assert(signRes);
    assert(signRes.signedUrl);
  });

  it('test updateBandwidthRateLimit', async () => {
    // Update download bandwidth rate limit
    await client.oss.updateDownloadBandwidthRateLimit({
      storeName: 'oss_demo',
      averageRateLimitInBitsPerSec: 1024 * 1024 * 8, // 1MB/s
    });

    // Update upload bandwidth rate limit
    await client.oss.updateUploadBandwidthRateLimit({
      storeName: 'oss_demo',
      averageRateLimitInBitsPerSec: 1024 * 1024 * 8, // 1MB/s
    });
  });
});
