import { Readable, PassThrough, Writable } from 'node:stream';
import { pipelinePromise } from '../utils';
import {
  CopyObjectRequest,
  DeleteObjectRequest,
  DeleteObjectsRequest,
  IsObjectExistRequest,
  GetObjectRequest,
  GetObjectResponse,
  HeadObjectRequest,
  ListObjectsRequest,
  ListObjectVersionsRequest,
  PutObjectRequest,
  PutObjectResponse,
  SignUrlRequest,
  PutObjectTaggingRequest,
  DeleteObjectTaggingRequest,
  GetObjectTaggingRequest,
  GetObjectCannedAclRequest,
  PutObjectCannedAclRequest,
  CreateMultipartUploadRequest,
  UploadPartRequest,
  UploadPartCopyRequest,
  CompleteMultipartUploadRequest,
  AbortMultipartUploadRequest,
  ListMultipartUploadsRequest,
  ListPartsRequest,
  AppendObjectRequest,
  RestoreObjectRequest,
  UpdateBandwidthRateLimitRequest,
} from '../types/Oss';
import {
  AbortMultipartUploadInput,
  AbortMultipartUploadOutput,
  AppendObjectInput,
  AppendObjectOutput,
  CompleteMultipartUploadInput,
  CompleteMultipartUploadOutput,
  CompletedMultipartUpload,
  CompletedPart,
  CopyObjectInput,
  CopyObjectOutput,
  CopySource,
  CreateMultipartUploadInput,
  CreateMultipartUploadOutput,
  Delete,
  DeleteObjectInput,
  DeleteObjectOutput,
  DeleteObjectsInput,
  DeleteObjectsOutput,
  DeleteObjectTaggingInput,
  DeleteObjectTaggingOutput,
  GetObjectCannedAclInput,
  GetObjectCannedAclOutput,
  GetObjectInput,
  GetObjectOutput,
  GetObjectTaggingInput,
  GetObjectTaggingOutput,
  HeadObjectInput,
  HeadObjectOutput,
  IsObjectExistInput,
  IsObjectExistOutput,
  ListMultipartUploadsInput,
  ListMultipartUploadsOutput,
  ListObjectsInput,
  ListObjectsOutput,
  ListObjectVersionsInput,
  ListObjectVersionsOutput,
  ListPartsInput,
  ListPartsOutput,
  ObjectIdentifier,
  PutObjectCannedAclInput,
  PutObjectCannedAclOutput,
  PutObjectInput,
  PutObjectOutput,
  PutObjectTaggingInput,
  PutObjectTaggingOutput,
  RestoreObjectInput,
  RestoreObjectOutput,
  RestoreRequest,
  SignURLInput,
  SignURLOutput,
  UpdateBandwidthRateLimitInput,
  UploadPartCopyInput,
  UploadPartCopyOutput,
  UploadPartInput,
  UploadPartOutput,
} from '../../proto/extension/v1/s3/oss_pb';
import { ObjectStorageServiceClient } from '../../proto/extension/v1/s3/oss_grpc_pb';
import { API, APIOptions } from './API';

export interface OssOptions {
  // set default metadata on every request
  defaultRequestMeta?: Record<string, string>;
}

export class Oss extends API {
  private readonly ossClient: ObjectStorageServiceClient;
  private readonly options: OssOptions;

  constructor(ossClient: ObjectStorageServiceClient, options: OssOptions, apiOptions?: APIOptions) {
    super(apiOptions);
    this.ossClient = ossClient;
    this.options = options;
  }

