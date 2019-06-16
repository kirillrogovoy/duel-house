import { map, takeUntil, first, toArray, flatMap } from 'rxjs/operators'
import chance from 'chance'
import { connect } from './connection'
import {Channel} from '../../shared/channel';
import {HelloMessage} from '../../shared/components/hello';

const serverAddressElem = document.querySelector<HTMLInputElement>('.serverAddress')!
const nameElem = document.querySelector<HTMLInputElement>('.name')!
nameElem.value = chance().name()

const buttonConnect = document.querySelector<HTMLButtonElement>('.buttonConnect')!

buttonConnect.addEventListener('click', () => {
  const connection$ = connect({
    playerName: nameElem.value,
    url: serverAddressElem.value
  })

  connection$.subscribe(connection => {
    console.log('connection', connection)
    const helloChannel = connection.channels.find(c => c.label === 'hello') as Channel<'hello',HelloMessage>
    helloChannel.messages$.subscribe(m => console.log('hello message', m))
    helloChannel.send({
      text: 'hello from client'
    })
  })
})
