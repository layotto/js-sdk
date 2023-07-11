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
  componentName: string;
  plainText: Uint8Array | string;
  keyId?: string;
}>;

export type DecryptRequest = RequestWithMeta<DecryptRequestPB.AsObject>;

export type DecryptResponse = {
  plainText: Uint8Array;
  keyId: string,
  keyVersionId: string,
  requestId: string,
};

export default class Cryption extends API {
  private readonly cryptionClient: CryptionServiceClient;

  constructor(cryptionClient: CryptionServiceClient) {
    super();
    this.cryptionClient = cryptionClient;
  }

  async encrypt(request: EncryptRequest): Promise<EncryptResponse.AsObject> {
    const req = new EncryptRequestPB();
    req.setComponentName(request.componentName);
    let plainText = request.plainText;
    if (typeof plainText === 'string') {
      plainText = Buffer.from(plainText);
    }
    req.setPlainText(plainText);
    if (request.keyId) {
      req.setKeyId(request.keyId);
    }

    return new Promise((resolve, reject) => {
      this.cryptionClient.encrypt(req, this.createMetadata(request), (err, res: EncryptResponse) => {
        if (err) return reject(err);
        resolve(res.toObject());
      });
    });
  }

  async decrypt(request: DecryptRequest): Promise<DecryptResponse> {
    const req = new DecryptRequestPB();
    req.setComponentName(request.componentName);
    req.setCipherText(request.cipherText);

    return new Promise((resolve, reject) => {
      this.cryptionClient.decrypt(req, this.createMetadata(request), (err, res: DecryptResponsePB) => {
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
