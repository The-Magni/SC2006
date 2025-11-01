import { RouteLeg } from "./RouteLeg"
import {RouteInstruction} from "@/lib/onemap/deserializedClasses/dzDrivingRoutes";

export class DrivingRouteLeg extends RouteLeg {
  instruction: string
  roadName: string
  distanceText: string
  direction: string

  constructor(data: RouteInstruction) {
    super("DRIVE")

    this.instruction = data[0] ?? ""
    this.roadName = data[1] ?? "Unnamed Road"
    this.distance = data[2] ?? 0
    this.distanceText = data[5] ?? `${this.distance}m`
    this.direction = data[6] ?? ""
    this.description = `${this.instruction} on ${this.roadName} (${this.distanceText})`
  }
}
