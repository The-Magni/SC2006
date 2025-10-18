import { ExternalApiHandler } from "@/lib/boundary/ExternalApiHandler";
import { ItineraryController } from "@/lib/controllers/itinerary-controller";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const api = new ExternalApiHandler();
    const controller = new ItineraryController(api);
    const carparks = await controller.getNearestCarparks(1.29, 103.85);
    return NextResponse.json(carparks);
}