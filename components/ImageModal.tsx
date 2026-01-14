import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Dimensions, Image, Modal, TouchableOpacity } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

interface ImageModalProps {
    visible: boolean;
    imageUri: string | null;
    onClose: () => void;
}

const { width, height } = Dimensions.get('window');

export const ImageModal = ({ visible, imageUri, onClose }: ImageModalProps) => {
    if (!visible || !imageUri) return null;

    return (
        <Modal visible={visible} transparent onRequestClose={onClose} statusBarTranslucent>
            <Animated.View
                entering={FadeIn}
                exiting={FadeOut}
                className="flex-1 bg-black justify-center items-center"
            >
                {/* Close Button */}
                <TouchableOpacity
                    onPress={onClose}
                    className="absolute top-12 right-6 z-50 w-10 h-10 rounded-full bg-white/20 items-center justify-center backdrop-blur-md"
                >
                    <Feather name="x" size={24} color="white" />
                </TouchableOpacity>

                {/* Image */}
                <Image
                    source={{ uri: imageUri }}
                    style={{ width, height: height * 0.7 }}
                    resizeMode="contain"
                />
            </Animated.View>
        </Modal>
    );
};
