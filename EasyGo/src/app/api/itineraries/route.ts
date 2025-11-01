import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";

interface RequestBody {
    start: string;
    end: string;
    startLat: number;
    startLon: number;
    endLat: number;
    endLon: number;
}

export async function GET() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user)
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { data, error } = await supabase
        .from('itineraries')
        .select() 
        .eq('user_id', user.id);
    if (error) {
        console.error(error);
        return NextResponse.json({ error: 'Fail to retrieve data'}, { status: 400 });
    }
    return NextResponse.json({ itineraries: data }, { status: 200 });
}

export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const { data: {user} } = await supabase.auth.getUser();
    if (!user) 
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { start, end, startLat, startLon, endLat, endLon }: RequestBody = await request.json();
    const { data, error } = await supabase
        .from('itineraries')
        .insert({ 
            user_id: user.id, 
            start: start, 
            end: end, 
            start_lat: startLat, 
            start_lon: startLon, 
            end_lat: endLat, 
            end_lon: endLon 
        })
        .select()
        .single();
    if (error) {
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ itinerary: data }, { status: 201 });
}