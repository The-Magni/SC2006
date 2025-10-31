import { ExternalApiHandler } from "@/lib/boundary/ExternalApiHandler";
import { ItineraryController } from "@/lib/controllers/itinerary-controller";
import { ConvenienceScoreFilterPreference } from "@/lib/entityclass/ConvenienceScoreFilterPreference";
import { PublicItinerary } from "@/lib/entityclass/PublicItinerary";
import { getRoute } from "@/lib/onemap/onemapHandler";
import { NextResponse } from "next/server";

export async function GET() {
    const api = new ExternalApiHandler();
    const controller = new ItineraryController(api);
    const data = await getRoute([1.397055, 103.747498], [1.2654, 103.8203], 'pt');
    const itineraries = ItineraryController.parseResponse(data, 'pt');
    for (const i of itineraries) {
        if (i instanceof PublicItinerary) {
            await controller.getPlatformDensity(i);
            await controller.getBusWaitTime(i);
        }
    }
    const userPreference = new ConvenienceScoreFilterPreference(
        5, 1, 5, 5, 5, 5, 5
    );
    const [best, walk, publicIti, drive] = controller.rankItineraries(itineraries, userPreference);

    console.log(itineraries);
    
    publicIti.forEach(i => {
        console.log(i.itinerary.summary);
        console.log(i.score);
        console.log(i.itinerary);
    });
    return NextResponse.json({
        code: 200,
        message: 'Success'
    });
}