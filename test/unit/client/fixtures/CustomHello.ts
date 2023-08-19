import Hello from '../../../../src/client/Hello';

export class CustomHello extends Hello {
  async sayHello(...args: any[]) {
    this.logger.info(args);
    return await super.sayHello(...args);
  }
}
