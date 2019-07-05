import { createChannel, ChannelMessageCoder } from '../../channel'
import { ComponentServerInput, ComponentClientInput } from '../../components'
import { Connection } from '../../connection'
import { getKeyStream, getArrowMovements, ArrowMovementCommand } from './controls'
import { Body, Bodies, World, Events, Composite } from 'matter-js'
import { filter, scan } from 'rxjs/operators'

export type PlayerMessage = ArrowMovementCommandMessage

export interface ArrowMovementCommandMessage {
  type: 'ArrowMovementCommandMessage'
  command: ArrowMovementCommand
}

export function registerOnServer(input: ComponentServerInput) {
  const playerBody = Bodies.circle(0, 0, 30, {  density: 0.00003, restitution: 0.8 })
  World.add(input.engine.world, [playerBody])

  input.connection.closed$.subscribe(() => {
    World.remove(input.engine.world, playerBody)
  })

  const channels = registerChannels(input.connection)

  let commandState = {
    up: false,
    down: false,
    left: false,
    right: false
  }

  channels.player.messages$
    .pipe(
      filter((m): m is ArrowMovementCommandMessage => m.type === 'ArrowMovementCommandMessage'),
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
}

export function registerOnClient(input: ComponentClientInput) {
  const channels = registerChannels(input.connection)

  const keyEvents$ = getKeyStream()
  const keyMap = { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD' }
  const arrowMovements$ = getArrowMovements(keyEvents$, keyMap)

  arrowMovements$.subscribe(m => {
    console.log('move', m)
    channels.player.send({
      type: 'ArrowMovementCommandMessage',
      command: m
    })
  })
}

function registerChannels(connection: Connection) {
  return {
    player: createChannel<PlayerMessage>(connection, { label: 'player' })
  }
}
