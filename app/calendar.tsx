
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React, { useCallback, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DateData, Calendar as RNCalendar } from 'react-native-calendars';
import { auth } from './config/firebase';
import { COLORS, SHADOWS } from './constants/theme';
import { getEntries } from './db/database';

type Entry = {
    id: number;
    date: string;
    text: string;
    attachments: string;
    created_at: number;
};

export default function CalendarPage() {
    const router = useRouter();
    const [markedDates, setMarkedDates] = useState<any>({});
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [entries, setEntries] = useState<Entry[]>([]);
    const [selectedEntries, setSelectedEntries] = useState<Entry[]>([]);

    const loadEntries = async () => {
        const userId = auth.currentUser?.uid;
        if (!userId) return;

        const data = await getEntries(userId) as Entry[];
        setEntries(data);

        const markers: any = {};
        data.forEach(entry => {
            markers[entry.date] = { marked: true, dotColor: COLORS.secondary };
        });

        markers[selectedDate] = {
            ...markers[selectedDate],
            selected: true,
            selectedColor: COLORS.primary,
            disableTouchEvent: true
        };

        setMarkedDates(markers);
        filterEntriesForDate(selectedDate, data);
    };

    useFocusEffect(
        useCallback(() => {
            loadEntries();
        }, [selectedDate])
    );

    const onDayPress = (day: DateData) => {
        setSelectedDate(day.dateString);

        const newMarkers = { ...markedDates };
        Object.keys(newMarkers).forEach(key => {
            if (newMarkers[key].selected) {
                delete newMarkers[key].selected;
                delete newMarkers[key].selectedColor;
            }
        });

        newMarkers[day.dateString] = {
            ...newMarkers[day.dateString],
            selected: true,
            selectedColor: COLORS.primary
        };

        setMarkedDates(newMarkers);
        filterEntriesForDate(day.dateString, entries);
    };

    const filterEntriesForDate = (date: string, allEntries: Entry[]) => {
        const filtered = allEntries.filter(e => e.date === date);
        setSelectedEntries(filtered);
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={COLORS.background} style={StyleSheet.absoluteFill} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Calendar</Text>
                <View style={{ width: 24 }} />
            </View>

            <MotiView
                from={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={styles.calendarContainer}
            >
                <RNCalendar
                    onDayPress={onDayPress}
                    markedDates={markedDates}
                    theme={{
                        backgroundColor: 'transparent',
                        calendarBackground: 'transparent',
                        textSectionTitleColor: '#b6c1cd',
                        selectedDayBackgroundColor: COLORS.primary,
                        selectedDayTextColor: '#ffffff',
                        todayTextColor: COLORS.primary,
                        dayTextColor: '#2d4150',
                        textDisabledColor: '#d9e1e8',
                        dotColor: COLORS.secondary,
                        selectedDotColor: '#ffffff',
                        arrowColor: COLORS.primary,
                        monthTextColor: COLORS.text,
                        indicatorColor: COLORS.primary,
                        textDayFontWeight: '600',
                        textMonthFontWeight: 'bold',
                        textDayHeaderFontWeight: '600',
                        textDayFontSize: 16,
                        textMonthFontSize: 18,
                        textDayHeaderFontSize: 14
                    }}
                    style={styles.calendar}
                />
            </MotiView>

            <View style={styles.listContainer}>
                <Text style={styles.sectionTitle}>
                    {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </Text>

                <FlatList
                    data={selectedEntries}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.list}
                    renderItem={({ item, index }) => {
                        const attachments = JSON.parse(item.attachments || '[]');
                        const hasAudio = attachments.some((a: any) => a.type === 'audio');
                        const firstImage = attachments.find((a: any) => a.type === 'image');
                        return (
                            <MotiView
                                from={{ translateY: 10, opacity: 0 }}
                                animate={{ translateY: 0, opacity: 1 }}
                                transition={{ delay: index * 100 }}
                                style={styles.timelineRow}
                            >
                                <TouchableOpacity
                                    style={styles.card}
                                    activeOpacity={0.9}
                                    onPress={() => router.push(`/entry/${item.id}` as any)}
                                >
                                    {firstImage && (
                                        <Image source={{ uri: firstImage.uri }} style={styles.cardImage} />
                                    )}
                                    <View style={styles.cardContent}>
                                        <Text style={styles.cardText} numberOfLines={3}>
                                            {item.text || 'Just a moment captured...'}
                                        </Text>
                                        <View style={styles.cardFooter}>
                                            <Text style={styles.timeText}>
                                                {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </Text>
                                            <View style={{ flexDirection: 'row' }}>
                                                {hasAudio && <Ionicons name="mic" size={14} color={COLORS.primary} style={{ marginRight: 5 }} />}
                                                {firstImage && <Ionicons name="image" size={14} color={COLORS.secondary} />}
                                            </View>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            </MotiView>
                        );
                    }}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>No entries for this day.</Text>
                        </View>
                    }
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        paddingTop: 60,
    },
    backButton: { padding: 5 },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
    },

    calendarContainer: {
        margin: 20,
        marginTop: 0,
        backgroundColor: 'rgba(255,255,255,0.8)',
        borderRadius: 20,
        padding: 10,
        ...SHADOWS.light,
    },
    calendar: {
        borderRadius: 15,
    },

    listContainer: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.5)',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingTop: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 25,
        marginBottom: 15,
        color: COLORS.text,
    },
    list: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    timelineRow: {
        marginBottom: 15,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 18,
        overflow: 'hidden',
        ...SHADOWS.light,
    },
    cardImage: {
        width: '100%',
        height: 140,
    },
    cardContent: {
        padding: 15,
    },
    cardText: {
        fontSize: 16,
        color: COLORS.text,
        lineHeight: 22,
        marginBottom: 10,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 5,
    },
    timeText: {
        fontSize: 12,
        color: '#999',
    },
    emptyState: {
        padding: 20,
        alignItems: 'center',
    },
    emptyText: {
        color: COLORS.textSecondary,
    },
});
