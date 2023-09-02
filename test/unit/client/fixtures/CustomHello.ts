import { Clients } from '../../../../src';

export class CustomHello extends Clients.Hello {
  async sayHello(...args: any[]) {
    this.logger.info(args);
    return await super.sayHello(...args);
  }
}
