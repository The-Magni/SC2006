import { RouteLeg } from "./RouteLeg"
import { decodePolyline } from "../controllers/leaflethelper-controller"

export class DrivingRouteLeg extends RouteLeg {
  instruction: string
  roadName: string
  distanceText: string
  direction: string
  geometryString: string

  constructor(data: any, fullGeometry?: string) {
    super({ mode: "DRIVE" })
    console.log("i am in the consttructor now", data)

    this.instruction = data[0] ?? ""
    this.roadName = data[1] ?? "Unnamed Road"
    this.distance = data[2] ?? 0
    this.distanceText = data[5] ?? `${this.distance}m`
    this.direction = data[6] ?? ""
    this.geometryString = fullGeometry ?? ""

    this.geometry = this.geometryString ? decodePolyline(this.geometryString) : []
    this.description = `${this.instruction} on ${this.roadName} (${this.distanceText})`
  }
}
