import { BaseItinerary } from "./BaseItinerary"
import { RouteLeg } from "./RouteLeg"
<<<<<<< HEAD
import { decodePolyline } from "../controllers/leaflet/leaflethelper-controller"
=======
import { decodePolyline } from "../controllers/leaflethelper-controller"
>>>>>>> main

export class SimpleWalkingItinerary extends BaseItinerary {
  fullGeometryString?: string
  polylineCoords: [number, number][]
<<<<<<< HEAD
  // summary: string;
=======
  summary: string;
>>>>>>> main

  constructor(legs: RouteLeg[], fullGeometry?: string, userMode: string = "walk") {
    super(legs, userMode)
    this.fullGeometryString = fullGeometry
<<<<<<< HEAD
    // this.summary = `
    //   Duration: ${(this.totalDuration / 60).toFixed(0)} mins<br>
    //   Distance: ${(this.totalDistance / 1000).toFixed(2)} km<br>
    //   Mode: ${this.userMode}
    // `
    this.name = "Walking Route";
=======
    this.summary = `
      Duration: ${(this.totalDuration / 60).toFixed(0)} mins<br>
      Distance: ${(this.totalDistance / 1000).toFixed(2)} km<br>
      Mode: ${this.userMode}
    `

>>>>>>> main
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
<<<<<<< HEAD
  }

  public get summary() {
    return `
      Duration: ${(this.totalDuration / 60).toFixed(0)} mins<br>
      Distance: ${(this.totalDistance / 1000).toFixed(2)} km<br>
      Mode: ${this.userMode}
    `
=======
>>>>>>> main
  }
}
