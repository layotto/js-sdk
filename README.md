# Layotto Node.js SDK

The Layotto Node.js SDK to build your application.

[![NPM version](https://img.shields.io/npm/v/layotto.svg?style=flat-square)](https://npmjs.org/package/layotto)
[![NPM quality](https://npm.packagequality.com/shield/layotto.svg?style=flat-square)](https://packagequality.com/#?package=layotto)
[![NPM download](https://img.shields.io/npm/dm/layotto.svg?style=flat-square)](https://npmjs.org/package/layotto)

[![Node.js CI](https://github.com/layotto/js-sdk/actions/workflows/nodejs.yml/badge.svg)](https://github.com/layotto/js-sdk/actions/workflows/nodejs.yml)
[![Test coverage](https://img.shields.io/codecov/c/github/layotto/js-sdk.svg?style=flat-square)](https://codecov.io/gh/layotto/js-sdk)
[![Known Vulnerabilities](https://snyk.io/test/npm/layotto/badge.svg?style=flat-square)](https://snyk.io/test/npm/layotto)

## Clone

```bash
git clone --recurse-submodules git@github.com:layotto/js-sdk.git
```

If forgot to add `--recurse-submodules`, you can run `git submodule update --init --recursive` to clone the submodules.

More git submodule commands, please refer to [Git submodule](https://git-scm.com/book/en/v2/Git-Tools-Submodules).

## Usage

### State

`demo/state.ts`

```ts
import { Client } from 'layotto';

const storeName = 'redis';
const key = 'foo-js-sdk';
const value = `bar, from js-sdk, ${Date()}`;

await client.state.save({
  storeName, 
  states: { key, value },
});
console.log('saveState success, key: %j, value: %j', key, value);

const resValue = await client.state.get({ storeName, key });
console.log('getState success, key: %j, value: %j, toString: %j',
  key, resValue, Buffer.from(resValue).toString('utf8'));
```

## Development

### Install dependencies

```bash
npm install
```

### Generate gRPC files

Should install [grpc-tools](https://github.com/grpc/grpc-node) first.
MacOS M1 follow [this issue](https://github.com/grpc/grpc-node/issues/1405).

```bash
npm run build:grpc
```

### Run Tests

### step 1. Set up the environment

- Running redis and etcd under Docker

```bash
docker-compose up -d
```

- Start a echoserver for testing the rpc api

```bash
node demo/rpc/http/server.js
```

If you want to know more about this, check https://mosn.io/layotto/#/zh/start/rpc/helloworld

- Start Layotto, see [How to run layotto](https://mosn.io/layotto/#/zh/start/state/start?id=%e7%ac%ac%e4%ba%8c%e6%ad%a5%ef%bc%9a%e8%bf%90%e8%a1%8clayotto)

```bash
cd layotto/cmd/layotto
go build

./layotto start -c ../../../demo/config.json
```

### step 2: Run the tests

- Then, run the test script by npm

```bash
npm run test:unit
```

Enable trace debug log for grpc-js:

```bash
GRPC_TRACE=compression GRPC_VERBOSITY=debug GRPC_TRACE=all npm run test test/unit/client/Invoker.test.ts
```

### NPM Publish

Just run `npm version <semver-version>` command to update the version and push the tag to GitHub.

```bash
npm version <patch|minor|major>
git push origin main --tags
```

## Reference

- [Core concepts, architecture and lifecycle](https://grpc.io/docs/what-is-grpc/core-concepts/)
- [Get Start with gRPC on Node.js](https://grpc.io/docs/languages/node/quickstart/)
- [Node.js gRPC Library](https://grpc.github.io/grpc/node/)
- [Understanding Streams in Node.js](https://nodesource.com/blog/understanding-streams-in-nodejs/)
- [Go Proxy in China](https://learnku.com/go/wikis/38122)
- [How to build a bi-directional streaming gRPC service with Node.js and Java](https://medium.com/@Mark.io/bi-directional-streaming-grpc-with-node-js-and-java-7cbe0f1e0693)

## License

[Apache License 2.0](LICENSE)

## Contributors

[![Contributors](https://contrib.rocks/image?repo=layotto/js-sdk)](https://github.com/layotto/js-sdk/graphs/contributors)

Made with [contributors-img](https://contrib.rocks).
