import { CachedImage } from '@/components/CachedImage';
import { FullScreenLoader } from '@/components/FullScreenLoader';
import { ImageModal } from '@/components/ImageModal';
import { StatusModal } from '@/components/StatusModal';
import { useMemoryLimit } from '@/hooks/useMemoryLimit';
import { supabase } from '@/lib/supabase';
import { useEventStore } from '@/store/eventStore';
import { scheduleEventNotifications } from '@/utils/notifications';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, Share, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

const calculateDetailedDuration = (event: any) => {
    const target = new Date(event.date);
    let now = new Date();

    if (event.status === 'completed' && event.completed_at) {
        now = new Date(event.completed_at);
    } else if (event.status === 'paused' && event.paused_at) {
        now = new Date(event.paused_at);
    }

    // Total diff logic
    let diff = now.getTime() - target.getTime();

    // Subtract total paused duration if any
    if (event.total_paused_duration) {
        diff -= event.total_paused_duration;
    }

    // If active and we have a current pause session, the 'now' is moving, so diff increases.
    // If paused, 'now' is fixed at paused_at, so diff is fixed.
    // If completed, 'now' is fixed at completed_at.

    const isPast = diff < 0; // "Time Until" vs "Time Since"
    // Usually for special events (future), target > now. diff is negative.
    // For past events (birthdays), target < now. diff is positive.

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

export default function EventDetails() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const limit = useMemoryLimit();
    const { events, deleteEvent, togglePauseEvent, completeEvent, fetchEventDetails, addEvent } = useEventStore();
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [isJoining, setIsJoining] = useState(false);

    // For FullScreenLoader during actions
    const [isProcessing, setIsProcessing] = useState(false);



    const [statusModal, setStatusModal] = useState<{ visible: boolean, type: 'success' | 'error', title: string, message: string }>({
        visible: false,
        type: 'success',
        title: '',
        message: ''
    });

    const event = events.find(e => e.id === id);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            setCurrentUserId(data.user?.id || null);
        });
    }, []);

    // Fetch full details (images/description) on mount
    useEffect(() => {
        if (typeof id === 'string') {
            fetchEventDetails(id);
        }
    }, [id]);

    // Live timer
    const [duration, setDuration] = useState<{ years: number, months: number, days: number, hours: number, minutes: number, seconds: number, isPast: boolean } | null>(null);

    useEffect(() => {
        if (event) {
            // Initial call
            setDuration(calculateDetailedDuration(event));

            // Only interval if active
            const timer = setInterval(() => {
                // If paused or completed, the value technically doesn't change relative to "elapsed time" 
                // BUT "isPast" might change? No.
                // If paused, the "now" (paused_at) is static.
                // If completed, "now" (completed_at) is static.
                // So valid to only update if active? 
                // But let's run it anyway to be safe, minimal cost.
                if (event.status !== 'paused' && event.status !== 'completed') {
                    setDuration(calculateDetailedDuration(event));
                }
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [event]);

    const isOwner = event ? event.user_id === currentUserId : false;

    // Time Capsule Logic
    const isLocked = event && duration ? (event.isTimeCapsule && !duration.isPast) : false;

    if (!event || !duration || isProcessing) {
        return (
            <FullScreenLoader />
        );
    }

    const handleDelete = () => {
        setDeleteModalVisible(true);
    };

    const confirmDelete = async () => {
        if (typeof id === 'string') {
            setIsProcessing(true);
            try {
                await deleteEvent(id);
                setDeleteModalVisible(false);
                // navigate back with potential param for toast on home? 
                // For now just back.
                router.back();
            } catch (e: any) {
                Alert.alert("Error", e.message || 'Delete failed');
                setIsProcessing(false);
            }
        }
    };

    const handleEdit = () => {
        router.push({ pathname: "/edit-event", params: { id: event.id } });
    };

    // const handleShare = async () => {
    //     try {
    //         const result = await Share.share({
    //             message: `Check out this special moment on Memories: "${event.title}"\n\nTap to open in app:\nmemories://event/${event.id}\n\nGet the app on Play Store:\nhttps://play.google.com/store/apps/details?id=com.venture.memories`,
    //         });
    //     } catch (error: any) {
    //         Alert.alert(error.message);
    //     }
    // };

    const handlePauseResume = async () => {
        if (typeof id === 'string') {
            setIsProcessing(true);
            try {
                const willPause = event.status !== 'paused';
                await togglePauseEvent(id);
            } catch (e: any) {
                Alert.alert("Error", e.message);
            } finally {
                setIsProcessing(false);
            }
        }
    };

    const handleComplete = async () => {
        if (typeof id === 'string') {
            setIsProcessing(true);
            try {
                await completeEvent(id);
            } catch (e: any) {
                Alert.alert("Error", e.message);
            } finally {
                setIsProcessing(false);
            }
        }
    };

    // Re-declaring handleJoin here (logic only, state is above) so it can use 'event' safely
    const handleJoin = async () => {
        if (isJoining || !event) return;

        // Check limit for shared events too
        if (events.length >= limit) {
            Alert.alert("Limit Reached", "Memory limit reached.");
            return;
        }

        setIsJoining(true); // Using state declared above
        try {
            const newEventId = await addEvent({
                title: event.title,
                description: event.description || '',
                date: event.date,
                images: event.images || [],
            });
            if (newEventId) {
                await scheduleEventNotifications(newEventId, event.title, event.date);
                setStatusModal({
                    visible: true,
                    type: 'success',
                    title: 'Success',
                    message: 'Memory added to your collection!'
                });
            }
        } catch (error: any) {
            setStatusModal({
                visible: true,
                type: 'error',
                title: 'Error',
                message: error.message || "Failed to join memory"
            });
        } finally {
            setIsJoining(false);
        }
    };



    return (
        <View style={{ backgroundColor: '#000000' }} className="flex-1">
            <StatusBar style="light" />

            {/* Header */}
            <View className="flex-row items-center justify-between px-6 pt-16  z-10">
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={{ backgroundColor: '#18181b', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}
                    className="w-12 h-12 rounded-full items-center justify-center"
                >
                    <Feather name="arrow-left" size={24} color="white" />
                </TouchableOpacity>
                <Text style={{ fontFamily: 'Outfit-Bold', color: 'white' }} className="text-lg">Memory Details</Text>

                <TouchableOpacity
                    // onPress={handleShare}
                    // style={{ backgroundColor: '#18181b', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}
                    className="w-12 h-12 rounded-full items-center justify-center"
                >
                    {/* <Feather name="share" size={20} color="white" /> */}
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>

                {/* Top Timing Section */}
                <Animated.View
                    entering={FadeInDown.delay(200).springify()}
                    className="items-center justify-center py-4 px-6"
                >
                    <View style={{ backgroundColor: '#18181b', borderColor: isLocked ? '#4f46e5' : 'rgba(255,255,255,0.1)' }} className="px-5 py-2.5 rounded-full mb-12 border flex-row items-center gap-2">
                        <Text style={{ fontFamily: 'Outfit-Bold', color: isLocked ? '#818cf8' : 'rgba(255,255,255,0.6)' }} className="text-xs uppercase tracking-[2px]">
                            {event.status === 'completed' ? 'Finished' : (isLocked ? 'Capsule Locked' : (event.status === 'paused' ? 'Paused' : (duration.isPast ? 'Time Since' : 'Time Until')))}
                        </Text>
                        {isLocked && <Feather name="lock" size={12} color="#818cf8" />}
                        {event.status === 'paused' && <Feather name="pause" size={12} color="white" />}
                        {event.status === 'completed' && <Feather name="check" size={12} color="white" />}
                    </View>

                    {/* Row 1: Years, Months, Days */}
                    <View className="flex-row justify-between w-full px-4 ">
                        <TimeUnit value={duration.years} label="Years" size="large" />
                        <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.1)', height: '60%', alignSelf: 'center' }} />
                        <TimeUnit value={duration.months} label="Months" size="large" />
                        <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.1)', height: '60%', alignSelf: 'center' }} />
                        <TimeUnit value={duration.days} label="Days" size="large" />
                    </View>

                    {/* Divider */}
                    <View style={{ height: 1, width: '80%', backgroundColor: 'rgba(255,255,255,0.05)', marginBottom: 32 }} />

                    {/* Row 2: Hours, Minutes, Seconds */}
                    <View className="flex-row justify-between w-full px-4 mb-4">
                        <TimeUnit value={duration.hours} label="Hours" size="medium" />
                        <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.1)', height: '60%', alignSelf: 'center' }} />
                        <TimeUnit value={duration.minutes} label="Mins" size="medium" />
                        <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.1)', height: '60%', alignSelf: 'center' }} />
                        <TimeUnit value={duration.seconds} label="Secs" size="medium" />
                    </View>

                </Animated.View>

                {/* Details Section */}
                <Animated.View
                    entering={FadeInDown.delay(400).springify()}
                    className="px-6 mb-8"
                >

                    {/* Title & Date Group */}
                    <View className="items-center ">
                        <Text style={{ fontFamily: 'Outfit-Bold', color: 'white' }} className="text-4xl mb-3 text-center tracking-tight leading-tight">
                            {event.title}
                        </Text>
                        <Text style={{ fontFamily: 'Outfit-Medium', color: 'rgba(255,255,255,0.4)' }} className="text-base uppercase tracking-[2px] text-center">
                            {new Date(event.date).toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
                        </Text>
                    </View>

                    {isLocked ? (
                        <View className="items-center justify-center py-12">
                            <View className="w-24 h-24 rounded-full bg-indigo-500/10 items-center justify-center mb-6 ring-1 ring-indigo-500/30">
                                <Feather name="lock" size={48} color="#818cf8" />
                            </View>
                            <Text style={{ fontFamily: 'Outfit-Bold', color: '#818cf8' }} className="text-xl text-center mb-2">
                                Locked Until {new Date(event.date).toLocaleDateString()}
                            </Text>
                            <Text style={{ fontFamily: 'Outfit-Regular', color: 'rgba(255,255,255,0.5)' }} className="text-center text-sm px-8 leading-6">
                                The contents of this time capsule are sealed. Wait for the date to unlock your memories.
                            </Text>
                        </View>
                    ) : (
                        <>
                            {/* Description */}
                            {event.description && (
                                <View className="items-center px-4 mt-8">
                                    <View style={{ width: 40, height: 2, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 1 }} className="mb-8" />

                                    <Text
                                        style={{ fontFamily: 'Outfit-Regular', color: 'rgba(255,255,255,0.8)' }}
                                        className="text-xl leading-8 text-center"
                                        numberOfLines={isExpanded ? undefined : 3}
                                    >
                                        {event.description}
                                    </Text>

                                    {event.description.length > 100 && (
                                        <TouchableOpacity
                                            onPress={() => setIsExpanded(!isExpanded)}
                                            className="pt-6 pb-2 px-8"
                                        >
                                            <Animated.View
                                                style={{
                                                    backgroundColor: 'rgba(255,255,255,0.05)',
                                                    borderRadius: 20,
                                                    paddingVertical: 8,
                                                    paddingHorizontal: 16
                                                }}
                                                className="flex-row items-center gap-2"
                                            >
                                                <Text style={{ fontFamily: 'Outfit-Medium', color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
                                                    {isExpanded ? "Show Less" : "Read More"}
                                                </Text>
                                                <Feather name={isExpanded ? "chevron-up" : "chevron-down"} size={14} color="rgba(255,255,255,0.5)" />
                                            </Animated.View>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            )}

                            {/* Images Section */}
                            {event.images && event.images.length > 0 && (
                                <View className="mt-10">
                                    <Text style={{ fontFamily: 'Outfit-Bold', color: 'white', opacity: 0.5 }} className="text-xs uppercase tracking-widest text-center mb-4">Memories</Text>
                                    <ScrollView
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', gap: 10, paddingHorizontal: 24 }}
                                    >
                                        {event.images.map((imgData, index) => (
                                            <TouchableOpacity key={index} onPress={() => setPreviewImage(imgData.remote)} activeOpacity={0.9}>
                                                <CachedImage
                                                    source={imgData}
                                                    style={{ width: 100, height: 100, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}
                                                    resizeMode="cover"
                                                />
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            )}
                        </>
                    )}

                </Animated.View>

            </ScrollView>

            {/* Sticky Action Footer */}
            {/* Sticky Action Footer */}
            <View className="absolute bottom-0 w-full px-6 pb-10 pt-6" style={{ backgroundColor: '#000000' }}>
                <Animated.View
                    entering={FadeInDown.delay(600).springify()}
                    className="flex-row items-center justify-center gap-6"
                >
                    {/* Slot 1: Active=Pause, Completed=Share */}
                    {!isLocked && event.status !== 'completed' && (
                        <View className="items-center gap-2">
                            <TouchableOpacity
                                onPress={handlePauseResume}
                                style={{ backgroundColor: '#18181b', borderColor: 'rgba(255,255,255,0.1)' }}
                                className="items-center justify-center w-14 h-14 rounded-full border active:bg-white/10"
                            >
                                <Feather name={event.status === 'paused' ? "play" : "pause"} size={20} color="white" />
                            </TouchableOpacity>
                            <Text style={{ fontFamily: 'Outfit-Medium', color: 'rgba(255,255,255,0.5)' }} className="text-[10px] uppercase tracking-wider">
                                {event.status === 'paused' ? "Resume" : "Pause"}
                            </Text>
                        </View>
                    )}

                    {/* Slot 2: Active=Done, Completed=Hidden */}
                    {!isLocked && event.status !== 'completed' && (
                        <View className="items-center gap-2">
                            <TouchableOpacity
                                onPress={handleComplete}
                                style={{ backgroundColor: '#18181b', borderColor: 'rgba(255,255,255,0.1)' }}
                                className="items-center justify-center w-14 h-14 rounded-full border active:bg-white/10"
                            >
                                <Feather name="check" size={20} color="white" />
                            </TouchableOpacity>
                            <Text style={{ fontFamily: 'Outfit-Medium', color: 'rgba(255,255,255,0.5)' }} className="text-[10px] uppercase tracking-wider">
                                Done
                            </Text>
                        </View>
                    )}

                    {/* Slot 3: Edit or Join (Center) */}
                    {!isLocked && (
                        <View className="items-center gap-2">
                            {isOwner ? (
                                <>
                                    <TouchableOpacity
                                        onPress={handleEdit}
                                        style={{ backgroundColor: 'white' }}
                                        className="items-center justify-center w-16 h-16 rounded-full shadow-lg shadow-white/10 mx-2"
                                    >
                                        <Feather name="edit-2" size={24} color="black" />
                                    </TouchableOpacity>
                                    <Text style={{ fontFamily: 'Outfit-Bold', color: 'white' }} className="text-[10px] uppercase tracking-wider">
                                        Edit
                                    </Text>
                                </>
                            ) : (
                                <>
                                    <TouchableOpacity
                                        onPress={handleJoin} // Ensure this logic is restored above or this will fail
                                        style={{ backgroundColor: 'white' }}
                                        className="items-center justify-center w-16 h-16 rounded-full shadow-lg shadow-white/10 mx-2"
                                    >
                                        <Feather name="heart" size={24} color="black" />
                                    </TouchableOpacity>
                                    <Text style={{ fontFamily: 'Outfit-Bold', color: 'white' }} className="text-[10px] uppercase tracking-wider">
                                        Join
                                    </Text>
                                </>
                            )}
                        </View>
                    )}

                    {/* Slot 4: Shared Delete Button (Always Right) */}
                    <View className="items-center gap-2">
                        <TouchableOpacity
                            onPress={handleDelete}
                            style={{ backgroundColor: '#18181b', borderColor: 'rgba(255,255,255,0.1)' }}
                            className="items-center justify-center w-14 h-14 rounded-full border active:bg-white/10"
                        >
                            <Feather name="trash-2" size={20} color="white" />
                        </TouchableOpacity>
                        <Text style={{ fontFamily: 'Outfit-Medium', color: 'rgba(255,255,255,0.5)' }} className="text-[10px] uppercase tracking-wider">
                            Delete
                        </Text>
                    </View>
                </Animated.View>
            </View>



            {
                deleteModalVisible && (
                    <View className="absolute inset-0 z-50 flex-1 items-center justify-center bg-black/80 px-4">
                        <Animated.View
                            entering={FadeInDown.springify()}
                            className="bg-[#18181b] w-full max-w-sm p-6 rounded-3xl border border-white/10 items-center"
                        >
                            <View className="w-16 h-16 rounded-full bg-red-500/10 items-center justify-center mb-6 ring-1 ring-red-500/20">
                                <Feather name="trash-2" size={32} color="#ef4444" />
                            </View>

                            <Text style={{ fontFamily: 'Outfit-Bold' }} className="text-white text-2xl text-center mb-2">
                                Delete Memory?
                            </Text>
                            <Text style={{ fontFamily: 'Outfit-Regular' }} className="text-white/60 text-center text-base mb-8 px-4">
                                This action is permanent and cannot be undone. Are you sure?
                            </Text>

                            <View className="flex-row gap-4 w-full">
                                <TouchableOpacity
                                    onPress={() => setDeleteModalVisible(false)}
                                    className="flex-1 py-4 rounded-xl bg-white/5 border border-white/10 items-center"
                                >
                                    <Text style={{ fontFamily: 'Outfit-Bold' }} className="text-white">Cancel</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={confirmDelete}
                                    className="flex-1 py-4 rounded-xl bg-white items-center"
                                >
                                    <Text style={{ fontFamily: 'Outfit-Bold' }} className="text-black">Delete</Text>
                                </TouchableOpacity>
                            </View>
                        </Animated.View>
                    </View>
                )
            }

            <ImageModal
                visible={!!previewImage}
                imageUri={previewImage}
                onClose={() => setPreviewImage(null)}
            />
            <StatusModal
                visible={statusModal.visible}
                onClose={() => setStatusModal({ ...statusModal, visible: false })}
                type={statusModal.type}
                title={statusModal.title}
                message={statusModal.message}
                onConfirm={() => {
                    if (statusModal.type === 'success') {
                        router.replace('/home');
                    }
                }}
                confirmText={statusModal.type === 'success' ? "Go to Home" : "Okay"}
            />
        </View >
    );
}

const TimeUnit = ({ value, label, size = 'medium' }: { value: number, label: string, size?: 'large' | 'medium' }) => (
    <View className="items-center flex-1">
        <Text style={{
            fontFamily: 'Outfit-Bold',
            color: 'white',
            fontSize: size === 'large' ? 42 : 32,
            lineHeight: size === 'large' ? 48 : 36
        }}>
            {value.toString().padStart(2, '0')}
        </Text>
        <Text style={{ fontFamily: 'Outfit-Medium', color: 'rgba(255,255,255,0.3)' }} className="text-[10px] uppercase font-bold mt-1 tracking-widest">
            {label}
        </Text>
    </View>
);
