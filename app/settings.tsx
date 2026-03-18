
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as SQLite from 'expo-sqlite';
import { signOut } from 'firebase/auth';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { auth } from './config/firebase';
// import { COLORS, SHADOWS } from './constants/theme';
import { SHADOWS } from './constants/theme';
import { useTheme } from './context/ThemeContext';
import { backupData, restoreData } from './services/backupService';


export default function Settings() {
    const router = useRouter();
    const { colors, toggleTheme, isDark } = useTheme();
    const [notifications, setNotifications] = useState(true);
    const [biometrics, setBiometrics] = useState(false);
    const [backingUp, setBackingUp] = useState(false);
    const [restoring, setRestoring] = useState(false);

    const handleReset = async () => {
        Alert.alert(
            "Clear All Data",
            "Are you sure you want to delete all entries? This cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        const db = await SQLite.openDatabaseAsync('diary.db');
                        await db.runAsync('DELETE FROM entries');
                        Alert.alert("Success", "All entries deleted.");
                    }
                }
            ]
        );
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.replace('/login');
        } catch (error) {
            Alert.alert("Error", "Failed to logout");
        }
    };

    const handleBackup = async () => {
        setBackingUp(true);
        try {
            const count = await backupData();
            Alert.alert("Backup Success", `Uploaded ${count} entries to the cloud.`);
        } catch (error: any) {
            Alert.alert("Backup Failed", error.message);
        } finally {
            setBackingUp(false);
        }
    };

    const handleRestore = async () => {
        setRestoring(true);
        try {
            const count = await restoreData();
            Alert.alert("Restore Success", `Downloaded ${count} entries from the cloud.`);
        } catch (error: any) {
            Alert.alert("Restore Failed", error.message);
        } finally {
            setRestoring(false);
        }
    };

    const SettingRow = ({ icon, label, rightElement, color, pressable, onPress }: any) => {
        const Wrapper = pressable ? TouchableOpacity : View;
        return (
            <Wrapper onPress={onPress} style={styles.row}>
                <View style={[styles.iconBox, { backgroundColor: color + '20' }]}>
                    <Ionicons name={icon} size={22} color={color} />
                </View>
                <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
                <View style={styles.rightElement}>
                    {rightElement}
                </View>
            </Wrapper>
        );
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={colors.background as any} style={StyleSheet.absoluteFill} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.sectionContainer}>
                    <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>Preferences</Text>
                    <View style={[styles.card, { backgroundColor: colors.cardBg }]}>
                        <SettingRow
                            icon="moon"
                            label="Dark Mode"
                            color="#6C63FF"
                            rightElement={
                                <Switch
                                    value={isDark}
                                    onValueChange={toggleTheme}
                                    trackColor={{ true: 'red', false: '#ccc' }}
                                    thumbColor={'#fff'}
                                />
                            }
                        />
                        <View style={styles.divider} />
                        <SettingRow
                            icon="notifications"
                            label="Daily Reminders"
                            color="#FF6584"
                            rightElement={<Switch value={notifications} onValueChange={setNotifications} trackColor={{ true: 'red', false: '#ccc' }} thumbColor={'#fff'} />}
                        />
                        <View style={styles.divider} />
                        <SettingRow
                            icon="finger-print"
                            label="Biometric Lock"
                            color="#00cec9"
                            rightElement={<Switch value={biometrics} onValueChange={setBiometrics} trackColor={{ true: 'red', false: '#ccc' }} thumbColor={'#fff'} />}
                        />
                    </View>
                </View>

                <View style={styles.sectionContainer}>
                    <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>Account</Text>
                    <View style={[styles.card, { backgroundColor: colors.cardBg }]}>
                        <SettingRow
                            icon="log-out-outline"
                            label="Logout"
                            color="#FF4444"
                            pressable
                            onPress={handleLogout}
                            rightElement={<Ionicons name="chevron-forward" size={20} color="#ccc" />}
                        />
                    </View>
                </View>

                <View style={styles.sectionContainer}>
                    <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>Data & Privacy</Text>
                    <View style={[styles.card, { backgroundColor: colors.cardBg }]}>
                        <SettingRow
                            icon="cloud-upload"
                            label={backingUp ? "Backing up..." : "Backup Data"}
                            color="#0984e3"
                            pressable={!backingUp}
                            onPress={handleBackup}
                            rightElement={backingUp ? <ActivityIndicator size="small" color="#0984e3" /> : <Ionicons name="chevron-forward" size={20} color="#ccc" />}
                        />
                        <View style={styles.divider} />
                        <SettingRow
                            icon="cloud-download"
                            label={restoring ? "Restoring..." : "Restore Data"}
                            color="#00b894"
                            pressable={!restoring}
                            onPress={handleRestore}
                            rightElement={restoring ? <ActivityIndicator size="small" color="#00b894" /> : <Ionicons name="chevron-forward" size={20} color="#ccc" />}
                        />
                        <View style={styles.divider} />
                        <SettingRow
                            icon="trash"
                            label="Clear Local Data"
                            color="#ff4444"
                            pressable
                            onPress={handleReset}
                            rightElement={<Ionicons name="chevron-forward" size={20} color="#ccc" />}
                        />
                    </View>
                </View>

                {/* Developer Tools for Easy Verification */}
                <View style={styles.sectionContainer}>
                    <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>Developer Tools</Text>
                    <View style={[styles.card, { backgroundColor: colors.cardBg }]}>
                        <SettingRow
                            icon="code-slash"
                            label="Log DB to Console"
                            color="#e17055"
                            pressable
                            onPress={async () => {
                                const { getEntries } = require('./db/database');
                                const userId = auth.currentUser?.uid;
                                if (!userId) {
                                    Alert.alert('Error', 'Not logged in');
                                    return;
                                }
                                try {
                                    const data = await getEntries(userId);
                                    console.log('=== DATABASE DUMP ===');
                                    console.log(JSON.stringify(data, null, 2));
                                    console.log('=====================');
                                    Alert.alert('Success', 'Check your terminal console for the DB dump.');
                                } catch (e) {
                                    console.error(e);
                                    Alert.alert('Error', 'Failed to read DB');
                                }
                            }}
                            rightElement={<Ionicons name="terminal" size={20} color={colors.textSecondary} />}
                        />
                    </View>
                </View>

                <View style={styles.footer}>
                    <Text style={[styles.version, { color: colors.textSecondary }]}>Diary App v2.0 • Premium Edition</Text>
                </View>
            </ScrollView>
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
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    sectionContainer: {
        marginBottom: 25,
    },
    sectionHeader: {
        fontSize: 14,
        fontWeight: '700',
        marginLeft: 10,
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    card: {
        borderRadius: 20,
        paddingHorizontal: 5,
        ...SHADOWS.light,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 15,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    rowLabel: {
        fontSize: 16,
        fontWeight: '500',
        flex: 1,
    },
    rightElement: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    divider: {
        height: 1,
        backgroundColor: '#f0f0f0',
        marginLeft: 70,
    },
    footer: {
        marginTop: 20,
        alignItems: 'center',
    },
    version: {
        opacity: 0.6,
    },
});
