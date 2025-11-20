import { NextRequest, NextResponse } from "next/server";
import { getRoute } from "@/lib/onemap/onemapHandler";
import { ItineraryController } from "@/lib/controllers/itinerary-controller";
import { ExternalApiHandler } from "@/lib/boundary/ExternalApiHandler";
import { DrivingItinerary } from "@/lib/entityclass/DrivingItinerary";

export async function GET() {
    const data = await getRoute([1.397055, 103.747498], [1.2654, 103.8203], "pt");
    const itinerary = ItineraryController.parseResponse(data, 'pt')[0];
    const api = new ExternalApiHandler();
    const controller = new ItineraryController(api);
    await controller.getWeatherData(itinerary);
    return NextResponse.json(itinerary.weather);
}