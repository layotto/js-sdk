import { strict as assert } from 'node:assert';
import {
  Clients, Client,
  Servers, Server,
} from '../../src';

describe('index.test.ts', () => {
  describe('Clients', () => {
    it('should export Cryption Class', async () => {
      assert(Clients.Cryption);
      assert.equal(typeof Clients.Cryption.prototype.encrypt, 'function');
    });

    it('should export Client Class', async () => {
      assert(Clients.Client);
      assert.equal(Clients.Client, Client);
    });
  });

  describe('Servers', () => {
    it('should export PubSub Class', async () => {
      assert(Servers.PubSub);
      assert.equal(typeof Clients.PubSub.prototype.publish, 'function');
    });

    it('should export Server Class', async () => {
      assert(Servers.Server);
      assert.equal(Servers.Server, Server);
    });
  });
});
