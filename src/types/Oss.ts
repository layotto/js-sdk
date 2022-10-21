import { RequestWithMeta } from './common';
import { Readable } from 'stream';
import { GetObjectOutput } from '../../proto/extension/v1/s3/oss_pb';

export type PutObjectRequest = RequestWithMeta<{
  storeName: string;
  bucket: string;
  body: Readable;
  key: string;
  acl?: string;
  bucketKeyEnabled?: boolean;
  cacheControl?: string;
  contentDisposition?: string;
  contentEncoding?: string;
  expires?: number;
  serverSideEncryption?: string;
  signedUrl?: string;
}>;

export interface PutObjectResponse {
  bucketKeyEnabled: boolean;
  etag: string;
  expiration: string;
  requestCharged: string;
  versionId: string;
}

export type GetObjectRequest = RequestWithMeta<{
  storeName: string;
  bucket: string;
  key: string;
  expectedBucketOwner?: string;
  ifMatch?: string;
  ifModifiedSince?: number;
  ifNoneMatch?: string;
  ifUnmodifiedSince?: number;
  partNumber?: number;
  start?: number;
  end?: number;
  requestPayer?: string;
  responseCacheControl?: string;
  responseContentDisposition?: string;
  responseContentEncoding?: string;
  responseContentLanguage?: string;
  responseContentType?: string;
  responseExpires?: string;
  sseCustomerAlgorithm?: string;
  sseCustomerKey?: string;
  sseCustomerKeyMd5?: string;
  versionId?: string;
  acceptEncoding?: string;
  signedUrl?: string;
}>;

export interface GetObjectResponse extends GetObjectOutput.AsObject {
  object: Readable;
}

export interface CopySource {
  copySourceBucket: string;
  copySourceKey: string;
  copySourceVersionId?: string;
}

export type CopyObjectRequest = RequestWithMeta<{
  storeName: string;
  bucket: string;
  key: string;
  copySource: CopySource;
  expires?: number;
  metadataDirective?: string;
}>;

export type ListObjectsRequest = RequestWithMeta<{
  storeName: string;
  bucket: string;
  prefix?: string;
  delimiter?: string;
  encodingType?: string;
  expectedBucketOwner?: string;
  marker?: string;
  maxkeys?: number;
  requestPayer?: string;
}>;

export type DeleteObjectRequest = RequestWithMeta<{
  storeName: string;
  bucket: string;
  key: string;
  requestPayer?: string;
  versionId?: string;
}>;

export type HeadObjectRequest = RequestWithMeta<{
  storeName: string;
  bucket: string;
  key: string;
  checksumMode?: string;
  expectedBucketOwner?: string;
  ifMatch?: string;
  ifModifiedSince?: number;
  ifNoneMatch?: string;
  ifUnmodifiedSince?: number;
  partNumber?: number;
  requestPayer?: string;
  sseCustomerAlgorithm?: string;
  sseCustomerKey?: string;
  sseCustomerKeyMd5?: string;
  versionId?: string;
  withDetails?: boolean;
}>;
