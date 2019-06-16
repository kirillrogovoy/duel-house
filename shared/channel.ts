import { Observable, fromEvent } from 'rxjs'
import { first, takeUntil, map } from 'rxjs/operators'

export interface Channel<L extends string, T> {
  label: L
  send(message: T): void;
  messages$: Observable<T>
  open$: Observable<Event>
  closed$: Observable<Event>
}

export type Payload = ArrayBuffer
export interface ChannelMessageCoder<T> {
  encode(message: T): Payload
  decode(paylod: Payload): T
}

export interface ChannelDescription {
  label: string
  params: RTCDataChannelInit
}

export function createChannel<L extends string, T>(
  pc: RTCPeerConnection,
  label: L,
  description: ChannelDescription,
  coder: ChannelMessageCoder<T>
): Channel<L, T> {
  const rtcChannel = pc.createDataChannel(description.label, description.params)
  const open$ = fromEvent(rtcChannel, 'open').pipe(first())
  const closed$ = fromEvent(rtcChannel, 'close').pipe(first())
  const messages$ = fromEvent(rtcChannel, 'message').pipe(
    map(event => coder.decode((event as MessageEvent).data)),
    takeUntil(closed$)
  )
  return {
    label,
    send: (message: T) => rtcChannel.send(coder.encode(message)),
    messages$,
    open$,
    closed$
  }
}

export function toMap<L extends string>(channels: Channel<L, any>[]): {[key in L]: Channel<key,any>} {
  return channels.reduce((res, channel) => {
    res[channel.label] = channel;
    return res;
  }, Object.create(null));
}
