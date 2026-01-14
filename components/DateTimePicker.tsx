import { Feather } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { FlatList, Modal, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';

interface DatePickerProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (date: Date) => void;
    currentDate: Date;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const AestheticDatePicker = ({ visible, onClose, onSelect, currentDate }: DatePickerProps) => {
    const [selectedDate, setSelectedDate] = useState(currentDate);
    const [viewDate, setViewDate] = useState(currentDate);
    const [mode, setMode] = useState<'calendar' | 'year' | 'month'>('calendar');

    useEffect(() => {
        if (visible) {
            setSelectedDate(currentDate);
            setViewDate(currentDate);
            setMode('calendar');
        }
    }, [visible]);

    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const changeMonth = (increment: number) => {
        const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + increment, 1);
        setViewDate(newDate);
    };

    const handleDayPress = (day: number) => {
        const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
        newDate.setHours(selectedDate.getHours());
        newDate.setMinutes(selectedDate.getMinutes());
        setSelectedDate(newDate);
    };

    const handleConfirm = () => {
        onSelect(selectedDate);
        onClose();
    };

    const renderCalendarDays = () => {
        const daysInMonth = getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth());
        const firstDay = getFirstDayOfMonth(viewDate.getFullYear(), viewDate.getMonth());
        const days = [];

        for (let i = 0; i < firstDay; i++) {
            days.push(<View key={`empty-${i}`} style={{ width: '14.28%', aspectRatio: 1 }} />);
        }

        for (let i = 1; i <= daysInMonth; i++) {
            const isSelected =
                selectedDate.getDate() === i &&
                selectedDate.getMonth() === viewDate.getMonth() &&
                selectedDate.getFullYear() === viewDate.getFullYear();

            const isToday =
                new Date().getDate() === i &&
                new Date().getMonth() === viewDate.getMonth() &&
                new Date().getFullYear() === viewDate.getFullYear();

            days.push(
                <TouchableOpacity
                    key={i}
                    onPress={() => handleDayPress(i)}
                    activeOpacity={0.7}
                    style={{ width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center' }}
                >
                    <View
                        style={{
                            width: 32, height: 32, borderRadius: 16,
                            alignItems: 'center', justifyContent: 'center',
                            backgroundColor: isSelected ? 'white' : 'transparent',
                            borderWidth: isToday && !isSelected ? 1 : 0,
                            borderColor: 'white'
                        }}
                    >
                        <Text style={{
                            fontFamily: isSelected ? 'Outfit-Bold' : 'Outfit-Medium',
                            color: isSelected ? 'black' : 'white'
                        }}>
                            {i}
                        </Text>
                    </View>
                </TouchableOpacity>
            );
        }

        return days;
    };

    if (!visible) return null;

    return (
        <Modal transparent visible={visible} animationType="none" onRequestClose={onClose} statusBarTranslucent>
            {/* Main container fills screen, keeps content at bottom */}
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
                <TouchableWithoutFeedback onPress={onClose}>
                    <View style={{ flex: 1 }} />
                </TouchableWithoutFeedback>

                <Animated.View
                    entering={SlideInDown.duration(200)}
                    exiting={SlideOutDown.duration(200)}
                    style={{
                        width: '100%',
                        // Do NOT clip overflow here so the skirt can hang down
                        overflow: 'visible',
                    }}
                >
                    {/* The Visible Modal Card */}
                    <View style={{
                        backgroundColor: '#18181b',
                        borderTopLeftRadius: 24,
                        borderTopRightRadius: 24,
                        borderTopWidth: 1,
                        borderColor: 'rgba(255,255,255,0.1)',
                        paddingBottom: 24, // Internal padding for content
                    }}>
                        <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 8 }}>
                            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)' }} />
                        </View>

                        <View style={{ padding: 24, paddingTop: 0 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                                <View>
                                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontFamily: 'Outfit-Medium', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Select Date</Text>
                                    <Text style={{ color: 'white', fontSize: 24, fontFamily: 'Outfit-Bold' }}>
                                        {selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                    </Text>
                                </View>
                                <TouchableOpacity onPress={handleConfirm} style={{ backgroundColor: 'white', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 100 }}>
                                    <Text style={{ color: 'black', fontFamily: 'Outfit-Bold' }}>Done</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                {mode === 'calendar' && (
                                    <TouchableOpacity onPress={() => changeMonth(-1)} style={{ padding: 8 }}>
                                        <Feather name="chevron-left" size={24} color="white" />
                                    </TouchableOpacity>
                                )}
                                <View className="flex-row items-center gap-2" style={{ flex: 1, justifyContent: 'center' }}>
                                    <TouchableOpacity onPress={() => setMode(mode === 'month' ? 'calendar' : 'month')}>
                                        <Text style={{
                                            color: mode === 'month' ? '#fff' : 'rgba(255,255,255,0.7)',
                                            fontSize: 18,
                                            fontFamily: 'Outfit-Bold',
                                            textDecorationLine: mode === 'month' ? 'underline' : 'none'
                                        }}>
                                            {MONTHS[viewDate.getMonth()]}
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => setMode(mode === 'year' ? 'calendar' : 'year')}>
                                        <Text style={{
                                            color: mode === 'year' ? '#fff' : 'rgba(255,255,255,0.7)',
                                            fontSize: 18,
                                            fontFamily: 'Outfit-Bold',
                                            textDecorationLine: mode === 'year' ? 'underline' : 'none'
                                        }}>
                                            {viewDate.getFullYear()}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                {mode === 'calendar' && (
                                    <TouchableOpacity onPress={() => changeMonth(1)} style={{ padding: 8 }}>
                                        <Feather name="chevron-right" size={24} color="white" />
                                    </TouchableOpacity>
                                )}
                            </View>

                            <View style={{ height: 320 }}>
                                {mode === 'calendar' && (
                                    <>
                                        <View style={{ flexDirection: 'row', marginBottom: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', paddingBottom: 8 }}>
                                            {DAYS.map(day => (
                                                <Text key={day} style={{ width: '14.28%', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 12, fontFamily: 'Outfit-Medium' }}>
                                                    {day}
                                                </Text>
                                            ))}
                                        </View>
                                        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                                            {renderCalendarDays()}
                                        </View>
                                    </>
                                )}

                                {mode === 'month' && (
                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingVertical: 20 }}>
                                        {MONTHS.map((month, index) => (
                                            <TouchableOpacity
                                                key={month}
                                                style={{ width: '30%', paddingVertical: 12, alignItems: 'center', marginBottom: 12, borderRadius: 12, backgroundColor: viewDate.getMonth() === index ? 'white' : 'rgba(255,255,255,0.05)' }}
                                                onPress={() => {
                                                    const newDate = new Date(viewDate.getFullYear(), index, 1);
                                                    setViewDate(newDate);
                                                    setMode('calendar');
                                                }}
                                            >
                                                <Text style={{ fontFamily: 'Outfit-Bold', color: viewDate.getMonth() === index ? 'black' : 'white' }}>{month.substring(0, 3)}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}

                                {mode === 'year' && (
                                    <View style={{ flex: 1 }}>
                                        <FlatList
                                            data={Array.from({ length: 200 }, (_, i) => 1900 + i).reverse()}
                                            keyExtractor={(item) => item.toString()}
                                            getItemLayout={(data, index) => (
                                                { length: 60, offset: 60 * index, index }
                                            )}
                                            showsVerticalScrollIndicator={false}
                                            initialScrollIndex={2099 - viewDate.getFullYear()} // Keep this, it should be fast
                                            maxToRenderPerBatch={10}
                                            windowSize={5}
                                            renderItem={({ item }) => (
                                                <TouchableOpacity
                                                    style={{ height: 60, justifyContent: 'center', alignItems: 'center', backgroundColor: viewDate.getFullYear() === item ? 'rgba(255,255,255,0.1)' : 'transparent', borderRadius: 8 }}
                                                    onPress={() => {
                                                        const newDate = new Date(item, viewDate.getMonth(), 1);
                                                        setViewDate(newDate);
                                                        setMode('calendar');
                                                    }}
                                                >
                                                    <Text style={{ fontFamily: 'Outfit-Bold', fontSize: 18, color: viewDate.getFullYear() === item ? '#fff' : 'rgba(255,255,255,0.4)' }}>
                                                        {item}
                                                    </Text>
                                                </TouchableOpacity>
                                            )}
                                        />
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>

                    {/* The "Skirt" - Only this part hangs down into the safe area/nav bar area */}
                    <View style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        height: 500, // Massive height to cover any possible gap
                        backgroundColor: '#18181b', // Matches modal background
                        marginTop: -1 // 1px overlap to prevent hairline cracks
                    }} />
                </Animated.View>
            </View>
        </Modal>
    );
};

interface TimePickerProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (date: Date) => void;
    currentDate: Date;
}

export const AestheticTimePicker = ({ visible, onClose, onSelect, currentDate }: TimePickerProps) => {
    const [tempHour, setTempHour] = useState(12);
    const [tempMinute, setTempMinute] = useState(0);
    const [tempPeriod, setTempPeriod] = useState<'AM' | 'PM'>('AM');

    useEffect(() => {
        if (visible) {
            let h = currentDate.getHours();
            const m = currentDate.getMinutes();
            const p = h >= 12 ? 'PM' : 'AM';

            h = h % 12;
            h = h ? h : 12;

            setTempHour(h);
            setTempMinute(m);
            setTempPeriod(p);
        }
    }, [visible, currentDate]);

    const handleConfirm = () => {
        let h = tempHour;
        const m = tempMinute;

        if (tempPeriod === 'PM' && h !== 12) h += 12;
        if (tempPeriod === 'AM' && h === 12) h = 0;

        const newDate = new Date(currentDate);
        newDate.setHours(h);
        newDate.setMinutes(m);
        onSelect(newDate);
        onClose();
    };

    const hours = Array.from({ length: 12 }, (_, i) => i + 1);
    const minutes = Array.from({ length: 60 }, (_, i) => i);
    const periods = ['AM', 'PM'];

    const ITEM_HEIGHT = 65;
    const CONTAINER_HEIGHT = 280;
    const PADDING_VERTICAL = (CONTAINER_HEIGHT - ITEM_HEIGHT) / 2;

    const onScroll = (e: any, setSetter: (val: any) => void, data: any[]) => {
        const offsetY = e.nativeEvent.contentOffset.y;
        const index = Math.round(offsetY / ITEM_HEIGHT);
        if (data[index] !== undefined) {
            setSetter(data[index]);
        }
    };

    const renderItem = ({ item, type }: { item: string | number; type: 'hour' | 'minute' | 'period' }) => {
        let isSelected = false;
        if (type === 'hour') isSelected = item === tempHour;
        if (type === 'minute') isSelected = item === tempMinute;
        if (type === 'period') isSelected = item === tempPeriod;

        const display = type === 'minute' || type === 'hour' ? item.toString().padStart(2, '0') : item;

        return (
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                    if (type === 'hour') setTempHour(item as number);
                    if (type === 'minute') setTempMinute(item as number);
                    if (type === 'period') setTempPeriod(item as 'AM' | 'PM');
                }}
                style={{ height: ITEM_HEIGHT, justifyContent: 'center', alignItems: 'center' }}
            >
                <Text style={{
                    color: isSelected ? 'white' : 'rgba(255,255,255,0.3)',
                    fontSize: isSelected ? 32 : 24,
                    fontFamily: 'Outfit-Bold'
                }}>
                    {display}
                </Text>
            </TouchableOpacity>
        );
    };

    if (!visible) return null;

    return (
        <Modal transparent visible={visible} animationType="none" onRequestClose={onClose} statusBarTranslucent>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
                <TouchableWithoutFeedback onPress={onClose}>
                    <View style={{ flex: 1 }} />
                </TouchableWithoutFeedback>

                <Animated.View
                    entering={SlideInDown.duration(200)}
                    exiting={SlideOutDown.duration(200)}
                    style={{
                        width: '100%',
                        overflow: 'visible', // Ensure Skirt is visible
                    }}
                >
                    <View style={{
                        backgroundColor: '#18181b',
                        borderTopLeftRadius: 24,
                        borderTopRightRadius: 24,
                        borderTopWidth: 1,
                        borderColor: 'rgba(255,255,255,0.1)',
                        paddingBottom: 24, // Internal padding
                    }}>
                        <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 8 }}>
                            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)' }} />
                        </View>

                        <View style={{ padding: 24, paddingTop: 0 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                                <View>
                                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontFamily: 'Outfit-Medium', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Select Time</Text>
                                    <Text style={{ color: 'white', fontSize: 28, fontFamily: 'Outfit-Bold' }}>
                                        {`${tempHour.toString().padStart(2, '0')}:${tempMinute.toString().padStart(2, '0')} ${tempPeriod}`}
                                    </Text>
                                </View>
                                <TouchableOpacity onPress={handleConfirm} style={{ backgroundColor: 'white', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 100 }}>
                                    <Text style={{ color: 'black', fontFamily: 'Outfit-Bold', fontSize: 16 }}>Done</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={{ height: CONTAINER_HEIGHT, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 24, overflow: 'hidden', position: 'relative' }}>
                                <View style={{ position: 'absolute', top: '50%', marginTop: -(ITEM_HEIGHT / 2), height: ITEM_HEIGHT, width: '100%', backgroundColor: 'rgba(255,255,255,0.08)', zIndex: 0 }} />

                                {/* Hours */}
                                <View style={{ flex: 1.2, height: '100%' }}>
                                    <FlatList
                                        data={hours}
                                        keyExtractor={item => `h-${item}`}
                                        showsVerticalScrollIndicator={false}
                                        snapToInterval={ITEM_HEIGHT}
                                        decelerationRate="fast"
                                        initialNumToRender={12}
                                        getItemLayout={(data, index) => (
                                            { length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index }
                                        )}
                                        contentContainerStyle={{ paddingVertical: PADDING_VERTICAL }}
                                        onScroll={(e) => onScroll(e, setTempHour, hours)}
                                        scrollEventThrottle={16}
                                        renderItem={({ item }) => renderItem({ item, type: 'hour' })}
                                    />
                                </View>

                                <View>
                                    <Text style={{ color: 'white', fontSize: 24, fontFamily: 'Outfit-Bold', paddingBottom: 4 }}>:</Text>
                                </View>

                                {/* Minutes */}
                                <View style={{ flex: 1.2, height: '100%' }}>
                                    <FlatList
                                        data={minutes}
                                        keyExtractor={item => `m-${item}`}
                                        showsVerticalScrollIndicator={false}
                                        snapToInterval={ITEM_HEIGHT}
                                        decelerationRate="fast"
                                        initialNumToRender={15}
                                        getItemLayout={(data, index) => (
                                            { length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index }
                                        )}
                                        contentContainerStyle={{ paddingVertical: PADDING_VERTICAL }}
                                        onScroll={(e) => onScroll(e, setTempMinute, minutes)}
                                        scrollEventThrottle={16}
                                        renderItem={({ item }) => renderItem({ item, type: 'minute' })}
                                    />
                                </View>

                                {/* AM/PM */}
                                <View style={{ flex: 1, height: '100%', borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.05)' }}>
                                    <FlatList
                                        data={periods}
                                        keyExtractor={item => item}
                                        showsVerticalScrollIndicator={false}
                                        snapToInterval={ITEM_HEIGHT}
                                        decelerationRate="fast"
                                        contentContainerStyle={{ paddingVertical: PADDING_VERTICAL }}
                                        onScroll={(e) => {
                                            const offsetY = e.nativeEvent.contentOffset.y;
                                            if (offsetY > ITEM_HEIGHT / 2) setTempPeriod('PM');
                                            else setTempPeriod('AM');
                                        }}
                                        scrollEventThrottle={16}
                                        renderItem={({ item }) => renderItem({ item, type: 'period' })}
                                    />
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* The "Skirt" for Time Picker */}
                    <View style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        height: 500, // Massive skirt
                        backgroundColor: '#18181b',
                        marginTop: -1
                    }} />
                </Animated.View>
            </View>
        </Modal>
    );
};
