import { RouteLeg } from "./RouteLeg"

export class TrainRouteLeg extends RouteLeg {
  routeName: string

  constructor(data: any) {
    super(data)
    this.routeName = data.route ?? "Train Line"
    const from = this.start?.name ?? "Unknown"
    const to = this.end?.name ?? "Unknown"

    this.description = `Take ${this.routeName} from ${from} → ${to}`
  }
}
