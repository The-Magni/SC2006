import { RouteLeg } from "./RouteLeg"
import { TrainStation } from "./TrainStation"

export class TrainRouteLeg extends RouteLeg {
  routeName: string
  fromStation?: TrainStation
  toStation?: TrainStation

  constructor(data: any) {
    super(data)
    this.routeName = data.route ?? "Train Line"

    const fromName = this.start?.name ?? "Unknown"
    const toName = this.end?.name ?? "Unknown"

    this.fromStation = new TrainStation(fromName, data.from?.stopCode ?? "")
    this.toStation = new TrainStation(toName, data.to?.stopCode ?? "")

    this.description = `🚇 Take ${this.routeName} from ${this.fromStation.getName} → ${this.toStation.getName}`
  }
}
