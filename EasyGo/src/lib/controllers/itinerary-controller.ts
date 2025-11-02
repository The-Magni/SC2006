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
import { ExternalApiHandler, Incident } from "../boundary/ExternalApiHandler"
import { calCrow, getStopNumber, calDistancePointLine } from "../utils"
import { CarparkData } from "../boundary/ExternalApiHandler"
import { ConvenienceScoreFilterPreference } from "../entityclass/ConvenienceScoreFilterPreference"
import { OneMapPTResponse, TransitLeg, WalkLeg } from "@/lib/onemap/deserializedClasses/dzPtRoutes"
import { OneMapDrivingRouteResponse } from "@/lib/onemap/deserializedClasses/dzDrivingRoutes"
import { Bound } from "../entityclass/ConvenienceScore"

export type ItineraryScore<T extends BaseItinerary> = {
	itinerary: T;
	score: number;
};



function parseCoords(str: string): { lat: number; lon: number } {
    const parts = str?.split(",") ?? ["0", "0"];
    const lat = parseFloat(parts[0]) || 0;
    const lon = parseFloat(parts[1]) || 0;
    return { lat, lon };
}


export type OneMapAnyResponse = OneMapPTResponse | OneMapDrivingRouteResponse;

export class ItineraryController {

	private api: ExternalApiHandler;

	public constructor(api: ExternalApiHandler) {
        this.api = api;
    }	

	static parseResponse(json: OneMapAnyResponse, mode: "pt" | "drive" | "walk" | "cycle" = "pt"): BaseItinerary[] {
		if (!json) throw new Error("Empty OneMap response")

		if (mode === "pt" && "plan" in json && json.plan) {
		return this.parsePublicTransport(json)
		} else if (["drive", "walk", "cycle"].includes(mode)) {
		return this.parseSimpleRoute(json as OneMapDrivingRouteResponse, mode)
		} else {
		console.warn("Unknown OneMap format or missing data:", json)
		return []
		}
	}

	static parsePublicTransport(json: OneMapPTResponse): PublicItinerary[] {
		const itinerariesRaw = json.plan?.itineraries ?? []
		const itineraries: PublicItinerary[] = []

		for (const itinerary of itinerariesRaw) {
		const legsRaw = itinerary.legs ?? []
		const legs: RouteLeg[] = []

		for (const leg of legsRaw) {
			const mode = leg.mode?.toUpperCase() ?? ""
			if (mode === "BUS") legs.push(new BusRouteLeg(leg as TransitLeg))
			else if (["RAIL", "SUBWAY", "TRAIN"].includes(mode)) legs.push(new TrainRouteLeg(leg as TransitLeg))
			else if (mode === "WALK") legs.push(new WalkingRouteLeg(leg as WalkLeg))
			//else legs.push(new RouteLeg(leg as Bus))
		}

		const iti = new PublicItinerary(legs)
		iti.totalDuration = itinerary.duration ?? 0
		//iti.totalDistance = itinerary.walkDistance ?? 0
		iti.totalTransfers = itinerary.transfers ?? 0
		iti.totalFare = parseFloat(itinerary.fare ?? "0")

		const modeSequence: string[] = legs.map((leg) => {
		const m = leg.mode.toUpperCase()
		if (m === "BUS" && "routeName" in leg && leg.routeName) return `Bus ${leg.routeName}`
		if (["RAIL", "SUBWAY", "TRAIN"].includes(m) && "routeName" in leg && leg.routeName)
			return leg.routeName
		if (m === "WALK") return "Walk"
		return m
		}).filter((v): v is string => Boolean(v))

		iti.name = modeSequence.join(" → ")
			itineraries.push(iti)
			}

			return itineraries
		}


    static parseSimpleRoute(json: OneMapDrivingRouteResponse, mode: "pt" | "drive" | "walk" | "cycle"): BaseItinerary[] {
    const itineraries: BaseItinerary[] = []

		function buildDrivingItinerary(routeBlock: OneMapDrivingRouteResponse): DrivingItinerary {
		const summary = routeBlock.route_summary ?? {}
		const fullGeometry = routeBlock.route_geometry ?? ""
		const routeInstructions = routeBlock.route_instructions ?? []
		const legs: RouteLeg[] = []

      for (const instr of routeInstructions) {
        legs.push(new DrivingRouteLeg(instr))
      }

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
		iti.name = "Driving Route " + (routeBlock.viaRoute || "Via Unknown");
      return iti
    }

    //
    //DRIVING MODES
    //
    if (mode === "drive") {
      // Primary (fastest) route
      if (json.route_instructions) {
        itineraries.push(buildDrivingItinerary(json))
      }

    //   // Secondary (shortest) route
    //   if (json.phyroute?.route_instructions) {
    //     itineraries.push(buildDrivingItinerary(json.phyroute, "shortest"))
    //   }

    //   // Alternative suggestions (array)
    //   if (Array.isArray(json.alternativeroute)) {
    //     json.alternativeroute.forEach((alt: any, idx: number) => {
    //       if (alt.route_instructions) {
    //         itineraries.push(buildDrivingItinerary(alt, `alternative_${idx + 1}`))
    //       }
    //     })
    //   }
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
            from: parseCoords(json.route_instructions[0][3]),
            to: parseCoords(json.route_instructions[json.route_instructions.length -1][3]),
        } as WalkLeg);

