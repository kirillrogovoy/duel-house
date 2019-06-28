import {fromEvent, merge, Observable} from 'rxjs';
import {failIfNode} from '../../util';
import {map, filter} from 'rxjs/operators';

export interface KeyEvent {
  up: boolean
  code: string
  event: KeyboardEvent
}

export function getKeyStream(): Observable<KeyEvent> {
  failIfNode()

  const down$ = fromEvent(window, 'keydown')
  const up$ = fromEvent(window, 'keyup')

  console.log('subscribe');
  return merge(down$, up$).pipe(
    map(e => {
      const ke = e as KeyboardEvent

      return {
        up: ke.type === 'keyup',
        code: ke.code,
        event: ke
      }
    }),
    filter(e => !e.event.repeat)
  )
}

export interface ArrowMovementKeyMap {
  up: string
  down: string
  left: string
  right: string
}

export interface ArrowMovementCommand {
  pressed: boolean
  commandType: keyof ArrowMovementKeyMap
}

export function getArrowMovements(keyEventStream: Observable<KeyEvent>, keyMap: ArrowMovementKeyMap): Observable<ArrowMovementCommand> {
  return keyEventStream.pipe(
    filter(e => Object.values(keyMap).includes(e.code)),
    map(e => ({
      pressed: !e.up,
      commandType: keyMap.up === e.code ? 'up' : keyMap.down === e.code ? 'down' : keyMap.left === e.code ? 'left' : keyMap.right === e.code ? 'right' : undefined
    }))
  )
}
