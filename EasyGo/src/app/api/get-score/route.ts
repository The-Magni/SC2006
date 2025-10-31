import { ExternalApiHandler } from "@/lib/boundary/ExternalApiHandler";
import { ItineraryController } from "@/lib/controllers/itinerary-controller";
import { DrivingItineraryData, ItineraryData, Parser, PublicItineraryData, WalkingItineraryData } from "@/lib/controllers/Parser";
import { BaseItinerary } from "@/lib/entityclass/BaseItinerary";
import { NextRequest, NextResponse } from "next/server";
import { ConvenienceScoreFilterPreference } from "@/lib/entityclass/ConvenienceScoreFilterPreference";
import { DrivingItinerary } from "@/lib/entityclass/DrivingItinerary";
import { PublicItinerary } from "@/lib/entityclass/PublicItinerary";
import { SimpleWalkingItinerary } from "@/lib/entityclass/SimpleWalkingItinerary";

interface RequestBody {
    filterData: {
        durationWeight: number;
        walkingDistanceWeight: number;
        noTransferWeight: number;
        carparkAvailabilityWeight: number;
        busWaitTimeWeight: number;
        platformDensityWeight: number;
        fareWeight: number;
    }
    driving: ItineraryData<DrivingItineraryData>[];
    pt: ItineraryData<PublicItineraryData>[];
    walking: ItineraryData<WalkingItineraryData>[];
}

export async function POST(request: NextRequest) {
    const body: RequestBody = await request.json();
    const {filterData, driving, pt, walking} = body;
    const api = new ExternalApiHandler();
    const controller = new ItineraryController(api);
    const drivingItineraries = driving.map(i => Parser.deserializeDrivingItinerary(i)) as BaseItinerary[];
    const publicItineraries = pt.map(i => Parser.deserializePublicItinerary(i)) as BaseItinerary[];
    const walkingItineraries = walking.map(i => Parser.deserializeWalkingItinerary(i)) as BaseItinerary[];
    const allItineraries: BaseItinerary[] = drivingItineraries.concat(publicItineraries, walkingItineraries);
    const userPreference = new ConvenienceScoreFilterPreference(
        filterData.durationWeight,
        filterData.noTransferWeight,
        filterData.walkingDistanceWeight,
        filterData.carparkAvailabilityWeight,
        filterData.busWaitTimeWeight,
        filterData.platformDensityWeight,
        filterData.fareWeight
    );
    
    const [best, walkingIti, ptIti, drivingIti] = controller.rankItineraries(allItineraries, userPreference);
return NextResponse.json({
    best: best.map(b => {
        const it = b.itinerary;
        if (it instanceof DrivingItinerary)
        return { score: b.score, itinerary: Parser.serializeDrivingItinerary(it) };
        if (it instanceof PublicItinerary)
        return { score: b.score, itinerary: Parser.serializePublicItinerary(it) };
        if (it instanceof SimpleWalkingItinerary)
        return { score: b.score, itinerary: Parser.serializeWalkingItinerary(it) };
        return { score: b.score, itinerary: Parser.serializeBaseItinenerary(it) };
    }),
    driving: drivingIti.map(d => ({
        score: d.score,
        itinerary: Parser.serializeDrivingItinerary(d.itinerary as DrivingItinerary),
    })),
    public: ptIti.map(p => ({
        score: p.score,
        itinerary: Parser.serializePublicItinerary(p.itinerary as PublicItinerary),
    })),
    walking: walkingIti.map(w => ({
        score: w.score,
        itinerary: Parser.serializeWalkingItinerary(
        w.itinerary as SimpleWalkingItinerary
        ),
    })),
});
;
}
