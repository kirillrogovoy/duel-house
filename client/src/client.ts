import { map, takeUntil, first, toArray, flatMap } from 'rxjs/operators'
import chance from 'chance'
import { connect } from './connection'
import {registerOnClient} from '../../shared/components';
import {Engine, Render} from 'matter-js';

const serverAddressElem = document.querySelector<HTMLInputElement>('.serverAddress')!
const nameElem = document.querySelector<HTMLInputElement>('.name')!
nameElem.value = chance().name()

const buttonConnect = document.querySelector<HTMLButtonElement>('.buttonConnect')!

const engine = Engine.create();
Engine.run(engine);

const render = Render.create({
    element: document.querySelector('.game'),
    engine: engine,
    options: {
        width: 800,
        height: 600,
    }
});

Render.run(render)

buttonConnect.addEventListener('click', () => {
  const connection$ = connect({
    playerName: nameElem.value,
    url: serverAddressElem.value
  })

  connection$.subscribe(connection => {
    console.log('connection', connection)

    const components = registerOnClient(connection, engine)
  })
})
