import { Itinerary } from "../entityclass/Itinerary"
import { LatLng, RouteLeg } from "../entityclass/RouteLeg"
import { BusRouteLeg } from "../entityclass/BusRouteLeg"
import { TrainRouteLeg } from "../entityclass/TrainRouteLeg"
import { WalkingRouteLeg } from "../entityclass/WalkingRouteLeg"
import { DrivingRouteLeg } from "../entityclass/DrivingRouteLeg"
import { SimpleWalkingRouteLeg } from "../entityclass/SimpleWalkingRouteLeg"
import { ExternalApiHandler } from "../boundary/ExternalApiHandler"
import { calCrow, calDistancePointLine, getStopNumber } from "../utils"

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
        const longitude = destination.lon;
        const allCarParks = await this.api.fetchCarparkAvailability();
        let minDistance = Infinity;
        let nearestLocation: [number, number] = [Infinity, Infinity];
        allCarParks.forEach(carparkData => {
            const location = carparkData.Location;
            const [lat, long] = location.split(' ').map(parseFloat);
            const distance = calCrow(lat, long, latitude, longitude);
            if (distance < minDistance) {
                minDistance = distance;
                nearestLocation = [lat, long];
            }
        });

        if (Number.isFinite(minDistance)) 
            throw new Error('No carpark data found');
        return [minDistance, nearestLocation];

    }

    private async getRoutePlatformDensity(trainRoute: TrainRouteLeg): Promise<number> {
        const trainLine = trainRoute.routeName.toUpperCase();
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
                && startNumber <= number && number < endNumber);
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
    
    public async getPlatformDensity(itinery: Itinerary): Promise<number> {
        let platformDensity = 0;
        let count = 0;
        for (const leg of itinery.legs) {
            if (leg instanceof TrainRouteLeg) {
                platformDensity += await this.getRoutePlatformDensity(leg);
                count++;
            }
        }
        if (count === 0) return 0; // no TrainRoute, so technically dont count density
        return platformDensity / count; // average platform density
    }

    public async getTrafficIncidents(itinerary: Itinerary) {
        const incidents = await this.api.fetchTrafficIncident();
        const relevantIncidents = [];
        const seen = new Set<string>();
        for (const route of itinerary.legs) {
            if (route instanceof DrivingRouteLeg) {
                for (let i = 0; i < route.geometry.length-1; i++) {
                    for (const incident of incidents) {
                        if (seen.has(`${incident.latitude}, ${incident.longitude}`))
                            continue; // ensure not add an incident twice
                        const distance = calDistancePointLine(
                            incident.latitude, 
                            incident.longitude,
                            route.geometry[i].lat,
                            route.geometry[i].lng,
                            route.geometry[i+1].lat,
                            route.geometry[i+1].lng
                        );
                        if (distance <= 50e-3) {
                            seen.add(`${incident.latitude}, ${incident.longitude}`); 
                            relevantIncidents.push(incident);
                        }
                    }
                }
            }
        }
        return relevantIncidents;
    }

    public async getWeatherData(itinerary: Itinerary): Promise<string> {
        // get data of the weather station that is closest to the midpoint of the itinerary
        const [metadata, forecast] = await this.api.fetchWeatherData();
        const start = itinerary.legs[0].start;
        const end = itinerary.legs[itinerary.legs.length-1].end;
        if (!start || !end)
            throw new Error('Invalid itinerary');
        const midpoint = {
            lat: (start.lat + end.lat) / 2,
            lon: (start.lon + end.lon) / 2
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
        if (!Number.isFinite(minDistance)) throw new Error('No weather station');
        const weatherData = forecast.find(f => f.area === closestStation)?.forecast;
        if (!weatherData) throw new Error('No forecast for this weather station');
        return weatherData;
    }


  static parseResponse(json: any, mode: "pt" | "drive" | "walk" | "cycle" = "pt"): Itinerary[] {
    console.log(json)
    if (!json) throw new Error("Empty OneMap response")

    if (mode === "pt" && json.plan) {
      return this.parsePublicTransport(json, mode)
    }

    // OneMap drive/walk/cycle responses have route_summary + route_geometry
    if (json.route_summary && json.route_geometry) {
        return this.parseSimpleRoute(json, mode)
    
    }

    console.warn("Unknown or unsupported OneMap format:", json)
    return []
}

// the controller parses the two types of return json, the public transport one and the simple route (walk / drive) one
  static parsePublicTransport(json: any, mode: "pt" | "drive" | "walk" | "cycle" = "pt"): Itinerary[] {
    
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
      iti.userMode = mode
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
  iti.userMode = mode
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

