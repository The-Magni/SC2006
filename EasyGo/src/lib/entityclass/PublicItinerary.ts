import { BaseItinerary } from "./BaseItinerary"
import { RouteLeg } from "./RouteLeg"

export class PublicItinerary extends BaseItinerary {
  userMode?: string
  busWaitTime: number;
  platformDensity: number;
  // summary: string;

  constructor(legs: RouteLeg[]) {
    super(legs, "pt")
    this.userMode = "pt"
    this.busWaitTime = 0; // init so that typescript doesnt complain
    this.platformDensity = 0; // same thing
    // const details = this.legs.map((l) => l.getDescription()).join("<br>")
    // this.summary = `
    //   Public Transport<br>
    //   Duration: ${(this.totalDuration / 60).toFixed(0)} mins<br>
    //   Distance: ${(this.totalDistance / 1000).toFixed(2)} km<br>
    //   Transfers: ${this.totalTransfers}<br><br>
    //   ${details}
    // `
  }
  public get mode() {
    return 'PublicItinerary';
  }

  public get summary() {
    const details = this.legs.map((l) => l.getDescription()).join("<br>")
    return `
      Public Transport<br>
      Duration: ${(this.totalDuration / 60).toFixed(0)} mins<br>
      Distance: ${(this.totalDistance / 1000).toFixed(2)} km<br>
      Transfers: ${this.totalTransfers}<br><br>
      ${details}
    `
  }
/*

  

  static fromPT(data: any): PublicItinerary[] {
    const itineraries = data.plan?.itineraries || []

    return itineraries.map((iti: any) => {
      const legs = iti.legs.map((leg: any) => {
        const mode = leg.mode?.toUpperCase() ?? ""
        if (mode === "BUS") return new BusRouteLeg(leg)
        if (["RAIL", "SUBWAY", "TRAIN"].includes(mode)) return new TrainRouteLeg(leg)
        if (mode === "WALK") return new WalkingRouteLeg(leg)
        return new RouteLeg(leg)
      })

      const itinerary = new PublicItinerary(legs)
      itinerary.totalDuration = iti.duration ?? 0
      itinerary.totalDistance = iti.walkDistance ?? 0
      itinerary.totalTransfers = iti.transfers ?? 0
      itinerary.totalFare = parseFloat(iti.fare ?? "0")
      return itinerary
    })
  }*/
}
