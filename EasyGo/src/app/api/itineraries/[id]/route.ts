import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const supabase = await createClient();
        const { id } = await context.params;
        const { data: { user }} = await supabase.auth.getUser();
        if (!id)
            throw new Error('ID is not provided');
        if (!user)
            throw new Error('Unauthorized');

        const { error: filterError } = await supabase
            .from('filters')
            .delete()
            .eq('itinerary_id', id);
        if (filterError) {
            console.error(filterError);
            throw Error('Error deleting filter');
        }

        const { error: itineraryError } = await supabase
            .from('itineraries')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);
        if (itineraryError) {
            console.error(itineraryError);
            throw Error('Error deleting itinerary');
        }

        return NextResponse.json({ message: `Successfully delete ${id}`}, { status: 200 });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ message: 'Fail to delete' }, { status: 500 });
    }
}