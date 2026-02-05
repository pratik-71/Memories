import { useSubscriptionStore } from '@/store/subscriptionStore';
import { useThemeStore } from '@/store/themeStore';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Dimensions, Image, Linking, ScrollView, Text, TouchableOpacity, View } from 'react-native';
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
        subscriptionType,
        expirationDate,
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
                    {/* Hero Image - Hide if subscribed */}
                    {!isPro && (
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
                    )}

                    {(() => {
                        // Logic to determine view state
                        const annualPackage = offerings?.availablePackages.find(p => p.packageType === "ANNUAL");
                        const lifetimePackage = offerings?.availablePackages.find(p => p.packageType === "LIFETIME");

                        // Robust ID matching (handles both Android [id:plan] and iOS [id] formats)
                        const isAnnualProduct = (id: string) => id === annualPackage?.product.identifier || id.includes('yearly') || id.includes('annual');
                        const isLifetimeProduct = (id: string) => id === lifetimePackage?.product.identifier || id.includes('lifetime');

                        const isYearlyActive = isPro && activeProductId ? isAnnualProduct(activeProductId) : false;
                        const isLifetimeActive = isPro && activeProductId ? isLifetimeProduct(activeProductId) : false;

                        // If Lifetime is active, show the "Lifetime Active" success screen
                        if (isLifetimeActive) {
                            return (
                                <Animated.View entering={FadeInDown.delay(300).springify()} className="w-full items-center py-8 px-4">
                                    <View className="w-24 h-24 bg-purple-500/20 rounded-full items-center justify-center mb-6 shadow-lg shadow-purple-500/30">
                                        <Feather name="heart" size={40} color="#a855f7" />
                                    </View>
                                    <Text style={{ fontFamily: 'Outfit-Bold', color: 'white' }} className="text-3xl mb-3 text-center">
                                        Lifetime Active
                                    </Text>
                                    <Text style={{ fontFamily: 'Outfit-Regular', color: 'rgba(255,255,255,0.6)' }} className="text-center text-lg mb-8 leading-6">
                                        Unlimited happiness of memories for a lifetime!
                                    </Text>

                                    <TouchableOpacity
                                        onPress={() => router.back()}
                                        style={{ backgroundColor: '#a855f7' }}
                                        className="w-full py-4 rounded-3xl items-center shadow-lg shadow-purple-500/30"
                                    >
                                        <Text style={{ fontFamily: 'Outfit-Bold', color: '#fff' }} className="text-base">
                                            Start Creating Forever
                                        </Text>
                                    </TouchableOpacity>
                                </Animated.View>
                            );
                        }

                        // If ANY other Pro plan is active (Monthly or Yearly)
                        if (isPro && !isLifetimeActive) {
                            return (
                                <View className="w-full">
                                    <Animated.View entering={FadeInDown.delay(300).springify()} className="w-full items-center py-6 px-4 bg-green-500/5 rounded-3xl border border-green-500/10 mb-8">
                                        <View className="w-16 h-16 bg-green-500/20 rounded-full items-center justify-center mb-4">
                                            <Feather name="check" size={32} color="#4ade80" />
                                        </View>
                                        <Text style={{ fontFamily: 'Outfit-Bold', color: 'white' }} className="text-xl mb-1 text-center">
                                            Premium Active
                                        </Text>
                                        <Text style={{ fontFamily: 'Outfit-Regular', color: 'rgba(255,255,255,0.6)' }} className="text-center text-sm mb-4">
                                            You're on the {subscriptionType} plan.
                                            {expirationDate && `\nRenews/Expires: ${new Date(expirationDate).toLocaleDateString()}`}
                                        </Text>


                                    </Animated.View>

                                    <Animated.View entering={FadeInDown.delay(400).springify()} className="mb-6">
                                        <Text style={{ fontFamily: 'Outfit-Bold', color: 'white' }} className="text-2xl text-center mb-2">
                                            {subscriptionType === 'Monthly' ? 'Upgrade Your Plan' : 'Go Lifetime'}
                                        </Text>
                                        <Text style={{ fontFamily: 'Outfit-Regular', color: 'rgba(255,255,255,0.5)' }} className="text-center text-sm leading-5 px-4">
                                            {subscriptionType === 'Monthly'
                                                ? 'Switch to Yearly to save more, or get Lifetime for a one-time purchase.'
                                                : 'Switch to a one-time purchase and save forever.'}
                                        </Text>
                                    </Animated.View>

                                    {/* Show Upgrade Packages */}
                                    <View className="w-full gap-3 pb-6">
                                        {offerings?.availablePackages
                                            .filter(p => {
                                                if (subscriptionType === 'Monthly') {
                                                    return p.packageType === "ANNUAL" || p.packageType === "LIFETIME";
                                                }
                                                if (subscriptionType === 'Yearly') {
                                                    return p.packageType === "LIFETIME";
                                                }
                                                return false;
                                            })
                                            .sort((a, b) => {
                                                // Sort: Lifetime first
                                                const priority = { LIFETIME: 0, ANNUAL: 1 };
                                                return (priority[a.packageType as keyof typeof priority] || 2) -
                                                    (priority[b.packageType as keyof typeof priority] || 2);
                                            })
                                            .map((pack, index) => {
                                                const isLifetime = pack.packageType === "LIFETIME";
                                                const isAnnual = pack.packageType === "ANNUAL";

                                                return (
                                                    <Animated.View
                                                        key={pack.identifier}
                                                        entering={FadeInDown.delay(500 + (index * 100)).springify()}
                                                    >
                                                        <TouchableOpacity
                                                            onPress={() => purchasePackage(pack)}
                                                            style={{
                                                                backgroundColor: isLifetime
                                                                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                                                    : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                                                                borderColor: isLifetime ? '#a855f7' : '#3b82f6',
                                                                borderWidth: 2
                                                            }}
                                                            className={`p-4 rounded-2xl w-full relative ${isLifetime ? 'shadow-xl shadow-purple-500/30' : 'shadow-lg shadow-blue-500/20'}`}
                                                        >
                                                            <View className="absolute -top-3 right-5 bg-red-500 px-3 py-1 rounded-full shadow-lg shadow-red-500/30">
                                                                <Text style={{ fontFamily: 'Outfit-Bold', color: 'white', fontSize: 10 }}>
                                                                    {isLifetime ? 'BEST VALUE' : 'SAVE 25%'}
                                                                </Text>
                                                            </View>

                                                            <View className="flex-row justify-between items-start mb-1">
                                                                <View className="flex-1 pr-4">
                                                                    <Text style={{ fontFamily: 'Outfit-Bold', color: 'white' }} className="text-lg mb-1">
                                                                        {pack.product.title.replace(/\s*\(.*?\)\s*/g, '')}
                                                                    </Text>
                                                                    <View className="flex-row items-center">
                                                                        <Text style={{ fontFamily: 'Outfit-Bold', color: '#fff' }} className="text-xl">
                                                                            {pack.product.priceString}
                                                                        </Text>
                                                                        <View className="bg-white/20 px-2 py-1 rounded-full ml-2">
                                                                            <Text style={{ fontFamily: 'Outfit-Bold', color: '#fff', fontSize: 10 }}>
                                                                                {isLifetime ? 'ONE TIME' : 'PER YEAR'}
                                                                            </Text>
                                                                        </View>
                                                                    </View>
                                                                </View>
                                                                <View className={`p-2 rounded-full ${isLifetime ? 'bg-purple-500/30' : 'bg-blue-500/30'}`}>
                                                                    <Feather name={isLifetime ? "heart" : "star"} size={20} color="white" />
                                                                </View>
                                                            </View>
                                                        </TouchableOpacity>
                                                    </Animated.View>
                                                );
                                            })}
                                    </View>
                                </View>
                            );
                        }

                        // Otherwise (Free user), show the pricing cards
                        return (
                            <>
                                <Animated.View entering={FadeInDown.delay(300).springify()} className="items-center w-full mb-8">
                                    <Text style={{ fontFamily: 'Outfit-Bold', color: 'white' }} className="text-3xl text-center mb-2">
                                        Unlock Unlimited
                                    </Text>
                                    <Text style={{ fontFamily: 'Outfit-Regular', color: 'rgba(255,255,255,0.5)' }} className="text-center text-base leading-6 px-4">
                                        Create unlimited memories of happiness\ncancel anytime.
                                    </Text>
                                </Animated.View>

                                {isLoading || !offerings ? (
                                    <View className="items-center py-10">
                                        <Text style={{ fontFamily: 'Outfit-Regular', color: 'rgba(255,255,255,0.5)' }}>Loading offers...</Text>
                                    </View>
                                ) : (
                                    <View className="w-full gap-3 pb-6">
                                        {(() => {
                                            // Sort packages: Lifetime first, then Annual, then Monthly
                                            const sortedPackages = [...offerings.availablePackages].sort((a, b) => {
                                                const priority = { LIFETIME: 0, ANNUAL: 1, MONTHLY: 2 };
                                                return (priority[a.packageType as keyof typeof priority] || 3) -
                                                    (priority[b.packageType as keyof typeof priority] || 3);
                                            });

                                            return sortedPackages.map((pack, index) => {
                                                const isAnnual = pack.packageType === "ANNUAL";
                                                const isLifetime = pack.packageType === "LIFETIME";
                                                const isCurrentPlan = pack.product.identifier === activeProductId;

                                                // flexible content based on plan type

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
                                                                    ? 'rgba(74, 222, 128, 0.1)'
                                                                    : (isLifetime ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' :
                                                                        (isAnnual ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' : 'rgba(255,255,255,0.03)')),
                                                                borderColor: isCurrentPlan
                                                                    ? '#4ade80'
                                                                    : (isLifetime ? '#a855f7' : (isAnnual ? '#3b82f6' : 'rgba(255,255,255,0.1)')),
                                                                borderWidth: (isAnnual || isCurrentPlan || isLifetime) ? 2 : 1
                                                            }}
                                                            className={`p-4 rounded-2xl w-full relative ${isLifetime && !isCurrentPlan ? 'shadow-xl shadow-purple-500/30' : isAnnual && !isCurrentPlan ? 'shadow-lg shadow-blue-500/20' : ''}`}
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
                                                                <View className="absolute -top-3 right-5 bg-yellow-400 px-3 py-1 rounded-full shadow-lg shadow-yellow-400/30">
                                                                    <Text style={{ fontFamily: 'Outfit-Bold', color: '#000', fontSize: 10 }}>
                                                                        POPULAR
                                                                    </Text>
                                                                </View>
                                                            )}

                                                            {isLifetime && !isCurrentPlan && (
                                                                <View className="absolute -top-3 right-5 bg-red-500 px-3 py-1 rounded-full shadow-lg shadow-red-500/30 ">
                                                                    <Text style={{ fontFamily: 'Outfit-Bold', color: 'white', fontSize: 10 }}>
                                                                        LIMITED TIME
                                                                    </Text>
                                                                </View>
                                                            )}

                                                            <View className="flex-row justify-between items-start mb-3">
                                                                <View className="flex-1 pr-4">
                                                                    <Text style={{ fontFamily: 'Outfit-Bold', color: 'white' }} className="text-lg mb-1">
                                                                        {pack.product.title.replace(/\s*\(.*?\)\s*/g, '')}
                                                                    </Text>

                                                                    <View>
                                                                        {isLifetime && !isCurrentPlan ? (
                                                                            <View>
                                                                                <View className="flex-row items-center">
                                                                                    <Text style={{ fontFamily: 'Outfit-Bold', color: '#fff' }} className="text-xl">
                                                                                        {pack.product.priceString}
                                                                                    </Text>
                                                                                    <View className="bg-red-500 px-2 py-1 rounded-full ml-2">
                                                                                        <Text style={{ fontFamily: 'Outfit-Bold', color: '#fff', fontSize: 10 }}>
                                                                                            80% OFF
                                                                                        </Text>
                                                                                    </View>
                                                                                </View>
                                                                                <Text style={{ fontFamily: 'Outfit-Regular', color: 'rgba(255,255,255,0.6)', textDecorationLine: 'line-through' }} className="text-sm mt-1">
                                                                                    Was {new Intl.NumberFormat(undefined, {
                                                                                        style: 'currency',
                                                                                        currency: pack.product.currencyCode,
                                                                                        maximumFractionDigits: 2
                                                                                    }).format(pack.product.price / 0.2)}
                                                                                </Text>
                                                                            </View>
                                                                        ) : (
                                                                            <View>
                                                                                <View className="flex-row items-center">
                                                                                    <Text style={{ fontFamily: 'Outfit-Bold', color: isCurrentPlan ? '#4ade80' : (isLifetime ? '#fff' : (isAnnual ? '#fff' : currentTheme.colors.primary)) }} className={`${isAnnual && !isCurrentPlan ? 'text-lg' : 'text-xl'}`}>
                                                                                        {pack.product.priceString}
                                                                                        <Text style={{ fontFamily: 'Outfit-Regular', color: isLifetime ? 'rgba(255,255,255,0.8)' : (isAnnual ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.3)'), fontSize: 16 }}>
                                                                                            {isLifetime ? ' once' : (isAnnual ? '/year' : '/mo')}
                                                                                        </Text>
                                                                                    </Text>
                                                                                    {isAnnual && !isCurrentPlan && (
                                                                                        <View className="bg-emerald-500 px-2 py-1 rounded-full ml-2">
                                                                                            <Text style={{ fontFamily: 'Outfit-Bold', color: '#fff', fontSize: 10 }}>
                                                                                                SAVE 25%
                                                                                            </Text>
                                                                                        </View>
                                                                                    )}
                                                                                </View>
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
                                                                        )}
                                                                    </View>
                                                                </View>
                                                                {isCurrentPlan ? (
                                                                    <View className="bg-green-500/20 p-2 rounded-full">
                                                                        <Feather name="check" size={20} color="#4ade80" />
                                                                    </View>
                                                                ) : isLifetime ? (
                                                                    <View className="bg-gradient-to-br from-purple-500 to-pink-500 p-2 rounded-full">
                                                                        <Feather name="heart" size={20} color="white" />
                                                                    </View>
                                                                ) : isAnnual ? (
                                                                    <View className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-full">
                                                                        <Feather name="star" size={20} color="white" />
                                                                    </View>
                                                                ) : (
                                                                    <View className="bg-gray-500/20 p-2 rounded-full">
                                                                        <Feather name="user" size={20} color="rgba(255,255,255,0.5)" />
                                                                    </View>
                                                                )}
                                                            </View>
                                                        </TouchableOpacity>
                                                    </Animated.View>
                                                )
                                            });
                                        })()}

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
                                                <TouchableOpacity onPress={() => Linking.openURL('https://zenvy-venture.vercel.app/memories/terms-conditions')}>
                                                    <Text style={{ fontFamily: 'Outfit-Regular', color: 'rgba(255,255,255,0.3)' }} className="text-[10px]">
                                                        Terms of Service
                                                    </Text>
                                                </TouchableOpacity>
                                                <Text style={{ fontFamily: 'Outfit-Regular', color: 'rgba(255,255,255,0.3)' }} className="text-[10px]">•</Text>
                                                <TouchableOpacity onPress={() => Linking.openURL('https://zenvy-venture.vercel.app/memories/privacy-policy')}>
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
