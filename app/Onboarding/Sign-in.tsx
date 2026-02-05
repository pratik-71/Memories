import RevenueCatService from '@/lib/revenuecat';
import { useEventStore } from '@/store/eventStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { useThemeStore } from '@/store/themeStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    GoogleSignin,
    statusCodes,
} from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, Linking, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { supabase } from '../../lib/supabase';

// Configure Google Sign-In
GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_IOS_CLIENT_ID,
});

const { width } = Dimensions.get('window');

export default function SignIn() {
    const router = useRouter();
    const currentTheme = useThemeStore((state) => state.currentTheme);
    const imageSize = width * 1.2;
    const [hasAttemptedAutoSignIn, setHasAttemptedAutoSignIn] = useState(false);
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    useEffect(() => {
        checkAutoSignIn();
    }, []);

    const handleNavigationAfterSignIn = async () => {
        try {
            // Check if user already has events (onboarded)
            const { fetchEvents } = useEventStore.getState();
            await fetchEvents();
            const events = useEventStore.getState().events;

            if (events.length > 0) {
                router.replace('/home');
            } else {
                router.replace('/Onboarding/SetupBirthday');
            }
        } catch (error) {
            // Fallback to boarding if check fails, it will redirect anyway if needed
            router.replace('/Onboarding/SetupBirthday');
        }
    };

    const checkAutoSignIn = async () => {
        if (hasAttemptedAutoSignIn) return;

        try {
            const lastProvider = await AsyncStorage.getItem('last_login_provider');
            if (lastProvider === 'apple') {
                signInWithApple(true); // pass true to indicate it's an auto-attempt
            } else if (lastProvider === 'google') {
                signInWithGoogle(true);
            }
        } catch (e) {
            // Silent
        } finally {
            setHasAttemptedAutoSignIn(true);
        }
    };

    // Google Sign-In Logic
    const signInWithGoogle = async (isAuto: boolean | any = false) => {
        const auto = isAuto === true;
        setIsLoggingIn(true);
        try {
            await GoogleSignin.hasPlayServices();

            let userInfo;
            if (auto) {
                userInfo = await GoogleSignin.signInSilently();
            } else {
                // Force account picker for manual sign-in
                try {
                    await GoogleSignin.signOut();
                } catch (e) { }
                userInfo = await GoogleSignin.signIn();
            }

            if (userInfo.data?.idToken) {
                const { data, error } = await supabase.auth.signInWithIdToken({
                    provider: 'google',
                    token: userInfo.data.idToken,
                })

                if (error) {
                    if (!auto) Alert.alert('Supabase Error', error.message);
                } else if (data.session?.user) {
                    await AsyncStorage.setItem('last_login_provider', 'google');
                    await RevenueCatService.logIn(data.session.user.id, data.session.user.email);
                    await useSubscriptionStore.getState().initialize();
                    await handleNavigationAfterSignIn();
                }
            } else if (!auto) {
                throw new Error('No ID token present!');
            }

        } catch (error: any) {
            if (error.code === statusCodes.SIGN_IN_CANCELLED) {
                // User cancelled, do nothing
            } else if (error.code === statusCodes.IN_PROGRESS) {
                // Already in progress
            } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
                if (!auto) Alert.alert("Error", "Play services not available");
            } else {
                if (!auto) Alert.alert("Google Sign In Error", error.message);
            }
        } finally {
            // Only set to false if we didn't successfully navigate
            // (Wait a bit to prevent flashing back to the button text)
            setTimeout(() => {
                setIsLoggingIn(false);
            }, 1000);
        }
    };

    const signInWithApple = async (isAuto: boolean | any = false) => {
        const auto = isAuto === true;
        setIsLoggingIn(true);
        try {
            const credential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
                // @ts-ignore
                serviceId: process.env.EXPO_PUBLIC_APPLE_SERVICE_ID,
                // @ts-ignore
                redirectUrl: process.env.EXPO_PUBLIC_APPLE_REDIRECT_URL,
            });

            if (credential.identityToken) {
                const { data, error } = await supabase.auth.signInWithIdToken({
                    provider: 'apple',
                    token: credential.identityToken,
                });

                if (error) {
                    if (!auto) Alert.alert('Supabase Error', error.message);
                } else if (data.session?.user) {
                    await AsyncStorage.setItem('last_login_provider', 'apple');
                    await RevenueCatService.logIn(data.session.user.id, data.session.user.email);
                    await useSubscriptionStore.getState().initialize();
                    await handleNavigationAfterSignIn();
                }
            } else {
                throw new Error('No identity token provided.');
            }
        } catch (e: any) {
            if (e.code === 'ERR_REQUEST_CANCELED') {
            } else {
                if (!auto) Alert.alert('Error', e.message);
            }
        } finally {
            setTimeout(() => {
                setIsLoggingIn(false);
            }, 1000);
        }
    };

    return (
        <View
            style={{ backgroundColor: currentTheme.colors.background }}
            className="flex-1"
        >
            <StatusBar style="light" />
            <ScrollView
                contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between', paddingBottom: 48, paddingTop: 80 }}
                showsVerticalScrollIndicator={false}
                className="px-6"
            >
                {/* Title Section */}
                <Animated.View
                    entering={FadeInDown.delay(200).springify()}
                    className="items-center"
                >
                    <Text
                        style={{ color: currentTheme.colors.text.primary, fontFamily: 'Outfit-Bold' }}
                        className="text-4xl text-center tracking-tight leading-[1.2]"
                    >
                        Save Your{'\n'}Special Days
                    </Text>
                </Animated.View>

                {/* Image Section */}
                <Animated.View
                    entering={FadeInDown.delay(400).springify()}
                    className="items-center justify-center flex-1 "
                >
                    <Image
                        source={require('@/assets/onboarding/sign-in.png')}
                        style={{ width: imageSize, height: imageSize }}
                        resizeMode="contain"
                    />
                </Animated.View>

                {/* Button Section */}
                <Animated.View
                    entering={FadeInDown.delay(600).springify()}
                    className="w-full space-y-4 gap-4"
                >
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => signInWithGoogle(false)}
                        disabled={isLoggingIn}
                        style={{
                            backgroundColor: currentTheme.colors.button.primary,
                            opacity: isLoggingIn ? 0.7 : 1
                        }}
                        className="w-full py-4 rounded-xl items-center flex-row justify-center shadow-lg shadow-white/10"
                    >
                        {isLoggingIn ? (
                            <ActivityIndicator color={currentTheme.colors.background} />
                        ) : (
                            <Text
                                style={{ color: currentTheme.colors.background, fontFamily: 'Outfit-Bold' }}
                                className="text-lg"
                            >
                                Continue with Google
                            </Text>
                        )}
                    </TouchableOpacity>


                    {Platform.OS === 'ios' && (
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => signInWithApple(false)}
                            disabled={isLoggingIn}
                            style={{
                                backgroundColor: currentTheme.colors.text.primary,
                                opacity: isLoggingIn ? 0.7 : 1
                            }}
                            className="w-full py-4 rounded-xl items-center flex-row justify-center shadow-lg shadow-white/10"
                        >
                            {isLoggingIn ? (
                                <ActivityIndicator color={currentTheme.colors.background} />
                            ) : (
                                <Text
                                    style={{ color: currentTheme.colors.background, fontFamily: 'Outfit-Bold' }}
                                    className="text-lg"
                                >
                                    Continue with Apple
                                </Text>
                            )}
                        </TouchableOpacity>
                    )}

                    <View className="items-center px-4 mt-2">
                        <Text
                            style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Outfit-Regular' }}
                            className="text-[11px] text-center leading-4"
                        >
                            By signing in, you accept our{' '}
                            <Text
                                onPress={() => Linking.openURL('https://zenvy-venture.vercel.app/memories/terms-conditions')}
                                style={{ color: currentTheme.colors.text.primary }}
                                className="underline"
                            >
                                Terms & Conditions
                            </Text>
                            {' '}and{' '}
                            <Text
                                onPress={() => Linking.openURL('https://zenvy-venture.vercel.app/memories/privacy-policy')}
                                style={{ color: currentTheme.colors.text.primary }}
                                className="underline"
                            >
                                Privacy Policy
                            </Text>
                        </Text>
                    </View>

                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="items-center py-2"
                    >
                        <Text style={{ color: currentTheme.colors.text.secondary, fontFamily: 'Outfit-Medium' }}>
                            Back to Welcome
                        </Text>
                    </TouchableOpacity>
                </Animated.View>
            </ScrollView>

            {/* Global Loading Overlay */}
            {isLoggingIn && (
                <Animated.View
                    entering={FadeInDown}
                    style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
                    className="absolute inset-0 items-center justify-center z-50"
                >
                    <View className="bg-zinc-900 p-8 rounded-3xl items-center shadow-2xl border border-white/10">
                        <ActivityIndicator size="large" color={currentTheme.colors.primary} />
                        <Text style={{ fontFamily: 'Outfit-Bold', color: 'white' }} className="mt-4 text-lg">
                            Signing you in...
                        </Text>
                        <Text style={{ fontFamily: 'Outfit-Regular', color: 'rgba(255,255,255,0.5)' }} className="mt-1">
                            Please wait a moment
                        </Text>
                    </View>
                </Animated.View>
            )}
        </View>
    );
}
