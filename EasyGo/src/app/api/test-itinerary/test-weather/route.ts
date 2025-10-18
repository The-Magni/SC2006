import { ExternalApiHandler } from "@/lib/boundary/ExternalApiHandler";
import { ItineraryController } from "@/lib/controllers/itinerary-controller";
import { NextResponse } from "next/server";
import { getRoute } from "@/lib/onemap/onemapHandler";

export async function GET(req: Request) {
    const api = new ExternalApiHandler();
    const controller = new ItineraryController(api);
    const data = await getRoute([1.3651319, 103.8742328], [1.3484064, 103.6808045], "pt")
    const itinerary = ItineraryController.parsePublicTransport(data, 'pt');
    return NextResponse.json(itinerary);
}