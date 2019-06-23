import { fromEvent, from, combineLatest, of, Subject, throwError, interval, merge } from 'rxjs'
import { map, takeUntil, first, toArray, flatMap, tap } from 'rxjs/operators'
import { Engine, World, Bodies } from 'matter-js'
import express from 'express'
import cors from 'cors'
import {Connection} from '../../shared/connection';

const webrtcApis = require('wrtc')
for (let key in webrtcApis) {
  ;(global as any)[key] = webrtcApis[key]
}

export interface ServerConnectionParams {
  host: string
  port: number
}

export function getIncomingConnections(params: ServerConnectionParams) {
  const connections = new Subject<Connection>()

  const app = express()
  app.use(cors())
  app.use(express.json())

  let iceCandidatesCache: RTCIceCandidate[] = []

  app.post('/connect', (req, res) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    })

    pc.createDataChannel('dummy', { negotiated: true, id: 255 })

    const connected$ = fromEvent(pc, 'iceconnectionstatechange').pipe(
      map(() => pc.iceConnectionState),
      flatMap(state => {
        return state === 'failed' ? throwError(new Error('connection state = failed')) : of(state)
      }),
      first(state => state === 'connected')
    )

    const closed$ = merge(fromEvent(pc, 'iceconnectionstatechange'), interval(1000)).pipe(
      map(() => pc.iceConnectionState),
      first(state => state === 'disconnected'),
    )

    const { offer, candidates } = req.body
    const iceCandidatesEvents$ = fromEvent(pc, 'icecandidate')
    const iceCandidatesEnd$ = iceCandidatesEvents$.pipe(
      first(event => (event as RTCPeerConnectionIceEvent).candidate === null)
    )
    console.log(iceCandidatesCache.length > 0 ? 'cache' : 'no cache');
    const iceCandidates$ =
      iceCandidatesCache.length > 0
        ? of(iceCandidatesCache)
        : iceCandidatesEvents$.pipe(
            takeUntil(iceCandidatesEnd$),
            map(event => (event as RTCPeerConnectionIceEvent).candidate!),
            tap(candidate => {
              iceCandidatesCache.push(candidate)
            }),
            toArray()
          )
    pc.setRemoteDescription(offer)
    candidates.forEach((c: RTCIceCandidate) => pc.addIceCandidate(c))
    const answer$ = from(pc.createAnswer(offer))
    answer$.subscribe(answer => pc.setLocalDescription(answer))

    combineLatest([iceCandidates$, answer$]).subscribe(([candidates, answer]) => {
      return res.json({ candidates, answer })
    })

    connected$.subscribe(() => {
      connections.next({
        pc,
        currentChannelId: 1,
        closed$,
      })
    })
  })
  app.listen(params.port, params.host, () => console.log(`Listening on port ${params.port}!`))

  return connections.asObservable()
}
