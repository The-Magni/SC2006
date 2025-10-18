// lib/controllers/itinerary-controller.ts
import { RouteLeg } from "../entityclass/RouteLeg"
import { BusRouteLeg } from "../entityclass/BusRouteLeg"
import { TrainRouteLeg } from "../entityclass/TrainRouteLeg"
import { WalkingRouteLeg } from "../entityclass/WalkingRouteLeg"
import { DrivingRouteLeg } from "../entityclass/DrivingRouteLeg"

import { BaseItinerary } from "../entityclass/BaseItinerary"
import { PublicItinerary } from "../entityclass/PublicItinerary"
import { DrivingItinerary } from "../entityclass/DrivingItinerary"
import { SimpleWalkingItinerary } from "../entityclass/SimpleWalkingItinerary"


export function parseCoords(coordStr: string): { lat: number; lng: number } | null {
  if (!coordStr) return null
  const [lat, lng] = coordStr.split(",").map(Number)
  if (isNaN(lat) || isNaN(lng)) return null
  return { lat, lng }
}


export class ItineraryController {

  static parseResponse(json: any, mode: "pt" | "drive" | "walk" | "cycle" = "pt"): BaseItinerary[] {
    if (!json) throw new Error("Empty OneMap response")

    if (mode === "pt" && json.plan) {
      return this.parsePublicTransport(json)
    } else if (["drive", "walk", "cycle"].includes(mode) && json.route_instructions) {
      return this.parseSimpleRoute(json, mode)
    } else {
      console.warn("Unknown OneMap format or missing data:", json)
      return []
    }
  }

  static parsePublicTransport(json: any): PublicItinerary[] {
    const itinerariesRaw = json.plan?.itineraries ?? []
    const itineraries: PublicItinerary[] = []

    for (const itinerary of itinerariesRaw) {
      const legsRaw = itinerary.legs ?? []
      const legs: RouteLeg[] = []

      for (const leg of legsRaw) {
        //console.log(leg)
        const mode = leg.mode?.toUpperCase() ?? ""
        if (mode === "BUS") legs.push(new BusRouteLeg(leg))
        else if (["RAIL", "SUBWAY", "TRAIN"].includes(mode)) legs.push(new TrainRouteLeg(leg))
        else if (mode === "WALK") legs.push(new WalkingRouteLeg(leg))
        else legs.push(new RouteLeg(leg))
      }

      const iti = new PublicItinerary(legs)
      iti.totalDuration = itinerary.duration ?? 0
      iti.totalDistance = itinerary.walkDistance ?? 0
      iti.totalTransfers = itinerary.transfers ?? 0
      iti.totalFare = parseFloat(itinerary.fare ?? "0")

      itineraries.push(iti)
    }

    return itineraries
  }


  static parseSimpleRoute(json: any, mode: "drive" | "walk" | "cycle"): BaseItinerary[] {
    const itineraries: BaseItinerary[] = []

    function buildDrivingItinerary(routeBlock: any, label?: string): DrivingItinerary {
      const summary = routeBlock.route_summary ?? {}
      const fullGeometry = routeBlock.route_geometry ?? ""
      const routeInstructions = routeBlock.route_instructions ?? []
      const legs: RouteLeg[] = []

      for (const instr of routeInstructions) {
        legs.push(
          new DrivingRouteLeg(instr, fullGeometry)
        )
      }

      const iti = new DrivingItinerary(legs)
      iti.totalDuration = summary.total_time ?? 0
      iti.totalDistance = summary.total_distance ?? 0
      iti.totalTransfers = 0
      iti.totalFare = 0
      iti.userMode = label ?? "drive"
      return iti
    }
    //fastest route by time
    if (mode === "drive" && json.route_instructions) {
      itineraries.push(buildDrivingItinerary(json, "fastest"))
    }

    //fastest secondary route by distance
    if (mode === "drive" && json.phyroute?.route_instructions) {
      itineraries.push(buildDrivingItinerary(json.phyroute, "shortest"))
    }

    if (["walk", "cycle"].includes(mode)) {
      const summary = json.route_summary ?? {}
      const fullGeometry = json.route_geometry ?? ""
      const leg = new WalkingRouteLeg({
        mode,
        distance: summary.total_distance ?? 0,
        duration: summary.total_time ?? 0,
        geometry: fullGeometry,
        from: parseCoords(json.start ?? ""),
        to: parseCoords(json.end ?? ""),
      })
      const iti = new SimpleWalkingItinerary([leg])
      iti.totalDuration = summary.total_time ?? 0
      iti.totalDistance = summary.total_distance ?? 0
      iti.totalTransfers = 0
      iti.totalFare = 0
      itineraries.push(iti)
    }

    return itineraries
  }


  static summarize(itineraries: BaseItinerary[]): string {
    if (!itineraries.length) return "<i>No routes found.</i>"

    let summaryText = ""
    itineraries.forEach((iti, i) => {
      summaryText += `<b>Itinerary ${i + 1}</b><br>`
      summaryText += `Duration: ${(iti.totalDuration / 60).toFixed(0)} mins<br>`
      summaryText += `Distance: ${(iti.totalDistance / 1000).toFixed(2)} km<br>`
      summaryText += `Transfers: ${iti.totalTransfers}<br><br>`

      iti.legs.forEach((leg) => {
        summaryText += `${leg.getDescription()}<br>`
      })
      summaryText += "<br><hr><br>"
    })

    return summaryText
  }
}
