import { BaseItinerary } from "./BaseItinerary"
import { RouteLeg } from "./RouteLeg"
import { decodePolyline } from "../controllers/leaflethelper-controller"

export class SimpleWalkingItinerary extends BaseItinerary {
  fullGeometryString?: string
  polylineCoords: [number, number][]

  constructor(legs: RouteLeg[], fullGeometry?: string, userMode: string = "walk") {
    super(legs, userMode)
    this.fullGeometryString = fullGeometry

    if (fullGeometry) {
      const decoded = decodePolyline(fullGeometry) || []
      this.polylineCoords = decoded.map(p => [p.lat, p.lng]) as [number, number][]
    } else {
      this.polylineCoords = legs.flatMap(l =>
        l.geometry ? l.geometry.map(p => [p.lat, p.lng] as [number, number]) : []
      )
    }
  }

  get summary(): string {
    return `
      Duration: ${(this.totalDuration / 60).toFixed(0)} mins<br>
      Distance: ${(this.totalDistance / 1000).toFixed(2)} km<br>
      Mode: ${this.userMode}
    `
  }
}
