import { GRPCServerImpl } from '../../../src/index';

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

export class CustomGRPCServerImpl extends GRPCServerImpl {
  constructor(pubsubConfig: PubSubConfig) {
    super();
    this.pubsubConfigToTopicSubscription(pubsubConfig);
  }

  private pubsubConfigToTopicSubscription(pubsubConfig: PubSubConfig) {
    for (const pubsubName in pubsubConfig) {
      const pubsub = pubsubConfig[pubsubName];
      // 处理发布
      if (pubsub.pubs) {
        for (const pub of pubsub.pubs) {
          const metadata: Record<string, string> = {
            groupId: pub.metadata.GROUP_ID,
            pubOrSub: 'pub',
          };
          if (pub.metadata.EVENTCODE) {
            metadata.eventcode = pub.metadata.EVENTCODE;
          }
          this.addPubSubSubscription(pubsubName, pub.topic, metadata);
        }
      }
      // 处理订阅
      if (pubsub.subs) {
        for (const sub of pubsub.subs) {
          const metadata: Record<string, string> = {
            groupId: sub.metadata.GROUP_ID,
            pubOrSub: 'sub',
            ldcSubMode: sub.metadata.SUB_LDC_SUBMODE,
          };
          if (sub.metadata.EVENTCODE) {
            metadata.eventcode = sub.metadata.EVENTCODE;
          }
          this.addPubSubSubscription(pubsubName, sub.topic, metadata);
        }
      }
    }
  }

  protected createPubSubHandlerKey(pubsubName: string, topic: string, metadata?: Record<string, string>): string {
    // sofamq 返回的 topic 是 %topic，如 SOFAMQ_DEFAULT_INS|GZ00B%TP_GO_DEMO , 需要去掉前面的 % 才能匹配
    const split = topic.split('%');
    if (split.length > 1) {
      topic = split[1];
    }
    // 如果 eventCode 为空，那么取 pubsubName|topic 作为 key ，否则取 pubsubName|topic|eventCode 作为 key
    if (metadata?.EVENTCODE) {
      return `${pubsubName}|${topic}|${metadata.eventCode}`.toLowerCase();
    }
    return `${pubsubName}|${topic}`.toLowerCase();
  }
}
