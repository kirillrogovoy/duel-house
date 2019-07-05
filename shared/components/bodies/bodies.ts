import { createChannel, ChannelMessageCoder } from '../../channel'
import { ComponentServerInput, ComponentClientInput } from '../../components'
import { Connection } from '../../connection'
import { Body, Bodies, World, Events, IBodyDefinition, Composite } from 'matter-js'
import { filter, scan } from 'rxjs/operators'

export type BodyAnnouncementMessage = BodyCreatedMessage | BodyRemovedMessage
export type BodyUpdateMessage = {
  type: 'BodyUpdateMessage'
  updates: BodyUpdate[]
}

export interface BodyCreatedMessage {
  type: 'BodyCreatedMessage'
  definition: IBodyDefinition
}

export interface BodyRemovedMessage {
  type: 'BodyRemovedMessage'
  bodyId: number
}

export interface BodyUpdate {
  bodyId: number
  position: {
    x: number
    y: number
  }
  angle: number
}

export function registerOnServer(input: ComponentServerInput) {
  const channels = registerChannels(input.connection)

  Composite.allBodies(input.engine.world).forEach(body => {
    channels.announcement.send({
      type: 'BodyCreatedMessage',
      definition: bodyToBodyDefinition(body)
    })
  })

  Events.on(input.engine.world, 'afterAdd', event => {
    if (!event.object || event.object.length < 0) {
      return
    }
    const bodies: Body[] = event.object

    for (let body of bodies.filter(b => b.type === 'body')) {
      channels.announcement.send({
        type: 'BodyCreatedMessage',
        definition: bodyToBodyDefinition(body)
      })
    }
  })

  Events.on(input.engine.world, 'afterRemove', event => {
    if (!event.object || event.object.type !== 'body') {
      return
    }
    const body: Body = event.object

    channels.announcement.send({
      type: 'BodyRemovedMessage',
      bodyId: body.id,
    })
  })

  Events.on(input.engine, 'afterTick', () => {
    const updates = Composite.allBodies(input.engine.world).filter(body => body.speed > 0.01).map(body => ({
      bodyId: body.id,
      position: body.position,
      angle: body.angle,
    }))

    if (updates.length > 0) {
      channels.update.send({
        type: 'BodyUpdateMessage',
        updates
      })
    }
  })
}

export function registerOnClient(input: ComponentClientInput) {
  const channels = registerChannels(input.connection)

  channels.announcement.messages$.subscribe(message => {
    if (message.type === 'BodyCreatedMessage') {
      World.addBody(input.engine.world, Body.create(message.definition))
    }

    if (message.type === 'BodyRemovedMessage') {
      const body = Composite.get(input.engine.world, message.bodyId, 'body')

      if (body) {
        World.remove(input.engine.world, body, true)
      }
    }
  })

  channels.update.messages$.subscribe(message => {
    for (let update of message.updates) {
      const body = Composite.get(input.engine.world, update.bodyId, 'body') as Body | null

      if (body) {
        Body.setPosition(body, update.position)
        Body.setAngle(body, update.angle)
      }
    }
  })
}

function registerChannels(connection: Connection) {
  return {
    announcement: createChannel<BodyAnnouncementMessage>(connection, { label: 'body-announcement', ordered: false, maxRetransmits: 10 }),
    update: createChannel<BodyUpdateMessage>(connection, { label: 'body-update', ordered: false, maxRetransmits: 0 }),
  }
}

function bodyToBodyDefinition(body: Body): IBodyDefinition {
  return {
    id: body.id,
    angle: body.angle,
    position: body.position,
    vertices: body.vertices.map(({x, y}) => ({x, y})),
    isStatic: true,
  }
}
