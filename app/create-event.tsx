import { CachedImage } from '@/components/CachedImage';
import { AestheticDatePicker, AestheticTimePicker } from '@/components/DateTimePicker';
import { FullScreenLoader } from '@/components/FullScreenLoader';
import { ImageModal } from '@/components/ImageModal';
import { useEventStore } from '@/store/eventStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { useThemeStore } from '@/store/themeStore';
import { scheduleEventNotifications } from '@/utils/notifications';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Alert, LayoutAnimation, Platform, ScrollView, Switch, Text, TextInput, TouchableOpacity, UIManager, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

export default function CreateEvent() {
    const router = useRouter();
    const currentTheme = useThemeStore((state) => state.currentTheme);
    const addEvent = useEventStore((state) => state.addEvent);
    const isPro = useSubscriptionStore((state) => state.isPro);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(new Date());
    const [isTimeCapsule, setIsTimeCapsule] = useState(false);

    // Independent visibility states
    const [datePickerVisible, setDatePickerVisible] = useState(false);
    const [timePickerVisible, setTimePickerVisible] = useState(false);

    // Image states
    const [selectedImages, setSelectedImages] = useState<string[]>([]);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const handleDateSelect = (newDate: Date) => {
        // Keep the existing time when changing date
        const updatedDate = new Date(newDate);
        updatedDate.setHours(date.getHours());
        updatedDate.setMinutes(date.getMinutes());
        setDate(updatedDate);
    };

    const handleTimeSelect = (newDate: Date) => {
        setDate(newDate);
    };
    const [loading, setLoading] = useState(false);

    const pickImage = async () => {
        if (!isPro) {
            router.push('/subscription');
            return;
        }

        if (selectedImages.length >= 4) {
            Alert.alert("Limit Reached", "You can only add up to 4 photos.");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            selectionLimit: 4 - selectedImages.length,
            quality: 0.8,
        });

        if (!result.canceled) {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            const newUris = result.assets.map(asset => asset.uri);
            setSelectedImages(prev => [...prev, ...newUris].slice(0, 4));
        }
    };

    const removeImage = (index: number) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        if (!title.trim()) {
            Alert.alert("Missing Info", "Please enter a title for your special day.");
            return;
        }

        try {
            setLoading(true);
            const newEventId = await addEvent({
                title: title.trim(),
                description: description.trim(),
                date: date.toISOString(),
                images: selectedImages,
                isTimeCapsule: isTimeCapsule,
            });

            if (newEventId) {
                await scheduleEventNotifications(newEventId, title.trim(), date.toISOString(), isTimeCapsule);
            }

            router.back();
        } catch (error: any) {
            if (error.message && error.message.includes("Limit Reached")) {
                // User requirement: Open subscription modal (page) directly if limit reached
                router.push('/subscription');
            } else {
                Alert.alert("Error", "Failed to save memory. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={{ backgroundColor: currentTheme.colors.background }} className="flex-1">
            <StatusBar style="light" />

            {loading && <FullScreenLoader />}

            <View className="flex-row justify-between items-center px-6 pt-12 pb-4 border-b border-white/5">
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={{ color: currentTheme.colors.text.secondary }} className="text-lg font-[Outfit-Medium]">Cancel</Text>
                </TouchableOpacity>
                <Text style={{ color: currentTheme.colors.text.primary, fontFamily: 'Outfit-Bold' }} className="text-xl">New Memory</Text>
                <TouchableOpacity onPress={handleSave} disabled={loading}>
                    <Text style={{ color: loading ? currentTheme.colors.text.secondary : currentTheme.colors.primary, fontFamily: 'Outfit-Bold' }} className="text-lg">Save</Text>
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 px-6 pt-6">
                <Animated.View entering={FadeInDown.delay(200).springify()} className="space-y-6 gap-6">

                    {/* Time Capsule Toggle */}
                    <View className="flex-row items-center justify-between p-4 rounded-2xl border" style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}>
                        <View className="flex-row items-center gap-3">
                            <View className="w-10 h-10 rounded-full bg-indigo-500/20 items-center justify-center">
                                <Feather name="lock" size={20} color={isTimeCapsule ? "#818cf8" : "rgba(255,255,255,0.5)"} />
                            </View>
                            <View>
                                <Text style={{ color: currentTheme.colors.text.primary, fontFamily: 'Outfit-Bold' }} className="text-base">Time Capsule</Text>
                                <Text style={{ color: currentTheme.colors.text.secondary, fontFamily: 'Outfit-Regular' }} className="text-xs">Lock this memory until the date</Text>
                            </View>
                        </View>
                        <Switch
                            value={isTimeCapsule}
                            onValueChange={setIsTimeCapsule}
                            trackColor={{ false: '#333', true: '#4f46e5' }}
                            thumbColor={isTimeCapsule ? '#fff' : '#f4f3f4'}
                        />
                    </View>

                    {/* Title Input */}
                    <View>
                        <Text style={{ color: currentTheme.colors.text.secondary, fontFamily: 'Outfit-Bold' }} className="text-xs uppercase tracking-widest mb-3">Title</Text>
                        <TextInput
                            value={title}
                            onChangeText={setTitle}
                            placeholder="Anniversary, Birthday..."
                            placeholderTextColor={currentTheme.colors.text.secondary}
                            style={{
                                color: currentTheme.colors.text.primary,
                                backgroundColor: 'rgba(255,255,255,0.03)',
                                borderColor: 'rgba(255,255,255,0.08)',
                                fontFamily: 'Outfit-Medium'
                            }}
                            className="p-5 rounded-2xl border text-lg"
                        />
                    </View>

                    {/* Description Input */}
                    <View>
                        <Text style={{ color: currentTheme.colors.text.secondary, fontFamily: 'Outfit-Bold' }} className="text-xs uppercase tracking-widest mb-3">Description</Text>
                        <TextInput
                            value={description}
                            onChangeText={setDescription}
                            placeholder="Add a sweet note..."
                            placeholderTextColor={currentTheme.colors.text.secondary}
                            style={{
                                color: currentTheme.colors.text.primary,
                                backgroundColor: 'rgba(255,255,255,0.03)',
                                borderColor: 'rgba(255,255,255,0.08)',
                                fontFamily: 'Outfit-Regular'
                            }}
                            className="p-5 rounded-2xl border text-base h-28"
                            multiline
                            textAlignVertical="top"
                        />
                    </View>

                    {/* Date & Time Selection */}
                    <View>
                        <Text style={{ color: currentTheme.colors.text.secondary, fontFamily: 'Outfit-Bold' }} className="text-xs uppercase tracking-widest mb-3">
                            {isTimeCapsule ? "Opening Date" : "When"}
                        </Text>
                        <View className="flex-row gap-4">
                            <TouchableOpacity
                                onPress={() => setDatePickerVisible(true)}
                                style={{
                                    backgroundColor: 'rgba(255,255,255,0.03)',
                                    borderColor: 'rgba(255,255,255,0.08)'
                                }}
                                className="flex-1 p-5 rounded-2xl border items-start active:bg-white/5"
                            >
                                <View className="flex-row items-center mb-2 opacity-50">
                                    <Feather name="calendar" size={14} color="white" />
                                    <Text style={{ color: currentTheme.colors.text.secondary, fontFamily: 'Outfit-Medium' }} className="text-xs ml-2 uppercase">
                                        {isTimeCapsule ? "Unlock Date" : "Date"}
                                    </Text>
                                </View>
                                <Text style={{ color: currentTheme.colors.text.primary, fontFamily: 'Outfit-Bold' }} className="text-xl">
                                    {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => setTimePickerVisible(true)}
                                style={{
                                    backgroundColor: 'rgba(255,255,255,0.03)',
                                    borderColor: 'rgba(255,255,255,0.08)'
                                }}
                                className="flex-1 p-5 rounded-2xl border items-start active:bg-white/5"
                            >
                                <View className="flex-row items-center mb-2 opacity-50">
                                    <Feather name="clock" size={14} color="white" />
                                    <Text style={{ color: currentTheme.colors.text.secondary, fontFamily: 'Outfit-Medium' }} className="text-xs ml-2 uppercase">
                                        {isTimeCapsule ? "Unlock Time" : "Time"}
                                    </Text>
                                </View>
                                <Text style={{ color: currentTheme.colors.text.primary, fontFamily: 'Outfit-Bold' }} className="text-xl">
                                    {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Photos Selection */}
                    <View>
                        <View className="flex-row justify-between items-center mb-3">
                            <Text style={{ color: currentTheme.colors.text.secondary, fontFamily: 'Outfit-Bold' }} className="text-xs uppercase tracking-widest">Photos ({selectedImages.length}/4)</Text>
                            {selectedImages.length < 4 && (
                                <TouchableOpacity onPress={pickImage}>
                                    <Text style={{ color: currentTheme.colors.primary, fontFamily: 'Outfit-Bold' }} className="text-xs uppercase tracking-widest">+ Add</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        <View className="flex-row flex-wrap gap-2 justify-center">
                            {selectedImages.map((uri, index) => (
                                <View key={index} className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/10">
                                    <TouchableOpacity onPress={() => setPreviewImage(uri)} activeOpacity={0.8}>
                                        <CachedImage source={uri} className="w-full h-full" resizeMode="cover" />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => removeImage(index)}
                                        className="absolute top-1 right-1 bg-black/50 rounded-full p-1"
                                    >
                                        <Feather name="x" size={12} color="white" />
                                    </TouchableOpacity>
                                </View>
                            ))}

                            {selectedImages.length === 0 && (
                                <TouchableOpacity
                                    onPress={pickImage}
                                    style={{ borderStyle: 'dashed' }}
                                    className="w-full h-24 rounded-2xl border-2 border-white/10 items-center justify-center bg-white/5"
                                >
                                    <Feather name="image" size={24} color="rgba(255,255,255,0.3)" />
                                    <Text style={{ fontFamily: 'Outfit-Medium' }} className="text-white/30 text-xs mt-2">Add up to 4 photos</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                </Animated.View>
            </ScrollView>

            <View className="p-6 border-t border-white/5">
                <TouchableOpacity
                    onPress={handleSave}
                    disabled={loading}
                    style={{ backgroundColor: currentTheme.colors.primary }}
                    className="w-full py-4 rounded-2xl items-center shadow-lg shadow-white/10"
                >
                    <Text style={{ color: currentTheme.colors.background, fontFamily: 'Outfit-Bold' }} className="text-lg tracking-wide">Save Memory</Text>
                </TouchableOpacity>
            </View>

            {/* Custom Modals */}
            <AestheticDatePicker
                visible={datePickerVisible}
                onClose={() => setDatePickerVisible(false)}
                onSelect={handleDateSelect}
                currentDate={date}
            />

            <AestheticTimePicker
                visible={timePickerVisible}
                onClose={() => setTimePickerVisible(false)}
                onSelect={handleTimeSelect}
                currentDate={date}
            />

            <ImageModal
                visible={!!previewImage}
                imageUri={previewImage}
                onClose={() => setPreviewImage(null)}
            />
        </View>
    );
}
