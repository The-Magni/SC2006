import L from "leaflet";
import { drawDrivingRoute } from "./draw-driving-line";
import { drawPublicRoute } from "./draw-pt-line";
import { drawWalkingRoute } from "./draw-walking-line";
import { BaseItineraryData, DrivingItineraryData, PublicItineraryData, WalkingItineraryData } from "@/lib/controllers/Parser";



export interface LatLng {
  lat: number
  lng: number
}


export function decodePolyline(encoded: string): LatLng[] {
  let index = 0
  let lat = 0
  let lng = 0
  const coordinates: LatLng[] = []

  while (index < encoded.length) {
    let b, shift = 0, result = 0

    // Decode latitude
    do {
      b = encoded.charCodeAt(index++) - 63
      result |= (b & 0x1f) << shift
      shift += 5
    } while (b >= 0x20)
    const deltaLat = (result & 1) ? ~(result >> 1) : (result >> 1)
    lat += deltaLat

    // Decode longitude
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


export function drawItineraryLine(map: L.Map, mode: string, itinerary: BaseItineraryData) {
  try {
    switch (mode) {
      case "drive":
      case "DrivingItinerary":
        if ("polyLineCoords" in itinerary) {
          drawDrivingRoute(map, itinerary as DrivingItineraryData);
        } else {
          console.warn("No polyLineCoords found for driving route.");
        }
        break;

      case "public":
      case "PublicItinerary":
        drawPublicRoute(map, itinerary as PublicItineraryData);
        break;

      case "walk":
      case "SimpleWalkingItinerary":
        if ("polyLineCoords" in itinerary) {
          drawWalkingRoute(map, itinerary as WalkingItineraryData);
        } else {
          console.warn("No polyLineCoords found for walking route.");
        }
        break;

      default:
        console.warn("Unknown route type:", mode, itinerary);
        break;
    }
  } catch (err) {
    console.error("Error drawing itinerary:", err, mode, itinerary);
  }
}