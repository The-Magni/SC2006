export type LatLng = { lat: number; lng: number }
import { decodePolyline } from "../controllers/leaflethelper-controller"

export class RouteLeg {
  mode: string
  distance: number
  duration: number
  start?: { name: string; lat: number; lon: number }
  end?: { name: string; lat: number; lon: number }
  geometry: [number, number][] = []
  description = ""

  constructor(data: any) {
    this.mode = data.mode ?? "UNKNOWN"
    this.distance = data.distance ?? 0
    this.duration = data.duration ?? 0

    if (data.from) {
      this.start = {
        name: data.from.name ?? "Unknown",
        lat: data.from.lat ?? 0,
        lon: data.from.lon ?? 0,
      }
    }

    if (data.to) {
      this.end = {
        name: data.to.name ?? "Unknown",
        lat: data.to.lat ?? 0,
        lon: data.to.lon ?? 0,
      }
    }

    if (data.legGeometry?.points) {
      this.geometry = decodePolyline(data.legGeometry.points)
    }

    if (!this.geometry) this.geometry = []
  }

  getDescription(): string {
    return this.description
  }
}
