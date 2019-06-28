import {createChannel} from '../../channel';
import {ComponentServerInput, ComponentClientInput} from '../../components';
import {Connection} from '../../connection';
import {Bodies, World} from 'matter-js';
import {interval} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

export interface WorldMessage {
  boxA: {
    x: number
    y: number
  }
}

export function registerOnServer(input: ComponentServerInput) {
  return
  const boxA = Bodies.rectangle(400, 200, 80, 80, { isStatic: true });
  const boxB = Bodies.rectangle(450, 50, 80, 80);
  const ground = Bodies.rectangle(400, 610, 810, 60, { isStatic: true });

  World.add(input.engine.world, [boxA, boxB, ground]);

  const channels = registerChannels(input.connection)

  interval(1000).pipe(takeUntil(input.connection.closed$)).subscribe(() => {
    console.log('sending position');
    channels.world.send({
      boxA: boxA.position
    })
  })

  channels.world.messages$.subscribe(message => {
    console.log('world message', message)
  })
}

export function registerOnClient(input: ComponentClientInput) {
  return
  const channels = registerChannels(input.connection)

  interval(1000).subscribe(() => {
    console.log('sending position');
    channels.world.send({
      boxA: {
        x: 0, y: 0
      }
    })
  })

  channels.world.messages$.subscribe(message => {
    console.log('world message', message)

    const boxA = Bodies.rectangle(message.boxA.x, message.boxA.y, 80, 80);

    World.add(input.engine.world, [boxA]);
  })
}

function registerChannels(connection: Connection) {
  return {
    world: createChannel<WorldMessage>(connection, {label: 'world'}),
  }
}
