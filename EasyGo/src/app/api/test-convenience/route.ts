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
export function serializeForMap(itinerary: BaseItinerary) {
  const base = {
    userMode: itinerary.userMode,
    totalDuration: itinerary.totalDuration,
    totalDistance: itinerary.totalDistance,
    totalFare: itinerary.totalFare ?? 0,
    summary: itinerary.summary,
  };

  if (itinerary.userMode === "drive" || itinerary.userMode === "walk") {
    const nearestCarpark = (itinerary as any).nearestCarpark
      ? {
          id: (itinerary as any).nearestCarpark.id,
          name: (itinerary as any).nearestCarpark.name,
          lat: (itinerary as any).nearestCarpark.lat,
          lng: (itinerary as any).nearestCarpark.lng,
          availableLots: (itinerary as any).nearestCarpark.availableLots,
        }
      : null;

    return {
      ...base,
      polylineCoords: (itinerary as any).polylineCoords ?? [],
      viaRoute: (itinerary as any).viaRoute ?? null,
      nearestCarpark,
    };
  }

  if (itinerary.userMode === "pt") {
    return {
      ...base,
      legs: itinerary.legs.map((l) => ({
        mode: l.mode,
        duration: l.duration,
        distance: l.distance,
        description: l.description,
        geometry:
          l.geometry?.map((p) => ({ lat: p.lat, lng: p.lng })) ?? [],
      })),
    };
  }

  return base;
}

export function serializeScoredItineraries(data: ItineraryScore<BaseItinerary>[]) {
  return data.map((i) => ({
    score: i.score,
    itinerary: serializeForMap(i.itinerary),
  }));
}


export function serializeAll(itineraries: BaseItinerary[]) {
  return itineraries.map(serializeForMap);
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

export function serializeDrvingItinerary(data: ItineraryScore<BaseItinerary>[]) {
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
export function serializePTItinerary(data: ItineraryScore<BaseItinerary>[]) {
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
        console.log("iam the carpark", carpark)
        drivingItinerary.nearestCarpark = new Carpark({
            id: carpark.CarParkID,
            name: carpark.Development,
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
        //best: serializeAll(best.map((b) => b.itinerary)), 
        best: best.map(b => ({
            score: b.score,
            itinerary: serializeForMap(b.itinerary)
        })),
        driving: driving.map(d => ({
            score: d.score,
            itinerary: serializeForMap(d.itinerary)
        })),
        public: publicIti.map(p => ({
            score: p.score,
            itinerary: serializeForMap(p.itinerary)
        })),
        walking: walking.map(w => ({
            score: w.score,
            itinerary: serializeForMap(w.itinerary)
        })),
    });
}


