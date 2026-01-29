
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React, { useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
// import { COLORS, SHADOWS } from './constants/theme';
import { SHADOWS } from './constants/theme';
import { useTheme } from './context/ThemeContext';
import { getEntries } from './db/database';

type Entry = {
    id: number;
    date: string;
    text: string;
    attachments: string;
    created_at: number;
};

export default function Entries() {
    const router = useRouter();
    const { colors, isDark } = useTheme();
    const [entries, setEntries] = useState<Entry[]>([]);

    const loadEntries = async () => {
        const data: any = await getEntries();
        setEntries(data as Entry[]);
    };

    useFocusEffect(
        React.useCallback(() => {
            loadEntries();
        }, [])
    );

    const renderItem = ({ item, index }: { item: Entry, index: number }) => {
        const attachments = JSON.parse(item.attachments);
        const hasAudio = attachments.some((a: any) => a.type === 'audio');
        const firstImage = attachments.find((a: any) => a.type === 'image');

        // Format Date nicely
        const dateObj = new Date(item.date);
        const day = dateObj.getDate();
        const month = dateObj.toLocaleDateString('en-US', { month: 'short' });
        const year = dateObj.getFullYear();

        return (
            <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', delay: index * 100 }}
            >
                <View style={styles.timelineRow}>
                    <View style={styles.dateCol}>
                        <Text style={[styles.dateDay, { color: colors.text }]}>{day}</Text>
                        <Text style={[styles.dateMonth, { color: colors.textSecondary }]}>{month}</Text>
                    </View>

                    <View style={styles.cardContainer}>
                        <TouchableOpacity
                            style={[styles.card, { backgroundColor: colors.cardBg }]}
                            activeOpacity={0.9}
                            onPress={() => router.push(`/entry/${item.id}` as any)}
                        >
                            {firstImage && (
                                <Image source={{ uri: firstImage.uri }} style={styles.cardImage} />
                            )}

                            <View style={styles.cardContent}>
                                <Text style={[styles.cardText, { color: colors.text }]} numberOfLines={3}>
                                    {item.text || "Just a moment captured..."}
                                </Text>

                                <View style={styles.cardFooter}>
                                    <Text style={styles.timeText}>{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                                    <View style={styles.icons}>
                                        {hasAudio && <Ionicons name="mic" size={14} color={colors.primary} style={{ marginRight: 5 }} />}
                                        {firstImage && <Ionicons name="image" size={14} color={colors.secondary} />}
                                    </View>
                                </View>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>
            </MotiView >
        );
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={colors.background as any} style={StyleSheet.absoluteFill} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.text }]}>Your Journey</Text>
                <View style={{ width: 24 }} />
            </View>

            <FlatList
                data={entries}
                renderItem={renderItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="book-outline" size={64} color="rgba(0,0,0,0.2)" />
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No memories yet.</Text>
                    </View>
                }
            />
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
    },
    list: { padding: 20 },

    timelineRow: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    dateCol: {
        width: 50,
        alignItems: 'center',
        marginRight: 15,
        paddingTop: 10,
    },
    dateDay: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    dateMonth: {
        fontSize: 14,
        fontWeight: '600',
        textTransform: 'uppercase',
    },

    cardContainer: {
        flex: 1,
    },
    card: {
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
        marginBottom: 10,
        lineHeight: 22,
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
    icons: {
        flexDirection: 'row',
    },

    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
    },
    emptyText: {
        fontSize: 18,
        marginTop: 20,
    },
});
