import {
  EncryptRequest as EncryptRequestPB,
  EncryptResponse,
  DecryptRequest as DecryptRequestPB,
  DecryptResponse as DecryptResponsePB,
} from '../../proto/extension/v1/cryption/cryption_pb';
import { CryptionServiceClient } from '../../proto/extension/v1/cryption/cryption_grpc_pb';
import { API } from './API';
import { RequestWithMeta } from '../types/common';

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

export type CryptionOptions = {
  componentName: string;
  // set default metadata on every request
  defaultRequestMeta?: Record<string, string>;
};

export default class Cryption extends API {
  private readonly cryptionClient: CryptionServiceClient;
  private readonly options: CryptionOptions;

  constructor(cryptionClient: CryptionServiceClient, options: CryptionOptions) {
    super();
    this.options = options;
    this.cryptionClient = cryptionClient;
  }

  async encrypt(request: EncryptRequest): Promise<EncryptResponse.AsObject> {
    const req = new EncryptRequestPB();
    req.setComponentName(this.options.componentName);
    let plainText = request.plainText;
    if (typeof plainText === 'string') {
      plainText = Buffer.from(plainText);
    }
    req.setPlainText(plainText);
    if (request.keyId) {
      req.setKeyId(request.keyId);
    }

    const metadata = this.createMetadata(request, this.options.defaultRequestMeta);
    return new Promise((resolve, reject) => {
      this.cryptionClient.encrypt(req, metadata, (err, res: EncryptResponse) => {
        if (err) return reject(err);
        resolve(res.toObject());
      });
    });
  }

  async decrypt(request: DecryptRequest): Promise<DecryptResponse> {
    const req = new DecryptRequestPB();
    req.setComponentName(this.options.componentName);
    req.setCipherText(request.cipherText);

    const metadata = this.createMetadata(request, this.options.defaultRequestMeta);
    return new Promise((resolve, reject) => {
      this.cryptionClient.decrypt(req, metadata, (err, res: DecryptResponsePB) => {
        if (err) return reject(err);
        const plainText = Buffer.from(res.getPlainText_asB64(), 'base64');
        resolve({
          ...res.toObject(),
          plainText,
        });
      });
    });
  }
}
