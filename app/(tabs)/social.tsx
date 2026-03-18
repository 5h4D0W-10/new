import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { addDoc, collection, doc, deleteDoc, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../config/firebase';
import { COLORS, SHADOWS } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { importEntry } from '../db/database';

export default function SocialScreen() {
    const { colors } = useTheme();
    const router = useRouter();
    const [chats, setChats] = useState<any[]>([]);
    const [sharedEntries, setSharedEntries] = useState<any[]>([]);
    const [newFriendEmail, setNewFriendEmail] = useState('');
    const currentUserEmail = auth.currentUser?.email;

    useEffect(() => {
        if (!currentUserEmail) return;

        const q = query(
            collection(db, 'chats'),
            where('participants', 'array-contains', currentUserEmail)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedChats = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setChats(fetchedChats);
        }, (error) => {
            console.warn('Firestore permission error:', error.message);
            // Don't crash - just show empty chats until rules are published
        });

        return () => unsubscribe();
    }, [currentUserEmail]);

    useEffect(() => {
        if (!currentUserEmail) return;

        const q = query(
            collection(db, 'shared_entries'),
            where('toEmail', '==', currentUserEmail.toLowerCase())
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetched = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setSharedEntries(fetched);
        }, (error) => {
            console.warn('Shared entries error:', error.message);
        });

        return () => unsubscribe();
    }, [currentUserEmail]);

    const handleSaveSharedEntry = async (item: any) => {
        try {
            const userId = auth.currentUser?.uid;
            if (userId) {
                await importEntry(item.entry, userId);
                await deleteDoc(doc(db, 'shared_entries', item.id));
                Alert.alert("Success", "Memory saved to your diary!");
            }
        } catch (error) {
            Alert.alert("Error", "Could not save memory.");
        }
    };

    const handleDiscardSharedEntry = async (item: any) => {
        try {
            await deleteDoc(doc(db, 'shared_entries', item.id));
        } catch (error) {
            Alert.alert("Error", "Could not discard memory.");
        }
    };

    const startChat = async () => {
        if (!newFriendEmail.trim() || !currentUserEmail) return;
        
        // Ensure not chatting with self
        if (newFriendEmail.trim().toLowerCase() === currentUserEmail.toLowerCase()) {
            Alert.alert("Error", "You cannot chat with yourself.");
            return;
        }

        try {
            // Check if chat already exists
            const q = query(
                collection(db, 'chats'),
                where('participants', 'array-contains', currentUserEmail)
            );
            const querySnapshot = await getDocs(q);
            let existingChatId = null;

            querySnapshot.forEach(doc => {
                const data = doc.data();
                if (data.participants.includes(newFriendEmail.trim().toLowerCase())) {
                    existingChatId = doc.id;
                }
            });

            if (existingChatId) {
                router.push({ pathname: '/chat', params: { chatId: existingChatId, friendEmail: newFriendEmail.trim() } });
            } else {
                // Create new chat
                const docRef = await addDoc(collection(db, 'chats'), {
                    participants: [currentUserEmail, newFriendEmail.trim().toLowerCase()],
                    createdAt: Date.now(),
                    lastMessage: 'New Chat started'
                });
                router.push({ pathname: '/chat', params: { chatId: docRef.id, friendEmail: newFriendEmail.trim() } });
            }
            setNewFriendEmail('');
        } catch (e: any) {
            Alert.alert("Error", e.message);
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={colors.background as any} style={StyleSheet.absoluteFill} />
            
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>Connect</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                
                {/* Shared Memories Section */}
                {sharedEntries.length > 0 && (
                    <>
                        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Shared With You</Text>
                        <View style={[styles.card, { backgroundColor: colors.cardBg, marginBottom: 25, padding: 0 }]}>
                            {sharedEntries.map((item, idx) => (
                                <View key={item.id} style={[styles.chatRow, idx > 0 && styles.borderTop, { flexDirection: 'column', alignItems: 'flex-start' }]}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <View style={[styles.avatar, { backgroundColor: COLORS.secondary }]}>
                                            <Ionicons name="gift" size={20} color="#fff" />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.chatName, { color: colors.text }]}>Memory from {item.fromEmail}</Text>
                                            <Text style={[styles.chatPreview, { color: colors.textSecondary }]} numberOfLines={2}>
                                                {item.entry.text || "A memory was shared with you."}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={{ flexDirection: 'row', marginTop: 15, width: '100%', justifyContent: 'flex-end' }}>
                                        <TouchableOpacity 
                                            style={[styles.actionBtn, { backgroundColor: 'rgba(255, 59, 48, 0.1)', marginRight: 10 }]}
                                            onPress={() => handleDiscardSharedEntry(item)}
                                        >
                                            <Text style={{ color: '#FF3B30', fontWeight: '600' }}>Discard</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity 
                                            style={[styles.actionBtn, { backgroundColor: COLORS.primary }]}
                                            onPress={() => handleSaveSharedEntry(item)}
                                        >
                                            <Text style={{ color: '#fff', fontWeight: '600' }}>Save to Diary</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </>
                )}

                {/* Find Users / Friend Requests */}
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Start a Chat</Text>
                <View style={[styles.card, { backgroundColor: colors.cardBg, marginBottom: 25 }]}>
                    <View style={styles.inputRow}>
                        <TextInput 
                            style={[styles.input, { color: colors.text }]}
                            placeholder="Enter friend's email..."
                            placeholderTextColor={colors.textSecondary}
                            value={newFriendEmail}
                            onChangeText={setNewFriendEmail}
                            autoCapitalize="none"
                        />
                        <TouchableOpacity style={styles.addBtn} onPress={startChat}>
                            <Ionicons name="chatbubbles" size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Active Chats Section */}
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Messages</Text>
                <View style={[styles.card, { backgroundColor: colors.cardBg, padding: 0 }]}>
                    {chats.length === 0 ? (
                        <Text style={{ color: colors.textSecondary, textAlign: 'center', padding: 20 }}>
                            Your chat history is empty. Start a conversation above!
                        </Text>
                    ) : (
                        chats.map((chat, idx) => {
                            const friendEmail = chat.participants.find((p: string) => p !== currentUserEmail);
                            return (
                                <TouchableOpacity 
                                    key={chat.id} 
                                    style={[styles.chatRow, idx > 0 && styles.borderTop]}
                                    onPress={() => router.push({ pathname: '/chat', params: { chatId: chat.id, friendEmail } })}
                                >
                                    <View style={styles.avatar}>
                                        <Text style={styles.avatarText}>{friendEmail?.charAt(0).toUpperCase()}</Text>
                                    </View>
                                    <View>
                                        <Text style={[styles.chatName, { color: colors.text }]}>{friendEmail}</Text>
                                        <Text style={[styles.chatPreview, { color: colors.textSecondary }]}>{chat.lastMessage || 'Active Chat'}</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} style={{ marginLeft: 'auto' }} />
                                </TouchableOpacity>
                            )
                        })
                    )}
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
    },
    title: {
        fontSize: 34,
        fontWeight: 'bold',
        letterSpacing: -0.5,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 60,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 10,
        marginLeft: 5,
    },
    card: {
        borderRadius: 20,
        padding: 15,
        ...SHADOWS.light,
        overflow: 'hidden',
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.05)',
        padding: 15,
        borderRadius: 12,
        marginRight: 10,
        fontSize: 16,
    },
    addBtn: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    chatRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
    },
    borderTop: {
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#f1c40f',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    avatarText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    chatName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    chatPreview: {
        fontSize: 14,
    },
    actionBtn: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
    }
});
