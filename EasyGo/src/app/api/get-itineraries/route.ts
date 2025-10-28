import { ExternalApiHandler } from "@/lib/boundary/ExternalApiHandler";
import { ItineraryController } from "@/lib/controllers/itinerary-controller";
import { getRoute } from "@/lib/onemap/onemapHandler";
import { NextRequest, NextResponse } from "next/server";
import { PublicItinerary } from "@/lib/entityclass/PublicItinerary";
import { DrivingItinerary } from "@/lib/entityclass/DrivingItinerary";
import { SimpleWalkingItinerary } from "@/lib/entityclass/SimpleWalkingItinerary";
import { Carpark } from "@/lib/entityclass/Carpark";
import { Parser } from "@/lib/controllers/Parser";

export async function GET(request: NextRequest) {
    const api = new ExternalApiHandler();
    const controller = new ItineraryController(api);
    const searchParams = request.nextUrl.searchParams;
    const startLat = searchParams.get('startLat');
    const startLon = searchParams.get('startLon');
    const endLat = searchParams.get('endLat');
    const endLon = searchParams.get('endLon');
    if (!startLat || ! startLon || !endLat || !endLon)
        return NextResponse.json({
            code: 404,
            message: 'Start or end destination not specified'
        });
    const start: [number, number] = [parseFloat(startLat), parseFloat(startLon)];
    const end: [number, number] = [parseFloat(endLat), parseFloat(endLon)];
    const nearestCarpark = await controller.getNearestCarpark(end[0], end[1]);
    if (!nearestCarpark) {
        return NextResponse.json({
            error: 404,
            message: 'No carpark data found'
        });
    }
    const drivingItineraries: DrivingItinerary[] = []
    for ( const {carpark, distance} of nearestCarpark) {
        const location = carpark.Location;
        const [lat, lon] = location.split(' ').map(parseFloat);
        const drivingData = await getRoute(start, [lat, lon], 'drive');
        const walkingData = await getRoute([lat, lon], end, 'walk');
        const drivingItinerary = ItineraryController.parseResponse(drivingData, 'drive')[0] as DrivingItinerary;
        const walkingItinerary = ItineraryController.parseResponse(walkingData, 'walk')[0] as SimpleWalkingItinerary;
        if (!drivingItinerary || ! walkingItinerary)
            continue;
        drivingItinerary.legs = drivingItinerary.legs.concat(walkingItinerary.legs);
        drivingItinerary.polylineCoords = drivingItinerary.polylineCoords.concat(walkingItinerary.polylineCoords);
        drivingItinerary.totalDuration += walkingItinerary.totalDuration;
        drivingItinerary.totalDistance += walkingItinerary.totalDistance;
        drivingItinerary.updateSummary();
        drivingItinerary.summary += walkingItinerary.summary;
        drivingItinerary.nearestCarpark = new Carpark({
            id: carpark.CarParkID,
            name: carpark.Development,
            lat: lat,
            lng: lon,
            availableLots: carpark.AvailableLots
            }
        );
        drivingItineraries.push(drivingItinerary);
    }

    let data = await getRoute(start, end, "pt");
    const publicItineraries = ItineraryController.parseResponse(data, 'pt') as PublicItinerary[];
    data = await getRoute(start, end, 'walk');
    const walkingItineraries = ItineraryController.parseResponse(data, 'walk') as SimpleWalkingItinerary[];
    // get bus wait time and plaform density for public itineraries
    await Promise.all(
        publicItineraries.map(async i => {
            try {
                await controller.getBusWaitTime(i);
                await controller.getPlatformDensity(i);
            } catch (e) {
                console.error(e);
            }
        })
    );
    // get incident and weather for driving itineraries
    await Promise.all(
        drivingItineraries.map(async i => {
            try {
                await controller.getWeatherData(i);
                await controller.getTrafficIncidents(i);
            } catch (e) {
                console.error(e);
            }
        })
    );
    // get weather data for walking
    await Promise.all(
        walkingItineraries.map(async i => {
            try {
                await controller.getWeatherData(i);
            } catch(e) {
                console.error(e);
            }
        })
    );
    
    return NextResponse.json({
        'driving': drivingItineraries.map(i => Parser.serializeDrivingItinerary(i)),
        'pt': publicItineraries.map(i => Parser.serializePublicItinerary(i)),
        'walking': walkingItineraries.map(i => Parser.serializeWalkingItinerary(i))
    });
}