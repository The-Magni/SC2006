import { Incident } from "../boundary/ExternalApiHandler";
import { BaseItinerary } from "../entityclass/BaseItinerary";
import { Carpark } from "../entityclass/Carpark";
import { DrivingItinerary } from "../entityclass/DrivingItinerary";
import { PublicItinerary } from "../entityclass/PublicItinerary";
import { RouteLeg } from "../entityclass/RouteLeg";
import { SimpleWalkingItinerary } from "../entityclass/SimpleWalkingItinerary";

interface LegData {
    mode: string;
    duration: number;
    distance: number;
    description: string;
    geometry: {lat: number; lng: number;}[]
}

export interface PublicItineraryData extends BaseItineraryData {
    totalTransfers: number;
    totalFare: number;
    busWaitTime: number;
    platformDensity: number;
    //name : string;
}

export interface DrivingItineraryData extends BaseItineraryData {
    polyLineCoords: [number, number][];
    viaRoute: string;
    nearestCarpark: {
        id: string;
        name: string;
        lat: number;
        lng: number;
        availableLots: number;
    };
    incidents: Incident[];
}

export interface WalkingItineraryData extends BaseItineraryData {
    polyLineCoords: [number, number][];
}

export interface BaseItineraryData {
    totalDuration: number; 
    totalDistance: number;
    walkingDistance: number;
    legs: LegData[];
    score: number;
    summary: string;
    name: string;
    incidents?: Incident[];
    weather?: string;
    
}

export interface ItineraryData<T extends BaseItineraryData> {
    mode: string;
    data: T;
}

export class Parser {
    private static deserializeRouteLeg(data: LegData): RouteLeg {
        const leg = new RouteLeg('base');
        leg.mode = data.mode;
        leg.duration = data.duration;
        leg.distance = data.distance;
        leg.description = data.description;
        leg.geometry = data.geometry;
        return leg;
    }

    private static serializeRouteLeg(leg: RouteLeg): LegData {
        return {
            mode: leg.mode,
            duration: leg.duration,
            distance: leg.distance,
            description: leg.description,
            geometry: leg.geometry.map(p => ({lat: p.lat, lng: p.lng}))
        }
    }

    public static serializePublicItinerary(itinerary: PublicItinerary): ItineraryData<PublicItineraryData> {
        return {
            mode: itinerary.mode,
            data: {
                totalDuration: itinerary.totalDuration,
                totalDistance: itinerary.totalDistance,
                walkingDistance: itinerary.walkingDistance,
                score: itinerary.convenienceScore.getScore(),
                summary: itinerary.summary,
                totalTransfers: itinerary.totalTransfers,
                totalFare: itinerary.totalFare || 0,
                busWaitTime: itinerary.busWaitTime,
                platformDensity: itinerary.platformDensity,
                legs: itinerary.legs.map(Parser.serializeRouteLeg),
                name: itinerary.name
            }
        }
    }

    public static serializeDrivingItinerary(itinerary: DrivingItinerary): ItineraryData<DrivingItineraryData> {
        return {
            mode: itinerary.mode,
            data: {
                totalDuration: itinerary.totalDuration,
                totalDistance: itinerary.totalDistance,
                walkingDistance: itinerary.walkingDistance,
                score: itinerary.convenienceScore.getScore(),
                summary: itinerary.summary,
                polyLineCoords: itinerary.polylineCoords,
                viaRoute: itinerary.viaRoute || 'Unknown',
                nearestCarpark: {
                    id: itinerary.nearestCarpark?.id || '0',
                    name: itinerary.nearestCarpark?.name || 'Unknown',
                    lat: itinerary.nearestCarpark?.lat || 0,
                    lng: itinerary.nearestCarpark?.lng || 0,
                    availableLots: itinerary.nearestCarpark?.availableLots || 0
                },
                legs: itinerary.legs.map(Parser.serializeRouteLeg),
                name: itinerary.name,
                incidents: itinerary.incidents,
                weather: itinerary.weather || ""

            }
        }
    }

