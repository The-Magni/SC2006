import { BaseItinerary } from "./BaseItinerary"
import { RouteLeg } from "./RouteLeg"
import { Carpark } from "./Carpark"

export class DrivingItinerary extends BaseItinerary {
  nearestCarpark?: Carpark

  constructor(legs: RouteLeg[], nearestCarpark?: Carpark) {
    super(legs, "drive")
    this.nearestCarpark = nearestCarpark
  }

  get summary(): string {
    return `
      Duration: ${(this.totalDuration / 60).toFixed(0)} mins<br>
      Distance: ${(this.totalDistance / 1000).toFixed(2)} km<br>
      ${this.legs.map(l => l.getDescription()).join("<br>")}
    `
  }
}
