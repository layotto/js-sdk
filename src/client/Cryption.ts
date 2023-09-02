import {
  EncryptRequest as EncryptRequestPB,
  EncryptResponse as EncryptResponsePB,
  DecryptRequest as DecryptRequestPB,
  DecryptResponse as DecryptResponsePB,
} from '../../proto/extension/v1/cryption/cryption_pb';
import { CryptionServiceClient } from '../../proto/extension/v1/cryption/cryption_grpc_pb';
import { API, APIOptions } from './API';
import {
  EncryptRequest,
  DecryptRequest,
  DecryptResponse,
} from '../types/Cryption';

export interface CryptionOptions {
  componentName: string;
  // set default metadata on every request
  defaultRequestMeta?: Record<string, string>;
}

export class Cryption extends API {
  private readonly cryptionClient: CryptionServiceClient;
  private readonly options: CryptionOptions;

  constructor(cryptionClient: CryptionServiceClient, options: CryptionOptions, apiOptions?: APIOptions) {
    super(apiOptions);
    this.options = options;
    this.cryptionClient = cryptionClient;
  }

  async encrypt(request: EncryptRequest): Promise<EncryptResponsePB.AsObject> {
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
      this.cryptionClient.encrypt(req, metadata, (err, res: EncryptResponsePB) => {
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
