import ContactModal from '@/components/ContactModal';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { useThemeStore } from '@/store/themeStore';
import { Feather } from '@expo/vector-icons';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as StoreReview from 'expo-store-review';
import { useEffect, useState } from 'react';
import { Alert, Dimensions, Image, Linking, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { supabase } from '../lib/supabase';

const { width } = Dimensions.get('window');

export default function Profile() {
    const router = useRouter();
    const currentTheme = useThemeStore((state) => state.currentTheme);
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [contactModalVisible, setContactModalVisible] = useState(false);
    const { isPro, hasReviewed, setReviewed } = useSubscriptionStore();

    useEffect(() => {
        getProfile();
    }, []);

    async function getProfile() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        } catch (error) {
            console.log('Error fetching user:', error);
        } finally {
            setLoading(false);
        }
    }

    const handleSignOut = async () => {
        try {
            // Sign out from Supabase
            await supabase.auth.signOut();

            // Sign out from Google if applicable
            try {
                await GoogleSignin.signOut();
            } catch (e) {
                console.log("Google SignOut error or not signed in with Google:", e);
            }

            // Clear auto sign-in provider so it doesn't auto-login next time
            await AsyncStorage.removeItem('last_login_provider');

            // Navigate to Welcome screen, clearing the stack
            router.dismissAll();
            router.replace('/Onboarding/Welcome');
        } catch (error: any) {
            Alert.alert('Error', error.message);
        }
    };

    const handleRateUs = async () => {
        let openedNative = false;
        if (await StoreReview.hasAction()) {
            try {
                await StoreReview.requestReview();
                openedNative = true;
            } catch (error) {
                console.log("Review Error:", error);
            }
        }

        if (!openedNative) {
            const url = Platform.OS === 'android'
                ? `market://details?id=com.venture.memories`
                : `https://apps.apple.com/app/id6739501550`; // Use actual ID or generic

            try {
                await Linking.openURL(url);
            } catch (e) {
                console.log("Link Error:", e);
            }
        }

        setReviewed();
        if (!isPro && !hasReviewed) {
            Alert.alert("Reward Unlocked!", "You created +1 Memory slot.");
        }
    };

    const menuItems = [
        {
            label: 'Subscription',
            value: isPro ? 'Premium Active' : 'Free Plan',
            icon: 'zap',
            action: () => router.push('/subscription')
        },
        {
            label: 'Contact Us',
            icon: 'message-circle',
            action: () => setContactModalVisible(true)
        },
        {
            label: 'Privacy Policy',
            icon: 'lock',
            action: () => router.push('/privacy-policy')
        },
        {
            label: 'Terms and Conditions',
            icon: 'file-text',
            action: () => router.push('/terms-conditions')
        },
    ];

    return (
        <View style={{ backgroundColor: currentTheme.colors.background }} className="flex-1">
            <StatusBar style="light" />

            <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
                {/* Header with Back Button */}
                {/* Header with Back Button */}
                <View className="flex-row items-center justify-between px-6 pt-12 pb-4">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="w-10 h-10 rounded-full bg-white/5 items-center justify-center active:bg-white/10"
                    >
                        <Feather name="arrow-left" size={24} color={currentTheme.colors.text.primary} />
                    </TouchableOpacity>
                    <Text style={{ color: currentTheme.colors.text.primary, fontFamily: 'Outfit-Bold' }} className="text-3xl">
                        Profile
                    </Text>
                    <View className="w-10" />
                </View>


                {/* Profile Info */}
                <Animated.View
                    entering={FadeInDown.delay(100).springify()}
                    className="items-center px-6 mt-6 mb-10"
                >
                    <View className="relative mb-4">
                        <Image
                            source={require('@/assets/profile.png')}
                            style={{
                                width: 120,
                                height: 120,
                                borderRadius: 60,
                                borderWidth: 4,
                                borderColor: 'rgba(255,255,255,0.1)'
                            }}
                            resizeMode="cover"
                        />
                        {/* Status Indicator */}
                        <View className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-[#121212]" />
                    </View>

                    <Text style={{ color: currentTheme.colors.text.primary }} className="text-2xl font-bold mb-1">
                        {user?.user_metadata?.full_name || 'Guest User'}
                    </Text>
                    <Text style={{ color: currentTheme.colors.text.secondary }} className="text-sm">
                        {user?.email || 'Sign in to sync your data'}
                    </Text>
                </Animated.View>

                {/* Menu Items */}
                <View className="px-6 space-y-4">
                    {menuItems.map((item, index) => (
                        <Animated.View
                            key={index}
                            entering={FadeInDown.delay(200 + (index * 100)).springify()}
                        >
                            <TouchableOpacity
                                onPress={item.action}
                                style={{
                                    backgroundColor: 'rgba(255,255,255,0.03)',
                                    borderColor: 'rgba(255,255,255,0.05)',
                                    borderWidth: 1
                                }}
                                className="flex-row items-center p-4 rounded-2xl active:bg-white/5"
                            >
                                <View className="w-10 h-10 rounded-full bg-white/5 items-center justify-center mr-4">
                                    <Feather name={item.icon as any} size={20} color={currentTheme.colors.text.primary} />
                                </View>
                                <View className="flex-1">
                                    <Text style={{ color: currentTheme.colors.text.primary, fontFamily: 'Outfit-Medium' }} className="text-base">
                                        {item.label}
                                    </Text>
                                    {item.value && (
                                        <Text style={{ color: currentTheme.colors.primary, fontFamily: 'Outfit-Bold' }} className="text-xs mt-0.5 uppercase tracking-wider">
                                            {item.value}
                                        </Text>
                                    )}
                                </View>
                                <Feather name="chevron-right" size={20} color={currentTheme.colors.text.secondary} />
                            </TouchableOpacity>
                        </Animated.View>
                    ))}
                </View>

                {/* Bottom Spacer for Sticky Button */}
                <View className="h-32" />
            </ScrollView>

            {/* Sticky Logout Button */}
            <Animated.View
                entering={FadeInDown.delay(600).springify()}
                style={{
                    backgroundColor: currentTheme.colors.background,
                    borderTopWidth: 1,
                    borderTopColor: 'rgba(255,255,255,0.05)',
                }}
                className="absolute bottom-0 w-full px-6 py-6 pb-10"
            >
                <TouchableOpacity
                    onPress={handleSignOut}
                    className="w-full py-4 rounded-2xl border border-red-500/30 bg-red-500/10 items-center active:bg-red-500/20"
                >
                    <Text className="text-red-500 font-bold text-base tracking-wide" style={{ fontFamily: 'Outfit-Bold' }}>Log Out</Text>
                </TouchableOpacity>
            </Animated.View>

            {/* Contact Modal */}
            <ContactModal
                visible={contactModalVisible}
                onClose={() => setContactModalVisible(false)}
            />
        </View>
    );
}
