import {
  CopyObjectRequest,
  DeleteObjectRequest,
  GetObjectRequest,
  GetObjectResponse,
  HeadObjectRequest,
  ListObjectsRequest,
  PutObjectRequest,
  PutObjectResponse,
  SignUrlRequest,
} from '../types/Oss';
import {
  CopyObjectInput,
  CopyObjectOutput,
  CopySource,
  DeleteObjectInput,
  DeleteObjectOutput,
  GetObjectInput,
  GetObjectOutput,
  HeadObjectInput,
  HeadObjectOutput,
  ListObjectsInput,
  ListObjectsOutput,
  PutObjectInput,
  PutObjectOutput,
  SignURLInput,
  SignURLOutput,
} from '../../proto/extension/v1/s3/oss_pb';
import { ObjectStorageServiceClient } from '../../proto/extension/v1/s3/oss_grpc_pb';
import { RequestWithMeta } from '../types/common';
import { Metadata } from '@grpc/grpc-js';
import { Readable, PassThrough, Writable } from 'stream';
import { pipeline as pipelinePromise } from 'stream/promises';

export default class Oss {
  private readonly ossClient: ObjectStorageServiceClient;

  constructor(ossClient: ObjectStorageServiceClient) {
    this.ossClient = ossClient;
  }

  createMetadata(request: RequestWithMeta<{}>): Metadata {
    const metadata = new Metadata();
    if (!request.requestMeta) return metadata;
    for (const key of Object.keys(request.requestMeta)) {
      metadata.add(key, request.requestMeta[key]);
    }
    return metadata;
  }

  private async* putObjectIterator(request: PutObjectRequest): AsyncGenerator<PutObjectInput> {
    for await (const chunk of request.body) {
      const req = new PutObjectInput();
      req.setStoreName(request.storeName);
      req.setBucket(request.bucket);
      req.setKey(request.key);
      req.setContentLength(request.contentLength);
      if (request.acl) {
        req.setAcl(request.acl);
      }
      if (request.bucketKeyEnabled) {
        req.setBucketKeyEnabled(request.bucketKeyEnabled);
      }
      if (request.cacheControl) {
        req.setCacheControl(request.cacheControl);
      }
      if (request.contentDisposition) {
        req.setContentDisposition(request.contentDisposition);
      }
      if (request.contentEncoding) {
        req.setContentEncoding(request.contentEncoding);
      }
      if (request.expires) {
        req.setExpires(request.expires);
      }
      if (request.serverSideEncryption) {
        req.setServerSideEncryption(request.serverSideEncryption);
      }
      if (request.signedUrl) {
        req.setSignedUrl(request.signedUrl);
      }
      req.setBody(chunk);
      yield req;
    }
  }

  async put(request: PutObjectRequest): Promise<PutObjectOutput.AsObject> {
    let resolve;
    let reject;
    const promise = new Promise<PutObjectResponse>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    const writeStream = this.ossClient.putObject(this.createMetadata(request), (err, res) => {
      if (err) {
        return reject(err);
      }
      return resolve(res.toObject());
    });
    const putObjectIterator = this.putObjectIterator(request);
    await pipelinePromise<AsyncGenerator<PutObjectInput>, Writable>(putObjectIterator, writeStream);

    return promise;
  }

  private async* getObjectIterator(request: Readable): AsyncGenerator<GetObjectOutput> {
    for await (const chunk of request) {
      yield chunk;
    }
  }

  private async* getObjectBufferIterator(firstChunk: GetObjectOutput, request: AsyncGenerator<GetObjectOutput>): AsyncGenerator<Uint8Array> {
    yield firstChunk.getBody_asU8();
    for await (const chunk of request) {
      yield chunk.getBody_asU8();
    }
  }

