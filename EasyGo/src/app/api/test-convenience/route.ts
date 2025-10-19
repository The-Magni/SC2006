import { ExternalApiHandler } from "@/lib/boundary/ExternalApiHandler";
import { ItineraryController, ItineraryScore } from "@/lib/controllers/itinerary-controller";
import { BaseItinerary } from "@/lib/entityclass/BaseItinerary";
import { Carpark } from "@/lib/entityclass/Carpark";
import { ConvenienceScoreFilterPreference } from "@/lib/entityclass/ConvenienceScoreFilterPreference";
import { DrivingItinerary } from "@/lib/entityclass/DrivingItinerary";
import { PublicItinerary } from "@/lib/entityclass/PublicItinerary";
import { SimpleWalkingItinerary } from "@/lib/entityclass/SimpleWalkingItinerary";
import { getRoute } from "@/lib/onemap/onemapHandler";
import { NextRequest, NextResponse } from "next/server";

interface RequestBody {
    start: [number, number];
    end: [number, number];
    filterData: {
        durationWeight: number;
        walkingDistanceWeight: number;
        noTransferWeight: number;
        carparkAvailabilityWeight: number;
        busWaitTimeWeight: number;
        platformDensityWeight: number;
        fareWeight: number;
    }
}

export function serialize(data: ItineraryScore<BaseItinerary>[]) {
    return data.map(i => ({
        score: i.score,
        itinerary: {
            totalDuration: i.itinerary.totalDuration,
            totalDistance: i.itinerary.totalDistance,
            totalFare: i.itinerary.totalFare,
            summary: i.itinerary.summary
        }  
    }));
}

export async function POST(request: NextRequest) {
    const body: RequestBody = await request.json();
    const {start, end, filterData} = body;
    const api = new ExternalApiHandler();
    const controller = new ItineraryController(api);
    const nearestCarpark = await controller.getNearestCarpark(end[0], end[1]);

    const drivingItineraries: BaseItinerary[] = []
    for ( const {carpark, distance} of nearestCarpark) {
        const location = carpark.Location;
        const [lat, lon] = location.split(' ').map(parseFloat);
        const drivingData = await getRoute(start, [lat, lon], 'drive');
        const walkingData = await getRoute([lat, lon], end, 'walk');
        console.log('Driving data', drivingData);
        const drivingItinerary = ItineraryController.parseResponse(drivingData, 'drive')[0] as DrivingItinerary;
        const walkingItinerary = ItineraryController.parseResponse(walkingData, 'walk')[0] as SimpleWalkingItinerary;
        if (!drivingItinerary || ! walkingItinerary)
            continue;
        drivingItinerary.legs = drivingItinerary.legs.concat(walkingItinerary.legs);
        drivingItinerary.polylineCoords = drivingItinerary.polylineCoords.concat(walkingItinerary.polylineCoords);
        drivingItinerary.totalDuration += walkingItinerary.totalDuration;
        drivingItinerary.totalDistance += walkingItinerary.totalDistance;
        drivingItineraries.push(drivingItinerary);
        drivingItinerary.nearestCarpark = new Carpark({
            id: carpark.CarParkID,
            name: carpark.Area,
            lat: lat,
            lng: lon,
            availableLots: carpark.AvailableLots
            }
        );
    }

    let data = await getRoute(start, end, "pt");
    const publicItineraries = ItineraryController.parseResponse(data, 'pt');
    data = await getRoute(start, end, 'walk');
    const walkingItineraries = ItineraryController.parseResponse(data, 'walk');

    const allItineraries = drivingItineraries.concat(publicItineraries, walkingItineraries);

    for (const i of allItineraries) {
        if (i instanceof PublicItinerary) { 
            await controller.getBusWaitTime(i);
            await controller.getPlatformDensity(i);
        }
    }
    const userPreference = new ConvenienceScoreFilterPreference(
        filterData.durationWeight,
        filterData.noTransferWeight,
        filterData.walkingDistanceWeight,
        filterData.carparkAvailabilityWeight,
        filterData.busWaitTimeWeight,
        filterData.platformDensityWeight,
        filterData.fareWeight
    );
    const [best, walking, publicIti, driving] = controller.rankItineraries(allItineraries, userPreference);
    return NextResponse.json({
        best: serialize(best),
        walking: serialize(walking),
        publicIti: serialize(publicIti),
        driving: serialize(driving)
    });
}