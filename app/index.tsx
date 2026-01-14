import { supabase } from '@/lib/supabase';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

export default function Index() {
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);
        });
    }, []);

    if (loading) {
        return <View style={{ flex: 1, backgroundColor: '#000' }} />;
    }

    if (session) {
        return <Redirect href="/home" />;
    }

    return <Redirect href="/Onboarding/Welcome" />;
}
