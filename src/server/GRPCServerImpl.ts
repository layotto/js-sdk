/*
 * Copyright 2021 Layotto Authors
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
import { debuglog } from 'node:util';
import { AsyncLocalStorage } from 'node:async_hooks';
import grpc from '@grpc/grpc-js';
import { Empty } from 'google-protobuf/google/protobuf/empty_pb';
import { IAppCallbackServer } from '../../proto/runtime/v1/appcallback_grpc_pb';
import {
  ListTopicSubscriptionsResponse,
  TopicSubscription,
  TopicEventRequest as TopicEventRequestPB,
  TopicEventResponse,
} from '../../proto/runtime/v1/appcallback_pb';
import { PubSubCallback, TopicEventRequest } from '../types/PubSub';
import { convertMapToKVString, mergeMetadataToMap } from '../utils';

const debug = debuglog('layotto:server:grpc');

export interface GRPCServerOptions {
  logger?: Console;
  localStorage?: AsyncLocalStorage<any>;
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export class GRPCServerImpl implements IAppCallbackServer {
  protected readonly handlersTopics: Record<string, PubSubCallback> = {};
  protected readonly subscriptionsList: TopicSubscription[] = [];
  protected readonly localStorage?: AsyncLocalStorage<any>;
  protected readonly logger: Console;

  constructor(options?: GRPCServerOptions) {
    this.logger = options?.logger ?? global.console;
    this.localStorage = options?.localStorage;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected createPubSubHandlerKey(pubsubName: string, topic: string, _metadata?: Record<string, string>): string {
    return `${pubsubName}|${topic}`.toLowerCase();
  }

  protected findPubSubHandler(pubsubName: string, topic: string,
    metadata?: Record<string, string>): PubSubCallback | undefined {
    const handlerKey = this.createPubSubHandlerKey(pubsubName, topic, metadata);
    return this.handlersTopics[handlerKey];
  }

  protected formatPubSubHandlerData(request: TopicEventRequest) {
    // https://mosn.io/layotto/#/zh/design/pubsub/pubsub-api-and-compability-with-dapr-component
    // PublishRequest.Data 和 NewMessage.Data 里面放符合 CloudEvent 1.0 规范的 json 数据（能反序列化放进 map[string]interface{}）
    if (request.dataContentType === 'application/json') {
      return JSON.parse(Buffer.from(request.data).toString());
    }
    return request.data;
  }

  protected async invokePubSubHandler(request: TopicEventRequest, handler: PubSubCallback) {
    const data = this.formatPubSubHandlerData(request);
    await handler(data, request);
  }

  addPubSubSubscription(pubsubName: string, topic: string, metadata?: Record<string, string>) {
    const sub = new TopicSubscription();
    sub.setPubsubName(pubsubName);
    sub.setTopic(topic);
    mergeMetadataToMap(sub.getMetadataMap(), metadata);
    this.subscriptionsList.push(sub);
  }

  registerPubSubSubscriptionHandler(pubsubName: string, topic: string, callback: PubSubCallback, metadata?: Record<string, string>): void {
    const handlerKey = this.createPubSubHandlerKey(pubsubName, topic, metadata);
    if (this.handlersTopics[handlerKey]) {
      throw new Error(`Topic: "${handlerKey}" handler was exists`);
    }
    this.handlersTopics[handlerKey] = callback;
    debug('PubSub Event from topic: "%s" is registered', handlerKey);
  }

  async onTopicEvent(call: grpc.ServerUnaryCall<TopicEventRequestPB, TopicEventResponse>,
    callback: grpc.sendUnaryData<TopicEventResponse>): Promise<void> {
    const req = call.request;
    const res = new TopicEventResponse();
    const pubsubName = req.getPubsubName();
    const topic = req.getTopic();
    const metadata = convertMapToKVString(req.getMetadataMap());
    const request: TopicEventRequest = {
      id: req.getId(),
      source: req.getSource(),
      type: req.getType(),
      specVersion: req.getSpecVersion(),
      dataContentType: req.getDataContentType(),
      data: req.getData_asU8(),
      topic,
      pubsubName,
      metadata,
    };
    const handler = this.findPubSubHandler(pubsubName, topic, metadata);
    if (!handler) {
      this.logger.warn('[layotto:server:grpc:onTopicEvent:warn] can\'t find the pubsub(%s) topic(%s) id(%s) handler, drop it',
        pubsubName, topic, request.id);
      res.setStatus(TopicEventResponse.TopicEventResponseStatus.DROP);
      return callback(null, res);
    }
    try {
      await this.invokePubSubHandler(request, handler);
      res.setStatus(TopicEventResponse.TopicEventResponseStatus.SUCCESS);
    } catch (err: any) {
      this.logger.error('[layotto:server:grpc:onTopicEvent:error] pubsub(%s) topic(%s) id(%s) handler throw error %s, let server retry',
        pubsubName, topic, request.id, err.message);
      this.logger.error(err);
      res.setStatus(TopicEventResponse.TopicEventResponseStatus.RETRY);
    }
    callback(null, res);
  }

  async listTopicSubscriptions(_call: grpc.ServerUnaryCall<Empty, ListTopicSubscriptionsResponse>,
    callback: grpc.sendUnaryData<ListTopicSubscriptionsResponse>): Promise<void> {
    const res = new ListTopicSubscriptionsResponse();
    debug('listTopicSubscriptions call: %j', this.subscriptionsList);
    res.setSubscriptionsList(this.subscriptionsList);
    callback(null, res);
  }
}
