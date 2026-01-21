import { useEventStore } from '@/store/eventStore';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { BackHandler, Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withTiming
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');
const DURATION = 5000; // Time per slide

export default function Slideshow() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { events, fetchEventDetails } = useEventStore();
    const [currentIndex, setCurrentIndex] = useState(0);

    const event = events.find(e => e.id === id);

    useEffect(() => {
        if (typeof id === 'string') {
            fetchEventDetails(id);
        }
    }, [id]);

    useEffect(() => {
        const backAction = () => {
            handleFinish();
            return true;
        };
        const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
        return () => backHandler.remove();
    }, []);

    const handleFinish = () => {
        router.replace({ pathname: "/event/[id]", params: { id: typeof id === 'string' ? id : '' } });
    };

    // If loaded and no images/event, redirect
    useEffect(() => {
        if (event && (!event.images || event.images.length === 0)) {
            handleFinish();
        }
    }, [event]);

    // Animation Values
    const opacity = useSharedValue(0);
    const scale = useSharedValue(1);
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);

    useEffect(() => {
        if (!event || !event.images || event.images.length === 0) return;

        // Reset with random configuration for "Ken Burns" effect
        const zoomIn = Math.random() > 0.5; // 50% chance to zoom in or out
        const randomX = (Math.random() - 0.5) * 50; // Random pan X (-25 to 25)
        const randomY = (Math.random() - 0.5) * 50; // Random pan Y (-25 to 25)

        // Start state
        opacity.value = 0;
        scale.value = zoomIn ? 1.0 : 1.15;
        translateX.value = 0;
        translateY.value = 0;

        // Target values
        const targetScale = zoomIn ? 1.15 : 1.0;

        // Animate
        opacity.value = withTiming(1, { duration: 800 });
        scale.value = withTiming(targetScale, { duration: DURATION });
        translateX.value = withTiming(randomX, { duration: DURATION });
        translateY.value = withTiming(randomY, { duration: DURATION });

        const timer = setTimeout(() => {
            // Animate Out
            opacity.value = withTiming(0, { duration: 800 }, (finished) => {
                if (finished) {
                    runOnJS(nextSlide)();
                }
            });
        }, DURATION - 800);

        return () => clearTimeout(timer);
    }, [currentIndex, event]);

    const nextSlide = () => {
        if (event && event.images) {
            if (currentIndex < event.images.length - 1) {
                setCurrentIndex(prev => prev + 1);
            } else {
                // End of slideshow
                handleFinish();
            }
        }
    };

    const animatedStyle = useAnimatedStyle(() => {
        return {
            opacity: opacity.value,
            transform: [
                { scale: scale.value },
                { translateX: translateX.value },
                { translateY: translateY.value }
            ]
        };
    });

    if (!event) return <View style={styles.container} />;

    const currentImage = event.images?.[currentIndex];

    const imageUri = currentImage
        ? (typeof currentImage === 'string'
            ? currentImage
            : (currentImage.local || currentImage.remote))
        : null;

    return (
        <View style={styles.container}>
            <StatusBar hidden />

            {/* Main Image Layer */}
            {imageUri && (
                <Animated.View style={[styles.imageContainer, animatedStyle]}>
                    <Image
                        source={{ uri: imageUri }}
                        style={styles.image}
                        resizeMode="cover"
                    />
                    {/* Blurred Background for portrait images on landscape or vice versa if needed
                         For now, 'cover' fills screen.
                     */}
                </Animated.View>
            )}

            {/* Overlay UI */}
            <View style={styles.overlay}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleFinish} style={styles.closeButton}>
                        <Feather name="x" size={24} color="white" />
                    </TouchableOpacity>
                    <View style={styles.progressContainer}>
                        {event.images?.map((_, idx) => (
                            <View
                                key={idx}
                                style={[
                                    styles.progressBar,
                                    { backgroundColor: idx === currentIndex ? 'white' : 'rgba(255,255,255,0.2)' }
                                ]}
                            />
                        ))}
                    </View>
                </View>

                {/* Bottom Text Info */}
                <View style={styles.footer}>
                    <Text style={styles.title}>{event.title}</Text>
                    <Text style={styles.date}>
                        {new Date(event.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                    </Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageContainer: {
        width: width,
        height: height,
        position: 'absolute',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'space-between',
        paddingVertical: 40,
        paddingHorizontal: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressContainer: {
        flex: 1,
        flexDirection: 'row',
        gap: 4,
        height: 3,
    },
    progressBar: {
        flex: 1,
        height: '100%',
        borderRadius: 2,
    },
    footer: {
        paddingBottom: 20,
    },
    title: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
        fontFamily: "Outfit-Bold"
    },
    date: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        fontFamily: "Outfit-Medium"
    }
});
