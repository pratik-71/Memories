import { useSubscriptionStore } from '@/store/subscriptionStore';
import { useThemeStore } from '@/store/themeStore';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { PurchasesPackage } from 'react-native-purchases';
import Animated, { FadeInDown } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function Subscription() {
    const router = useRouter();
    const currentTheme = useThemeStore((state) => state.currentTheme);
    const {
        offerings,
        purchasePackage,
        restorePurchases,
        isPro,
        isLoading,
        initialize
    } = useSubscriptionStore();

    useEffect(() => {
        initialize();
    }, []);

    const handlePurchase = async (pack: any) => {
        if (isPro) return;
        const success = await purchasePackage(pack);
        if (success) {
            Alert.alert("Success", "You are now a Premium member!");
            router.back();
        }
    };

    const handleRestore = async () => {
        const success = await restorePurchases();
        if (success) {
            Alert.alert("Success", "Purchases restored successfully!");
        } else {
            Alert.alert("Notice", "No purchases to restore found.");
        }
    };

    const availablePackages = offerings?.availablePackages || [];

    return (
        <View style={{ backgroundColor: currentTheme.colors.background }} className="flex-1">
            <StatusBar style="light" />

            <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
                {/* Close & Restore Header */}
                <View className="px-6 pt-16 pb-4 flex-row justify-between items-center z-10">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                        className="w-10 h-10 rounded-full items-center justify-center"
                    >
                        <Feather name="x" size={20} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleRestore}>
                        <Text style={{ fontFamily: 'Outfit-Medium', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontSize: 12, letterSpacing: 1 }}>
                            Restore
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Main Content */}
                <View className="flex-1 items-center pt-4 pb-20 px-6">
                    {/* Hero Image */}
                    <Animated.View
                        entering={FadeInDown.delay(200).springify()}
                        className="items-center justify-center mb-8 shadow-2xl shadow-black"
                    >
                        <Image
                            source={require('@/assets/onboarding/subscription.png')}
                            style={{
                                width: width * 0.75,
                                height: width * 0.75,
                                opacity: 0.9
                            }}
                            resizeMode="contain"
                        />
                    </Animated.View>

                    {/* Text Content */}
                    <Animated.View entering={FadeInDown.delay(300).springify()} className="items-center w-full mb-16">
                        <Text style={{ fontFamily: 'Outfit-Bold', color: 'white' }} className="text-4xl text-center mb-3">
                            Memories Premium
                        </Text>
                        <Text style={{ fontFamily: 'Outfit-Regular', color: 'rgba(255,255,255,0.5)' }} className="text-center text-lg leading-7 px-4">
                            Unlock the full experience.{'\n'}Unlimited moments.
                        </Text>
                    </Animated.View>

                    {/* Packages / Pricing */}
                    <Animated.View entering={FadeInDown.delay(400).springify()} className="w-full space-y-4 gap-4">
                        {isLoading ? (
                            <View className="py-12 items-center">
                                <ActivityIndicator size="small" color="white" />
                            </View>
                        ) : isPro ? (
                            <View
                                style={{ backgroundColor: '#18181b', borderColor: 'rgba(255,255,255,0.1)' }}
                                className="w-full py-6 rounded-3xl items-center border"
                            >
                                <Feather name="check-circle" size={32} color="white" style={{ marginBottom: 12 }} />
                                <Text style={{ fontFamily: 'Outfit-Bold', color: 'white' }} className="text-xl">
                                    Premium Unlocked
                                </Text>
                            </View>
                        ) : availablePackages.length > 0 ? (
                            availablePackages.map((pack: PurchasesPackage) => {
                                const isAnnual = pack.packageType === 'ANNUAL';
                                return (
                                    <TouchableOpacity
                                        key={pack.identifier}
                                        activeOpacity={0.9}
                                        onPress={() => handlePurchase(pack)}
                                        style={{
                                            backgroundColor: isAnnual ? 'white' : 'rgba(255,255,255,0.05)',
                                            borderColor: isAnnual ? 'white' : 'rgba(255,255,255,0.1)',
                                            borderWidth: 1
                                        }}
                                        className="w-full p-6 rounded-3xl flex-row items-center justify-between"
                                    >
                                        <View>
                                            <Text style={{
                                                fontFamily: 'Outfit-Bold',
                                                color: isAnnual ? 'black' : 'white',
                                                fontSize: 18
                                            }}>
                                                {pack.product.title}
                                            </Text>
                                            {isAnnual && (
                                                <Text style={{ fontFamily: 'Outfit-Medium', color: 'rgba(0,0,0,0.5)', marginTop: 4, fontSize: 12 }}>
                                                    BEST VALUE
                                                </Text>
                                            )}
                                        </View>
                                        <Text style={{
                                            fontFamily: 'Outfit-Bold',
                                            color: isAnnual ? 'black' : 'white',
                                            fontSize: 18
                                        }}>
                                            {pack.product.priceString}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })
                        ) : (
                            // Loading Skeleton / Fallback state
                            <View className="w-full space-y-4 opacity-50">
                                <View className="w-full h-20 bg-white/5 rounded-3xl animate-pulse" />
                                <View className="w-full h-20 bg-white/5 rounded-3xl animate-pulse" />
                            </View>
                        )}
                    </Animated.View>
                </View>
            </ScrollView>
        </View>
    );
}
