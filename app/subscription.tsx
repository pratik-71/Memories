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
        activeProductId,
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

                    {(() => {
                        // Logic to determine view state
                        const annualPackage = offerings?.availablePackages.find(p => p.packageType === "ANNUAL");
                        const isYearlyActive = isPro && activeProductId === annualPackage?.product.identifier;

                        // If Yearly is active, show the "Premium Active" success screen (DONE state)
                        if (isYearlyActive) {
                            return (
                                <Animated.View entering={FadeInDown.delay(300).springify()} className="w-full items-center py-8 px-4">
                                    <View className="w-20 h-20 bg-green-500/20 rounded-full items-center justify-center mb-6">
                                        <Feather name="check" size={40} color="#4ade80" />
                                    </View>
                                    <Text style={{ fontFamily: 'Outfit-Bold', color: 'white' }} className="text-2xl mb-2 text-center">
                                        Premium Active
                                    </Text>
                                    <Text style={{ fontFamily: 'Outfit-Regular', color: 'rgba(255,255,255,0.6)' }} className="text-center text-base mb-8">
                                        You have the highest plan. Enjoy unlimited access forever!
                                    </Text>

                                    <TouchableOpacity
                                        onPress={() => router.back()}
                                        style={{ backgroundColor: currentTheme.colors.primary }}
                                        className="w-full py-4 rounded-3xl items-center"
                                    >
                                        <Text style={{ fontFamily: 'Outfit-Bold', color: '#000' }} className="text-base">
                                            Start Creating
                                        </Text>
                                    </TouchableOpacity>
                                </Animated.View>
                            );
                        }

                        // Otherwise (Free OR Monthly), show the cards
                        return (
                            <>
                                <Animated.View entering={FadeInDown.delay(300).springify()} className="items-center w-full mb-8">
                                    <Text style={{ fontFamily: 'Outfit-Bold', color: 'white' }} className="text-3xl text-center mb-2">
                                        {isPro ? 'Upgrade Plan' : 'Unlock Unlimited'}
                                    </Text>
                                    <Text style={{ fontFamily: 'Outfit-Regular', color: 'rgba(255,255,255,0.5)' }} className="text-center text-base leading-6 px-4">
                                        {isPro ? 'Switch to annual for better savings.' : 'Create unlimited memories.\nKeep your moments forever.'}
                                    </Text>
                                </Animated.View>

                                {isLoading || !offerings ? (
                                    <View className="items-center py-10">
                                        <Text style={{ fontFamily: 'Outfit-Regular', color: 'rgba(255,255,255,0.5)' }}>Loading offers...</Text>
                                    </View>
                                ) : (
                                    <View className="w-full gap-4 pb-10">
                                        {offerings.availablePackages.map((pack, index) => {
                                            const isAnnual = pack.packageType === "ANNUAL";
                                            const isCurrentPlan = pack.product.identifier === activeProductId;

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
                                                        disabled={isCurrentPlan}
                                                        onPress={() => purchasePackage(pack)}
                                                        style={{
                                                            backgroundColor: isCurrentPlan
                                                                ? 'rgba(74, 222, 128, 0.1)' // Green tint for current
                                                                : (isAnnual ? 'rgba(250, 250, 250, 0.08)' : 'rgba(255,255,255,0.03)'),
                                                            borderColor: isCurrentPlan
                                                                ? '#4ade80'
                                                                : (isAnnual ? currentTheme.colors.primary : 'rgba(255,255,255,0.1)'),
                                                            borderWidth: (isAnnual || isCurrentPlan) ? 2 : 1
                                                        }}
                                                        className={`p-5 rounded-3xl w-full relative ${isAnnual && !isCurrentPlan ? 'shadow-lg shadow-white/10' : ''}`}
                                                    >
                                                        {isCurrentPlan && (
                                                            <View className="absolute -top-3 left-0 right-0 items-center z-10">
                                                                <View className="bg-green-500 px-4 py-1 rounded-full">
                                                                    <Text style={{ fontFamily: 'Outfit-Bold', color: '#000', fontSize: 10 }}>
                                                                        CURRENT PLAN
                                                                    </Text>
                                                                </View>
                                                            </View>
                                                        )}

                                                        {isAnnual && !isCurrentPlan && (
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
                                                                    <Text style={{ fontFamily: 'Outfit-Bold', color: isCurrentPlan ? '#4ade80' : currentTheme.colors.primary }} className="text-2xl">
                                                                        {pack.product.priceString}
                                                                        <Text style={{ fontFamily: 'Outfit-Regular', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
                                                                            {isAnnual ? '/year' : '/mo'}
                                                                        </Text>
                                                                    </Text>
                                                                    {isAnnual && pack.product.price > 0 && !isCurrentPlan && (
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
                                                            {isCurrentPlan && (
                                                                <View className="bg-green-500/20 p-2 rounded-full">
                                                                    <Feather name="check" size={20} color="#4ade80" />
                                                                </View>
                                                            )}
                                                        </View>

                                                        {/* Inline Features */}
                                                        <View className="gap-2">
                                                            {features.map((item, i) => (
                                                                <View key={i} className="flex-row items-center">
                                                                    <Feather name="check" size={12} color={isAnnual || isCurrentPlan ? "#4ade80" : "rgba(255,255,255,0.5)"} />
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

                                        {/* Restore & Legal */}
                                        <Animated.View entering={FadeInDown.delay(600).springify()} className="items-center mt-4 mb-6">
                                            <TouchableOpacity
                                                onPress={restorePurchases}
                                                className="py-2 px-4 mb-4"
                                            >
                                                <Text style={{ fontFamily: 'Outfit-Medium', color: 'rgba(255,255,255,0.4)' }} className="text-xs">
                                                    Restore Purchases
                                                </Text>
                                            </TouchableOpacity>

                                            <View className="flex-row gap-4">
                                                <TouchableOpacity onPress={() => router.push('/terms-conditions')}>
                                                    <Text style={{ fontFamily: 'Outfit-Regular', color: 'rgba(255,255,255,0.3)' }} className="text-[10px]">
                                                        Terms of Service
                                                    </Text>
                                                </TouchableOpacity>
                                                <Text style={{ fontFamily: 'Outfit-Regular', color: 'rgba(255,255,255,0.3)' }} className="text-[10px]">•</Text>
                                                <TouchableOpacity onPress={() => router.push('/privacy-policy')}>
                                                    <Text style={{ fontFamily: 'Outfit-Regular', color: 'rgba(255,255,255,0.3)' }} className="text-[10px]">
                                                        Privacy Policy
                                                    </Text>
                                                </TouchableOpacity>
                                            </View>
                                        </Animated.View>
                                    </View>
                                )}
                            </>
                        );
                    })()}
                </View>
            </ScrollView >
        </View >
    );
}
