'use client'

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

interface Profile {
    id: string;
    email: string;
    name: string;
    avatar: string;
}

export function useUser() {
    const [profile, setProfile] = useState<Profile | null>(null);

    useEffect(() => {
        const supabase = createClient();
       

        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setProfile(null);
                return;
            }

            const { data: userInfo, error } = await supabase
            .from('users')
            .select('name, avatar')
            .eq('id', user.id)
            .single();
            if (error) {
                console.error(error);
                setProfile({
                    id: user.id,
                    email: user.email!,
                    name: 'shadcn',
                    avatar: '/avatars/shadcn.jpg'
                });
            } else {
                setProfile({
                    id: user.id,
                    email: user.email!,
                    name: userInfo.name,
                    avatar: userInfo.avatar
                });
            }
        }
        fetchUser();

        const {
            data: { subscription }
        } = supabase.auth.onAuthStateChange((event, session) => {
            if (!session?.user)
                setProfile(null);
            else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')
                fetchUser();
        });

        return () => subscription.unsubscribe();
    }, []);

    return [profile, setProfile] as const;
}