import { Observable, fromEvent, interval, merge, ReplaySubject } from 'rxjs'
import { first, takeUntil, map, delay, filter, switchMapTo } from 'rxjs/operators'
import {Connection} from './connection';

export interface Channel<T> {
  label: string
  send(message: T): void;
  messages$: Observable<T>
  closed$: Observable<Event>
  handshake$: Observable<void>
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

  const closed$ = fromEvent(rtcChannel, 'close').pipe(first())
  const messages$ = fromEvent(rtcChannel, 'message').pipe(
    map(event => (event as MessageEvent).data),
    filter(data => data !== handshakeMarker),
    map(data => coder.decode(data)),
    takeUntil(closed$)
  )

  const handshakeMarker = 'H'
  const handshake$ = fromEvent(rtcChannel, 'message').pipe(
    map(event => (event as MessageEvent).data),
    first(m => m === handshakeMarker)
  )

  merge(handshake$, interval(100)).pipe(
    takeUntil(handshake$.pipe(delay(1)))
  ).subscribe(() => rtcChannel.send(handshakeMarker))

  const messageBuffer = new ReplaySubject<T>()
  closed$.subscribe(() => messageBuffer.complete())

  handshake$.pipe(switchMapTo(messageBuffer)).subscribe(message => {
    // emulating loss
    // if (Math.random() > 0.7) {
      // return
    // }
    rtcChannel.send(coder.encode(message))
  })

  return {
    label: description.label,
    send: (message: T) => messageBuffer.next(message),
    messages$,
    closed$,
    handshake$
  }
}