      const iti = new SimpleWalkingItinerary([leg], fullGeometry, mode)
      iti.totalDuration = summary.total_time ?? 0
      iti.totalDistance = summary.total_distance ?? 0
      iti.totalTransfers = 0
      iti.totalFare = 0
	  iti.name = "Walking Route";
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

	public async getNearestCarpark(endLat: number, endLon: number) {
		for (let attempt = 0; attempt < 3; attempt++) { //retry 3 times
			try {
				const allCarParks = await this.api.fetchCarparkAvailability();
				const nearestCarparks: {carpark: CarparkData, distance: number }[] = [];
				allCarParks.forEach(carparkData => {
					const location = carparkData.Location;
					const [lat, lon] = location.split(' ').map(parseFloat);
					const distance = calCrow(lat, lon, endLat, endLon);
					nearestCarparks.push({
						carpark: carparkData,
						distance: distance
					});
				});
				const filteredNearestCarparks = nearestCarparks.filter(c => c.carpark.AvailableLots > 0);
				filteredNearestCarparks.sort((a, b) => a.distance - b.distance);
				return filteredNearestCarparks.slice(0, Math.min(3, filteredNearestCarparks.length));
			} catch (e) {
				console.error(e);
				throw new Error('Fail to get carpark data');
			}
		}
	}

	private async getRoutePlatformDensity(trainRoute: TrainRouteLeg): Promise<number> {
		const trainLine = trainRoute.routeName.toUpperCase() + 'L';
		try {
			const stationDataList = await this.api.fetchPlatformDensity(trainLine);
			const startStop = trainRoute.fromStation?.code.toUpperCase();
			const endStop = trainRoute.toStation?.code.toUpperCase();
			if (!startStop || !endStop) return 0.5;
		
			const startNumber = getStopNumber(startStop);
			const endNumber = getStopNumber(endStop);
			const relevantStationDataList = stationDataList.filter(station => {
				const number = getStopNumber(station.Station);
				const prefix = station.Station.match(/^[A-Z]+/)?.[0] || '';
				return (prefix === trainLine.replace(/L$/, '') 
				&& (startNumber <= number && number < endNumber) || (startNumber >= number && number > endNumber));
			});
			
			let totalDensity = 0;
			for (const stationData of relevantStationDataList) {
				// encode the density to number
				let density;
				switch (stationData.CrowdLevel) {
					case 'l':
						density = 0;
						break;
					case 'm':
						density = 0.5;
						break;
					case 'h':
						density = 1;
						break;
					default:
						density = 0.5; // default to moderate
						break;
				}
				totalDensity += density;
			}
			if (relevantStationDataList.length === 0) return 0.5;
			return totalDensity / relevantStationDataList.length;

		} catch (e) {
			console.error(e);
			return 0.5;
		}
	}

	public async getPlatformDensity(itinery: PublicItinerary): Promise<void> {
		let platformDensity = 0;
		let count = 0;
		for (const leg of itinery.legs) {
			if (leg instanceof TrainRouteLeg) {
				try {
					platformDensity += await this.getRoutePlatformDensity(leg);
					count++;
				} catch (e) {
					console.error(e);
				}
			}
		}
		if (count === 0) itinery.platformDensity = 0; // no TrainRoute, so technically dont count density
		itinery.platformDensity = platformDensity / count; // average platform density
	}

	public async getTrafficIncidents(itinerary: DrivingItinerary): Promise<void> {
		try {
			const uniqueIncidents = new Map<string, Incident>();
			const incidents = await this.api.fetchTrafficIncident();
			//const seen = new Set<string>();
			const coords = itinerary.polylineCoords;
			for (let i = 0; i < coords.length - 2; i++) {
				for (const incident of incidents) {
					const key = `${incident.Type}-${incident.Message.trim()}`;
					if (uniqueIncidents.has(key)) continue; 
					// quick bounding-box filter first (1 km range)
					const minLat = Math.min(coords[i][0], coords[i + 1][0]) - 0.003; 
					const maxLat = Math.max(coords[i][0], coords[i + 1][0]) + 0.003;
					const minLon = Math.min(coords[i][1], coords[i + 1][1]) - 0.003;
					const maxLon = Math.max(coords[i][1], coords[i + 1][1]) + 0.003;

					if (
					incident.Latitude >= minLat &&
					incident.Latitude <= maxLat &&
					incident.Longitude >= minLon &&
					incident.Longitude <= maxLon
					) {
					const distance = calDistancePointLine(
						incident.Latitude,
						incident.Longitude,
						coords[i][0],
						coords[i][1],
						coords[i + 1][0],
						coords[i + 1][1]
					);

					if (distance < 0.03) { 
						uniqueIncidents.set(key, incident);
					}
				}
			}
		}
		itinerary.incidents.push(...Array.from(uniqueIncidents.values()));

			
		} catch (e) {
			console.error(e);
			throw new Error('Fail to get traffic incidents data');
		}
	}

