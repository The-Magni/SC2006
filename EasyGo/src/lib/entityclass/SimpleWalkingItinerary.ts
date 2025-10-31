import { BaseItinerary } from "./BaseItinerary"
import { RouteLeg } from "./RouteLeg"
import { decodePolyline } from "../controllers/leaflet/leaflethelper-controller"

export class SimpleWalkingItinerary extends BaseItinerary {
  fullGeometryString?: string
  polylineCoords: [number, number][]
  // summary: string;

  constructor(legs: RouteLeg[], fullGeometry?: string, userMode: string = "walk") {
    super(legs, userMode)
    this.fullGeometryString = fullGeometry
    // this.summary = `
    //   Duration: ${(this.totalDuration / 60).toFixed(0)} mins<br>
    //   Distance: ${(this.totalDistance / 1000).toFixed(2)} km<br>
    //   Mode: ${this.userMode}
    // `
    this.name = "Walking Route";
    if (fullGeometry) {
      const decoded = decodePolyline(fullGeometry) || []
      this.polylineCoords = decoded.map(p => [p.lat, p.lng]) as [number, number][]
    } else {
      this.polylineCoords = legs.flatMap(l =>
        l.geometry ? l.geometry.map(p => [p.lat, p.lng] as [number, number]) : []
      )
    }
  }

  public get mode() {
    return 'SimpleWalkingItinerary';
  }

  public get summary() {
    return `
      Duration: ${(this.totalDuration / 60).toFixed(0)} mins<br>
      Distance: ${(this.totalDistance / 1000).toFixed(2)} km<br>
      Mode: ${this.userMode}
    `
  }
}
