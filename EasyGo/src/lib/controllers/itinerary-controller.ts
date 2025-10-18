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
import { Carpark } from "../entityclass/Carpark"

export function parseCoords(coordStr: string): { lat: number; lng: number } | null {
  if (!coordStr) return null
  const [lat, lng] = coordStr.split(",").map(Number)
  if (isNaN(lat) || isNaN(lng)) return null
  return { lat, lng }
}


export class ItineraryController {

  static parseResponse(json: any, mode: "pt" | "drive" | "walk" | "cycle" = "pt"): BaseItinerary[] {
    if (!json) throw new Error("Empty OneMap response")
import { SimpleWalkingRouteLeg } from "../entityclass/SimpleWalkingRouteLeg"
import { ExternalApiHandler } from "../boundary/ExternalApiHandler"
import { calCrow } from "../utils"


export class ItineraryController {
	private api: ExternalApiHandler;

	public constructor(api: ExternalApiHandler) {
		this.api = api;
	}

	public async getNearestCarpark(itinery: Itinerary): Promise<[number, [number, number]]> {
		const destination = itinery.legs[itinery.legs.length - 1].end;
		if (!destination)
			return [-1, [-1, -1]];
		const latitude = destination.lat;
		const longtitude = destination.lon;
        const allCarParks = await this.api.fetchCarparkAvailability(latitude, longtitude);
        let minDistance = Infinity;
        let nearestLocation: [number, number] = [Infinity, Infinity];
        allCarParks.forEach(carparkData => {
            const location = carparkData.Location;
            const [lat, long] = location.split(' ').map(parseFloat);
            const distance = calCrow(lat, long, latitude, longtitude);
            if (distance < minDistance) {
                minDistance = distance;
                nearestLocation = [lat, long];
            }
        });

        if (Number.isFinite(minDistance)) 
            throw new Error('No carpark data found');
        return [minDistance, nearestLocation];

    }
	
	public async getPlatformDensity(itinery: Itinerary) {
		
	}


  static parseResponse(json: any, mode: "pt" | "drive" | "walk" | "cycle" = "pt"): Itinerary[] {
	console.log(json)
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

	// OneMap drive/walk/cycle responses have route_summary + route_geometry
	if (json.route_summary && json.route_geometry) {
		return this.parseSimpleRoute(json, mode)
	
	}

	console.warn("Unknown or unsupported OneMap format:", json)
	return []
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
        legs.push(new DrivingRouteLeg(instr))
      }
      console.log("the full geometry in build driving itinerary", fullGeometry)
      console.log("this is a route block",routeBlock.viaRoute)

      //temp empty carpark 
      const emptyCarpark = new Carpark({
      id: "",
      name: "Unknown",
      lat: 0,
      lng: 0,
      availableLots: 0,
    })


      const iti = new DrivingItinerary(legs, fullGeometry, emptyCarpark, routeBlock.viaRoute)
      iti.totalDuration = summary.total_time ?? 0
      iti.totalDistance = summary.total_distance ?? 0
      iti.totalTransfers = 0
      iti.totalFare = 0

      return iti
    }

    //
    //DRIVING MODES
    //
    if (mode === "drive") {
      // Primary (fastest) route
      if (json.route_instructions) {
        itineraries.push(buildDrivingItinerary(json, "fastest"))
      }

      // Secondary (shortest) route
      if (json.phyroute?.route_instructions) {
        itineraries.push(buildDrivingItinerary(json.phyroute, "shortest"))
      }

      // Alternative suggestions (array)
      if (Array.isArray(json.alternativeroute)) {
        json.alternativeroute.forEach((alt: any, idx: number) => {
          if (alt.route_instructions) {
            itineraries.push(buildDrivingItinerary(alt, `alternative_${idx + 1}`))
          }
        })
      }
    }

    //
    // WALK MODES
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
      const iti = new SimpleWalkingItinerary([leg], fullGeometry, mode)
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



// Utility functions for managing leaflet coordinates and polyline
export function parseCoords(coordStr: string): LatLng {
  if (!coordStr) return { lat: 0, lng: 0 }
  const [lat, lng] = coordStr.split(",").map(Number)
  return { lat, lng }
}


export function decodePolyline(encoded: string): LatLng[] {
  let index = 0,
    lat = 0,
    lng = 0;
  const coordinates: LatLng[] = []

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
