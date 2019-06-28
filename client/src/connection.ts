import { fromEvent, from, forkJoin, throwError, of } from 'rxjs'
import { map, takeUntil, first, toArray, flatMap, mapTo, tap, switchMapTo } from 'rxjs/operators'
import {Connection} from '../../shared/connection';

export interface ClientConnectionParams {
  playerName: string
  url: string
}

export function connect(params: ClientConnectionParams) {
  const pc = new RTCPeerConnection({
    // iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  })

  window.addEventListener('beforeunload', () => {
    pc.close()
  })

  pc.createDataChannel('dummy', { negotiated: true, id: 255 })

  const connected$ = fromEvent(pc, 'iceconnectionstatechange').pipe(
    map(() => pc.iceConnectionState),
    flatMap(state => {
      return state === 'failed' ? throwError(new Error('connection state = failed')) : of(state)
    }),
    first(state => state === 'connected')
  )

  const closed$ = fromEvent(pc, 'iceconnectionstatechange').pipe(
    map(() => pc.iceConnectionState),
    first(state => state === 'disconnected'),
  )

  const iceCandidatesEvents$ = fromEvent(pc, 'icecandidate')
  const iceCandidatesEnd$ = iceCandidatesEvents$.pipe(
    first(event => (event as RTCPeerConnectionIceEvent).candidate === null)
  )
  const iceCandidates$ = iceCandidatesEvents$.pipe(
    takeUntil(iceCandidatesEnd$),
    map(event => (event as RTCPeerConnectionIceEvent).candidate),
    toArray()
  )

  const offer$ = from(pc.createOffer())

  const setLocalDescription$ = offer$.pipe(map(offer => pc.setLocalDescription(offer)))

  return forkJoin([iceCandidates$, offer$, setLocalDescription$]).pipe(
    flatMap(([candidates, offer]) => {
      return fetch(params.url, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          offer,
          candidates
        })
      })
    }),
    flatMap(response => response.json()),
    flatMap(({ answer, candidates }) =>
      pc.setRemoteDescription(answer).then(candidates.forEach(c => pc.addIceCandidate(c))).then(() => connected$)
    ),
    map((): Connection => ({
      pc,
      currentChannelId: 1,
      closed$,
    }))
  )
}
