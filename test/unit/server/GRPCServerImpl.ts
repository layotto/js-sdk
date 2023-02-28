import { debuglog } from 'node:util';
import * as grpc from '@grpc/grpc-js';
import { Empty } from 'google-protobuf/google/protobuf/empty_pb';
import { IAppCallbackServer } from '../../../proto/runtime/v1/appcallback_grpc_pb';
import {
  ListTopicSubscriptionsResponse,
  TopicSubscription,
  TopicEventRequest,
  TopicEventResponse,
} from '../../../proto/runtime/v1/appcallback_pb';
import { PubSubCallback } from '../../../dist/types/PubSub';

import { convertMapToKVString } from '../../../dist/utils';

const debug = debuglog('layotto:server:grpc');


export type PubSubConfig = {
  [key: string]: {
    subs?: {
      topic: string;
      metadata: {
        // GROUP_ID 必填字段
        GROUP_ID: string;
        // EVENTCODE msgbroker必填字段, sofamq 非必填字段, msgbroker 通过 topic + eventCode 来唯一标识一个 pub/sub
        EVENTCODE: string;
        SUB_LDC_SUBMODE: string;
        SUBCONVERTMSGBODY?: string;
      }
    }[],
    pubs?: {
      topic: string;
      metadata: {
        // GROUP_ID 必填字段
        GROUP_ID: string;
        // EVENTCODE 必填字段, msgbroker 通过 topic + eventCode 来唯一标识一个 pub/sub
        EVENTCODE?: string;
        // POST_TIMEOUT 非必填字段，用于指定消息发送超时时间，单位为毫秒，默认值为 3000
        POST_TIMEOUT?: string;
        // MESSAGE_ID 非必填字段，16位的一个uuid, 用于指定消息的唯一标识，如果不指定，会自动生成一个
        MESSAGE_ID?: string;
        // ^committed$ 非必填字段，用于指定消息是否需要持久化，默认值为 true
        '^committed$'?: string;
        // EVENT_ID 非必填字段，16位的一个uuid, 用于指定消息的事件 ID，如果不指定，会自动生成一个
        EVENT_ID?: string;
      }
    }[],
  };
};

