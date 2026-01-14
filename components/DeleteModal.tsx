import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface DeleteModalProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isLoading?: boolean;
}

export const DeleteModal = ({ visible, onClose, onConfirm, isLoading = false }: DeleteModalProps) => {
    if (!visible) return null;

    return (
        <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
            <View className="flex-1 items-center justify-center bg-black/80 px-6">
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
                            onPress={onClose}
                            disabled={isLoading}
                            className="flex-1 py-4 rounded-xl bg-white/5 border border-white/10 items-center active:opacity-80"
                            style={{ opacity: isLoading ? 0.5 : 1 }}
                        >
                            <Text style={{ fontFamily: 'Outfit-Bold' }} className="text-white">Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={onConfirm}
                            disabled={isLoading}
                            className="flex-1 py-4 rounded-xl bg-white items-center active:opacity-80"
                            style={{ opacity: isLoading ? 0.7 : 1 }}
                        >
                            <Text style={{ fontFamily: 'Outfit-Bold' }} className="text-black">
                                {isLoading ? "Deleting..." : "Delete"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};