	public async getWeatherData(itinerary: BaseItinerary): Promise<void> {
		// get data of the weather station that is closest to the midpoint of the itinerary
		if (!(itinerary instanceof DrivingItinerary) && !(itinerary instanceof SimpleWalkingItinerary))
			return; // temporary patch because public doesnt have polylineCoords yet
		try {
			const [metadata, forecast] = await this.api.fetchWeatherData();
			const start = itinerary.polylineCoords[0];
			const end = itinerary.polylineCoords[itinerary.polylineCoords.length-1];
			const midpoint = {
				lat: (start[0] + end[0]) / 2,
				lon: (start[1] + end[1]) / 2
			}; // approximate for small distances (work ok for singapore)
			const distances = metadata.map(d => ({
				name: d.name, 
				distance: calCrow(d.label_location.latitude, d.label_location.longitude, midpoint.lat, midpoint.lon),
			}));
			let minDistance = Infinity;
			let closestStation = '';
			for (const d of distances) {
				if (d.distance < minDistance) {
					minDistance = d.distance;
					closestStation = d.name;
				}
			}
			if (!Number.isFinite(minDistance)) console.error('No weather station');
			let weatherData = forecast.find(f => f.area === closestStation)?.forecast;
			if (!weatherData) {
				weatherData = ''; 
				console.error('No forecast for this weather station');
			}
			itinerary.weather = weatherData;
		} catch (e) {
			console.error(e);
			throw new Error('Fail to get weather data');
		}
	}

	public async getBusWaitTime(itinerary: PublicItinerary) {
		let totalWaitTime = 0; // in minutes
		for (const route of itinerary.legs) {
			if (!(route instanceof BusRouteLeg))
				continue;
			try {
				const busData = await this.api.fetchBusArrivalTime(route.busStopCode, route.routeName);
				let waitTime = 0, count = 0;
				if (busData.length <= 1)
					continue; // bus may not in operations
				for (let i = 0; i < busData.length-1; i++) {
					const date1 = new Date(busData[i].EstimatedArrival);
					const date2 = new Date(busData[i+1].EstimatedArrival);
					if (isNaN(date1.getTime()) || isNaN(date2.getTime())) continue;
					waitTime += (date2.getTime() - date1.getTime()) / (1000 * 60);
					count++;
				}
				if (count === 0) {
					return;
				}
				totalWaitTime += waitTime / count;
			} catch (e) {
				console.error(e);
				continue;
			}
		}
		itinerary.busWaitTime = totalWaitTime;
	}

	public rankItineraries(itineraries: BaseItinerary[], userPreference: ConvenienceScoreFilterPreference) {
		const itineraryScore: ItineraryScore<BaseItinerary>[] = [];
		const bound = new Bound(itineraries);
		for (const itinerary of itineraries) {
			itinerary.convenienceScore.computeScore(bound, userPreference);
			const score = itinerary.convenienceScore.getScore();
			itineraryScore.push({
				itinerary: itinerary,
				score: score
			});
		}
		itineraryScore.sort((a, b) => b.score - a.score); // sort descending based on convenience score
		const bestItineraries = itineraryScore.slice(0, Math.min(3, itineraryScore.length));
		const walkingItineraries: ItineraryScore<SimpleWalkingItinerary>[] = [];
		const publicItineraries: ItineraryScore<PublicItinerary>[] = [];
		const drivingItineraries: ItineraryScore<DrivingItinerary>[] = []
		for (const i of itineraryScore) {
			if (i.itinerary instanceof SimpleWalkingItinerary)
				walkingItineraries.push(i as ItineraryScore<SimpleWalkingItinerary>);
			else if (i.itinerary instanceof PublicItinerary)
				publicItineraries.push(i as ItineraryScore<PublicItinerary>);
			else if (i.itinerary instanceof DrivingItinerary)
				drivingItineraries.push(i as ItineraryScore<DrivingItinerary>);
		}
		return [bestItineraries, walkingItineraries, publicItineraries, drivingItineraries];
	}
}