import { RouteLeg } from "./RouteLeg"

export class BusRouteLeg extends RouteLeg {
  routeName: string
  busStopCode?: string

  constructor(data: any) {
    super(data)
    this.routeName = data.route ?? "Unknown Bus"
    this.busStopCode = data.from?.stopCode ?? ""
    console.log(this.busStopCode)
    const from = this.start?.name ?? "Unknown"
    const to = this.end?.name ?? "Unknown"

    this.description = `Take ${this.routeName} from ${from} → ${to}`
  }
}
