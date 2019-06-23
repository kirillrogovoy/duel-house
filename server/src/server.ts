import { map, takeUntil, first, toArray } from 'rxjs/operators'
import { Engine } from 'matter-js'
import {getIncomingConnections} from './connection';
import {registerComponentsOnServer} from '../../shared/components';

const webrtcApis = require('wrtc')
for (let key in webrtcApis) {
  ;(global as any)[key] = webrtcApis[key]
}
console.log('start')


;(global as any).window = global
const engine = Engine.create();
Engine.run(engine);

const connections$ = getIncomingConnections({
  host: '0.0.0.0',
  port: 3000
})

connections$.subscribe(connection => {
  console.log('connection', connection);

  registerComponentsOnServer(connection, engine)
})
