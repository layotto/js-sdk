import { Client } from '../../../../src';
import { CustomHello } from './CustomHello';

export class CustomClient extends Client {
  private _customHello: CustomHello;

  get hello() {
    if (!this._customHello) {
      this._customHello = new CustomHello(this._runtime, this.initAPIOptions);
    }
    return this._customHello;
  }
}
