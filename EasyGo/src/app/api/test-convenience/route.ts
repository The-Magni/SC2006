import { ExternalApiHandler } from "@/lib/boundary/ExternalApiHandler";
import { ItineraryController } from "@/lib/controllers/itinerary-controller";
import { ConvenienceScoreFilterPreference } from "@/lib/entityclass/ConvenienceScoreFilterPreference";
import { PublicItinerary } from "@/lib/entityclass/PublicItinerary";
import { getRoute } from "@/lib/onemap/onemapHandler";
import { NextResponse } from "next/server";

export async function GET() {
    const start = [1.397055, 103.747498];
    const end = [1.2654, 103.8203];
    const api = new ExternalApiHandler();
    const controller = new ItineraryController(api);
    const nearestCarpark = controller.getNearestCarpark(end[0], end[1]);
    const data = await getRoute([1.397055, 103.747498], [1.2654, 103.8203], "pt");
    const itineraries = ItineraryController.parseResponse(data, 'pt');
    const userPreference: ConvenienceScoreFilterPreference = new ConvenienceScoreFilterPreference(
        8, 1, 5, 1, 10, 4, 5
    );
    for (const i of itineraries) {
        if (!(i instanceof PublicItinerary))
            continue;
        await controller.getBusWaitTime(i);
        await controller.getPlatformDensity(i);
    }
    const [best, walking, publicIti, driving] = controller.rankItineraries(itineraries, userPreference);
    console.log(best.length);
    console.log(walking.length);
    console.log(publicIti.length);
    console.log(driving.length);
    for (const iti of publicIti) {
        console.log((iti.itinerary as PublicItinerary).busWaitTime)
        console.log(iti.itinerary.summary, iti.score);
    }
}