  async get(request: GetObjectRequest): Promise<GetObjectResponse> {
    const req = new GetObjectInput();
    req.setStoreName(request.storeName);
    req.setBucket(request.bucket);
    req.setKey(request.key);
    if (request.expectedBucketOwner) {
      req.setExpectedBucketOwner(request.expectedBucketOwner)
    }
    if (request.ifMatch) {
      req.setIfMatch(request.ifMatch)
    }
    if (request.ifModifiedSince) {
      req.setIfModifiedSince(request.ifModifiedSince)
    }
    if (request.ifNoneMatch) {
      req.setIfNoneMatch(request.ifNoneMatch)
    }
    if (request.ifUnmodifiedSince) {
      req.setIfUnmodifiedSince(request.ifUnmodifiedSince)
    }
    if (request.partNumber) {
      req.setPartNumber(request.partNumber)
    }
    if (request.start) {
      req.setStart(request.start)
    }
    if (request.end) {
      req.setEnd(request.end)
    }
    if (request.requestPayer) {
      req.setRequestPayer(request.requestPayer)
    }
    if (request.responseCacheControl) {
      req.setResponseCacheControl(request.responseCacheControl)
    }
    if (request.responseContentDisposition) {
      req.setResponseContentDisposition(request.responseContentDisposition)
    }
    if (request.responseContentEncoding) {
      req.setResponseContentEncoding(request.responseContentEncoding)
    }
    if (request.responseContentLanguage) {
      req.setResponseContentLanguage(request.responseContentLanguage)
    }
    if (request.responseContentType) {
      req.setResponseContentType(request.responseContentType)
    }
    if (request.responseExpires) {
      req.setResponseExpires(request.responseExpires)
    }
    if (request.sseCustomerAlgorithm) {
      req.setSseCustomerAlgorithm(request.sseCustomerAlgorithm)
    }
    if (request.sseCustomerKey) {
      req.setSseCustomerKey(request.sseCustomerKey)
    }
    if (request.sseCustomerKeyMd5) {
      req.setSseCustomerKeyMd5(request.sseCustomerKeyMd5)
    }
    if (request.versionId) {
      req.setVersionId(request.versionId)
    }
    if (request.acceptEncoding) {
      req.setAcceptEncoding(request.acceptEncoding)
    }
    if (request.signedUrl) {
      req.setSignedUrl(request.signedUrl)
    }
    const callStream = this.ossClient.getObject(req, this.createMetadata(request));
    const getObjectIterator = this.getObjectIterator(callStream);
    const firstChunk = (await getObjectIterator.next()).value;
    const getObjectBufIterator = this.getObjectBufferIterator(firstChunk, getObjectIterator);
    return {
      ...firstChunk.toObject(),
      object: PassThrough.from(getObjectBufIterator),
    };

  }

  async copy(request: CopyObjectRequest): Promise<CopyObjectOutput.AsObject> {
    const req = new CopyObjectInput();
    req.setStoreName(request.storeName);
    req.setBucket(request.bucket);
    req.setKey(request.key);
    const copySource = new CopySource();
    req.setCopySource(copySource);
    copySource.setCopySourceBucket(request.copySource.copySourceBucket);
    copySource.setCopySourceKey(request.copySource.copySourceKey);
    if (request.copySource.copySourceVersionId) {
      copySource.setCopySourceVersionId(request.copySource.copySourceVersionId);
    }
    if (request.expires) {
      req.setExpires(request.expires);
    }
    if (request.metadataDirective) {
      req.setMetadataDirective(request.metadataDirective);
    }
    return new Promise((resolve, reject) => {
      this.ossClient.copyObject(req, this.createMetadata(request), (err, response) => {
        if (err) {
          return reject(err);
        }
        return resolve(response!.toObject());
      });
    });
  }

