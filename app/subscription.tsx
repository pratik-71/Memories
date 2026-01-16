import { useSubscriptionStore } from '@/store/subscriptionStore';
import { useThemeStore } from '@/store/themeStore';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Dimensions, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function Subscription() {
    const params = useLocalSearchParams();
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

    return (
        <View style={{ backgroundColor: currentTheme.colors.background }} className="flex-1">
            <StatusBar style="light" />

            <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
                {/* Close & Restore Header */}
                <View className="px-6 pt-16 pb-0 flex-row justify-between items-center z-10">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                        className="w-10 h-10 rounded-full items-center justify-center"
                    >
                        <Feather name="x" size={20} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Main Content */}
                <View className="flex-1 items-center pt-2 pb-10 px-6">
                    {/* Hero Image */}
                    <Animated.View
                        entering={FadeInDown.delay(200).springify()}
                        className="items-center justify-center mb-6 shadow-2xl shadow-black"
                    >
                        <Image
                            source={require('@/assets/onboarding/subscription.png')}
                            style={{
                                width: width * 1.2,
                                height: width * 0.45,
                                opacity: 0.9
                            }}
                            resizeMode="contain"
                        />
                    </Animated.View>

                    {/* Text Content */}
                    <Animated.View entering={FadeInDown.delay(300).springify()} className="items-center w-full mb-8">
                        <Text style={{ fontFamily: 'Outfit-Bold', color: 'white' }} className="text-3xl text-center mb-2">
                            Unlock Unlimited
                        </Text>
                        <Text style={{ fontFamily: 'Outfit-Regular', color: 'rgba(255,255,255,0.5)' }} className="text-center text-base leading-6 px-4">
                            Create unlimited memories.{'\n'}Keep your moments forever.
                        </Text>
                    </Animated.View>

                    {/* Loading State */}
                    {isLoading || !offerings ? (
                        <View className="items-center py-10">
                            <Text style={{ fontFamily: 'Outfit-Regular', color: 'rgba(255,255,255,0.5)' }}>Loading offers...</Text>
                        </View>
                    ) : (
                        <View className="w-full gap-4 pb-10">
                            {offerings.availablePackages.map((pack, index) => {
                                const isAnnual = pack.packageType === "ANNUAL";

                                // flexible content based on plan type
                                const features = isAnnual ? [
                                    "Save 20% vs monthly",
                                    "Cancel anytime",
                                ] : [
                                    "One-time payment",
                                    "30 days access"
                                ];

                                return (
                                    <Animated.View
                                        key={pack.identifier}
                                        entering={FadeInDown.delay(400 + (index * 100)).springify()}
                                    >
                                        <TouchableOpacity
                                            onPress={() => purchasePackage(pack)}
                                            style={{
                                                backgroundColor: isAnnual ? 'rgba(250, 250, 250, 0.08)' : 'rgba(255,255,255,0.03)',
                                                borderColor: isAnnual ? currentTheme.colors.primary : 'rgba(255,255,255,0.1)',
                                                borderWidth: isAnnual ? 2 : 1
                                            }}
                                            className={`p-5 rounded-3xl w-full relative ${isAnnual ? 'shadow-lg shadow-white/10' : ''}`}
                                        >
                                            {isAnnual && (
                                                <View className="absolute -top-3 right-5 bg-white px-3 py-1 rounded-full">
                                                    <Text style={{ fontFamily: 'Outfit-Bold', color: 'black', fontSize: 10 }}>
                                                        BEST VALUE
                                                    </Text>
                                                </View>
                                            )}

                                            <View className="flex-row justify-between items-start mb-4">
                                                <View className="flex-1 pr-4">
                                                    <Text style={{ fontFamily: 'Outfit-Bold', color: 'white' }} className="text-xl mb-1">
                                                        {pack.product.title.replace(/\s*\(.*?\)\s*/g, '')}
                                                    </Text>
                                                    <View>
                                                        <Text style={{ fontFamily: 'Outfit-Bold', color: currentTheme.colors.primary }} className="text-2xl">
                                                            {pack.product.priceString}
                                                            <Text style={{ fontFamily: 'Outfit-Regular', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
                                                                {isAnnual ? '/year' : '/mo'}
                                                            </Text>
                                                        </Text>
                                                        {isAnnual && pack.product.price > 0 && (
                                                            <Text style={{ fontFamily: 'Outfit-Medium', color: '#4ade80' }} className="text-sm mt-1">
                                                                Just {new Intl.NumberFormat(undefined, {
                                                                    style: 'currency',
                                                                    currency: pack.product.currencyCode,
                                                                    maximumFractionDigits: 2
                                                                }).format(pack.product.price / 12)}/mo
                                                            </Text>
                                                        )}
                                                    </View>
                                                </View>
                                            </View>

                                            {/* Inline Features */}
                                            <View className="gap-2">
                                                {features.map((item, i) => (
                                                    <View key={i} className="flex-row items-center">
                                                        <Feather name="check" size={12} color={isAnnual ? "#4ade80" : "rgba(255,255,255,0.5)"} />
                                                        <Text style={{ fontFamily: 'Outfit-Regular', color: 'rgba(255,255,255,0.6)' }} className="text-sm ml-2">
                                                            {item}
                                                        </Text>
                                                    </View>
                                                ))}
                                            </View>
                                        </TouchableOpacity>
                                    </Animated.View>
                                )
                            })}

                            {/* Restore Purchases */}
                            <Animated.View entering={FadeInDown.delay(600).springify()} className="items-center mt-4 mb-6">
                                <TouchableOpacity
                                    onPress={restorePurchases}
                                    className="py-2 px-4"
                                >
                                    <Text style={{ fontFamily: 'Outfit-Medium', color: 'rgba(255,255,255,0.4)' }} className="text-xs">
                                        Restore Purchases
                                    </Text>
                                </TouchableOpacity>
                            </Animated.View>
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}
