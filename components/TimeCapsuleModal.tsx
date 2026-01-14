import { DeleteModal } from '@/components/DeleteModal';
import { SpecialEvent, useEventStore } from '@/store/eventStore';
import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Alert, Modal, Share, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';

interface TimeCapsuleModalProps {
    event: SpecialEvent | null;
    onClose: () => void;
}

export const TimeCapsuleModal = ({ event, onClose }: TimeCapsuleModalProps) => {
    const deleteEvent = useEventStore((state) => state.deleteEvent);
    const [deleteVisible, setDeleteVisible] = React.useState(false);
    const [isDeleting, setIsDeleting] = React.useState(false);

    if (!event) return null;

    const handleShare = async () => {
        try {
            await Share.share({
                message: `I locked a special memory in a Time Capsule! It opens on ${new Date(event.date).toLocaleDateString()}. memories://event/${event.id}`,
            });
        } catch (error: any) {
            Alert.alert(error.message);
        }
    };

    const handleDelete = () => {
        setDeleteVisible(true);
    };

    const confirmDelete = async () => {
        setIsDeleting(true);
        try {
            await deleteEvent(event.id);
            onClose(); // This closes TimeCapsuleModal which also unmounts DeleteModal
        } catch (error) {
            Alert.alert("Error deleting", (error as any).message);
            setIsDeleting(false);
        }
    };

    return (
        <Modal transparent visible={!!event} animationType="fade" onRequestClose={onClose}>
            <View className="flex-1 items-center justify-center bg-black/90 px-6">
                {!deleteVisible ? (
                    <Animated.View
                        entering={FadeInDown.springify()}
                        exiting={FadeOutDown}
                        className="w-full max-w-sm bg-[#111113] p-8 rounded-[32px] border border-indigo-500/20 items-center"
                    >
                        {/* Glowing Lock Icon */}
                        <View className="w-20 h-20 rounded-full bg-indigo-500/10 items-center justify-center mb-6 ring-1 ring-indigo-500/30 shadow-[0_0_30px_rgba(99,102,241,0.3)]">
                            <Feather name="lock" size={32} color="#818cf8" />
                        </View>

                        <Text style={{ fontFamily: 'Outfit-Bold', color: 'white' }} className="text-2xl text-center mb-2">
                            Capsule Sealed
                        </Text>

                        <Text style={{ fontFamily: 'Outfit-Medium', color: '#818cf8' }} className="text-sm uppercase tracking-widest mb-6">
                            Opens {new Date(event.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                        </Text>

                        <Text style={{ fontFamily: 'Outfit-Regular', color: 'rgba(255,255,255,0.6)' }} className="text-center text-base leading-6 mb-8">
                            This memory is locked in a time capsule. Wait for the date to arrive to unlock its contents.
                        </Text>

                        <TouchableOpacity
                            onPress={onClose}
                            style={{ backgroundColor: '#818cf8' }}
                            className="w-full py-4 rounded-full items-center active:opacity-90 mb-4"
                        >
                            <Text style={{ fontFamily: 'Outfit-Bold', color: '#000000' }} className="text-base uppercase tracking-wide">
                                Okay, I'll Wait
                            </Text>
                        </TouchableOpacity>

                        {/* Secondary Actions */}
                        <View className="flex-row gap-4 w-full justify-center">
                            <TouchableOpacity
                                onPress={handleShare}
                                className="flex-1 py-3 rounded-full bg-[#18181b] border border-white/10 items-center flex-row justify-center gap-2"
                            >
                                <Feather name="share" size={16} color="white" />
                                <Text style={{ fontFamily: 'Outfit-Medium', color: 'white' }} className="text-sm">Share</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={handleDelete}
                                className="flex-1 py-3 rounded-full bg-[#18181b] border border-white/10 items-center flex-row justify-center gap-2"
                            >
                                <Feather name="trash-2" size={16} color="#ef4444" />
                                <Text style={{ fontFamily: 'Outfit-Medium', color: '#ef4444' }} className="text-sm">Delete</Text>
                            </TouchableOpacity>
                        </View>

                    </Animated.View>
                ) : (
                    <DeleteModal
                        visible={deleteVisible}
                        onClose={() => setDeleteVisible(false)}
                        onConfirm={confirmDelete}
                        isLoading={isDeleting}
                    />
                )}
            </View>
        </Modal>
    );
};
