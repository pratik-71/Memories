import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, BackHandler, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';

const DAYS_TO_FORCE_UPDATE = 7;
const STORAGE_KEY_UPDATE_ID = 'last_update_id';
const STORAGE_KEY_FIRST_SEEN = 'update_first_seen_date';

export function UpdateCheckModal() {
    const [visible, setVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isMandatory, setIsMandatory] = useState(false);
    const [daysRemaining, setDaysRemaining] = useState(DAYS_TO_FORCE_UPDATE);

    useEffect(() => {
        const checkUpdates = async () => {
            if (__DEV__) return;

            try {
                const update = await Updates.checkForUpdateAsync();

                if (update.isAvailable) {
                    // Logic to track how long this update has been pending
                    const updateId = update.manifest?.id || 'unknown_update';
                    const savedId = await AsyncStorage.getItem(STORAGE_KEY_UPDATE_ID);
                    const savedDate = await AsyncStorage.getItem(STORAGE_KEY_FIRST_SEEN);

                    let firstSeen;

                    if (savedId === updateId && savedDate) {
                        // We've seen this update before
                        firstSeen = parseInt(savedDate, 10);
                    } else {
                        // New update found! Reset timer.
                        firstSeen = Date.now();
                        await AsyncStorage.setItem(STORAGE_KEY_UPDATE_ID, updateId);
                        await AsyncStorage.setItem(STORAGE_KEY_FIRST_SEEN, firstSeen.toString());
                    }

                    const daysPassed = (Date.now() - firstSeen) / (1000 * 60 * 60 * 24);
                    const remaining = Math.max(0, Math.ceil(DAYS_TO_FORCE_UPDATE - daysPassed));

                    setDaysRemaining(remaining);

                    if (daysPassed > DAYS_TO_FORCE_UPDATE) {
                        setIsMandatory(true);
                    }

                    setVisible(true);
                }
            } catch (error) {
                console.log("Error checking for updates:", error);
            }
        };

        const timer = setTimeout(checkUpdates, 2000);
        return () => clearTimeout(timer);
    }, []);

    const handleUpdate = async () => {
        try {
            setLoading(true);
            await Updates.fetchUpdateAsync();
            await Updates.reloadAsync();
        } catch (error) {
            setLoading(false);
            console.log("Error fetching update:", error);
            // If mandatory, we can't let them close it even on error, 
            // but for UX maybe we show a retry button. 
            // For now, simple error handling.
            if (!isMandatory) setVisible(false);
        }
    };

    // Prevent hardware back button if mandatory
    useEffect(() => {
        if (visible && isMandatory) {
            const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);
            return () => backHandler.remove();
        }
    }, [visible, isMandatory]);

    if (!visible) return null;

    return (
        <View className="absolute inset-0 z-[100] flex-1 items-center justify-center bg-black/95 px-6">
            <Animated.View
                entering={FadeInDown.springify()}
                exiting={isMandatory ? undefined : FadeOutDown}
                style={{ backgroundColor: '#000000', borderColor: 'rgba(255,255,255,0.2)' }}
                className="w-full max-w-sm p-8 rounded-[32px] border items-center shadow-2xl shadow-white/5"
            >
                <View className="w-16 h-16 rounded-full bg-white/10 items-center justify-center mb-6">
                    <Feather name="arrow-up" size={32} color="white" />
                </View>

                <Text style={{ fontFamily: 'Outfit-Bold', color: 'white' }} className="text-2xl text-center mb-3">
                    Update Required
                </Text>

                <Text style={{ fontFamily: 'Outfit-Regular', color: 'rgba(255,255,255,0.6)' }} className="text-center text-base leading-6 mb-8">
                    {isMandatory
                        ? "This update includes critical improvements and you must update to continue using Memories."
                        : `A new version is available. You have ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} to update before it becomes mandatory.`
                    }
                </Text>

                <TouchableOpacity
                    onPress={handleUpdate}
                    disabled={loading}
                    className="w-full py-4 rounded-full bg-white items-center mb-4 active:opacity-90 flex-row justify-center gap-2"
                >
                    {loading ? (
                        <ActivityIndicator color="black" />
                    ) : (
                        <>
                            <Text style={{ fontFamily: 'Outfit-Bold', color: 'black' }} className="text-base">
                                Update Now
                            </Text>
                            <Feather name="arrow-right" size={18} color="black" />
                        </>
                    )}
                </TouchableOpacity>

                {!isMandatory && !loading && (
                    <TouchableOpacity
                        onPress={() => setVisible(false)}
                        className="py-2"
                    >
                        <Text style={{ fontFamily: 'Outfit-Medium', color: 'rgba(255,255,255,0.4)' }} className="text-sm">
                            Remind Me Later
                        </Text>
                    </TouchableOpacity>
                )}
            </Animated.View>
        </View>
    );
}
