import { Observable, fromEvent } from 'rxjs'
import { first, takeUntil, map } from 'rxjs/operators'
import {Connection} from './connection';

export interface Channel<T> {
  label: string
  send(message: T): void;
  messages$: Observable<T>
  closed$: Observable<Event>
}

export type Payload = ArrayBuffer
export interface ChannelMessageCoder<T> {
  encode(message: T): Payload
  decode(paylod: Payload): T
}

export type ChannelDescription = {
  label: string
} & RTCDataChannelInit

const jsonMessageCoder = {
  encode: (message: Object) => (new TextEncoder()).encode(JSON.stringify(message)),
  decode: (payload: Payload) => JSON.parse((new TextDecoder()).decode(payload))
}

export function createChannel<T>(
  connection: Connection,
  description: ChannelDescription,
  coder: ChannelMessageCoder<T> = jsonMessageCoder
): Channel<T> {
  const rtcChannel = connection.pc.createDataChannel(description.label, {
    ...(description || {}),
    negotiated: true,
    id: connection.currentChannelId++,
  })

  console.log('created', rtcChannel.label, rtcChannel.id);
  rtcChannel.addEventListener('open', () => console.log('open', rtcChannel.label))
  rtcChannel.addEventListener('close', () => console.log('close', rtcChannel.label))
  rtcChannel.addEventListener('error', () => console.log('error', rtcChannel.label))

  const closed$ = fromEvent(rtcChannel, 'close').pipe(first())
  const messages$ = fromEvent(rtcChannel, 'message').pipe(
    map(event => coder.decode((event as MessageEvent).data)),
    takeUntil(closed$)
  )
  return {
    label: description.label,
    send: (message: T) => rtcChannel.send(coder.encode(message)),
    messages$,
    closed$
  }
}
