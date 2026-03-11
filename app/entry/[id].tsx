
import Ionicons from '@expo/vector-icons/Ionicons';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth } from '../config/firebase';
import { SHADOWS } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { getEntryById } from '../db/database';

const AudioPlayer = ({ uri, colors }: { uri: string, colors: any }) => {
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    async function playSound() {
        if (sound) {
            await sound.replayAsync();
            setIsPlaying(true);
        } else {
            console.log('Loading Sound');
            const { sound: newSound } = await Audio.Sound.createAsync({ uri });
            setSound(newSound);

            newSound.setOnPlaybackStatusUpdate((status) => {
                if (status.isLoaded && status.didJustFinish) {
                    setIsPlaying(false);
                }
            });

            console.log('Playing Sound');
            await newSound.playAsync();
            setIsPlaying(true);
        }
    }

    async function stopSound() {
        if (sound) {
            await sound.stopAsync();
            setIsPlaying(false);
        }
    }

    useEffect(() => {
        return sound
            ? () => {
                console.log('Unloading Sound');
                sound.unloadAsync();
            }
            : undefined;
    }, [sound]);

    return (
        <TouchableOpacity
            style={[styles.audioBubble, { backgroundColor: colors.background[0] }]}
            onPress={isPlaying ? stopSound : playSound}
        >
            <Ionicons name={isPlaying ? "stop-circle" : "play-circle"} size={32} color={colors.primary} />
            <Text style={[styles.audioText, { color: colors.text }]}>{isPlaying ? 'Playing...' : 'Play Audio'}</Text>
        </TouchableOpacity>
    );
};

export default function EntryDetail() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { colors, isDark } = useTheme();
    const [entry, setEntry] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEntry = async () => {
            if (id) {
                const userId = auth.currentUser?.uid;
                if (userId) {
                    const data = await getEntryById(Number(id), userId);
                    setEntry(data);
                }
            }
            setLoading(false);
        };
        fetchEntry();
    }, [id]);

    if (loading) {
        return (
            <View style={[styles.container, styles.center, { backgroundColor: colors.background[0] as string }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!entry) {
        return (
            <View style={[styles.container, styles.center, { backgroundColor: colors.background[0] as string }]}>
                <Text style={{ color: colors.text }}>Entry not found.</Text>
                <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
                    <Text style={{ color: colors.primary }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const attachments = entry.attachments ? JSON.parse(entry.attachments) : [];
    const images = attachments.filter((a: any) => a.type === 'image');
    const audios = attachments.filter((a: any) => a.type === 'audio');

    const dateObj = new Date(entry.date);
    const formattedDate = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

    return (
        <View style={styles.container}>
            <LinearGradient colors={colors.background as any} style={StyleSheet.absoluteFill} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>{formattedDate}</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Images Carousel or Stack */}
                {images.length > 0 && (
                    <View style={styles.imageContainer}>
                        {images.map((img: any, index: number) => (
                            <Image key={index} source={{ uri: img.uri }} style={styles.heroImage} />
                        ))}
                    </View>
                )}

                <View style={[styles.paper, { backgroundColor: colors.cardBg }]}>
                    <Text style={[styles.entryText, { color: colors.text }]}>
                        {entry.text}
                    </Text>

                    {/* Audio Section */}
                    {audios.length > 0 && (
                        <View style={styles.audioSection}>
                            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Audio Notes</Text>
                            {audios.map((audio: any, index: number) => (
                                <AudioPlayer key={index} uri={audio.uri} colors={colors} />
                            ))}
                        </View>
                    )}

                    <View style={styles.metaInfo}>
                        <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
                            Saved at {new Date(entry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </View>
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        paddingTop: 60,
    },
    backButton: { padding: 5 },
    headerTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 50,
    },
    imageContainer: {
        marginBottom: 20,
    },
    heroImage: {
        width: '100%',
        height: 250,
        borderRadius: 20,
        marginBottom: 10,
    },
    paper: {
        borderRadius: 20,
        padding: 25,
        minHeight: 200,
        ...SHADOWS.medium,
    },
    entryText: {
        fontSize: 18,
        lineHeight: 28,
    },
    audioSection: {
        marginTop: 20,
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        marginBottom: 10,
        opacity: 0.7,
    },
    audioBubble: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 16,
        marginBottom: 10,
        ...SHADOWS.light,
    },
    audioText: {
        marginLeft: 10,
        fontWeight: '600',
    },
    metaInfo: {
        marginTop: 30,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
        paddingTop: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    timestamp: {
        fontSize: 12,
        fontStyle: 'italic',
    },
});
