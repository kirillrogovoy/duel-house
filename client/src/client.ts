import { map, takeUntil, first, toArray, flatMap } from 'rxjs/operators'
import chance from 'chance'
import { connect } from './connection'
import { registerComponentsOnClient } from '../../shared/components'
import { Engine, Render, World } from 'matter-js'

require('webrtc-adapter')

const serverAddressElem = document.querySelector<HTMLInputElement>('.serverAddress')!
const nameElem = document.querySelector<HTMLInputElement>('.name')!
nameElem.value = chance().name()

const buttonConnect = document.querySelector<HTMLButtonElement>('.buttonConnect')!

const world = World.create({
  gravity: {
    scale: 0,
    x: 0,
    y: 0
  }
})
const engine = Engine.create({ world })
Engine.run(engine)

const render = Render.create({
  element: document.querySelector('.game'),
  engine: engine,
  options: {
    width: 1280,
    height: 720,
    showPositions: true,
    showAngleIndicator: true,
  }
})
;(Render as any).lookAt(render, {max:{x:1280/2, y: 720/2},min:{x:-1280/2,y:-720/2}})

Render.run(render)

buttonConnect.addEventListener('click', () => {
  const connection$ = connect({
    playerName: nameElem.value,
    url: serverAddressElem.value
  })

  connection$.subscribe(connection => {
    console.log('connection', connection)

    registerComponentsOnClient(connection, engine)
  })
})
