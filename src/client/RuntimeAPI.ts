import { RuntimeClient } from '../../proto/runtime/v1/runtime_grpc_pb';
import { API, APIOptions } from './API';

export class RuntimeAPI extends API {
  protected readonly runtime: RuntimeClient;

  constructor(runtime: RuntimeClient, options?: APIOptions) {
    super(options);
    this.runtime = runtime;
  }
}
