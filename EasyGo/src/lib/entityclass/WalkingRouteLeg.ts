import { RouteLeg } from "./RouteLeg"
import { decodePolyline } from "../controllers/leaflet/leaflethelper-controller"
import {WalkLeg} from "@/lib/onemap/deserializedClasses/dzPtRoutes";

export class WalkingRouteLeg extends RouteLeg {
  constructor(data: WalkLeg) {
    super("WALK")

    this.mode = "WALK"
    this.distance = data.distance ?? 0
    this.duration = data.duration ?? 0
      //this.geometry = data.geometry ?? []
    // Decode its specific segment geometry for Leaflet display
    if (data.legGeometry?.points) {
      this.geometry = decodePolyline(data.legGeometry.points)
    }

    const fromName = data.from?.name ?? "Unknown Start"
    const toName = data.to?.name ?? "Unknown End"
    const distanceText = `${Math.round(this.distance)} m`

    // Readable display text
    this.description = `Walk from ${fromName} → ${toName} (${distanceText})`
  }
}