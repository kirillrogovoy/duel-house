import { createChannel } from '../../channel'
import { of } from 'rxjs'
import { ComponentServerInput, ComponentClientInput } from '../../components'
import { Connection } from '../../connection'

export interface HelloMessage {
  text: string
}

export function registerOnServer(input: ComponentServerInput) {
  const channels = registerChannels(input.connection)

  channels.hello.messages$.subscribe(message => {
    channels.hello.send({
      text: 'echo ' + message.text
    })
  })

  channels.hello.messages$.subscribe(message => {
    console.log('message', message)
  })

  const events$ = {
    test: of(1)
  }

  return { events$ }
}

export function registerOnClient(input: ComponentClientInput) {
  const channels = registerChannels(input.connection)

  channels.hello.send({
    text: 'hello'
  })

  channels.hello.messages$.subscribe(message => {
    console.log('message', message)
  })

  const events$ = {
    test: of(1)
  }

  return { events$ }
}

function registerChannels(connection: Connection) {
  return {
    hello: createChannel<HelloMessage>(connection, { label: 'hello' })
  }
}
