import { Observable } from 'rxjs'

export interface Connection {
  pc: RTCPeerConnection
  currentChannelId: number
  closed$: Observable<any>
}
