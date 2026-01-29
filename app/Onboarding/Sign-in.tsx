import { useThemeStore } from '@/store/themeStore';
import {
    GoogleSignin,
    statusCodes,
} from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Alert, Dimensions, Image, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { supabase } from '../../lib/supabase';

// Configure Google Sign-In
GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_WEB_CLIENT_ID,
});

const { width } = Dimensions.get('window');

export default function SignIn() {
    const router = useRouter();
    const currentTheme = useThemeStore((state) => state.currentTheme);
    const imageSize = width * 1.2; // Adjusted for better responsiveness

    // Google Sign-In Logic
    const signInWithGoogle = async () => {
        try {
            await GoogleSignin.hasPlayServices();
            const userInfo = await GoogleSignin.signIn();

            if (userInfo.data?.idToken) {
                const { data, error } = await supabase.auth.signInWithIdToken({
                    provider: 'google',
                    token: userInfo.data.idToken,
                })

                if (error) {
                    Alert.alert('Supabase Error', error.message);
                } else {
                    router.replace('/Onboarding/SetupBirthday');
                }
            } else {
                throw new Error('no ID token present!');
            }

        } catch (error: any) {
            if (error.code === statusCodes.SIGN_IN_CANCELLED) {
                // user cancelled the login flow
            } else if (error.code === statusCodes.IN_PROGRESS) {
                // operation (e.g. sign in) is in progress already
            } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
                Alert.alert("Error", "Play services not available");
            } else {
                Alert.alert("Google Sign In Error", error.message);
            }
        }
    };

    const signInWithApple = async () => {
        try {
            const credential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
            });

            if (credential.identityToken) {
                const { error } = await supabase.auth.signInWithIdToken({
                    provider: 'apple',
                    token: credential.identityToken,
                });

                if (error) {
                    Alert.alert('Supabase Error', error.message);
                } else {
                    router.replace('/Onboarding/SetupBirthday');
                }
            } else {
                throw new Error('No identity token provided.');
            }
        } catch (e: any) {
            if (e.code === 'ERR_REQUEST_CANCELED') {
                // handle that the user canceled the sign-in flow
            } else {
                Alert.alert('Error', e.message);
            }
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
                    className="items-center justify-center flex-1 my-8"
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
                        onPress={signInWithGoogle}
                        style={{ backgroundColor: currentTheme.colors.button.primary }}
                        className="w-full py-4 rounded-xl items-center flex-row justify-center shadow-lg shadow-white/10"
                    >
                        {/* Google Icon Placeholder or Text */}
                        <Text
                            style={{ color: currentTheme.colors.background, fontFamily: 'Outfit-Bold' }}
                            className="text-lg"
                        >
                            Continue with Google
                        </Text>
                    </TouchableOpacity>

                    {Platform.OS === 'ios' && (
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={signInWithApple}
                            style={{ backgroundColor: currentTheme.colors.text.primary }}
                            className="w-full py-4 rounded-xl items-center flex-row justify-center shadow-lg shadow-white/10"
                        >
                            <Text
                                style={{ color: currentTheme.colors.background, fontFamily: 'Outfit-Bold' }}
                                className="text-lg"
                            >
                                Continue with Apple
                            </Text>
                        </TouchableOpacity>
                    )}

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
        </View>
    );
}