  async head(request: HeadObjectRequest): Promise<HeadObjectOutput.AsObject> {
    const req = new HeadObjectInput();
    req.setStoreName(request.storeName);
    req.setBucket(request.bucket);
    req.setKey(request.key);
    if (request.checksumMode) {
      req.setChecksumMode(request.checksumMode);
    }
    if (request.expectedBucketOwner) {
      req.setExpectedBucketOwner(request.expectedBucketOwner);
    }
    if (request.ifMatch) {
      req.setIfMatch(request.ifMatch);
    }
    if (request.ifModifiedSince) {
      req.setIfModifiedSince(request.ifModifiedSince);
    }
    if (request.ifNoneMatch) {
      req.setIfNoneMatch(request.ifNoneMatch);
    }
    if (request.ifUnmodifiedSince) {
      req.setIfUnmodifiedSince(request.ifUnmodifiedSince);
    }
    if (request.partNumber) {
      req.setPartNumber(request.partNumber);
    }
    if (request.requestPayer) {
      req.setRequestPayer(request.requestPayer);
    }
    if (request.sseCustomerAlgorithm) {
      req.setSseCustomerAlgorithm(request.sseCustomerAlgorithm);
    }
    if (request.sseCustomerKey) {
      req.setSseCustomerKey(request.sseCustomerKey);
    }
    if (request.sseCustomerKeyMd5) {
      req.setSseCustomerKeyMd5(request.sseCustomerKeyMd5);
    }
    if (request.versionId) {
      req.setVersionId(request.versionId);
    }
    if (request.withDetails) {
      req.setWithDetails(request.withDetails);
    }
    return new Promise((resolve, reject) => {
      this.ossClient.headObject(req, this.createMetadata(request), (err, response) => {
        if (err) {
          return reject(err);
        }
        return resolve(response!.toObject());
      });
    });
  }

  async delete(request: DeleteObjectRequest): Promise<DeleteObjectOutput.AsObject> {
    const req = new DeleteObjectInput();
    req.setStoreName(request.storeName);
    req.setBucket(request.bucket);
    req.setKey(request.key);
    if (request.requestPayer) {
      req.setRequestPayer(request.requestPayer);
    }
    if (request.versionId) {
      req.setVersionId(request.versionId);
    }

    return new Promise((resolve, reject) => {
      this.ossClient.deleteObject(req, this.createMetadata(request), (err, response) => {
        if (err) {
          return reject(err);
        }
        return resolve(response!.toObject());
      });
    });
  }

  async list(request: ListObjectsRequest): Promise<ListObjectsOutput.AsObject> {
    const req = new ListObjectsInput();
    req.setStoreName(request.storeName);
    req.setBucket(request.bucket);
    if (request.prefix) {
      req.setPrefix(request.prefix);
    }
    if (request.delimiter) {
      req.setDelimiter(request.delimiter);
    }
    if (request.encodingType) {
      req.setEncodingType(request.encodingType);
    }
    if (request.expectedBucketOwner) {
      req.setExpectedBucketOwner(request.expectedBucketOwner);
    }
    if (request.marker) {
      req.setMarker(request.marker);
    }
    if (request.maxkeys) {
      req.setMaxkeys(request.maxkeys);
    }
    if (request.requestPayer) {
      req.setRequestPayer(request.requestPayer);
    }
    return new Promise((resolve, reject) => {
      this.ossClient.listObjects(req, this.createMetadata(request), (err, response) => {
        if (err) {
          return reject(err);
        }
        return resolve(response!.toObject());
      });
    })
  }

  async signUrl(request: SignUrlRequest): Promise<SignURLOutput.AsObject> {
    const req = new SignURLInput();
    req.setStoreName(request.storeName);
    req.setBucket(request.bucket);
    req.setKey(request.key);
    req.setMethod(request.method);
    req.setExpiredInSec(request.expiredInSec);
    return new Promise((resolve, reject) => {
      this.ossClient.signURL(req, this.createMetadata(request), (err, response) => {
        if (err) {
          return reject(err);
        }
        return resolve(response!.toObject());
      });
    })
  }
}
