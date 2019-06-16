import { fromEvent, from, combineLatest, of, Subject, throwError, forkJoin } from 'rxjs'
import { map, takeUntil, first, toArray, flatMap, tap } from 'rxjs/operators'
import { Engine, World, Bodies } from 'matter-js'
import express from 'express'
import cors from 'cors'
import {Connection} from '../../shared/connection';
import {openDataChannels} from '../../shared/components';

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

  const channels = openDataChannels(pc)
  const channelsOpen$ = forkJoin(channels.map(c => c.open$))

    const connected$ = fromEvent(pc, 'iceconnectionstatechange').pipe(
      map(() => pc.iceConnectionState),
      flatMap(state => {
        return state === 'failed' ? throwError(new Error('connection state = failed')) : of(state)
      }),
      first(state => state === 'connected')
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

    forkJoin([connected$, channelsOpen$]).subscribe(() => {
      connections.next({ pc, channels })
    })
  })
  app.listen(params.port, params.host, () => console.log(`Listening on port ${params.port}!`))

  return connections.asObservable()
}
