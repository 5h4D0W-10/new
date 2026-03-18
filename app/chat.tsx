import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { addDoc, collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth, db } from './config/firebase';
import { COLORS } from './constants/theme';
import { useTheme } from './context/ThemeContext';

export default function ChatScreen() {
    const { chatId, friendEmail } = useLocalSearchParams();
    const router = useRouter();
    const { colors } = useTheme();
    const [messages, setMessages] = useState<any[]>([]);
    const [text, setText] = useState('');
    const currentUserEmail = auth.currentUser?.email;

    useEffect(() => {
        if (!chatId) return;

        const q = query(
            collection(db, 'chats', chatId as string, 'messages'),
            orderBy('createdAt', 'asc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMessages(msgs);
        }, (error) => {
            console.warn('Chat Firestore error:', error.message);
        });

        return () => unsubscribe();
    }, [chatId]);

    const sendMessage = async () => {
        if (!text.trim() || !chatId || !currentUserEmail) return;
        const msgText = text;
        setText('');

        await addDoc(collection(db, 'chats', chatId as string, 'messages'), {
            text: msgText,
            sender: currentUserEmail,
            createdAt: Date.now()
        });
    };

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <LinearGradient colors={colors.background as any} style={StyleSheet.absoluteFill} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.text }]}>{friendEmail}</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.chatContainer}>
                {messages.map((msg) => {
                    const isMe = msg.sender === currentUserEmail;
                    return (
                        <View key={msg.id} style={[styles.messageBubble, isMe ? styles.myMessage : styles.theirMessage]}>
                            <Text style={[styles.messageText, isMe ? styles.myMessageText : { color: colors.text }]}>
                                {msg.text}
                            </Text>
                        </View>
                    );
                })}
            </ScrollView>

            <View style={[styles.inputContainer, { backgroundColor: colors.cardBg }]}>
                <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Type a message..."
                    placeholderTextColor={colors.textSecondary}
                    value={text}
                    onChangeText={setText}
                />
                <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
                    <Ionicons name="send" size={20} color="#fff" />
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
    },
    backBtn: { padding: 5 },
    title: { fontSize: 20, fontWeight: 'bold' },
    chatContainer: { padding: 20, paddingBottom: 40 },
    messageBubble: {
        maxWidth: '80%',
        padding: 15,
        borderRadius: 20,
        marginBottom: 10,
    },
    myMessage: {
        alignSelf: 'flex-end',
        backgroundColor: COLORS.primary,
        borderBottomRightRadius: 5,
    },
    theirMessage: {
        alignSelf: 'flex-start',
        backgroundColor: '#e6e6e6',
        borderBottomLeftRadius: 5,
    },
    messageText: { fontSize: 16 },
    myMessageText: { color: '#fff' },
    inputContainer: {
        flexDirection: 'row',
        padding: 15,
        paddingBottom: Platform.OS === 'ios' ? 30 : 15,
        alignItems: 'center',
        borderTopWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)'
    },
    input: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.05)',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 24,
        marginRight: 10,
        fontSize: 16,
    },
    sendBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    }
});
