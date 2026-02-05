import { FullScreenLoader } from '@/components/FullScreenLoader';
import { TimeCapsuleModal } from '@/components/TimeCapsuleModal';
import { useMemoryLimit } from '@/hooks/useMemoryLimit';
import { SpecialEvent, useEventStore } from '@/store/eventStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Dimensions, FlatList, Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const calculateDetailedDuration = (event: SpecialEvent) => {
    const target = new Date(event.date);
    let now = new Date();

    if (event.status === 'completed' && event.completed_at) {
        now = new Date(event.completed_at);
    } else if (event.status === 'paused' && event.paused_at) {
        now = new Date(event.paused_at);
    }

    let diff = now.getTime() - target.getTime();

    // Subtract total paused duration if any
    if (event.total_paused_duration) {
        diff -= event.total_paused_duration;
    }

    const isPast = diff < 0; // "Time Until" vs "Time Since"
    diff = Math.abs(diff);

    // Approximate calculation for UI display
    const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
    diff -= years * (1000 * 60 * 60 * 24 * 365.25);

    const months = Math.floor(diff / (1000 * 60 * 60 * 24 * 30.44));
    diff -= months * (1000 * 60 * 60 * 24 * 30.44);

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    diff -= days * (1000 * 60 * 60 * 24);

    const hours = Math.floor(diff / (1000 * 60 * 60));
    diff -= hours * (1000 * 60 * 60);

    const minutes = Math.floor(diff / (1000 * 60));
    diff -= minutes * (1000 * 60);

    const seconds = Math.floor(diff / 1000);

    return { years, months, days, hours, minutes, seconds, isPast };
};

// Auto-Scrolling Image Carousel Component
const ImageCarousel = React.memo(({ images }: { images?: any[] }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollViewRef = React.useRef<ScrollView>(null);
    const { width } = Dimensions.get('window');

    // Extract image URIs (handle both EventImage objects and strings)
    const imageUris = React.useMemo(() => {
        if (!images || images.length === 0) return [];
        return images.map(img => {
            if (typeof img === 'string') return img;
            // Try local first, fallback to remote
            return img.local || img.remote;
        }).filter(Boolean);
    }, [images]);

    // Auto-scroll effect
    useEffect(() => {
        if (imageUris.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentIndex(prev => {
                const next = (prev + 1) % imageUris.length;
                scrollViewRef.current?.scrollTo({ x: next * width, animated: true });
                return next;
            });
        }, 3000); // Change image every 3 seconds

        return () => clearInterval(interval);
    }, [imageUris.length, width]);

    if (imageUris.length === 0) return null;

    return (
        <View style={{ position: 'relative' }}>
            <ScrollView
                ref={scrollViewRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                scrollEventThrottle={16}
                onMomentumScrollEnd={(event) => {
                    const index = Math.round(event.nativeEvent.contentOffset.x / width);
                    setCurrentIndex(index);
                }}
            >
                {imageUris.map((uri, index) => (
                    <Image
                        key={index}
                        source={{ uri }}
                        style={{ width, height: 224 }} // h-56 = 224px
                        resizeMode="cover"
                    />
                ))}
            </ScrollView>
        </View>
    );
});

