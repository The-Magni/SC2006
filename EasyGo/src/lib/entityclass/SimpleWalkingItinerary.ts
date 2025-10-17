import { BaseItinerary } from "./BaseItinerary"
import { SimpleWalkingRouteLeg } from "./SimpleWalkingRouteLeg"
import { decodePolyline } from "../controllers/leaflethelper-controller"

export class SimpleWalkingItinerary extends BaseItinerary {
  constructor(legs: SimpleWalkingRouteLeg[]) {
    super(legs, "walk")
  }

  get summary(): string {
    const leg = this.legs[0]
    return `
      🚶 Walking Route<br>
      Duration: ${(this.totalDuration / 60).toFixed(0)} mins<br>
      Distance: ${(this.totalDistance / 1000).toFixed(2)} km<br>
      ${leg.getDescription()}
    `
  }

  static fromSimple(data: any): SimpleWalkingItinerary {
    const geometry = data.route_geometry ? decodePolyline(data.route_geometry) : []
    const summary = data.route_summary ?? {}

    const leg = new SimpleWalkingRouteLeg({
      mode: "walk",
      distance: summary.total_distance ?? 0,
      duration: summary.total_time ?? 0,
      geometry,
      from: { lat: geometry[0]?.lat ?? 0, lng: geometry[0]?.lng ?? 0 },
      to: { lat: geometry.at(-1)?.lat ?? 0, lng: geometry.at(-1)?.lng ?? 0 },
    })

    const itinerary = new SimpleWalkingItinerary([leg])
    itinerary.totalDuration = summary.total_time ?? 0
    itinerary.totalDistance = summary.total_distance ?? 0
    itinerary.totalTransfers = 0
    itinerary.totalFare = 0

    return itinerary
  }
}
