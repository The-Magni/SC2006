import { RouteLeg } from "./RouteLeg"

export class BusRouteLeg extends RouteLeg {
  routeName: string

  constructor(data: any) {
    super(data)
    this.routeName = data.route ?? "Unknown Bus"

    const from = this.start?.name ?? "Unknown"
    const to = this.end?.name ?? "Unknown"

    this.description = `Take ${this.routeName} from ${from} → ${to}`
  }
}
