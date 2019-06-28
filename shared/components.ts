import * as helloComponent from './components/hello/hello';
import * as worldComponent from './components/world/world';
import * as playerComponent from './components/player/player';
import {Connection} from './connection';
import {Observable, Subject} from 'rxjs';
import {Engine} from 'matter-js';

export interface ComponentsServer {
  hello: ReturnType<typeof helloComponent.registerOnServer>
  world: ReturnType<typeof worldComponent.registerOnServer>
  player: ReturnType<typeof playerComponent.registerOnServer>
}

export interface ComponentsClient {
  hello: ReturnType<typeof helloComponent.registerOnClient>
  world: ReturnType<typeof worldComponent.registerOnClient>
  player: ReturnType<typeof playerComponent.registerOnClient>
}

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

  const components: ComponentsServer = {
    hello: helloComponent.registerOnServer(input),
    world: worldComponent.registerOnServer(input),
    player: playerComponent.registerOnServer(input),
  }

  componentsSubject.next(components)
  componentsSubject.complete()

  return components
}

export function registerOnClient(connection: Connection, engine: Engine) {
  const componentsSubject = new Subject<ComponentsClient>()
  const input: ComponentClientInput = {
    connection,
    engine,
    components$: componentsSubject.asObservable()
  }

  const components: ComponentsClient = {
    hello: helloComponent.registerOnClient(input),
    world: worldComponent.registerOnClient(input),
    player: playerComponent.registerOnClient(input),
  }

  componentsSubject.next(components)
  componentsSubject.complete()

  return components
}
