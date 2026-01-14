import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming
} from 'react-native-reanimated';

export const FullScreenLoader = () => {

    // Scale Values
    const scale1 = useSharedValue(1);
    const scale2 = useSharedValue(1);

    // Opacity Values
    const opacity1 = useSharedValue(0.5);
    const opacity2 = useSharedValue(0.3);

    useEffect(() => {
        // Pulse Effect 1 (Inner)
        scale1.value = withRepeat(
            withSequence(
                withTiming(1.5, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
                withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );
        opacity1.value = withRepeat(
            withSequence(
                withTiming(0.2, { duration: 1500 }),
                withTiming(0.5, { duration: 1500 })
            ),
            -1,
            true
        );

        // Pulse Effect 2 (Outer - delayed)
        setTimeout(() => {
            scale2.value = withRepeat(
                withSequence(
                    withTiming(2, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
                    withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
                ),
                -1,
                true
            );
            opacity2.value = withRepeat(
                withSequence(
                    withTiming(0.1, { duration: 2000 }),
                    withTiming(0.3, { duration: 2000 })
                ),
                -1,
                true
            );
        }, 500);

    }, []);

    const animatedStyle1 = useAnimatedStyle(() => ({
        transform: [{ scale: scale1.value }],
        opacity: opacity1.value
    }));

    const animatedStyle2 = useAnimatedStyle(() => ({
        transform: [{ scale: scale2.value }],
        opacity: opacity2.value
    }));

    return (
        <View style={styles.container}>
            <View style={styles.animationContainer}>
                {/* Center Core */}
                <View style={styles.core} />

                {/* Pulsing Rings */}
                <Animated.View style={[styles.ring, { width: 100, height: 100, borderRadius: 50 }, animatedStyle1]} />
                <Animated.View style={[styles.ring, { width: 150, height: 150, borderRadius: 75 }, animatedStyle2]} />
            </View>

            <Text style={styles.text}>MEMORISING...</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#000000', // Deep Black
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
    },
    animationContainer: {
        width: 200,
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    core: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: 'white',
        zIndex: 10,
    },
    ring: {
        position: 'absolute',
        borderWidth: 1,
        borderColor: 'white',
        backgroundColor: 'rgba(255,255,255,0.05)',
        zIndex: 0,
    },
    text: {
        marginTop: 20,
        color: 'white',
        fontFamily: 'Outfit-Bold',
        letterSpacing: 6,
        fontSize: 14,
        opacity: 0.8
    }
});