    public static serializeWalkingItinerary(itinerary: SimpleWalkingItinerary): ItineraryData<WalkingItineraryData> {
        return {
            mode: itinerary.mode,
            data: {
                totalDuration: itinerary.totalDuration,
                totalDistance: itinerary.totalDistance,
                walkingDistance: itinerary.walkingDistance,
                polyLineCoords: itinerary.polylineCoords,
                summary: itinerary.summary,
                score: itinerary.convenienceScore.getScore(),
                legs: itinerary.legs.map(Parser.serializeRouteLeg),
                name: itinerary.name,
                weather: itinerary.weather || ""

            }
        }
    } 

    public static serializeBaseItinenerary(itinerary: BaseItinerary): ItineraryData<BaseItineraryData> {
        return {
            mode: itinerary.mode,
            data: {
                totalDuration: itinerary.totalDuration,
                totalDistance: itinerary.totalDistance,
                walkingDistance: itinerary.walkingDistance,
                score: itinerary.convenienceScore.getScore(),
                summary: itinerary.summary,
                legs: itinerary.legs.map(Parser.serializeRouteLeg),
                name: itinerary.name || "",
            }
        }
    }

    public static deserializePublicItinerary(data: ItineraryData<PublicItineraryData>): PublicItinerary {
        if (data.mode !== 'PublicItinerary')
            throw new Error('This is not public itinerary');
        const itinerary = new PublicItinerary([]);
        itinerary.totalDuration = data.data.totalDuration;
        itinerary.totalDistance = data.data.totalDistance;
        itinerary.convenienceScore.setScore(data.data.score);
        itinerary.totalTransfers = data.data.totalTransfers;
        itinerary.totalFare = data.data.totalFare;
        itinerary.busWaitTime = data.data.busWaitTime;
        itinerary.platformDensity = data.data.platformDensity;
        itinerary.legs = data.data.legs.map(data => Parser.deserializeRouteLeg(data));
        itinerary.walkingDistance = data.data.walkingDistance;
        itinerary.name = data.data.name;
        
        return itinerary;
    }

    public static deserializeDrivingItinerary(data: ItineraryData<DrivingItineraryData>): DrivingItinerary {
        if (data.mode !== 'DrivingItinerary')
            throw new Error('This is not driving itinerary');
        const itinerary = new DrivingItinerary([]);
        itinerary.totalDuration = data.data.totalDuration;
        itinerary.totalDistance = data.data.totalDistance;
        itinerary.convenienceScore.setScore(data.data.score);
        itinerary.polylineCoords = data.data.polyLineCoords;
        itinerary.viaRoute = data.data.viaRoute;
        itinerary.nearestCarpark = new Carpark(data.data.nearestCarpark);
        itinerary.walkingDistance = data.data.walkingDistance;
        itinerary.legs = data.data.legs.map(Parser.deserializeRouteLeg);
        itinerary.name = data.data.name;
        itinerary.incidents = data.data.incidents;
        return itinerary;
    }

    public static deserializeWalkingItinerary(data: ItineraryData<WalkingItineraryData>): SimpleWalkingItinerary {
        if (data.mode !== 'SimpleWalkingItinerary')
            throw new Error('This is not walking itinerary');
        const itinerary = new SimpleWalkingItinerary([]);
        itinerary.totalDuration = data.data.totalDuration;
        itinerary.totalDistance = data.data.totalDistance;
        itinerary.convenienceScore.setScore(data.data.score);
        itinerary.polylineCoords = data.data.polyLineCoords;
        itinerary.walkingDistance = data.data.walkingDistance;
        itinerary.name = data.data.name;
        itinerary.weather = data.data.weather || "";
        itinerary.legs = data.data.legs.map(Parser.deserializeRouteLeg);
        return itinerary;
    }
}