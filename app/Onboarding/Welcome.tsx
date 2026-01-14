import { useThemeStore } from '@/store/themeStore';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Dimensions, FlatList, Image, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = width * 0.8;
const SPACING = (width - ITEM_WIDTH) / 2;

const CAROUSEL_IMAGES = [
    require('@/assets/onboarding/propose.png'),
    require('@/assets/onboarding/birthday.png'),
    require('@/assets/onboarding/anniversary.png'),
    require('@/assets/onboarding/kids_birthday.png'),
];

export default function Welcome() {
    const router = useRouter();
    const currentTheme = useThemeStore((state) => state.currentTheme);
    const flatListRef = useRef<FlatList>(null);

    // Create a large data set for "infinite" effect
    const [data] = useState(() => {
        let items: any[] = [];
        for (let i = 0; i < 1000; i++) {
            items = items.concat(CAROUSEL_IMAGES);
        }
        return items;
    });

    // Start in the middle
    const [currentIndex, setCurrentIndex] = useState(data.length / 2);

    // Auto-scroll logic
    useEffect(() => {
        const interval = setInterval(() => {
            if (flatListRef.current) {
                const nextIndex = currentIndex + 1;
                flatListRef.current.scrollToIndex({
                    index: nextIndex,
                    animated: true,
                });
                setCurrentIndex(nextIndex);
            }
        }, 2500); // Slightly faster for flow

        return () => clearInterval(interval);
    }, [currentIndex]);

    // Handle manual scroll updates to keep sync with auto-scroll
    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index);
        }
    }).current;

    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 50,
    }).current;

    const getItemLayout = (data: any, index: number) => ({
        length: ITEM_WIDTH,
        offset: (ITEM_WIDTH + 20) * index, // +20 for gap
        index,
    });

    return (
        <View
            style={{ backgroundColor: currentTheme.colors.background }}
            className="flex-1 justify-between pt-20 pb-12"
        >
            <StatusBar style="light" />

            {/* Top Text Section */}
            <Animated.View
                entering={FadeInDown.delay(200).springify()}
                className="px-6 items-center"
            >
                <Text
                    style={{ color: currentTheme.colors.text.primary, fontFamily: 'Outfit-Bold' }}
                    className="text-5xl text-center tracking-tighter leading-[1.1]"
                >
                    Every Moment Matters
                </Text>
                <Text
                    style={{ color: currentTheme.colors.text.secondary, fontFamily: 'Outfit-Medium' }}
                    className="text-center mt-4 text-xl opacity-90"
                >
                    Celebrate every moment that matters.
                </Text>
            </Animated.View>

            {/* Carousel Section */}
            <View className="py-8">
                <FlatList
                    ref={flatListRef}
                    data={data}
                    keyExtractor={(_, index) => index.toString()}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    snapToInterval={ITEM_WIDTH + 20} // Adjust for spacing
                    decelerationRate="fast"
                    contentContainerStyle={{
                        paddingHorizontal: SPACING,
                        gap: 20,
                    }}
                    onViewableItemsChanged={onViewableItemsChanged}
                    viewabilityConfig={viewabilityConfig}
                    getItemLayout={getItemLayout}
                    initialScrollIndex={data.length / 2}
                    renderItem={({ item }) => (
                        <View
                            style={{
                                width: ITEM_WIDTH,
                                height: ITEM_WIDTH * 1.3,
                                borderRadius: 32,
                                overflow: 'hidden',
                                shadowOffset: {
                                    width: 0,
                                    height: 10,
                                },
                                shadowOpacity: 0.1,
                                shadowRadius: 20,
                                elevation: 10,
                            }}
                        >
                            <Image
                                source={item}
                                style={{ width: '100%', height: '100%' }}
                                resizeMode="cover"
                            />
                            <View className="absolute inset-0 bg-black/10" />
                        </View>
                    )}
                />
            </View>

            {/* Bottom Section */}
            <Animated.View
                entering={FadeInDown.delay(600).springify()}
                className="px-6 w-full"
            >
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => router.push('/Onboarding/Sign-in')}
                    style={{ backgroundColor: currentTheme.colors.button.primary }}
                    className="w-full py-5 rounded-2xl items-center shadow-lg shadow-white/10"
                >
                    <Text
                        style={{ color: currentTheme.colors.background, fontFamily: 'Outfit-Bold' }}
                        className="text-xl tracking-wide"
                    >
                        Get Started
                    </Text>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
}
