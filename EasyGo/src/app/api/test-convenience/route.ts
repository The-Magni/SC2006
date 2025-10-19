import { ExternalApiHandler } from "@/lib/boundary/ExternalApiHandler";
import { ItineraryController } from "@/lib/controllers/itinerary-controller";
import { PublicItinerary } from "@/lib/entityclass/PublicItinerary";
import { getRoute } from "@/lib/onemap/onemapHandler";
import { NextResponse } from "next/server";

export async function GET() {
    const data = await getRoute([1.397055, 103.747498], [1.2654, 103.8203], "pt");
    const itineraries = ItineraryController.parseResponse(data, 'pt');
    const api = new ExternalApiHandler();
    const controller = new ItineraryController(api);
    for (const i of itineraries) {
        if (!(i instanceof PublicItinerary))
            continue;
        await controller.getBusWaitTime(i);
        await controller.getPlatformDensity(i);
    }
    return NextResponse.json(itineraries.map(i => {
        if (!(i instanceof PublicItinerary))
            return null;
        else
            return [i.platformDensity, i.busWaitTime];
    }));
}