import { RouteLeg } from "./RouteLeg"
import { decodePolyline } from "../controllers/leaflethelper-controller"

export class WalkingRouteLeg extends RouteLeg {
  constructor(data: any) {
    super(data)

    this.mode = "WALK"
    this.distance = data.distance ?? 0
    this.duration = data.duration ?? 0

    // Decode its specific segment geometry for Leaflet display
    if (data.legGeometry?.points) {
      this.geometry = decodePolyline(data.legGeometry.points)
    }

    const fromName = data.from?.name ?? "Unknown Start"
    const toName = data.to?.name ?? "Unknown End"
    const distanceText = `${Math.round(this.distance)} m`

    // Readable display text
    this.description = `Walk from <b>${fromName}</b> → <b>${toName}</b> (${distanceText})`
  }
}
