import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";

interface RequestBody {
    start: string;
    end: string;
    startLat: number;
    startLon: number;
    endLat: number;
    endLon: number;
    name?: string;
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


export async function GET() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user)
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { data, error } = await supabase
        .from('itineraries')
        .select(`
           *,
           filters(*) 
        `)
        .eq('user_id', user.id);
    if (error) {
        console.error(error);
        return NextResponse.json({ error: 'Fail to retrieve data'}, { status: 400 });
    }
    return NextResponse.json({ itinerariesWithFilter: data }, { status: 200 });
}

export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const { data: {user} } = await supabase.auth.getUser();
    if (!user) 
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body: RequestBody = await request.json();
    const { data: itinerary, error: itineraryError } = await supabase
        .from('itineraries')
        .insert({ 
            user_id: user.id, 
            start: body.start, 
            end: body.end, 
            start_lat: body.startLat, 
            start_lon: body.startLon, 
            end_lat: body.endLat, 
            end_lon: body.endLon,
            name: body.name || '', 
        })
        .select()
        .single();
    if (itineraryError) {
        console.error(itineraryError);
        return NextResponse.json({ error: itineraryError.message }, { status: 400 });
    }

    const { data: filter, error: filterError } = await supabase
        .from('filters')
        .insert({
            bus_wait_time: body.filterData.busWaitTimeWeight,
            carpark_availability: body.filterData.carparkAvailabilityWeight,
            duration: body.filterData.durationWeight,
            fare: body.filterData.fareWeight,
            no_transfers: body.filterData.noTransferWeight,
            platform_density: body.filterData.platformDensityWeight,
            walking_distance: body.filterData.walkingDistanceWeight,
            itinerary_id: itinerary.id, 
        })
        .select()
        .single();
    if (filterError) {
        console.error(filterError);
        return NextResponse.json({ error: filterError.message }, { status: 400 });
    }

    return NextResponse.json({ itinerary: itinerary, filter: filter }, { status: 201 });
}