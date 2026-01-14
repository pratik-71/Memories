import { AestheticDatePicker, AestheticTimePicker } from '@/components/DateTimePicker';
import { FullScreenLoader } from '@/components/FullScreenLoader';
import { supabase } from '@/lib/supabase';
import { useEventStore } from '@/store/eventStore';
import { useThemeStore } from '@/store/themeStore';
import { scheduleEventNotifications } from '@/utils/notifications';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

// Configure notifications handler
// Configure notifications handler (Moved to _layout.tsx)

export default function SetupBirthday() {
    const router = useRouter();
    const currentTheme = useThemeStore((state) => state.currentTheme);
    const addEvent = useEventStore((state) => state.addEvent);

    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        checkUser();
    }, []);

    async function checkUser() {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                // If user is signed in, check if they already have events
                // If they do, they have already onboarded, so skip this page.
                const { events, fetchEvents } = useEventStore.getState();
                await fetchEvents();
                // Check fresh state after fetch
                const updatedEvents = useEventStore.getState().events;

                if (updatedEvents.length > 0) {
                    router.replace('/home');
                }
            }
        } catch (e) {
            console.log(e);
        }
    }



    const handleContinue = async () => {
        setLoading(true);
        try {
            // 1. Save Event
            const newEventId = await addEvent({
                title: "Your Birthday",
                description: "The day I started my journey!",
                date: date.toISOString()
            });

            if (newEventId) {
                // 2. Schedule Milestone Notifications (Includes Monthly & Yearly)
                await scheduleEventNotifications(newEventId, "Your Birthday", date.toISOString());
            }

            router.replace('/home');
        } catch (error: any) {
            console.error(error);
            if (error.message.includes("Limit Reached")) {
                Alert.alert("Limit Reached", "You already have an event. Skipping birthday setup.");
                router.replace('/home');
            } else {
                Alert.alert("Error", "Could not save birthday. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSkip = () => {
        router.replace('/home');
    };

    return (
        <View style={{ backgroundColor: currentTheme.colors.background }} className="flex-1 px-6 justify-center">
            <StatusBar style="light" />
            {loading && <FullScreenLoader />}

            <Animated.View entering={FadeInDown.delay(200).springify()} className="items-center mb-12">
                <Text style={{ fontFamily: 'Outfit-Bold', color: currentTheme.colors.text.primary }} className="text-3xl mb-2 text-center">
                    what's your{'\n'}birthday?
                </Text>
                <Text style={{ fontFamily: 'Outfit-Medium', color: currentTheme.colors.text.secondary }} className="text-center text-base">
                    Let's start by adding your birthday.
                </Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(400).springify()} className="items-center mb-12">
                {/* Date Trigger */}
                <TouchableOpacity
                    onPress={() => setShowDatePicker(true)}
                    className="bg-white/10 w-full px-6 py-5 rounded-2xl border border-white/20 mb-4 flex-row justify-between items-center"
                >
                    <Text style={{ fontFamily: 'Outfit-Medium', color: 'rgba(255,255,255,0.6)' }} className="text-lg">
                        Date
                    </Text>
                    <Text style={{ fontFamily: 'Outfit-Bold', color: '#fff' }} className="text-2xl">
                        {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Text>
                </TouchableOpacity>

                {/* Time Trigger */}
                <TouchableOpacity
                    onPress={() => setShowTimePicker(true)}
                    className="bg-white/10 w-full px-6 py-5 rounded-2xl border border-white/20 flex-row justify-between items-center"
                >
                    <Text style={{ fontFamily: 'Outfit-Medium', color: 'rgba(255,255,255,0.6)' }} className="text-lg">
                        Time
                    </Text>
                    <Text style={{ fontFamily: 'Outfit-Bold', color: '#fff' }} className="text-2xl">
                        {date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                    </Text>
                </TouchableOpacity>

                <AestheticDatePicker
                    visible={showDatePicker}
                    onClose={() => setShowDatePicker(false)}
                    onSelect={(updatedDate: Date) => {
                        setDate(updatedDate);
                    }}
                    currentDate={date}
                />

                <AestheticTimePicker
                    visible={showTimePicker}
                    onClose={() => setShowTimePicker(false)}
                    onSelect={(updatedDate: Date) => {
                        setDate(updatedDate);
                    }}
                    currentDate={date}
                />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(600).springify()} className="w-full space-y-4 gap-4">
                <TouchableOpacity
                    onPress={handleContinue}
                    disabled={loading}
                    style={{ backgroundColor: currentTheme.colors.primary }}
                    className="w-full py-4 rounded-2xl items-center shadow-lg shadow-white/10"
                >
                    <Text style={{ fontFamily: 'Outfit-Bold', color: currentTheme.colors.background }} className="text-lg">
                        Continue
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={handleSkip}
                    disabled={loading}
                    className="py-2 items-center"
                >
                    <Text style={{ fontFamily: 'Outfit-Medium', color: currentTheme.colors.text.secondary }}>
                        Skip for now
                    </Text>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
}
