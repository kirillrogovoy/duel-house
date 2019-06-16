import {ChannelMessageCoder, createChannel, Payload} from '../channel';

export interface HelloMessage {
  text: string
}

export interface HelloMessage2 {
  text2: string
}

const jsonMessageCoder = {
  encode: (message: Object) => (new TextEncoder()).encode(JSON.stringify(message)),
  decode: (payload: Payload) => JSON.parse((new TextDecoder()).decode(payload))
}

const helloMessageCoder: ChannelMessageCoder<HelloMessage> = { ...jsonMessageCoder }
const helloMessageCoder2: ChannelMessageCoder<HelloMessage2> = { ...jsonMessageCoder }

export const helloComponent = {
  createDataChannels(pc: RTCPeerConnection) {
    return [
      createChannel(pc, 'hello', {label: 'hello', params: { id: 1 }}, helloMessageCoder),
      createChannel(pc, 'hello2', {label: 'hello2', params: { id: 2 }}, helloMessageCoder2),
    ]
  }
}