  // https://github.com/node-modules/oss-client/blob/master/src/OSSObject.ts#L984
  #objectKey(key: string) {
    return key.replace(/^\/+/, '');
  }

  private async* putObjectIterator(request: PutObjectRequest): AsyncGenerator<PutObjectInput> {
    const key = this.#objectKey(request.key);
    let hasChunk = false;
    for await (const chunk of request.body) {
      hasChunk = true;
      const req = new PutObjectInput();
      req.setStoreName(request.storeName);
      req.setBucket(request.bucket);
      req.setKey(key);
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

    if (!hasChunk) {
      // put empty file
      const req = new PutObjectInput();
      req.setStoreName(request.storeName);
      req.setBucket(request.bucket);
      req.setKey(key);
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
    const metadata = this.createMetadata(request, this.options.defaultRequestMeta);
    const writeStream = this.ossClient.putObject(metadata, (err, res) => {
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

  private async* getObjectBufferIterator(firstChunk: GetObjectOutput | undefined, request: AsyncGenerator<GetObjectOutput>): AsyncGenerator<Uint8Array> {
    if (firstChunk) {
      yield firstChunk.getBody_asU8();
    }
    for await (const chunk of request) {
      yield chunk.getBody_asU8();
    }
  }

  async get(request: GetObjectRequest): Promise<GetObjectResponse> {
    const key = this.#objectKey(request.key);
    const req = new GetObjectInput();
    req.setStoreName(request.storeName);
    req.setBucket(request.bucket);
    req.setKey(key);
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
    if (request.start) {
      req.setStart(request.start);
    }
    if (request.end) {
      req.setEnd(request.end);
    }
    if (request.requestPayer) {
      req.setRequestPayer(request.requestPayer);
    }
    if (request.responseCacheControl) {
      req.setResponseCacheControl(request.responseCacheControl);
    }
    if (request.responseContentDisposition) {
      req.setResponseContentDisposition(request.responseContentDisposition);
    }
    if (request.responseContentEncoding) {
      req.setResponseContentEncoding(request.responseContentEncoding);
    }
    if (request.responseContentLanguage) {
      req.setResponseContentLanguage(request.responseContentLanguage);
    }
    if (request.responseContentType) {
      req.setResponseContentType(request.responseContentType);
    }
    if (request.responseExpires) {
      req.setResponseExpires(request.responseExpires);
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
    if (request.acceptEncoding) {
      req.setAcceptEncoding(request.acceptEncoding);
    }
    if (request.signedUrl) {
      req.setSignedUrl(request.signedUrl);
    }
    const metadata = this.createMetadata(request, this.options.defaultRequestMeta);
    const callStream = this.ossClient.getObject(req, metadata);
    const getObjectIterator = this.getObjectIterator(callStream);
    const firstChunk = (await getObjectIterator.next()).value;
    const getObjectBufIterator = this.getObjectBufferIterator(firstChunk, getObjectIterator);
    return {
      ...firstChunk?.toObject(),
      object: PassThrough.from(getObjectBufIterator),
    };

  }

  async copy(request: CopyObjectRequest): Promise<CopyObjectOutput.AsObject> {
    const key = this.#objectKey(request.key);
    const req = new CopyObjectInput();
    req.setStoreName(request.storeName);
    req.setBucket(request.bucket);
    req.setKey(key);
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
    const metadata = this.createMetadata(request, this.options.defaultRequestMeta);
    return new Promise((resolve, reject) => {
      this.ossClient.copyObject(req, metadata, (err, response) => {
        if (err) {
          return reject(err);
        }
        return resolve(response!.toObject());
      });
    });
  }

  async head(request: HeadObjectRequest): Promise<HeadObjectOutput.AsObject> {
    const key = this.#objectKey(request.key);
    const req = new HeadObjectInput();
    req.setStoreName(request.storeName);
    req.setBucket(request.bucket);
    req.setKey(key);
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
    const metadata = this.createMetadata(request, this.options.defaultRequestMeta);
    return new Promise((resolve, reject) => {
      this.ossClient.headObject(req, metadata, (err, response) => {
        if (err) {
          return reject(err);
        }
        return resolve(response!.toObject());
      });
    });
  }

  async delete(request: DeleteObjectRequest): Promise<DeleteObjectOutput.AsObject> {
    const key = this.#objectKey(request.key);
    const req = new DeleteObjectInput();
    req.setStoreName(request.storeName);
    req.setBucket(request.bucket);
    req.setKey(key);
    if (request.requestPayer) {
      req.setRequestPayer(request.requestPayer);
    }
    if (request.versionId) {
      req.setVersionId(request.versionId);
    }

    const metadata = this.createMetadata(request, this.options.defaultRequestMeta);
    return new Promise((resolve, reject) => {
      this.ossClient.deleteObject(req, metadata, (err, response) => {
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

    const metadata = this.createMetadata(request, this.options.defaultRequestMeta);
    return new Promise((resolve, reject) => {
      this.ossClient.listObjects(req, metadata, (err, response) => {
        if (err) {
          return reject(err);
        }
        return resolve(response!.toObject());
      });
    });
  }

  async signUrl(request: SignUrlRequest): Promise<SignURLOutput.AsObject> {
    const key = this.#objectKey(request.key);
    const req = new SignURLInput();
    req.setStoreName(request.storeName);
    req.setBucket(request.bucket);
    req.setKey(key);
    req.setMethod(request.method);
    req.setExpiredInSec(request.expiredInSec);

    const metadata = this.createMetadata(request, this.options.defaultRequestMeta);
    return new Promise((resolve, reject) => {
      this.ossClient.signURL(req, metadata, (err, response) => {
        if (err) {
          return reject(err);
        }
        return resolve(response!.toObject());
      });
    });
  }

  async deleteObjects(request: DeleteObjectsRequest): Promise<DeleteObjectsOutput.AsObject> {
    const req = new DeleteObjectsInput();
    req.setStoreName(request.storeName);
    req.setBucket(request.bucket);

    const deleteObj = new Delete();
    const objectIdentifiers = request.objects.map(obj => {
      const identifier = new ObjectIdentifier();
      identifier.setKey(this.#objectKey(obj.key));
      if (obj.versionId) {
        identifier.setVersionId(obj.versionId);
      }
      return identifier;
    });
    deleteObj.setObjectsList(objectIdentifiers);
    if (request.quiet !== undefined) {
      deleteObj.setQuiet(request.quiet);
    }
    req.setDelete(deleteObj);

    if (request.requestPayer) {
      req.setRequestPayer(request.requestPayer);
    }

    const metadata = this.createMetadata(request, this.options.defaultRequestMeta);
    return new Promise((resolve, reject) => {
      this.ossClient.deleteObjects(req, metadata, (err, response) => {
        if (err) {
          return reject(err);
        }
        return resolve(response!.toObject());
      });
    });
  }

  async isObjectExist(request: IsObjectExistRequest): Promise<IsObjectExistOutput.AsObject> {
    const key = this.#objectKey(request.key);
    const req = new IsObjectExistInput();
    req.setStoreName(request.storeName);
    req.setBucket(request.bucket);
    req.setKey(key);
    if (request.versionId) {
      req.setVersionId(request.versionId);
    }

    const metadata = this.createMetadata(request, this.options.defaultRequestMeta);
    return new Promise((resolve, reject) => {
      this.ossClient.isObjectExist(req, metadata, (err, response) => {
        if (err) {
          return reject(err);
        }
        return resolve(response!.toObject());
      });
    });
  }

  async listObjectVersions(request: ListObjectVersionsRequest): Promise<ListObjectVersionsOutput.AsObject> {
    const req = new ListObjectVersionsInput();
    req.setStoreName(request.storeName);
    req.setBucket(request.bucket);
    if (request.delimiter) {
      req.setDelimiter(request.delimiter);
    }
    if (request.encodingType) {
      req.setEncodingType(request.encodingType);
    }
    if (request.expectedBucketOwner) {
      req.setExpectedBucketOwner(request.expectedBucketOwner);
    }
    if (request.keyMarker) {
      req.setKeyMarker(request.keyMarker);
    }
    if (request.maxKeys) {
      req.setMaxKeys(request.maxKeys);
    }
    if (request.prefix) {
      req.setPrefix(request.prefix);
    }
    if (request.versionIdMarker) {
      req.setVersionIdMarker(request.versionIdMarker);
    }

    const metadata = this.createMetadata(request, this.options.defaultRequestMeta);
    return new Promise((resolve, reject) => {
      this.ossClient.listObjectVersions(req, metadata, (err, response) => {
        if (err) {
          return reject(err);
        }
        return resolve(response!.toObject());
      });
    });
  }

  async putObjectTagging(request: PutObjectTaggingRequest): Promise<PutObjectTaggingOutput.AsObject> {
    const key = this.#objectKey(request.key);
    const req = new PutObjectTaggingInput();
    req.setStoreName(request.storeName);
    req.setBucket(request.bucket);
    req.setKey(key);

    const tagsMap = req.getTagsMap();
    Object.entries(request.tags).forEach(([ k, v ]) => {
      tagsMap.set(k, v);
    });

    if (request.versionId) {
      req.setVersionId(request.versionId);
    }

    const metadata = this.createMetadata(request, this.options.defaultRequestMeta);
    return new Promise((resolve, reject) => {
      this.ossClient.putObjectTagging(req, metadata, (err, response) => {
        if (err) {
          return reject(err);
        }
        return resolve(response!.toObject());
      });
    });
  }

  async deleteObjectTagging(request: DeleteObjectTaggingRequest): Promise<DeleteObjectTaggingOutput.AsObject> {
    const key = this.#objectKey(request.key);
    const req = new DeleteObjectTaggingInput();
    req.setStoreName(request.storeName);
    req.setBucket(request.bucket);
    req.setKey(key);
    if (request.versionId) {
      req.setVersionId(request.versionId);
    }
    if (request.expectedBucketOwner) {
      req.setExpectedBucketOwner(request.expectedBucketOwner);
    }

    const metadata = this.createMetadata(request, this.options.defaultRequestMeta);
    return new Promise((resolve, reject) => {
      this.ossClient.deleteObjectTagging(req, metadata, (err, response) => {
        if (err) {
          return reject(err);
        }
        return resolve(response!.toObject());
      });
    });
  }

  async getObjectTagging(request: GetObjectTaggingRequest): Promise<GetObjectTaggingOutput.AsObject> {
    const key = this.#objectKey(request.key);
    const req = new GetObjectTaggingInput();
    req.setStoreName(request.storeName);
    req.setBucket(request.bucket);
    req.setKey(key);
    if (request.versionId) {
      req.setVersionId(request.versionId);
    }
    if (request.expectedBucketOwner) {
      req.setExpectedBucketOwner(request.expectedBucketOwner);
    }
    if (request.requestPayer) {
      req.setRequestPayer(request.requestPayer);
    }

    const metadata = this.createMetadata(request, this.options.defaultRequestMeta);
    return new Promise((resolve, reject) => {
      this.ossClient.getObjectTagging(req, metadata, (err, response) => {
        if (err) {
          return reject(err);
        }
        return resolve(response!.toObject());
      });
    });
  }

  async getObjectCannedAcl(request: GetObjectCannedAclRequest): Promise<GetObjectCannedAclOutput.AsObject> {
    const key = this.#objectKey(request.key);
    const req = new GetObjectCannedAclInput();
    req.setStoreName(request.storeName);
    req.setBucket(request.bucket);
    req.setKey(key);
    if (request.versionId) {
      req.setVersionId(request.versionId);
    }

    const metadata = this.createMetadata(request, this.options.defaultRequestMeta);
    return new Promise((resolve, reject) => {
      this.ossClient.getObjectCannedAcl(req, metadata, (err, response) => {
        if (err) {
          return reject(err);
        }
        return resolve(response!.toObject());
      });
    });
  }

  async putObjectCannedAcl(request: PutObjectCannedAclRequest): Promise<PutObjectCannedAclOutput.AsObject> {
    const key = this.#objectKey(request.key);
    const req = new PutObjectCannedAclInput();
    req.setStoreName(request.storeName);
    req.setBucket(request.bucket);
    req.setKey(key);
    req.setAcl(request.acl);
    if (request.versionId) {
      req.setVersionId(request.versionId);
    }

    const metadata = this.createMetadata(request, this.options.defaultRequestMeta);
    return new Promise((resolve, reject) => {
      this.ossClient.putObjectCannedAcl(req, metadata, (err, response) => {
        if (err) {
          return reject(err);
        }
        return resolve(response!.toObject());
      });
    });
  }

  async createMultipartUpload(request: CreateMultipartUploadRequest): Promise<CreateMultipartUploadOutput.AsObject> {
    const key = this.#objectKey(request.key);
    const req = new CreateMultipartUploadInput();
    req.setStoreName(request.storeName);
    req.setBucket(request.bucket);
    req.setKey(key);
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
    if (request.contentLanguage) {
      req.setContentLanguage(request.contentLanguage);
    }
    if (request.contentType) {
      req.setContentType(request.contentType);
    }
    if (request.expectedBucketOwner) {
      req.setExpectedBucketOwner(request.expectedBucketOwner);
    }
    if (request.expires) {
      req.setExpires(request.expires);
    }
    if (request.serverSideEncryption) {
      req.setServerSideEncryption(request.serverSideEncryption);
    }
    if (request.storageClass) {
      req.setStorageClass(request.storageClass);
    }

    const metadata = this.createMetadata(request, this.options.defaultRequestMeta);
    return new Promise((resolve, reject) => {
      this.ossClient.createMultipartUpload(req, metadata, (err, response) => {
        if (err) {
          return reject(err);
        }
        return resolve(response!.toObject());
      });
    });
  }

  private async* uploadPartIterator(request: UploadPartRequest): AsyncGenerator<UploadPartInput> {
    const key = this.#objectKey(request.key);
    let hasChunk = false;
    for await (const chunk of request.body) {
      hasChunk = true;
      const req = new UploadPartInput();
      req.setStoreName(request.storeName);
      req.setBucket(request.bucket);
      req.setKey(key);
      req.setContentLength(request.contentLength);
      req.setPartNumber(request.partNumber);
      req.setUploadId(request.uploadId);
      if (request.contentMd5) {
        req.setContentMd5(request.contentMd5);
      }
      if (request.expectedBucketOwner) {
        req.setExpectedBucketOwner(request.expectedBucketOwner);
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
      req.setBody(chunk);
      yield req;
    }

    if (!hasChunk) {
      // upload empty part
      const req = new UploadPartInput();
      req.setStoreName(request.storeName);
      req.setBucket(request.bucket);
      req.setKey(key);
      req.setContentLength(request.contentLength);
      req.setPartNumber(request.partNumber);
      req.setUploadId(request.uploadId);
      if (request.contentMd5) {
        req.setContentMd5(request.contentMd5);
      }
      if (request.expectedBucketOwner) {
        req.setExpectedBucketOwner(request.expectedBucketOwner);
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
      yield req;
    }
  }

  async uploadPart(request: UploadPartRequest): Promise<UploadPartOutput.AsObject> {
    let resolve;
    let reject;
    const promise = new Promise<UploadPartOutput.AsObject>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    const metadata = this.createMetadata(request, this.options.defaultRequestMeta);
    const writeStream = this.ossClient.uploadPart(metadata, (err, res) => {
      if (err) {
        return reject(err);
      }
      return resolve(res.toObject());
    });
    const uploadPartIterator = this.uploadPartIterator(request);
    await pipelinePromise<AsyncGenerator<UploadPartInput>, Writable>(uploadPartIterator, writeStream);

    return promise;
  }

  async uploadPartCopy(request: UploadPartCopyRequest): Promise<UploadPartCopyOutput.AsObject> {
    const key = this.#objectKey(request.key);
    const req = new UploadPartCopyInput();
    req.setStoreName(request.storeName);
    req.setBucket(request.bucket);
    req.setKey(key);
    req.setPartNumber(request.partNumber);
    req.setUploadId(request.uploadId);

    const copySource = new CopySource();
    copySource.setCopySourceBucket(request.copySource.copySourceBucket);
    copySource.setCopySourceKey(request.copySource.copySourceKey);
    if (request.copySource.copySourceVersionId) {
      copySource.setCopySourceVersionId(request.copySource.copySourceVersionId);
    }
    req.setCopySource(copySource);

    if (request.startPosition !== undefined) {
      req.setStartPosition(request.startPosition);
    }
    if (request.partSize !== undefined) {
      req.setPartSize(request.partSize);
    }

    const metadata = this.createMetadata(request, this.options.defaultRequestMeta);
    return new Promise((resolve, reject) => {
      this.ossClient.uploadPartCopy(req, metadata, (err, response) => {
        if (err) {
          return reject(err);
        }
        return resolve(response!.toObject());
      });
    });
  }

  async completeMultipartUpload(request: CompleteMultipartUploadRequest): Promise<CompleteMultipartUploadOutput.AsObject> {
    const key = this.#objectKey(request.key);
    const req = new CompleteMultipartUploadInput();
    req.setStoreName(request.storeName);
    req.setBucket(request.bucket);
    req.setKey(key);
    req.setUploadId(request.uploadId);

    const multipartUpload = new CompletedMultipartUpload();
    const parts = request.parts.map(part => {
      const completedPart = new CompletedPart();
      completedPart.setEtag(part.etag);
      completedPart.setPartNumber(part.partNumber);
      return completedPart;
    });
    multipartUpload.setPartsList(parts);
    req.setMultipartUpload(multipartUpload);

    if (request.requestPayer) {
      req.setRequestPayer(request.requestPayer);
    }
    if (request.expectedBucketOwner) {
      req.setExpectedBucketOwner(request.expectedBucketOwner);
    }

    const metadata = this.createMetadata(request, this.options.defaultRequestMeta);
    return new Promise((resolve, reject) => {
      this.ossClient.completeMultipartUpload(req, metadata, (err, response) => {
        if (err) {
          return reject(err);
        }
        return resolve(response!.toObject());
      });
    });
  }

  async abortMultipartUpload(request: AbortMultipartUploadRequest): Promise<AbortMultipartUploadOutput.AsObject> {
    const key = this.#objectKey(request.key);
    const req = new AbortMultipartUploadInput();
    req.setStoreName(request.storeName);
    req.setBucket(request.bucket);
    req.setKey(key);
    req.setUploadId(request.uploadId);
    if (request.expectedBucketOwner) {
      req.setExpectedBucketOwner(request.expectedBucketOwner);
    }
    if (request.requestPayer) {
      req.setRequestPayer(request.requestPayer);
    }

    const metadata = this.createMetadata(request, this.options.defaultRequestMeta);
    return new Promise((resolve, reject) => {
      this.ossClient.abortMultipartUpload(req, metadata, (err, response) => {
        if (err) {
          return reject(err);
        }
        return resolve(response!.toObject());
      });
    });
  }

  async listMultipartUploads(request: ListMultipartUploadsRequest): Promise<ListMultipartUploadsOutput.AsObject> {
    const req = new ListMultipartUploadsInput();
    req.setStoreName(request.storeName);
    req.setBucket(request.bucket);
    if (request.delimiter) {
      req.setDelimiter(request.delimiter);
    }
    if (request.encodingType) {
      req.setEncodingType(request.encodingType);
    }
    if (request.expectedBucketOwner) {
      req.setExpectedBucketOwner(request.expectedBucketOwner);
    }
    if (request.keyMarker) {
      req.setKeyMarker(request.keyMarker);
    }
    if (request.maxUploads) {
      req.setMaxUploads(request.maxUploads);
    }
    if (request.prefix) {
      req.setPrefix(request.prefix);
    }
    if (request.uploadIdMarker) {
      req.setUploadIdMarker(request.uploadIdMarker);
    }

    const metadata = this.createMetadata(request, this.options.defaultRequestMeta);
    return new Promise((resolve, reject) => {
      this.ossClient.listMultipartUploads(req, metadata, (err, response) => {
        if (err) {
          return reject(err);
        }
        return resolve(response!.toObject());
      });
    });
  }

  async listParts(request: ListPartsRequest): Promise<ListPartsOutput.AsObject> {
    const key = this.#objectKey(request.key);
    const req = new ListPartsInput();
    req.setStoreName(request.storeName);
    req.setBucket(request.bucket);
    req.setKey(key);
    req.setUploadId(request.uploadId);
    if (request.expectedBucketOwner) {
      req.setExpectedBucketOwner(request.expectedBucketOwner);
    }
    if (request.maxParts) {
      req.setMaxParts(request.maxParts);
    }
    if (request.partNumberMarker) {
      req.setPartNumberMarker(request.partNumberMarker);
    }
    if (request.requestPayer) {
      req.setRequestPayer(request.requestPayer);
    }

    const metadata = this.createMetadata(request, this.options.defaultRequestMeta);
    return new Promise((resolve, reject) => {
      this.ossClient.listParts(req, metadata, (err, response) => {
        if (err) {
          return reject(err);
        }
        return resolve(response!.toObject());
      });
    });
  }

  private async* appendObjectIterator(request: AppendObjectRequest): AsyncGenerator<AppendObjectInput> {
    const key = this.#objectKey(request.key);
    let hasChunk = false;
    for await (const chunk of request.body) {
      hasChunk = true;
      const req = new AppendObjectInput();
      req.setStoreName(request.storeName);
      req.setBucket(request.bucket);
      req.setKey(key);
      if (request.position) {
        req.setPosition(request.position);
      }
      if (request.acl) {
        req.setAcl(request.acl);
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
      if (request.contentMd5) {
        req.setContentMd5(request.contentMd5);
      }
      if (request.expires) {
        req.setExpires(request.expires);
      }
      if (request.storageClass) {
        req.setStorageClass(request.storageClass);
      }
      if (request.serverSideEncryption) {
        req.setServerSideEncryption(request.serverSideEncryption);
      }
      if (request.meta) {
        req.setMeta(request.meta);
      }
      if (request.tags) {
        const tagsMap = req.getTagsMap();
        Object.entries(request.tags).forEach(([ k, v ]) => {
          tagsMap.set(k, v);
        });
      }
      req.setBody(chunk);
      yield req;
    }

    if (!hasChunk) {
      // append empty content
      const req = new AppendObjectInput();
      req.setStoreName(request.storeName);
      req.setBucket(request.bucket);
      req.setKey(key);
      if (request.position) {
        req.setPosition(request.position);
      }
      if (request.acl) {
        req.setAcl(request.acl);
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
      if (request.contentMd5) {
        req.setContentMd5(request.contentMd5);
      }
      if (request.expires) {
        req.setExpires(request.expires);
      }
      if (request.storageClass) {
        req.setStorageClass(request.storageClass);
      }
      if (request.serverSideEncryption) {
        req.setServerSideEncryption(request.serverSideEncryption);
      }
      if (request.meta) {
        req.setMeta(request.meta);
      }
      if (request.tags) {
        const tagsMap = req.getTagsMap();
        Object.entries(request.tags).forEach(([ k, v ]) => {
          tagsMap.set(k, v);
        });
      }
      yield req;
    }
  }

  async appendObject(request: AppendObjectRequest): Promise<AppendObjectOutput.AsObject> {
    let resolve;
    let reject;
    const promise = new Promise<AppendObjectOutput.AsObject>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    const metadata = this.createMetadata(request, this.options.defaultRequestMeta);
    const writeStream = this.ossClient.appendObject(metadata, (err, res) => {
      if (err) {
        return reject(err);
      }
      return resolve(res.toObject());
    });
    const appendObjectIterator = this.appendObjectIterator(request);
    await pipelinePromise<AsyncGenerator<AppendObjectInput>, Writable>(appendObjectIterator, writeStream);

    return promise;
  }

  async restoreObject(request: RestoreObjectRequest): Promise<RestoreObjectOutput.AsObject> {
    const key = this.#objectKey(request.key);
    const req = new RestoreObjectInput();
    req.setStoreName(request.storeName);
    req.setBucket(request.bucket);
    req.setKey(key);

    if (request.days !== undefined || request.tier !== undefined) {
      const restoreRequest = new RestoreRequest();
      if (request.days !== undefined) {
        restoreRequest.setDays(request.days);
      }
      if (request.tier) {
        restoreRequest.setTier(request.tier);
      }
      req.setRestoreRequest(restoreRequest);
    }

    if (request.versionId) {
      req.setVersionId(request.versionId);
    }

    const metadata = this.createMetadata(request, this.options.defaultRequestMeta);
    return new Promise((resolve, reject) => {
      this.ossClient.restoreObject(req, metadata, (err, response) => {
        if (err) {
          return reject(err);
        }
        return resolve(response!.toObject());
      });
    });
  }

  async updateDownloadBandwidthRateLimit(request: UpdateBandwidthRateLimitRequest): Promise<void> {
    const req = new UpdateBandwidthRateLimitInput();
    req.setStoreName(request.storeName);
    req.setAverageRateLimitInBitsPerSec(request.averageRateLimitInBitsPerSec);

    const metadata = this.createMetadata(request, this.options.defaultRequestMeta);
    return new Promise((resolve, reject) => {
      this.ossClient.updateDownloadBandwidthRateLimit(req, metadata, err => {
        if (err) {
          return reject(err);
        }
        return resolve();
      });
    });
  }

  async updateUploadBandwidthRateLimit(request: UpdateBandwidthRateLimitRequest): Promise<void> {
    const req = new UpdateBandwidthRateLimitInput();
    req.setStoreName(request.storeName);
    req.setAverageRateLimitInBitsPerSec(request.averageRateLimitInBitsPerSec);

    const metadata = this.createMetadata(request, this.options.defaultRequestMeta);
    return new Promise((resolve, reject) => {
      this.ossClient.updateUploadBandwidthRateLimit(req, metadata, err => {
        if (err) {
          return reject(err);
        }
        return resolve();
      });
    });
  }
}
