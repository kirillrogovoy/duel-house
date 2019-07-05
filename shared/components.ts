import * as helloComponent from './components/hello/hello'
import * as worldComponent from './components/world/world'
import * as playerComponent from './components/player/player'
import * as bodiesComponent from './components/bodies/bodies'
import { Connection } from './connection'
import { Observable, Subject } from 'rxjs'
import { Engine } from 'matter-js'

export type ComponentsServer = ReturnType<typeof registerComponentsOnServer>
export type ComponentsClient = ReturnType<typeof registerComponentsOnClient>

export interface ComponentServerInput {
  connection: Connection
  engine: Engine
  components$: Observable<ComponentsServer>
}

export interface ComponentClientInput {
  connection: Connection
  engine: Engine
  components$: Observable<ComponentsClient>
}

export function registerComponentsOnServer(connection: Connection, engine: Engine) {
  const componentsSubject = new Subject<ComponentsServer>()
  const input: ComponentServerInput = {
    connection,
    engine,
    components$: componentsSubject.asObservable()
  }

  const components = {
    hello: helloComponent.registerOnServer(input),
    world: worldComponent.registerOnServer(input),
    player: playerComponent.registerOnServer(input),
    bodies: bodiesComponent.registerOnServer(input),
  }

  componentsSubject.next(components)
  componentsSubject.complete()

  return components
}

export function registerComponentsOnClient(connection: Connection, engine: Engine) {
  const componentsSubject = new Subject<ComponentsClient>()
  const input: ComponentClientInput = {
    connection,
    engine,
    components$: componentsSubject.asObservable()
  }

  const components = {
    hello: helloComponent.registerOnClient(input),
    world: worldComponent.registerOnClient(input),
    player: playerComponent.registerOnClient(input),
    bodies: bodiesComponent.registerOnClient(input),
  }

  componentsSubject.next(components)
  componentsSubject.complete()

  return components
}
