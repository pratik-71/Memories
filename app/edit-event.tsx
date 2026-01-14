import { AestheticDatePicker, AestheticTimePicker } from '@/components/DateTimePicker';
import { FullScreenLoader } from '@/components/FullScreenLoader';
import { ImageModal } from '@/components/ImageModal';
import { useEventStore } from '@/store/eventStore';
import { useThemeStore } from '@/store/themeStore';
import { cancelEventNotifications, scheduleEventNotifications } from '@/utils/notifications';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Alert, Image, LayoutAnimation, Platform, ScrollView, Text, TextInput, TouchableOpacity, UIManager, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

export default function EditEvent() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const currentTheme = useThemeStore((state) => state.currentTheme);
    const { events, updateEvent } = useEventStore();

    // Find the event to edit
    const eventToEdit = events.find(e => e.id === id);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(new Date());

    // Independent visibility states
    const [datePickerVisible, setDatePickerVisible] = useState(false);
    const [timePickerVisible, setTimePickerVisible] = useState(false);

    // Image states
    const [selectedImages, setSelectedImages] = useState<string[]>([]);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    // Initialize state when event is found
    useEffect(() => {
        if (eventToEdit) {
            setTitle(eventToEdit.title);
            setDescription(eventToEdit.description || '');
            setDate(new Date(eventToEdit.date));
            setSelectedImages(eventToEdit.images || []);
        }
    }, [eventToEdit]);

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

    const pickImage = async () => {
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

    const [loading, setLoading] = useState(false);

    const handleUpdate = async () => {
        if (!title.trim()) {
            Alert.alert("Missing Info", "Please enter a title.");
            return;
        }

        if (typeof id === 'string') {
            try {
                setLoading(true);
                await updateEvent(id, {
                    title: title.trim(),
                    description: description.trim(),
                    date: date.toISOString(),
                    images: selectedImages,
                });

                // Reschedule notifications
                await cancelEventNotifications(id);
                // Preserve original isTimeCapsule state if it exists
                await scheduleEventNotifications(id, title.trim(), date.toISOString(), eventToEdit?.isTimeCapsule || false);

                router.back();
            } catch (error: any) {
                Alert.alert("Error", error.message);
            } finally {
                setLoading(false);
            }
        }
    };

    if (!eventToEdit) return null;

    return (
        <View style={{ backgroundColor: currentTheme.colors.background }} className="flex-1">
            <StatusBar style="light" />
            {loading && <FullScreenLoader />}

            <View className="flex-row justify-between items-center px-6 pt-12 pb-4 border-b border-white/5">
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={{ color: currentTheme.colors.text.secondary }} className="text-lg">Cancel</Text>
                </TouchableOpacity>
                <Text style={{ color: currentTheme.colors.text.primary }} className="text-xl font-bold">Edit Memory</Text>
                <TouchableOpacity onPress={handleUpdate}>
                    <Text style={{ color: currentTheme.colors.primary }} className="text-lg font-bold">Update</Text>
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 px-6 pt-6">
                <Animated.View entering={FadeInDown.delay(200).springify()} className="space-y-6 gap-4">

                    <View>
                        <Text style={{ color: currentTheme.colors.text.secondary }} className="text-sm font-bold uppercase mb-2">Title</Text>
                        <TextInput
                            value={title}
                            onChangeText={setTitle}
                            style={{
                                color: currentTheme.colors.text.primary,
                                backgroundColor: 'rgba(255,255,255,0.05)',
                                borderColor: 'rgba(255,255,255,0.1)'
                            }}
                            className="p-4 rounded-xl border text-lg"
                        />
                    </View>

                    <View>
                        <Text style={{ color: currentTheme.colors.text.secondary }} className="text-sm font-bold uppercase mb-2">Description</Text>
                        <TextInput
                            value={description}
                            onChangeText={setDescription}
                            style={{
                                color: currentTheme.colors.text.primary,
                                backgroundColor: 'rgba(255,255,255,0.05)',
                                borderColor: 'rgba(255,255,255,0.1)'
                            }}
                            className="p-4 rounded-xl border text-base h-24"
                            multiline
                            textAlignVertical="top"
                        />
                    </View>

                    <View>
                        <Text style={{ color: currentTheme.colors.text.secondary }} className="text-sm font-bold uppercase mb-2">When</Text>
                        <View className="flex-row gap-4">
                            <TouchableOpacity
                                onPress={() => setDatePickerVisible(true)}
                                style={{
                                    backgroundColor: 'rgba(255,255,255,0.05)',
                                    borderColor: 'rgba(255,255,255,0.1)'
                                }}
                                className="flex-1 p-4 rounded-xl border items-center"
                            >
                                <Text style={{ color: currentTheme.colors.text.secondary }} className="text-xs mb-1">Date</Text>
                                <Text style={{ color: currentTheme.colors.text.primary }} className="text-lg font-bold">
                                    {date.toLocaleDateString()}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => setTimePickerVisible(true)}
                                style={{
                                    backgroundColor: 'rgba(255,255,255,0.05)',
                                    borderColor: 'rgba(255,255,255,0.1)'
                                }}
                                className="flex-1 p-4 rounded-xl border items-center"
                            >
                                <Text style={{ color: currentTheme.colors.text.secondary }} className="text-xs mb-1">Time</Text>
                                <Text style={{ color: currentTheme.colors.text.primary }} className="text-lg font-bold">
                                    {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Photos Selection */}
                    <View>
                        <View className="flex-row justify-between items-center mb-3">
                            <Text style={{ color: currentTheme.colors.text.secondary }} className="text-sm font-bold uppercase">Photos ({selectedImages.length}/4)</Text>
                            {selectedImages.length < 4 && (
                                <TouchableOpacity onPress={pickImage}>
                                    <Text style={{ color: currentTheme.colors.primary }} className="text-sm font-bold uppercase">+ Add</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        <View className="flex-row flex-wrap gap-2 justify-center">
                            {selectedImages.map((uri, index) => (
                                <View key={index} className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/10">
                                    <TouchableOpacity onPress={() => setPreviewImage(uri)} activeOpacity={0.8}>
                                        <Image source={{ uri }} className="w-full h-full" resizeMode="cover" />
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
                    onPress={handleUpdate}
                    style={{ backgroundColor: currentTheme.colors.button.primary }}
                    className="w-full py-4 rounded-xl items-center"
                >
                    <Text style={{ color: currentTheme.colors.background }} className="font-bold text-lg">Update Memory</Text>
                </TouchableOpacity>
            </View>

            <ImageModal
                visible={!!previewImage}
                imageUri={previewImage}
                onClose={() => setPreviewImage(null)}
            />

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
        </View>
    );
}
