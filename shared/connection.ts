import { Observable, fromEvent } from 'rxjs'
import {Channels} from './components';

export interface Connection {
  pc: RTCPeerConnection
  channels: Channels
}
