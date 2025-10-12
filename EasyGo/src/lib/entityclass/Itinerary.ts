import { RouteLeg } from "./RouteLeg"

export class Itinerary {
  totalDurationSec: number
  totalFare: string
  totalTransfers: number
  totalWalkDistanceM: number
  legs: RouteLeg[]

  constructor(
    totalDurationSec: number,
    totalFare: string,
    totalTransfers: number,
    totalWalkDistanceM: number,
    legs: RouteLeg[]
  ) {
    this.totalDurationSec = totalDurationSec
    this.totalFare = totalFare
    this.totalTransfers = totalTransfers
    this.totalWalkDistanceM = totalWalkDistanceM
    this.legs = legs
  }

  get totalDurationMin(): number {
    return Math.round(this.totalDurationSec / 60)
  }

  private formatDistance(meters: number): string {
    if (meters < 1000) return `${meters.toFixed(0)} m`
    return `${(meters / 1000).toFixed(1)} km`
  }

  get summary(): string {
    const header = `${this.totalDurationMin} min • ${this.totalTransfers} transfer(s) • $${this.totalFare}\n`
    const body = this.legs
      .map((leg, i) => {
        const dur = `${leg.durationMin} min`
        const dist = this.formatDistance(leg.distanceM)
        const routeInfo =
          leg.mode === "SUBWAY" || leg.mode === "BUS"
            ? ` (${leg.routeName ?? leg.mode})`
            : ""

        return `${i + 1}. ${leg.mode}${routeInfo}: ${leg.from} → ${leg.to} (${dur}, ${dist})`
      })
      .join("\n")

    return header + body
  }
}
