import 'source-map-support/register'
import { map, takeUntil, first, toArray } from 'rxjs/operators'
import { Engine, World } from 'matter-js'
import { getIncomingConnections } from './connection'
import { registerComponentsOnServer } from '../../shared/components'
import stun from 'stun'
import {constructBoundBodies} from './bounds';

const webrtcApis = require('wrtc')
for (let key in webrtcApis) {
  ;(global as any)[key] = webrtcApis[key]
}
console.log('start')
;(global as any).window = global

const world = World.create({
  gravity: {
    scale: 0,
    x: 0,
    y: 0
  }
})
const engine = Engine.create({ world })
Engine.run(engine)
constructBoundBodies({
  width: 1000,
  height: 700,
}, world)

const connections$ = getIncomingConnections({
  host: '0.0.0.0',
  port: 3000
})

connections$.subscribe(connection => {
  registerComponentsOnServer(connection, engine)
})

const stunServer = stun.createServer({
  type: 'udp4'
})
stunServer.listen('19302')
