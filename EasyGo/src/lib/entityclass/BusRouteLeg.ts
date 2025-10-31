import { RouteLeg } from "./RouteLeg"
import { TransitLeg} from "@/lib/onemap/deserializedClasses/dzPtRoutes";

export class BusRouteLeg extends RouteLeg {
  routeName: string
  busStopCode: string

  constructor(data: TransitLeg) {
    super("BUS", data)
    this.routeName = data.route ?? "Unknown Bus"
    this.busStopCode = data.from?.stopCode ?? ""
    const from = this.start?.name ?? "Unknown"
    const to = this.end?.name ?? "Unknown"

    this.description = `Take ${this.routeName} from ${from} → ${to}`
  }
}
