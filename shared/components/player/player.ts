import {createChannel, ChannelMessageCoder} from '../../channel';
import {ComponentServerInput, ComponentClientInput} from '../../components';
import {Connection} from '../../connection';
import {getKeyStream, getArrowMovements, ArrowMovementCommand} from './controls';
import {Body, Bodies, World, Events} from 'matter-js';
import {filter, scan} from 'rxjs/operators';

export type PlayerMessage = ArrowMovementCommandMessage | PlayerPositionMessage

export interface ArrowMovementCommandMessage {
  type: 'ArrowMovementCommandMessage'
  command: ArrowMovementCommand
}

export interface PlayerPositionMessage {
  type: 'PlayerPositionMessage'
  position: {
    x: number
    y: number
  }
}

export function registerOnServer(input: ComponentServerInput) {
  const playerBody = Bodies.rectangle(400, 200, 10, 10);
  World.add(input.engine.world, [playerBody]);

  const channels = registerChannels(input.connection)

  let prevPosition = {
    x: 0, y: 0
  }

  let commandState = {
    up: false,
    down: false,
    left: false,
    right: false,
  }

  channels.player.messages$.pipe(filter((m): m is ArrowMovementCommandMessage => m.type === 'ArrowMovementCommandMessage')).pipe(
    scan((acc, cur) => {
      const { commandType, pressed } = cur.command

      return {
        ...acc,
        [commandType]: pressed
      }
    }, commandState)
  )
  .subscribe(newCommandState => {
    commandState = newCommandState
  })

  Events.on(input.engine, 'tick', () => {
    const { position } = playerBody
    if (prevPosition.x !== position.x || prevPosition.y !== position.y) {
      prevPosition = {...position}
      channels.player.send({
        type: 'PlayerPositionMessage',
        position: playerBody.position
      })
    }

    if (commandState.up) {
      playerBody.force.y += -0.0001
    }

    if (commandState.down) {
      playerBody.force.y += 0.0001
    }

    if (commandState.left) {
      playerBody.force.x += -0.0001
    }

    if (commandState.right) {
      playerBody.force.x += 0.0001
    }
  })

  // interval(2000).subscribe(i => {
    // playerBody.force.x = 0.002 * (i % 2 === 0 ? 1 : -1)
  // })
}

export function registerOnClient(input: ComponentClientInput) {
  const playerBody = Bodies.rectangle(400, 200, 20, 20);
  let playerBodyCreated = false

  const channels = registerChannels(input.connection)

  channels.player.messages$.pipe(filter((m): m is PlayerPositionMessage => m.type === 'PlayerPositionMessage')).subscribe(message => {
    Body.setPosition(playerBody, message.position)
    if (!playerBodyCreated) {
      (window as any).playerBody = playerBody
      ;(window as any).Body = Body
      World.add(input.engine.world, [playerBody]);
      playerBodyCreated = true
    }
  })

  const keyEvents$ = getKeyStream()
  const keyMap = { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD' }
  const arrowMovements$ = getArrowMovements(keyEvents$, keyMap)

  arrowMovements$.subscribe(m => {
    console.log("move", m);
    channels.player.send({
      type: 'ArrowMovementCommandMessage',
      command: m
    })
  })
}

function registerChannels(connection: Connection) {
  // const coder: ChannelMessageCoder<PlayerMessage> = {
    // encode: (m: PlayerMessage) => Float32Array.of(m.position.x, m.position.y),
    // decode: (a: ArrayBuffer) => {
      // const [ x, y ] = Array.from(new Float32Array(a))
      // return {
        // position: {x, y}
      // }
    // }
  // }
  return {
    player: createChannel<PlayerMessage>(connection, {label: 'player'}),
  }
}
