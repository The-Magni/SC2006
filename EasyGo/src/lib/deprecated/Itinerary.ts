// lib/models/Itinerary.ts
import { RouteLeg } from "../entityclass/RouteLeg"
import { TrainRouteLeg } from "../entityclass/TrainRouteLeg"
import { DrivingRouteLeg } from "../entityclass/DrivingRouteLeg"
import { WalkingRouteLeg } from "../entityclass/WalkingRouteLeg"
import { SimpleWalkingRouteLeg } from "../entityclass/SimpleWalkingRouteLeg"

import { BusRouteLeg } from "../entityclass/BusRouteLeg"
import { decodePolyline } from "../controllers/itinerary-controller"

export class Itinerary {
  legs: RouteLeg[]
  totalDuration: number
  totalDistance: number
  totalTransfers: number
  totalFare?: number
  userMode?: string

  constructor(legs: RouteLeg[], userMode?: string) {
    this.legs = legs
    this.totalDuration = legs.reduce((s, l) => s + (l.duration || 0), 0)
    this.totalDistance = legs.reduce((s, l) => s + (l.distance || 0), 0)
    this.totalTransfers = 0
    this.userMode = userMode

  }

  get summary(): string {
    const details = this.legs.map((leg) => leg.getDescription()).join("<br>")
    return `
      Duration: ${(this.totalDuration / 60).toFixed(0)} mins<br>
      Distance: ${(this.totalDistance / 1000).toFixed(2)} km<br>
      Transfers: ${this.totalTransfers}<br><br>
      ${details}
    `
  }

  getAllPolylines(): [number, number][][] {
    return this.legs
      .filter((l) => l.geometry)
      .map((l) => l.geometry!.map((p) => [p.lat, p.lng]))
  }


  static fromPT(data: any): Itinerary[] {
    const itineraries = data.plan?.itineraries || []

    return itineraries.map((iti: any) => {
      const legs = iti.legs.map((leg: any) => {
        const mode = leg.mode?.toUpperCase() ?? ""
        if (mode === "BUS") return new BusRouteLeg(leg)
        if (["RAIL", "SUBWAY", "TRAIN"].includes(mode)) return new TrainRouteLeg(leg)
        if (mode === "WALK") return new WalkingRouteLeg(leg)
        return new RouteLeg(leg)
      })

      const itinerary = new Itinerary(legs)
      itinerary.totalDuration = iti.duration ?? 0
      itinerary.totalDistance = iti.walkDistance ?? 0
      itinerary.totalTransfers = iti.transfers ?? 0
      itinerary.totalFare = parseFloat(iti.fare ?? "0")

      return itinerary
    })
  }


static fromSimple(data: any, type: "drive" | "walk" | "cycle"): Itinerary {
  const geometry = data.route_geometry
    ? decodePolyline(data.route_geometry)
    : []

  const summary = data.route_summary ?? {}

  const legData = {
    mode: type,
    distance: summary.total_distance ?? 0,
    duration: summary.total_time ?? 0,
    geometry,
    from: { lat: geometry[0]?.lat ?? 0, lng: geometry[0]?.lng ?? 0 },
    to: { lat: geometry.at(-1)?.lat ?? 0, lng: geometry.at(-1)?.lng ?? 0 },
  }

  let leg
  if (type === "drive") {
    leg = new DrivingRouteLeg(legData)
  } else {
    leg = new SimpleWalkingRouteLeg(legData)
  }

  const itinerary = new Itinerary([leg])
  itinerary.totalDuration = summary.total_time ?? 0
  itinerary.totalDistance = summary.total_distance ?? 0
  itinerary.totalTransfers = 0
  itinerary.totalFare = 0

  return itinerary
}
}