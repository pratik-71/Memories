import { Feather } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import React, { useEffect, useState } from 'react';
import { Platform, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';

export const NotificationPermissionModal = () => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // checkPermissions();
    }, []);

    const checkPermissions = async () => {
        const { status } = await Notifications.getPermissionsAsync();
        // If not granted, we want to ask. 
        // Note: On iOS, status might be 'undetermined' initially.
        // On Android, it might be 'denied' if not asked yet or blocked.
        if (status !== 'granted') {
            // You might want to store a "hasSkipped" flag in AsyncStorage so you don't annoy them every launch.
            // For now, we will simply ask if not granted.
            setVisible(true);
        }
    };

    const handleEnable = async () => {
        try {
            const { status } = await Notifications.requestPermissionsAsync({
                ios: {
                    allowAlert: true,
                    allowBadge: true,
                    allowSound: true,
                },
            });

            if (status === 'granted') {
                setVisible(false);
            } else {
                // If they denied it previously, requestPermissionsAsync might return denied immediately.
                // In that case, we might want to guide them to settings.
                // linking to settings is platform specific.
                if (Platform.OS === 'ios') {
                    // Linking.openURL('app-settings:'); // Optional: Advanced UX
                }
                setVisible(false); // Close anyway
            }
        } catch (error) {
            console.log('Error requesting permissions:', error);
            setVisible(false);
        }
    };

    const handleLater = () => {
        setVisible(false);
    };

    if (!visible) return null;

    return (
        <View className="absolute inset-0 z-50 flex-1 items-center justify-center bg-black/90 px-6">
            <Animated.View
                entering={FadeInDown.springify()}
                exiting={FadeOutDown}
                style={{ backgroundColor: '#18181b', borderColor: 'rgba(255,255,255,0.1)' }}
                className="w-full max-w-sm p-8 rounded-[32px] border items-center"
            >
                <View className="w-16 h-16 rounded-full bg-white/10 items-center justify-center mb-6">
                    <Feather name="bell" size={32} color="white" />
                </View>

                <Text style={{ fontFamily: 'Outfit-Bold', color: 'white' }} className="text-2xl text-center mb-3">
                    Don't Miss a Moment
                </Text>

                <Text style={{ fontFamily: 'Outfit-Regular', color: 'rgba(255,255,255,0.6)' }} className="text-center text-base leading-6 mb-8">
                    Memories works best with notifications enabled. We'll remind you of special days and upcoming moments.
                </Text>

                <TouchableOpacity
                    onPress={handleEnable}
                    className="w-full py-4 rounded-full bg-white items-center mb-4 active:opacity-90"
                >
                    <Text style={{ fontFamily: 'Outfit-Bold', color: 'black' }} className="text-base">
                        Enable Notifications
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={handleLater}
                    className="py-2"
                >
                    <Text style={{ fontFamily: 'Outfit-Medium', color: 'rgba(255,255,255,0.4)' }} className="text-sm">
                        Maybe Later
                    </Text>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
};
