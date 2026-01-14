import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface LimitReachedModalProps {
    visible: boolean;
    onClose: () => void;
}

export const LimitReachedModal = ({ visible, onClose }: LimitReachedModalProps) => {
    const router = useRouter();

    if (!visible) return null;

    return (
        <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
                <Animated.View
                    entering={FadeInDown.springify()}
                    style={{
                        backgroundColor: '#18181b',
                        width: '100%',
                        borderRadius: 24,
                        padding: 24,
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.1)',
                        alignItems: 'center'
                    }}
                >
                    <View className="w-16 h-16 rounded-full bg-yellow-500/10 items-center justify-center mb-6 ring-1 ring-yellow-500/20">
                        <Feather name="lock" size={32} color="#fbbf24" />
                    </View>

                    <Text style={{ fontFamily: 'Outfit-Bold' }} className="text-white text-2xl text-center mb-2">
                        Limit Reached
                    </Text>
                    <Text style={{ fontFamily: 'Outfit-Regular' }} className="text-white/60 text-center text-base mb-8">
                        You've reached the free limit of 1 memory. Upgrade to Premium for unlimited moments.
                    </Text>

                    <TouchableOpacity
                        onPress={() => {
                            onClose();
                            router.push('/subscription');
                        }}
                        className="w-full py-4 rounded-xl bg-white items-center mb-3"
                    >
                        <Text style={{ fontFamily: 'Outfit-Bold' }} className="text-black text-base">Get Unlimited</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={onClose}
                        className="py-2"
                    >
                        <Text style={{ fontFamily: 'Outfit-Medium' }} className="text-white/40">Maybe Later</Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </Modal>
    );
};