const LiveEventCard = React.memo(({ item, index, onLockedPress }: { item: SpecialEvent, index: number, onLockedPress: (e: SpecialEvent) => void }) => {
    const router = useRouter();
    const { hasLocalImage, localUri } = require('@/hooks/useLocalEventImage').useLocalEventImage(item.images);

    const [duration, setDuration] = useState(calculateDetailedDuration(item));


    useEffect(() => {
        // Only run timer if active
        if (item.status === 'paused' || item.status === 'completed') {
            setDuration(calculateDetailedDuration(item)); // Update once to ensure correctness
            return;
        }

        const timer = setInterval(() => {
            setDuration(calculateDetailedDuration(item));
        }, 1000);
        return () => clearInterval(timer);
    }, [item.id, item.status, item.paused_at, item.completed_at, item.date]); // Optimized dependencies

    const TimeUnit = ({ value, label }: { value: number, label: string }) => (
        <View className="items-center flex-1">
            <Text style={{ fontFamily: 'Outfit-Bold', color: 'white' }} className="text-2xl">
                {value.toString().padStart(2, '0')}
            </Text>
            <Text style={{ fontFamily: 'Outfit-Medium', color: 'rgba(255,255,255,0.3)' }} className="text-[10px] uppercase tracking-wider">
                {label}
            </Text>
        </View>
    );

    const isLocked = item.isTimeCapsule && !duration.isPast;

    return (
        <Animated.View
            entering={FadeInDown.delay(index * 100).springify()}
            className="mb-4"
        >
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => {
                    if (isLocked) {
                        onLockedPress(item);
                        return;
                    }
                    router.push({ pathname: "/event/[id]", params: { id: item.id } });
                }}
            >
                {hasLocalImage && localUri && !isLocked ? (
                    // Beautiful Image Card with Auto-Scrolling Images - Redesigned
                    <View
                        style={{ backgroundColor: '#18181b', borderColor: 'rgba(255,255,255,0.08)' }}
                        className="rounded-3xl border overflow-hidden"
                    >
                        {/* Auto-Scrolling Image Carousel - Taller */}
                        <View style={{ height: 280 }}>
                            <ImageCarousel images={item.images} />
                        </View>

                        {/* Gradient-like Overlay - darker at bottom */}
                        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '30%', backgroundColor: 'rgba(0,0,0,0.3)' }} />
                        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '70%', backgroundColor: 'rgba(0,0,0,0.65)' }} />

                        <View className="absolute inset-0 p-4 justify-between">
                            {/* Top Section - Title and Status */}
                            <View className="flex-row justify-between items-start gap-3">
                                <View className="flex-1 bg-black/70 backdrop-blur-lg rounded-xl p-3">
                                    <Text style={{ fontFamily: 'Outfit-Bold', color: 'white', textShadowColor: 'rgba(0,0,0,0.9)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 8 }} className="text-xl mb-0.5" numberOfLines={1}>
                                        {item.title}
                                    </Text>
                                    <Text style={{ fontFamily: 'Outfit-Medium', color: 'rgba(255,255,255,0.9)', textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6 }} className="text-[10px] uppercase tracking-widest">
                                        {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </Text>
                                </View>
                                <View className={`px-3 py-2 rounded-xl ${item.status === 'completed' ? 'bg-green-500/50' : (item.status === 'paused' ? 'bg-yellow-500/50' : 'bg-white/40')} backdrop-blur-lg`}>
                                    <Text style={{ fontFamily: 'Outfit-Bold', color: 'white', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }} className="text-[9px] uppercase tracking-wider">
                                        {item.status === 'completed' ? 'DONE' : (item.status === 'paused' ? 'PAUSED' : (duration.isPast ? 'SINCE' : 'UNTIL'))}
                                    </Text>
                                </View>
                            </View>

                            {/* Bottom Section - Compact Timer */}
                            <View>
                                {/* Main Timer */}
                                <View className="bg-black/70 backdrop-blur-xl rounded-2xl p-3 border border-white/10">
                                    <View className="flex-row gap-1.5 mb-1.5">
                                        <TimeUnit value={duration.years} label="YRS" />
                                        <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.25)', alignSelf: 'stretch', marginVertical: 4 }} />
                                        <TimeUnit value={duration.months} label="MTH" />
                                        <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.25)', alignSelf: 'stretch', marginVertical: 4 }} />
                                        <TimeUnit value={duration.days} label="DAY" />
                                    </View>
                                    <View className="flex-row gap-1.5 pt-1.5 border-t border-white/15">
                                        <TimeUnit value={duration.hours} label="HRS" />
                                        <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.25)', alignSelf: 'stretch', marginVertical: 4 }} />
                                        <TimeUnit value={duration.minutes} label="MIN" />
                                        <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.25)', alignSelf: 'stretch', marginVertical: 4 }} />
                                        <TimeUnit value={duration.seconds} label="SEC" />
                                    </View>
                                </View>

                                {/* Total Summary - Compact Horizontal */}
                                <View className="flex-row gap-2 mt-2">
                                    <View className="flex-1 bg-black/60 backdrop-blur-lg rounded-xl p-2 border border-white/10">
                                        <Text style={{ fontFamily: 'Outfit-Bold', color: 'white' }} className="text-base text-center">
                                            {Math.floor((duration.years * 365.25 + duration.months * 30.44 + duration.days))}
                                        </Text>
                                        <Text style={{ fontFamily: 'Outfit-Medium', color: 'rgba(255,255,255,0.6)' }} className="text-[9px] uppercase tracking-wider text-center">
                                            Total Days
                                        </Text>
                                    </View>
                                    <View className="flex-1 bg-black/60 backdrop-blur-lg rounded-xl p-2 border border-white/10">
                                        <Text style={{ fontFamily: 'Outfit-Bold', color: 'white' }} className="text-base text-center">
                                            {Math.floor((duration.years * 365.25 * 24 + duration.months * 30.44 * 24 + duration.days * 24 + duration.hours))}
                                        </Text>
                                        <Text style={{ fontFamily: 'Outfit-Medium', color: 'rgba(255,255,255,0.6)' }} className="text-[9px] uppercase tracking-wider text-center">
                                            Total Hours
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>
                ) : isLocked ? (
                    // Locked Time Capsule UI
                    <View
                        style={{ backgroundColor: '#111113', borderColor: 'rgba(129, 140, 248, 0.2)' }}
                        className="p-6 rounded-3xl border border-2 py-4"
                    >
                        <View className="flex-row items-center gap-4 mb-4">
                            <View className="w-12 h-12 rounded-full bg-indigo-500/10 items-center justify-center ring-1 ring-indigo-500/20">
                                <Feather name="lock" size={18} color="#818cf8" />
                            </View>

                            <Text style={{ fontFamily: 'Outfit-Bold', color: '#818cf8' }} className="text-xl tracking-widest uppercase">
                                Time Capsule
                            </Text>
                        </View>

                        {/* Countdown Only */}
                        <View className="w-full">
                            <View className="flex-row gap-2 mb-4">
                                <TimeUnit value={duration.years} label="Yrs" />
                                <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.1)', height: '80%', marginTop: 5 }} />
                                <TimeUnit value={duration.months} label="Mths" />
                                <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.1)', height: '80%', marginTop: 5 }} />
                                <TimeUnit value={duration.days} label="Days" />
                            </View>
                            <View className="flex-row gap-2 pt-4 border-t border-white/5">
                                <TimeUnit value={duration.hours} label="Hrs" />
                                <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.1)', height: '80%', marginTop: 5 }} />
                                <TimeUnit value={duration.minutes} label="Mins" />
                                <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.1)', height: '80%', marginTop: 5 }} />
                                <TimeUnit value={duration.seconds} label="Secs" />
                            </View>

                            {/* Additional Info: Total Days and Hours Passed */}
                            <View className="mt-3 pt-3 border-t border-white/5">
                                <View className="flex-row justify-between items-center">
                                    <View className="items-center">
                                        <Text style={{ fontFamily: 'Outfit-Bold', color: 'rgba(255,255,255,0.8)' }} className="text-lg">
                                            {Math.floor((duration.years * 365.25 + duration.months * 30.44 + duration.days))}
                                        </Text>
                                        <Text style={{ fontFamily: 'Outfit-Medium', color: 'rgba(255,255,255,0.4)' }} className="text-xs uppercase tracking-wider">
                                            Total Days
                                        </Text>
                                    </View>
                                    <View className="items-center">
                                        <Text style={{ fontFamily: 'Outfit-Bold', color: 'rgba(255,255,255,0.8)' }} className="text-lg">
                                            {Math.floor((duration.years * 365.25 * 24 + duration.months * 30.44 * 24 + duration.days * 24 + duration.hours))}
                                        </Text>
                                        <Text style={{ fontFamily: 'Outfit-Medium', color: 'rgba(255,255,255,0.4)' }} className="text-xs uppercase tracking-wider">
                                            Total Hours
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>
                ) : (
                    // Regular Event UI
                    <View
                        style={{ backgroundColor: '#18181b', borderColor: 'rgba(255,255,255,0.08)' }}
                        className="p-6 rounded-3xl border"
                    >
                        <View className="flex-row justify-between items-start mb-6">
                            <View className="flex-1 mr-4">
                                <Text style={{ fontFamily: 'Outfit-Bold', color: 'white' }} className="text-2xl mb-1" numberOfLines={1}>{item.title}</Text>
                                <Text style={{ fontFamily: 'Outfit-Medium', color: 'rgba(255,255,255,0.4)' }} className="text-xs uppercase tracking-widest">
                                    {new Date(item.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                                </Text>
                            </View>
                            <View className={`flex-row items-center px-3 py-1.5 rounded-full ${item.status === 'completed' ? 'bg-green-500/20' : ((item.isTimeCapsule && !duration.isPast) ? 'bg-indigo-500/20' : (item.status === 'paused' ? 'bg-yellow-500/20' : 'bg-white/10'))}`}>
                                {(item.isTimeCapsule && !duration.isPast) && <Feather name="lock" size={10} color="#818cf8" style={{ marginRight: 4 }} />}
                                <Text style={{ fontFamily: 'Outfit-Bold', color: item.status === 'completed' ? '#4ade80' : ((item.isTimeCapsule && !duration.isPast) ? '#818cf8' : (item.status === 'paused' ? '#facc15' : 'rgba(255,255,255,0.8)')) }} className="text-[10px] uppercase tracking-wider">
                                    {item.status === 'completed' ? 'FINISHED' : ((item.isTimeCapsule && !duration.isPast) ? 'LOCKED' : (item.status === 'paused' ? 'PAUSED' : (duration.isPast ? 'SINCE' : 'UNTIL')))}
                                </Text>
                            </View>
                        </View>

                        {/* Row 1: Years, Months, Days */}
                        <View className="flex-row gap-2 mb-4">
                            <TimeUnit value={duration.years} label="Years" />
                            <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.1)', height: '80%', marginTop: 5 }} />
                            <TimeUnit value={duration.months} label="Months" />
                            <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.1)', height: '80%', marginTop: 5 }} />
                            <TimeUnit value={duration.days} label="Days" />
                        </View>

                        {/* Row 2: Hours, Minutes, Seconds */}
                        <View className="flex-row gap-2 pt-4 border-t border-white/5">
                            <TimeUnit value={duration.hours} label="Hrs" />
                            <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.1)', height: '80%', marginTop: 5 }} />
                            <TimeUnit value={duration.minutes} label="Mins" />
                            <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.1)', height: '80%', marginTop: 5 }} />
                            <TimeUnit value={duration.seconds} label="Secs" />
                        </View>

                        {/* Additional Info: Total Days and Hours Passed */}
                        <View className="mt-3 pt-3 border-t border-white/5">
                            <View className="flex-row justify-between items-center">
                                <View className="items-center">
                                    <Text style={{ fontFamily: 'Outfit-Bold', color: 'rgba(255,255,255,0.8)' }} className="text-lg">
                                        {Math.floor((duration.years * 365.25 + duration.months * 30.44 + duration.days))}
                                    </Text>
                                    <Text style={{ fontFamily: 'Outfit-Medium', color: 'rgba(255,255,255,0.4)' }} className="text-xs uppercase tracking-wider">
                                        Total Days
                                    </Text>
                                </View>
                                <View className="items-center">
                                    <Text style={{ fontFamily: 'Outfit-Bold', color: 'rgba(255,255,255,0.8)' }} className="text-lg">
                                        {Math.floor((duration.years * 365.25 * 24 + duration.months * 30.44 * 24 + duration.days * 24 + duration.hours))}
                                    </Text>
                                    <Text style={{ fontFamily: 'Outfit-Medium', color: 'rgba(255,255,255,0.4)' }} className="text-xs uppercase tracking-wider">
                                        Total Hours
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>
                )}
            </TouchableOpacity>
        </Animated.View>
    );
}, (prevProps, nextProps) => {
    // Custom comparison: re-render if images change
    return (
        prevProps.item.id === nextProps.item.id &&
        prevProps.item.status === nextProps.item.status &&
        prevProps.item.date === nextProps.item.date &&
        JSON.stringify(prevProps.item.images) === JSON.stringify(nextProps.item.images)
    );
});


