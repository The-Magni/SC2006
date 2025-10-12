export class RouteLeg {
  mode: string
  from: string
  to: string
  distanceM: number
  durationSec: number
  routeName?: string

  constructor(
    mode: string,
    from: string,
    to: string,
    distanceM: number,
    durationSec: number,
    routeName?: string
  ) {
    this.mode = mode
    this.from = from
    this.to = to
    this.distanceM = distanceM
    this.durationSec = durationSec
    this.routeName = routeName
  }

  get durationMin(): number {
    return Math.round(this.durationSec / 60)
  }
}
