import {helloComponent} from './components/hello';

export const components = [
  helloComponent
]

export type Channels = ReturnType<typeof openDataChannels>

export function openDataChannels(pc: RTCPeerConnection) {
  return components.flatMap(c => c.createDataChannels(pc))
}
