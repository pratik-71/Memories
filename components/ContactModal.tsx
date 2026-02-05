import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { supabase } from '../lib/supabase';

interface ContactModalProps {
    visible: boolean;
    onClose: () => void;
}

export default function ContactModal({ visible, onClose }: ContactModalProps) {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        // Validation
        if (!fullName.trim()) {
            Alert.alert('Error', 'Please enter your full name');
            return;
        }

        if (!email.trim()) {
            Alert.alert('Error', 'Please enter your email');
            return;
        }

        if (!message.trim()) {
            Alert.alert('Error', 'Please enter your message');
            return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            Alert.alert('Error', 'Please enter a valid email address');
            return;
        }

        setIsSubmitting(true);

        try {
            const { error } = await supabase
                .from('feedbacks')
                .insert([
                    {
                        full_name: fullName.trim(),
                        email: email.trim(),
                        message: message.trim(),
                        created_at: new Date().toISOString()
                    }
                ]);

            if (error) {
                throw error;
            }

            Alert.alert(
                'Success!',
                'Thank you for your feedback. We\'ll get back to you soon!',
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            // Reset form
                            setFullName('');
                            setEmail('');
                            setMessage('');
                            onClose();
                        }
                    }
                ]
            );
        } catch (error: any) {
            console.error('Contact form error:', error);
            Alert.alert('Error', 'Failed to submit your feedback. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="fullScreen"
        >
            <View style={{ backgroundColor: '#000000' }} className="flex-1">
                {/* Header */}
                <View className="flex-row items-center justify-between px-6 pt-12 pb-4">
                    <TouchableOpacity
                        onPress={onClose}
                        className="w-10 h-10 rounded-full bg-white/5 items-center justify-center active:bg-white/10"
                    >
                        <Feather name="x" size={24} color="white" />
                    </TouchableOpacity>
                    <Text style={{ color: 'white', fontFamily: 'Outfit-Bold' }} className="text-3xl">
                        Contact Us
                    </Text>
                    <View className="w-10" />
                </View>

                <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 }}>
                    {/* Form Content */}
                    <Animated.View
                        entering={FadeInDown.delay(200).springify()}
                        className="mt-8"
                    >
                        {/* Full Name Input */}
                        <View className="mb-6">
                            <Text style={{ color: 'rgba(255,255,255,0.8)', fontFamily: 'Outfit-Medium' }} className="text-sm mb-2 uppercase tracking-wider">
                                Full Name
                            </Text>
                            <TextInput
                                value={fullName}
                                onChangeText={setFullName}
                                placeholder="Enter your full name"
                                placeholderTextColor="rgba(255,255,255,0.3)"
                                maxLength={15}
                                style={{
                                    backgroundColor: 'rgba(255,255,255,0.05)',
                                    borderColor: 'rgba(255,255,255,0.1)',
                                    color: 'white',
                                    fontFamily: 'Outfit-Regular'
                                }}
                                className="w-full p-4 rounded-2xl border text-base"
                                selectionColor="#white"
                            />
                        </View>

                        {/* Email Input */}
                        <View className="mb-6">
                            <Text style={{ color: 'rgba(255,255,255,0.8)', fontFamily: 'Outfit-Medium' }} className="text-sm mb-2 uppercase tracking-wider">
                                Email Address
                            </Text>
                            <TextInput
                                value={email}
                                onChangeText={setEmail}
                                placeholder="Enter your email address"
                                placeholderTextColor="rgba(255,255,255,0.3)"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                maxLength={50}
                                style={{
                                    backgroundColor: 'rgba(255,255,255,0.05)',
                                    borderColor: 'rgba(255,255,255,0.1)',
                                    color: 'white',
                                    fontFamily: 'Outfit-Regular'
                                }}
                                className="w-full p-4 rounded-2xl border text-base"
                                selectionColor="#white"
                            />
                        </View>

                        {/* Message Input */}
                        <View className="mb-8">
                            <Text style={{ color: 'rgba(255,255,255,0.8)', fontFamily: 'Outfit-Medium' }} className="text-sm mb-2 uppercase tracking-wider">
                                Message
                            </Text>
                            <TextInput
                                value={message}
                                onChangeText={setMessage}
                                placeholder="Tell us what's on your mind..."
                                placeholderTextColor="rgba(255,255,255,0.3)"
                                multiline
                                numberOfLines={6}
                                textAlignVertical="top"
                                maxLength={5000}
                                style={{
                                    backgroundColor: 'rgba(255,255,255,0.05)',
                                    borderColor: 'rgba(255,255,255,0.1)',
                                    color: 'white',
                                    fontFamily: 'Outfit-Regular',
                                    minHeight: 120
                                }}
                                className="w-full p-4 rounded-2xl border text-base"
                                selectionColor="#white"
                            />
                        </View>

                        {/* Additional Info */}
                        <Animated.View
                            entering={FadeInDown.delay(600).springify()}
                            className="mt-8 items-center"
                        >
                            <View className="flex-row items-center gap-2 mb-2">
                                <Feather name="info" size={16} color="rgba(255,255,255,0.4)" />
                                <Text style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Outfit-Medium' }} className="text-sm">
                                    We typically respond within 24-48 hours
                                </Text>
                            </View>
                            <Text style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Outfit-Regular' }} className="text-xs text-center">
                                Your feedback helps us improve Memories for everyone
                            </Text>
                        </Animated.View>
                    </Animated.View>
                </ScrollView>

                {/* Floating Submit Button */}
                <Animated.View
                    entering={FadeInDown.delay(400).springify()}
                    style={{
                        backgroundColor: '#000000',
                        borderTopWidth: 1,
                        borderTopColor: 'rgba(255,255,255,0.1)',
                    }}
                    className="absolute bottom-0 w-full px-6 py-6 pb-10"
                >
                    <TouchableOpacity
                        onPress={handleSubmit}
                        disabled={isSubmitting}
                        style={{
                            backgroundColor: isSubmitting ? 'rgba(255,255,255,0.2)' : 'white'
                        }}
                        className="w-full py-4 rounded-2xl items-center shadow-lg shadow-black/50"
                    >
                        <Text 
                            style={{ 
                                color: isSubmitting ? 'rgba(255,255,255,0.5)' : 'black', 
                                fontFamily: 'Outfit-Bold' 
                            }} 
                            className="text-base font-bold tracking-wide"
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                        </Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </Modal>
    );
}
