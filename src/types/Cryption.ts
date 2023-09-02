import { RequestWithMeta } from './common';

export type EncryptRequest = RequestWithMeta<{
  plainText: Uint8Array | string;
  keyId?: string;
}>;

export type DecryptRequest = RequestWithMeta<{
  cipherText: Uint8Array | string;
}>;

export type DecryptResponse = {
  plainText: Uint8Array;
  keyId: string,
  keyVersionId: string,
  requestId: string,
};
