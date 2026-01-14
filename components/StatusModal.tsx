import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface StatusModalProps {
    visible: boolean;
    onClose: () => void;
    type: 'success' | 'error';
    title: string;
    message: string;
    onConfirm?: () => void;
    confirmText?: string;
}

export const StatusModal = ({ visible, onClose, type, title, message, onConfirm, confirmText = "Okay" }: StatusModalProps) => {

    if (!visible) return null;

    const isSuccess = type === 'success';

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
                    <View className={`w-16 h-16 rounded-full items-center justify-center mb-6 ring-1 ${isSuccess ? 'bg-green-500/10 ring-green-500/20' : 'bg-red-500/10 ring-red-500/20'}`}>
                        <Feather
                            name={isSuccess ? "check" : "alert-circle"}
                            size={32}
                            color={isSuccess ? "#4ade80" : "#ef4444"}
                        />
                    </View>

                    <Text style={{ fontFamily: 'Outfit-Bold' }} className="text-white text-2xl text-center mb-2">
                        {title}
                    </Text>
                    <Text style={{ fontFamily: 'Outfit-Regular' }} className="text-white/60 text-center text-base mb-8">
                        {message}
                    </Text>

                    <TouchableOpacity
                        onPress={() => {
                            if (onConfirm) onConfirm();
                            onClose();
                        }}
                        className="w-full py-4 rounded-xl bg-white items-center"
                    >
                        <Text style={{ fontFamily: 'Outfit-Bold' }} className="text-black text-base">{confirmText}</Text>
                    </TouchableOpacity>

                </Animated.View>
            </View>
        </Modal>
    );
};
