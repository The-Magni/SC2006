import { Itinerary } from "../entityclass/Itinerary"
import { LatLng, RouteLeg } from "../entityclass/RouteLeg"
import { BusRouteLeg } from "../entityclass/BusRouteLeg"
import { TrainRouteLeg } from "../entityclass/TrainRouteLeg"
import { WalkingRouteLeg } from "../entityclass/WalkingRouteLeg"
import { DrivingRouteLeg } from "../entityclass/DrivingRouteLeg"
import { SimpleWalkingRouteLeg } from "../entityclass/SimpleWalkingRouteLeg"


export class ItineraryController {
  static parseResponse(json: any, mode: "pt" | "drive" | "walk" | "cycle" = "pt"): Itinerary[] {
    console.log(json)
    if (!json) throw new Error("Empty OneMap response")

    if (mode === "pt" && json.plan) {
      return this.parsePublicTransport(json)
    }

      // OneMap drive/walk/cycle responses have route_summary + route_geometry
      if (json.route_summary && json.route_geometry) {
        return this.parseSimpleRoute(json, mode)
      
    }

    console.warn("Unknown or unsupported OneMap format:", json)
    return []
  }

// the controller parses the two types of return json, the public transport one and the simple route (walk / drive) one
  static parsePublicTransport(json: any): Itinerary[] {
    const itinerariesRaw = json.plan?.itineraries ?? []
    const itineraries: Itinerary[] = []

    for (const itinerary of itinerariesRaw) {
      const legsRaw = itinerary.legs ?? []
      const legs: RouteLeg[] = []

      for (const leg of legsRaw) {
        const mode = leg.mode?.toUpperCase() ?? ""
        console.log(`Mode detected: ${mode} | Route: ${leg.route}`)

        if (mode === "BUS") {
          legs.push(new BusRouteLeg(leg))
        } else if (["RAIL", "SUBWAY", "TRAIN"].includes(mode)) {
          legs.push(new TrainRouteLeg(leg))
        } else if (mode === "WALK") {
          legs.push(new WalkingRouteLeg(leg))
        } else {
          legs.push(new RouteLeg(leg))
        }
      }

      const iti = new Itinerary(legs)
      iti.totalDuration = itinerary.duration ?? 0
      iti.totalDistance = itinerary.walkDistance ?? 0
      iti.totalTransfers = itinerary.transfers ?? 0
      iti.totalFare = parseFloat(itinerary.fare ?? "0")

      itineraries.push(iti)
    }

    return itineraries
  }

static parseSimpleRoute(json: any, mode: "drive" | "walk" | "cycle"): Itinerary[] {
  const routeInstructions = json.route_instructions ?? []
  const fullGeometry = json.route_geometry ? decodePolyline(json.route_geometry) : []

  const legs = routeInstructions.map((instr: any) => {
    if (mode === "drive") return new DrivingRouteLeg(instr, json.route_geometry)
    if (mode === "walk") return new SimpleWalkingRouteLeg(instr, json.route_geometry)

  })

  const iti = new Itinerary(legs)
  iti.totalDuration = json.route_summary?.total_time ?? 0
  iti.totalDistance = json.route_summary?.total_distance ?? 0
  iti.totalTransfers = legs.length - 1
  iti.totalFare = 0

  return [iti]
}

  static summarize(itineraries: Itinerary[]): string {
    if (!itineraries.length) return "<i>No routes found.</i>"

    let summaryText = ""
    itineraries.forEach((itinerary, index) => {
      summaryText += `<b>Itinerary ${index + 1}</b><br>`
      summaryText += `Duration: ${(itinerary.totalDuration / 60).toFixed(0)} mins<br>`
      summaryText += `Distance: ${(itinerary.totalDistance / 1000).toFixed(2)} km<br>`
      summaryText += `Transfers: ${itinerary.totalTransfers}<br><br>`

      itinerary.legs.forEach((leg) => {
        summaryText += `${leg.description}<br>`
      })

      summaryText += "<br><hr><br>"
    })

    return summaryText
  }
}



// Utility functions for managing leaflet coordinates and polyline
export function parseCoords(coordStr: string): LatLng {
  if (!coordStr) return { lat: 0, lng: 0 }
  const [lat, lng] = coordStr.split(",").map(Number)
  return { lat, lng }
}


export function decodePolyline(encoded: string): LatLng[] {
  let index = 0,
    lat = 0,
    lng = 0,
    coordinates: LatLng[] = []

  while (index < encoded.length) {
    let b, shift = 0, result = 0
    do {
      b = encoded.charCodeAt(index++) - 63
      result |= (b & 0x1f) << shift
      shift += 5
    } while (b >= 0x20)
    const deltaLat = (result & 1) ? ~(result >> 1) : (result >> 1)
    lat += deltaLat

    shift = 0
    result = 0
    do {
      b = encoded.charCodeAt(index++) - 63
      result |= (b & 0x1f) << shift
      shift += 5
    } while (b >= 0x20)
    const deltaLng = (result & 1) ? ~(result >> 1) : (result >> 1)
    lng += deltaLng

    coordinates.push({ lat: lat / 1e5, lng: lng / 1e5 })
  }

  return coordinates
}
