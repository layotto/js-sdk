import { RuntimeClient } from '../../proto/runtime/v1/runtime_grpc_pb';
import { API } from './API';

export class RuntimeAPI extends API {
  readonly runtime: RuntimeClient;
  constructor(runtime: RuntimeClient) {
    super();
    this.runtime = runtime;
  }
}
