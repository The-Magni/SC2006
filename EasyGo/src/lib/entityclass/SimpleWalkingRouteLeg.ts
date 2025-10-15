import { RouteLeg } from "./RouteLeg"
import { decodePolyline } from "../controllers/itinerary-controller"

export class SimpleWalkingRouteLeg extends RouteLeg {
  instruction: string
  distanceText: string
  direction: string
  geometryString: string

  constructor(data: any, fullGeometry?: string) {
    super({ mode: "WALK" })

    this.instruction = data[0] ?? ""
    this.distance = data[2] ?? 0
    this.distanceText = data[5] ?? `${this.distance}m`
    this.direction = data[6] ?? ""
    this.geometryString = fullGeometry ?? ""

    this.geometry = this.geometryString ? decodePolyline(this.geometryString) : []
    this.description = `🚶 ${this.instruction} (${this.distanceText})`
  }
}
