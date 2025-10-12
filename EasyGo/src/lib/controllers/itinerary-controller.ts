
import { RouteLeg } from "../entityclass/RouteLeg"
import { Itinerary } from "../entityclass/Itinerary"


export class ItineraryController {
  static fromJson(json: any): Itinerary {
    const legs: RouteLeg[] = (json.legs || []).map((leg: any) => {
      return new RouteLeg(
        leg.mode,
        leg.from?.name ?? "Unknown",
        leg.to?.name ?? "Unknown",
        leg.distance ?? 0,
        leg.duration ?? 0
      )
    })

    return new Itinerary(
      json.duration ?? 0,
      json.fare ?? "0.00",
      json.transfers ?? 0,
      json.walkDistance ?? 0,
      legs
    )
  }


  static parseResponse(apiResponse: any): Itinerary[] {
    const itineraries = apiResponse?.plan?.itineraries ?? []
    return itineraries.map((it: any) => ItineraryController.fromJson(it))
  }
}
