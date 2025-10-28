import { Incident } from "../boundary/ExternalApiHandler"
import type { ConvenienceScore } from "./ConvenienceScore"
import { ConvenienceScoreFactory } from "./ConvenienceScore"
import { RouteLeg } from "./RouteLeg"
import { SimpleWalkingRouteLeg } from "./SimpleWalkingRouteLeg"

export abstract class BaseItinerary {
  legs: RouteLeg[]
  totalDuration: number
  totalDistance: number
  totalTransfers: number
  totalFare?: number
  userMode?: string
  weather: string;
  incidents: Incident[];
  convenienceScore: ConvenienceScore;
  abstract summary: string;

  constructor(legs: RouteLeg[], userMode?: string) {
    this.legs = legs
    this.userMode = userMode
    this.totalDuration = legs.reduce((s, l) => s + (l.duration || 0), 0)
    this.totalDistance = legs.reduce((s, l) => s + (l.distance || 0), 0)
    this.totalTransfers = Math.max(legs.length - 1, 0)
    this.weather = '' // init an empty string, will take the value later from ItineraryController
    this.incidents = [];
    this.convenienceScore = ConvenienceScoreFactory.create(this);
	}

  public abstract get mode(): string;

  getAllPolylines(): [number, number][][] {
    return this.legs
      .filter((l) => l.geometry)
      .map((l) => l.geometry!.map((p) => [p.lat, p.lng]))
  }

  public getWalkingDistance(): number {
	let walkingDistance = 0;
	for (const leg of this.legs) {
		if (leg instanceof SimpleWalkingRouteLeg)
			walkingDistance += leg.distance;
	}
	return walkingDistance;
  }
}
