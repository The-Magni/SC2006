import { BaseItinerary } from "./BaseItinerary"
import { RouteLeg } from "./RouteLeg"
import { Carpark } from "./Carpark"
import { decodePolyline } from "../controllers/leaflet/leaflethelper-controller"

export class DrivingItinerary extends BaseItinerary {
  nearestCarpark?: Carpark
  fullGeometryString?: string
  polylineCoords: [number, number][]
  viaRoute?: string
  userMode = "drive"
  // summary: string;

  constructor(legs: RouteLeg[], fgs?: string, nearestCarpark?: Carpark, viaRoute?: string) {
    super(legs, "drive")
    this.nearestCarpark = nearestCarpark
    this.fullGeometryString = fgs
    this.viaRoute = viaRoute
    this.name = "Driving Route " + viaRoute;
    if (fgs) {
      const decoded = decodePolyline(fgs)
      this.polylineCoords = decoded.map(p => [p.lat, p.lng]) as [number, number][]
    } else {
      // Fallback: build from legs if no geometry provided
      this.polylineCoords = legs.flatMap(l =>
        l.geometry ? l.geometry.map(p => [p.lat, p.lng] as [number, number]) : []
      )
    }
  }

  // public updateSummary() { // for when adding the walking itinerary to it
  //   this.summary = `
  //     Duration: ${(this.totalDuration / 60).toFixed(0)} mins<br>
  //     Distance: ${(this.totalDistance / 1000).toFixed(2)} km<br>
  //     ${this.legs.map(l => l.getDescription()).join("<br>")}
  //   `;
  // }

  public get summary() {
    return `
      Duration: ${(this.totalDuration / 60).toFixed(0)} mins<br>
      Distance: ${(this.totalDistance / 1000).toFixed(2)} km<br>
      ${this.legs.map(l => l.getDescription()).join("<br>")}
    `;
  }

  public get mode(): string {
      return 'DrivingItinerary';
  }
}