export type CallbackResponseInfo = {
  id: string,
  topic: string,
  pubsubName: string,
  type: string,
  specVersion: string,
  data: string | object,
  source: string,
  metadata: Record<string, string>,
};

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export default class GRPCServerImpl implements IAppCallbackServer {
  private readonly _handlersTopics: { [key: string]: PubSubCallback };
  private readonly _pubsubList: TopicSubscription[] = [];
  constructor(pubsubConfig: PubSubConfig) {
    this._handlersTopics = {};
    this._pubsubList = this.pubsubConfigToTopicSubscription(pubsubConfig);
  }

  private pubsubConfigToTopicSubscription(pubsubConfig: PubSubConfig): TopicSubscription[] {
    const pubsubList: TopicSubscription[] = [];
    for (const pubsubName in pubsubConfig) {
      const pubsub = pubsubConfig[pubsubName];
      // 处理发布
      if (pubsub.pubs) {
        for (const pub of pubsub.pubs) {
          const topicSubscription = new TopicSubscription();
          topicSubscription.setTopic(pub.topic);
          topicSubscription.setPubsubName(pubsubName);
          topicSubscription.getMetadataMap().set('groupId', pub.metadata.GROUP_ID);
          topicSubscription.getMetadataMap().set('pubOrSub', 'pub');
          if (pub.metadata.EVENTCODE) {
            topicSubscription.getMetadataMap().set('eventcode', pub.metadata.EVENTCODE);
          }
          pubsubList.push(topicSubscription);
        }
      }
      // 处理订阅
      if (pubsub.subs) {
        for (const sub of pubsub.subs) {
          const topicSubscription = new TopicSubscription();
          topicSubscription.setTopic(sub.topic);
          topicSubscription.setPubsubName(pubsubName);
          topicSubscription.getMetadataMap().set('groupId', sub.metadata.GROUP_ID);
          topicSubscription.getMetadataMap().set('pubOrSub', 'sub');
          topicSubscription.getMetadataMap().set('ldcSubMode', sub.metadata.SUB_LDC_SUBMODE);
          if (sub.metadata.EVENTCODE) {
            topicSubscription.getMetadataMap().set('eventcode', sub.metadata.EVENTCODE);
          }
          // if (sub.metadata.SUBCONVERTMSGBODY) {
          //   topicSubscription.getMetadataMap().set('convertMsgBody', sub.metadata.SUBCONVERTMSGBODY);
          // }
          pubsubList.push(topicSubscription);
        }
      }
    }
    return pubsubList;
  }

  private createPubSubHandlerKey(pubsubName: string, topic: string, eventCode?: string): string {
    // 如果 eventCode 为空，那么取 pubsubName|topic 作为 key ，否则取 pubsubName|topic|eventCode 作为 key
    if (eventCode) {
      return `${pubsubName}|${topic}|${eventCode}`.toLowerCase();
    }
    return `${pubsubName}|${topic}`.toLowerCase();
  }

  registerPubSubSubscriptionHandler(pubsubName: string, topic: string, callback: PubSubCallback, metadata?: Record<string, string>): void {
    const handlerKey = this.createPubSubHandlerKey(pubsubName, topic, metadata?.EVENTCODE);
    if (this._handlersTopics[handlerKey]) {
      throw new Error(`Topic: "${handlerKey}" handler was exists`);
    }
    this._handlersTopics[handlerKey] = callback;
    debug('PubSub Event from topic: "%s" is registered', handlerKey);
  }

  async onTopicEvent(call: grpc.ServerUnaryCall<TopicEventRequest, TopicEventResponse>,
    callback: grpc.sendUnaryData<TopicEventResponse>): Promise<void> {
    const req = call.request;
    const res = new TopicEventResponse();
    let topic = req.getTopic();
    // sofamq 返回的 topic 是 %topic，如 SOFAMQ_DEFAULT_INS|GZ00B%TP_GO_DEMO , 需要去掉前面的 % 才能匹配
    const split = topic.split('%');
    if (split.length > 1) {
      topic = split[1];
    }
    const eventCode = req.getMetadataMap().get('EVENTCODE');
    const handlerKey = this.createPubSubHandlerKey(req.getPubsubName(), topic, eventCode);
    const handler = this._handlersTopics[handlerKey];
    if (!handler) {
      debug('PubSub Event from topic: "%s" was not handled, drop now', handlerKey);
      // FIXME: should retry?
      res.setStatus(TopicEventResponse.TopicEventResponseStatus.DROP);
      return callback(null, res);
    }
    // https://mosn.io/layotto/#/zh/design/pubsub/pubsub-api-and-compability-with-dapr-component
    // PublishRequest.Data 和 NewMessage.Data 里面放符合 CloudEvent 1.0 规范的 json 数据（能反序列化放进 map[string]interface{}）
    const rawData = Buffer.from(req.getData_asU8()).toString();
    const result: CallbackResponseInfo = {
      id: req.getId(),
      topic: req.getTopic(),
      pubsubName: req.getPubsubName(),
      type: req.getType(),
      specVersion: req.getSpecVersion(),
      source: req.getSource(),
      data: '',
      metadata: convertMapToKVString(req.getMetadataMap()),
    };
    debug('PubSub Event from topic: "%s" raw data: %j, typeof %s', handlerKey, rawData, typeof rawData);
    let data: string | object;
    try {
      data = JSON.parse(rawData);
    } catch {
      data = rawData;
    }
    result.data = data;
    try {
      await handler(result);
      res.setStatus(TopicEventResponse.TopicEventResponseStatus.SUCCESS);
    } catch (e) {
      // FIXME: should retry?
      debug('PubSub Event from topic: "%s" handler throw error: %s, drop now', handlerKey, e);
      res.setStatus(TopicEventResponse.TopicEventResponseStatus.DROP);
    }
    callback(null, res);
  }

  async listTopicSubscriptions(_call: grpc.ServerUnaryCall<Empty, ListTopicSubscriptionsResponse>,
    callback: grpc.sendUnaryData<ListTopicSubscriptionsResponse>): Promise<void> {
    const res = new ListTopicSubscriptionsResponse();
    debug('listTopicSubscriptions call: %j', this._pubsubList);
    res.setSubscriptionsList(this._pubsubList);
    callback(null, res);
  }
}
