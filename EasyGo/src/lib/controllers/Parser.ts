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

interface PublicItineraryData {
    totalDuration: number;
    totalDistance: number;
    score: number;
    summary: string;
    totalTransfers: number;
    totalFare: number;
    busWaitTime: number;
    platformDensity: number;
    legs: LegData[];
}

interface DrivingItineraryData {
    totalDuration: number;
    totalDistance: number;
    score: number;
    summary: string;
    polyLineCoords: [number, number][];
    viaRoute: string;
    nearestCarpark: {
        id: string;
        name: string;
        lat: number;
        lng: number;
        availableLots: number;
    };
}

interface WalkingItineraryData {
    totalDuration: number;
    totalDistance: number;
    score: number;
    summary: string;
    polyLineCoords: [number, number][];
}

interface ItineraryData<T> {
    mode: string;
    data: T;
}

export class Parser {
    private static deserializeRouteLeg(data: LegData): RouteLeg {
        const leg = new RouteLeg({});
        leg.mode = data.mode;
        leg.duration = data.duration;
        leg.distance = data.distance;
        leg.description = data.description;
        leg.geometry = data.geometry;
        return leg;
    }

    public static serializePublicItinerary(itinerary: PublicItinerary): ItineraryData<PublicItineraryData> {
        return {
            mode: itinerary.mode,
            data: {
                totalDuration: itinerary.totalDuration,
                totalDistance: itinerary.totalDistance,
                score: itinerary.convenienceScore.getScore(),
                summary: itinerary.summary,
                totalTransfers: itinerary.totalTransfers,
                totalFare: itinerary.totalFare || 0,
                busWaitTime: itinerary.busWaitTime,
                platformDensity: itinerary.platformDensity,
                legs: itinerary.legs.map(l => ({
                    mode: l.mode,
                    duration: l.duration,
                    distance: l.distance,
                    description: l.description,
                    geometry: l.geometry.map(p => ({lat: p.lat, lng: p.lng}))
                }))
            }
        }
    }

    public static serializeDrivivingItinerary(itinerary: DrivingItinerary): ItineraryData<DrivingItineraryData> {
        return {
            mode: itinerary.mode,
            data: {
                totalDuration: itinerary.totalDuration,
                totalDistance: itinerary.totalDistance,
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
                }
            }
        }
    }

    public static serializeWalkingItinerary(itinerary: SimpleWalkingItinerary): ItineraryData<WalkingItineraryData> {
        return {
            mode: itinerary.mode,
            data: {
                totalDuration: itinerary.totalDuration,
                totalDistance: itinerary.totalDistance,
                polyLineCoords: itinerary.polylineCoords,
                summary: itinerary.summary,
                score: itinerary.convenienceScore.getScore()
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
        itinerary.summary = data.data.summary;        
        itinerary.totalTransfers = data.data.totalTransfers;
        itinerary.totalFare = data.data.totalFare;
        itinerary.busWaitTime = data.data.busWaitTime;
        itinerary.platformDensity = data.data.platformDensity;
        itinerary.legs = data.data.legs.map(data => Parser.deserializeRouteLeg(data));
        return itinerary;
    }

    public static deserializeDrivingItinerary(data: ItineraryData<DrivingItineraryData>): DrivingItinerary {
        if (data.mode !== 'DrivingItinerary')
            throw new Error('This is not driving itinerary');
        const itinerary = new DrivingItinerary([]);
        itinerary.totalDuration = data.data.totalDuration;
        itinerary.totalDistance = data.data.totalDistance;
        itinerary.convenienceScore.setScore(data.data.score);
        itinerary.summary = data.data.summary;
        itinerary.polylineCoords = data.data.polyLineCoords;
        itinerary.viaRoute = data.data.viaRoute;
        itinerary.nearestCarpark = new Carpark(data.data.nearestCarpark);
        return itinerary;
    }

    public static deserializeWalkingItinerary(data: ItineraryData<WalkingItineraryData>): SimpleWalkingItinerary {
        if (data.mode !== 'SimpleWalkingItinerary')
            throw new Error('This is not walking itinerary');
        const itinerary = new SimpleWalkingItinerary([]);
        itinerary.totalDuration = data.data.totalDuration;
        itinerary.totalDistance = data.data.totalDistance;
        itinerary.convenienceScore.setScore(data.data.score);
        itinerary.summary = data.data.summary;
        itinerary.polylineCoords = data.data.polyLineCoords;
        return itinerary;
    }
}