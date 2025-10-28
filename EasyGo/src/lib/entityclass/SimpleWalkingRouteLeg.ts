import { RouteLeg } from "./RouteLeg"

export class SimpleWalkingRouteLeg extends RouteLeg {
  from?: [number, number]
  to?: [number, number]

  constructor(data: {
    mode: string
    distance?: number
    duration?: number
    from?: [number, number]
    to?: [number, number]
  }) {
    super("WALK")
    this.distance = data.distance ?? 0
    this.duration = data.duration ?? 0
    this.from = data.from
    this.to = data.to
    this.description = `${this.mode} for ${(this.distance / 1000).toFixed(2)} km`
  }
}
