import { RouteLeg } from "./RouteLeg"

export abstract class BaseItinerary {
  legs: RouteLeg[]
  totalDuration: number
  totalDistance: number
  totalTransfers: number
  totalFare?: number
  userMode?: string

  constructor(legs: RouteLeg[], userMode?: string) {
    this.legs = legs
    this.userMode = userMode
    this.totalDuration = legs.reduce((s, l) => s + (l.duration || 0), 0)
    this.totalDistance = legs.reduce((s, l) => s + (l.distance || 0), 0)
    this.totalTransfers = Math.max(legs.length - 1, 0)
  }

  abstract get summary(): string

  getAllPolylines(): [number, number][][] {
    return this.legs
      .filter((l) => l.geometry)
      .map((l) => l.geometry!.map((p) => [p.lat, p.lng]))
  }
}
