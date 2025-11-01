import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function DELETE({ params }: { params: { id: string } }) {
    try {
        const supabase = await createClient();
        const { id } = params;
        const { data: { user }} = await supabase.auth.getUser();
        if (!id)
            throw new Error('ID is not provided');
        if (!user)
            throw new Error('Unauthorized');
        const { data, error } = await supabase
            .from('itineraries')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);
        if (error) {
            console.error(error);
            throw Error('Error deleting');
        }

        return NextResponse.json({ message: `Successfully delete ${id}`}, { status: 200 });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ message: 'Fail to delete' }, { status: 500 });
    }
}