export default function Home() {
    const router = useRouter();
    const events = useEventStore((state) => state.events);
    const fetchEvents = useEventStore((state) => state.fetchEvents);
    const { isPro, hasReviewed } = useSubscriptionStore();
    const limit = useMemoryLimit();
    const [lockedEvent, setLockedEvent] = useState<SpecialEvent | null>(null);
    const [reviewModalVisible, setReviewModalVisible] = useState(false);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            await fetchEvents();
            // Artificial delay to show off the loader briefly if fetch is instant, for polish
            setTimeout(() => setLoading(false), 800);
        };
        load();
    }, []);

    // Auto-open subscription for free users every time they visit home
    useEffect(() => {
        if (!loading && !isPro && !hasReviewed) {
            const timer = setTimeout(() => {
                router.push('/subscription');
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [loading, isPro, hasReviewed]);

    // Show Review Modal if user has created at least 1 memory and hasn't reviewed yet
    // useEffect(() => {
    //     if (!loading && !hasReviewed && events.length >= 1) {
    //         // Wait a bit so it doesn't clash with other modals or loading
    //         const timer = setTimeout(() => {
    //             setReviewModalVisible(true);
    //         }, 3000);
    //         return () => clearTimeout(timer);
    //     }
    // }, [loading, hasReviewed, events.length]);

    const [searchQuery, setSearchQuery] = useState('');

    const filteredEvents = events.filter(event =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCreateEvent = () => {
        if (events.length >= limit) {
            router.push({ pathname: '/subscription', params: { limitReached: 'true' } });
        } else {
            router.push('/create-event');
        }
    };

    return (
        <View style={{ backgroundColor: '#000000' }} className="flex-1">
            <StatusBar style="light" />

            {loading && <FullScreenLoader />}

            {/* Header */}
            <View className="flex-row justify-between items-center px-6 pt-16 pb-4 bg-black z-10">
                <View>
                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'Outfit-Medium' }} className="text-xs font-medium uppercase tracking-wider mb-1">Welcome</Text>
                    <Text style={{ color: 'white', fontFamily: 'Outfit-Bold' }} className="text-3xl">Memory Basket</Text>
                </View>
                <View className="flex-row items-center gap-3">
                    {!isPro && (
                        <TouchableOpacity
                            onPress={() => router.push('/subscription')}
                            style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255, 255, 255, 0.14)' }}
                            className="px-3 py-1.5 rounded-full border"
                        >
                            <Text style={{ color: 'white', fontFamily: 'Outfit-Bold' }} className="text-[10px] tracking-wide">Free Plan</Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        onPress={() => router.push('/profile')}
                        className="w-10 h-10 rounded-full overflow-hidden border border-white/20"
                    >
                        <Image
                            source={require('@/assets/profile.png')}
                            style={{ width: '100%', height: '100%' }}
                            resizeMode="cover"
                        />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Search Bar */}
            {events.length > 0 && (
                <View className="px-6 pb-6 bg-black z-10">
                    <View
                        style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.1)' }}
                        className="flex-row items-center px-4 py-1 rounded-2xl border"
                    >
                        <Feather name="search" size={20} color="rgba(255,255,255,0.4)" />
                        <TextInput
                            placeholder="Search moments..."
                            placeholderTextColor="rgba(255,255,255,0.4)"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            style={{ fontFamily: 'Outfit-Medium', color: 'white' }}
                            className="flex-1 ml-3 text-base"
                            selectionColor="#white"
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <Feather name="x" size={18} color="rgba(255,255,255,0.4)" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            )}

            {events.length === 0 ? (
                <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-6">
                    {/* Empty State with Waiting Image */}
                    <Animated.View
                        entering={FadeInDown.delay(200).springify()}
                        className="items-center justify-center mt-20"
                    >
                        <Image
                            source={require('@/assets/waiting.png')}
                            style={{ width: width * 0.7, height: width * 0.7, opacity: 0.8 }}
                            resizeMode="contain"
                        />
                        <Text style={{ fontFamily: 'Outfit-Medium', color: 'rgba(255,255,255,0.4)' }} className="text-center mt-6 text-base">
                            No moments tracked yet.
                        </Text>
                    </Animated.View>

                    {/* Add Section */}
                    <Animated.View
                        entering={FadeInDown.delay(400).springify()}
                        className="mt-12 w-full pb-20"
                    >
                        <TouchableOpacity
                            onPress={handleCreateEvent}
                            style={{
                                borderStyle: 'dashed',
                            }}
                            className="w-full py-12 rounded-3xl border-2 border-white/20 items-center justify-center bg-zinc-900/50 active:bg-zinc-900"
                        >
                            <View
                                className="w-16 h-16 rounded-full items-center justify-center mb-4 bg-white shadow-lg shadow-white/10"
                            >
                                <Feather name="plus" size={28} color="black" />
                            </View>
                            <Text style={{ fontFamily: 'Outfit-Bold', color: '#FFFFFF', fontSize: 20, marginBottom: 4 }}>Add Memory</Text>
                            <Text style={{ fontFamily: 'Outfit-Medium', color: 'rgba(255,255,255,0.5)' }} className="text-sm uppercase tracking-widest">Start tracking Memories</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </ScrollView>
            ) : (
                <View className="flex-1">
                    <FlatList
                        data={filteredEvents}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item, index }) => <LiveEventCard item={item} index={index} onLockedPress={setLockedEvent} />}
                        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100, paddingTop: 10 }}
                        showsVerticalScrollIndicator={false}
                    />

                    {/* Floating Add Button when list is not empty */}
                    <Animated.View
                        entering={FadeInDown.delay(300).springify()}
                        className="absolute bottom-8 right-6"
                    >
                        <TouchableOpacity
                            onPress={handleCreateEvent}
                            style={{ backgroundColor: 'white' }}
                            className="w-16 h-16 rounded-full items-center justify-center shadow-lg shadow-black/50"
                        >
                            <Feather name="plus" size={32} color="black" />
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            )}

            {/* Modals */}
            <TimeCapsuleModal event={lockedEvent} onClose={() => setLockedEvent(null)} />
            {/* <ReviewModal visible={reviewModalVisible} onClose={() => setReviewModalVisible(false)} /> */}
        </View>
    );
}
