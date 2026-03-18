
import Ionicons from '@expo/vector-icons/Ionicons';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { addDoc, collection } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
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
    const [isShareModalVisible, setShareModalVisible] = useState(false);
    const [shareEmail, setShareEmail] = useState('');
    const [isSharing, setIsSharing] = useState(false);

    const handleShare = async () => {
        if (!shareEmail.trim()) {
            Alert.alert("Error", "Please enter an email address");
            return;
        }
        if (shareEmail.trim().toLowerCase() === auth.currentUser?.email?.toLowerCase()) {
            Alert.alert("Error", "You cannot share with yourself");
            return;
        }
        setIsSharing(true);
        try {
            await addDoc(collection(db, 'shared_entries'), {
                entry: {
                    ...entry,
                    id: undefined // Remove local ID so it doesn't conflict when imported
                },
                fromEmail: auth.currentUser?.email,
                toEmail: shareEmail.trim().toLowerCase(),
                createdAt: Date.now()
            });
            Alert.alert("Success", "Memory shared successfully!");
            setShareModalVisible(false);
            setShareEmail('');
        } catch (error: any) {
            Alert.alert("Error", error.message);
        } finally {
            setIsSharing(false);
        }
    };

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
                <TouchableOpacity onPress={() => setShareModalVisible(true)} style={styles.backButton}>
                    <Ionicons name="paper-plane-outline" size={24} color={colors.primary} />
                </TouchableOpacity>
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

            <Modal
                visible={isShareModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShareModalVisible(false)}
            >
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.cardBg }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Share Memory</Text>
                        <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                            Enter your friend's email address to share this memory with them.
                        </Text>
                        
                        <TextInput
                            style={[styles.modalInput, { color: colors.text }]}
                            placeholder="friend@example.com"
                            placeholderTextColor={colors.textSecondary}
                            value={shareEmail}
                            onChangeText={setShareEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                        
                        <View style={styles.modalButtons}>
                            <TouchableOpacity 
                                style={[styles.modalBtn, { backgroundColor: 'transparent' }]}
                                onPress={() => setShareModalVisible(false)}
                            >
                                <Text style={[styles.modalBtnText, { color: colors.textSecondary }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.modalBtn, { backgroundColor: colors.primary }]}
                                onPress={handleShare}
                                disabled={isSharing}
                            >
                                {isSharing ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <Text style={[styles.modalBtnText, { color: '#fff' }]}>Share</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        borderRadius: 20,
        padding: 20,
        ...SHADOWS.medium,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    modalSubtitle: {
        fontSize: 14,
        marginBottom: 20,
        lineHeight: 20,
    },
    modalInput: {
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 12,
        padding: 15,
        fontSize: 16,
        marginBottom: 20,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    modalBtn: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 10,
        marginLeft: 10,
    },
    modalBtnText: {
        fontSize: 16,
        fontWeight: '600',
    },
});
