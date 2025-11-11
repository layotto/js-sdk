import { Readable } from 'node:stream';
import { RequestWithMeta } from './common';
import { GetObjectOutput } from '../../proto/extension/v1/s3/oss_pb';

export type PutObjectRequest = RequestWithMeta<{
  storeName: string;
  bucket: string;
  body: Readable;
  contentLength: number;
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
  metadataMap: Array<[string, string]>;
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


export type SignUrlRequest = RequestWithMeta<{
  storeName: string;
  bucket: string;
  key: string;
  method: string;
  expiredInSec: number;
}>;

export interface ObjectIdentifier {
  key: string;
  versionId?: string;
}

export type DeleteObjectsRequest = RequestWithMeta<{
  storeName: string;
  bucket: string;
  objects: ObjectIdentifier[];
  quiet?: boolean;
  requestPayer?: string;
}>;

export type IsObjectExistRequest = RequestWithMeta<{
  storeName: string;
  bucket: string;
  key: string;
  versionId?: string;
}>;

export type PutObjectTaggingRequest = RequestWithMeta<{
  storeName: string;
  bucket: string;
  key: string;
  tags: Record<string, string>;
  versionId?: string;
}>;

export type DeleteObjectTaggingRequest = RequestWithMeta<{
  storeName: string;
  bucket: string;
  key: string;
  versionId?: string;
  expectedBucketOwner?: string;
}>;

export type GetObjectTaggingRequest = RequestWithMeta<{
  storeName: string;
  bucket: string;
  key: string;
  versionId?: string;
  expectedBucketOwner?: string;
  requestPayer?: string;
}>;

export type GetObjectCannedAclRequest = RequestWithMeta<{
  storeName: string;
  bucket: string;
  key: string;
  versionId?: string;
}>;

export type PutObjectCannedAclRequest = RequestWithMeta<{
  storeName: string;
  bucket: string;
  key: string;
  acl: string;
  versionId?: string;
}>;

export type CreateMultipartUploadRequest = RequestWithMeta<{
  storeName: string;
  bucket: string;
  key: string;
  acl?: string;
  bucketKeyEnabled?: boolean;
  cacheControl?: string;
  contentDisposition?: string;
  contentEncoding?: string;
  contentLanguage?: string;
  contentType?: string;
  expectedBucketOwner?: string;
  expires?: number;
  serverSideEncryption?: string;
  storageClass?: string;
}>;

export type UploadPartRequest = RequestWithMeta<{
  storeName: string;
  bucket: string;
  key: string;
  body: Readable;
  contentLength: number;
  partNumber: number;
  uploadId: string;
  contentMd5?: string;
  expectedBucketOwner?: string;
  requestPayer?: string;
  sseCustomerAlgorithm?: string;
  sseCustomerKey?: string;
  sseCustomerKeyMd5?: string;
}>;

export interface CompletedPart {
  etag: string;
  partNumber: number;
}

export type CompleteMultipartUploadRequest = RequestWithMeta<{
  storeName: string;
  bucket: string;
  key: string;
  uploadId: string;
  parts: CompletedPart[];
  requestPayer?: string;
  expectedBucketOwner?: string;
}>;

export type AbortMultipartUploadRequest = RequestWithMeta<{
  storeName: string;
  bucket: string;
  key: string;
  uploadId: string;
  expectedBucketOwner?: string;
  requestPayer?: string;
}>;

export type ListMultipartUploadsRequest = RequestWithMeta<{
  storeName: string;
  bucket: string;
  delimiter?: string;
  encodingType?: string;
  expectedBucketOwner?: string;
  keyMarker?: string;
  maxUploads?: number;
  prefix?: string;
  uploadIdMarker?: string;
}>;

export type ListPartsRequest = RequestWithMeta<{
  storeName: string;
  bucket: string;
  key: string;
  uploadId: string;
  expectedBucketOwner?: string;
  maxParts?: number;
  partNumberMarker?: number;
  requestPayer?: string;
}>;

export type UploadPartCopyRequest = RequestWithMeta<{
  storeName: string;
  bucket: string;
  key: string;
  copySource: CopySource;
  partNumber: number;
  uploadId: string;
  startPosition?: number;
  partSize?: number;
}>;

export type ListObjectVersionsRequest = RequestWithMeta<{
  storeName: string;
  bucket: string;
  delimiter?: string;
  encodingType?: string;
  expectedBucketOwner?: string;
  keyMarker?: string;
  maxKeys?: number;
  prefix?: string;
  versionIdMarker?: string;
}>;

export type AppendObjectRequest = RequestWithMeta<{
  storeName: string;
  bucket: string;
  key: string;
  body: Readable;
  position?: number;
  acl?: string;
  cacheControl?: string;
  contentDisposition?: string;
  contentEncoding?: string;
  contentMd5?: string;
  expires?: number;
  storageClass?: string;
  serverSideEncryption?: string;
  meta?: string;
  tags?: Record<string, string>;
}>;

export type RestoreObjectRequest = RequestWithMeta<{
  storeName: string;
  bucket: string;
  key: string;
  days?: number;
  tier?: string;
  versionId?: string;
}>;

export type UpdateBandwidthRateLimitRequest = RequestWithMeta<{
  storeName: string;
  averageRateLimitInBitsPerSec: number;
}>;
