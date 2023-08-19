import { Client, ClientOptions } from '../../../../src';
import { CustomHello } from './CustomHello';

export interface CustomClientOptions extends ClientOptions {
  port?: string;
  host?: string;
}

export class CustomClient extends Client {
  private _customHello: CustomHello;

  constructor(options: CustomClientOptions) {
    super(options.port, options.host, options);
  }

  get hello() {
    if (!this._customHello) {
      this._customHello = new CustomHello(this._runtime, this.initAPIOptions);
    }
    return this._customHello;
  }
}
