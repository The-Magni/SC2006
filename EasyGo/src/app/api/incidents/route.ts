import { ExternalApiHandler } from "@/lib/boundary/ExternalApiHandler";
import { ItineraryController } from "@/lib/controllers/itinerary-controller";
import { DrivingItinerary } from "@/lib/entityclass/DrivingItinerary";
import { getRoute } from "@/lib/onemap/onemapHandler";
import { NextResponse } from "next/server";

export async function GET() {
    const start: [number, number] = [1.2872181276401213, 103.86149413560685];
    const end: [number, number] = [1.355275211560916, 103.7233076756091];
    const data = await getRoute(start, end, "drive");
    const itinerary = await ItineraryController.parseResponse(data, 'drive')[0] as DrivingItinerary;
    console.log(itinerary);
    const api = new ExternalApiHandler();
    const controller = new ItineraryController(api);
    await controller.getTrafficIncidents(itinerary);
    console.log(itinerary.incidents.length);
    return NextResponse.json(itinerary.incidents.map(i => ({
        msg: i.Message,
        lat: i.Latitude,
        lon: i.Longitude
    })));    
}