import { Body, Bodies, World, Events } from 'matter-js'
import { filter, scan } from 'rxjs/operators'

export interface BoundDescription {
  width: number
  height: number
}

export function constructBoundBodies(bd: BoundDescription, world: World) {
  const options = {
    isStatic: true,
  }
  const boundWidth = 10
  World.add(
    world,
    [
      Bodies.rectangle(0, -bd.height/2, bd.width, boundWidth, options), // top
      Bodies.rectangle(0, bd.height/2, bd.width, boundWidth, options), // bottom
      Bodies.rectangle(-bd.width/2, 0, boundWidth, bd.height, options), // left
      Bodies.rectangle(bd.width/2, 0, boundWidth, bd.height, options), // right
    ]
  )
}
