import { map, takeUntil, first, toArray } from 'rxjs/operators'
import { Engine, World, Bodies } from 'matter-js'
import {getIncomingConnections} from './connection';
import {HelloMessage} from '../../shared/components/hello';
import {Channel, toMap} from '../../shared/channel';

const webrtcApis = require('wrtc')
for (let key in webrtcApis) {
  ;(global as any)[key] = webrtcApis[key]
}
console.log('start')

const connections$ = getIncomingConnections({
  host: '0.0.0.0',
  port: 3000
})

connections$.subscribe(connection => {
  console.log('connection', connection);

  const helloChannel = connection.channels.find(c => c.label === 'hello') //as Channel<'hello', HelloMessage>

  helloChannel.messages$.subscribe(m => console.log('hello message', m))
  helloChannel.send({
    text: 'hello from server'
  })
})

// (global as any).window = global
// const engine = Engine.create();
//
// const boxA = Bodies.rectangle(400, 200, 80, 80);
// const boxB = Bodies.rectangle(450, 50, 80, 80);
// const ground = Bodies.rectangle(400, 610, 810, 60, { isStatic: true });
//
// World.add(engine.world, [boxA, boxB, ground]);
//
// Engine.run(engine);
//
