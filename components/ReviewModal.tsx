import { useSubscriptionStore } from '@/store/subscriptionStore';
import { Feather } from '@expo/vector-icons';
import * as StoreReview from 'expo-store-review';
import React, { useEffect } from 'react';
import { Linking, Modal, Platform, Text, TouchableOpacity, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

interface ReviewModalProps {
    visible: boolean;
    onClose: () => void;
}

export const ReviewModal = ({ visible, onClose }: ReviewModalProps) => {
    const { setReviewed } = useSubscriptionStore();

    useEffect(() => {
        // If the modal becomes visible, we can pre-check availability if needed
    }, [visible]);

    const handleRate = async () => {
        try {
            // Try native modal first
            if (await StoreReview.hasAction()) {
                await StoreReview.requestReview();
            } else {
                throw new Error("Native review not available");
            }
        } catch (e) {
            console.log("Review Error, falling back to store link", e);
            // Fallback: Open Play Store / App Store
            const url = Platform.OS === 'android'
                ? `market://details?id=com.venture.memories`
                : `https://apps.apple.com/app/id6739501550`; // Updated iOS ID

            Linking.openURL(url).catch(err => console.log("Failed to open store", err));
        } finally {
            // Grant reward for the attempt/intent
            setReviewed();
            onClose();
        }
    };

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-black/80 items-center justify-center px-6">
                <Animated.View
                    entering={ZoomIn.duration(300)}
                    style={{ backgroundColor: '#18181b', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1 }}
                    className="w-full p-6 rounded-3xl relative overflow-hidden"
                >
                    {/* Decorative Background Glow */}
                    <View className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl -mr-10 -mt-10" />

                    <View className="items-center mb-6">
                        <View className="w-16 h-16 bg-yellow-500/20 rounded-full items-center justify-center mb-4 ring-1 ring-yellow-500/30">
                            <Feather name="star" size={32} color="#facc15" />
                        </View>
                        <Text style={{ fontFamily: 'Outfit-Bold', color: 'white' }} className="text-2xl text-center mb-2">
                            Unlock +1 Memory
                        </Text>
                        <Text style={{ fontFamily: 'Outfit-Regular', color: 'rgba(255,255,255,0.6)' }} className="text-center text-sm leading-5">
                            Rate us 5 stars to unlock one extra free memory slot as a one-time reward!
                        </Text>
                    </View>

                    <View className="gap-3">
                        <TouchableOpacity
                            onPress={handleRate}
                            style={{ backgroundColor: '#facc15' }}
                            className="w-full py-4 rounded-xl items-center flex-row justify-center gap-2"
                        >
                            <Feather name="thumbs-up" size={18} color="black" />
                            <Text style={{ fontFamily: 'Outfit-Bold', color: 'black' }} className="text-base">
                                Rate & Unlock
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={onClose}
                            className="w-full py-3 items-center"
                        >
                            <Text style={{ fontFamily: 'Outfit-Medium', color: 'rgba(255,255,255,0.4)' }} className="text-sm">
                                No thanks, maybe later
                            </Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};
