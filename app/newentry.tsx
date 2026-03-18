
import Ionicons from '@expo/vector-icons/Ionicons';
import { Audio } from 'expo-av';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ActivityIndicator
} from 'react-native';
import { auth } from './config/firebase';
import { fetchSignInMethodsForEmail } from 'firebase/auth';
import { COLORS, SHADOWS } from './constants/theme';
import { insertEntry } from './db/database';

type Attachment = {
    type: 'image' | 'audio';
    uri: string;
};

export default function NewEntry() {
    const router = useRouter();
    const [text, setText] = useState<string>('');
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [isFetchingLocation, setIsFetchingLocation] = useState<boolean>(false);

    // Collaboration
    const [collabVisible, setCollabVisible] = useState<boolean>(false);
    const [collabEmail, setCollabEmail] = useState<string>('');

    // Camera
    const [cameraVisible, setCameraVisible] = useState<boolean>(false);
    const [cameraPermission, requestCameraPermission] = useCameraPermissions();
    const cameraRef = useRef<CameraView>(null);

    // Audio
    const [audioPermission, setAudioPermission] = useState<Audio.PermissionResponse | null>(null);

    useEffect(() => {
        (async () => {
            const audioStatus = await Audio.requestPermissionsAsync();
            setAudioPermission(audioStatus);
        })();
    }, []);

    const handleSave = async () => {
        if (!text.trim() && attachments.length === 0) {
            Alert.alert("Empty Entry", "Write something to save!");
            return;
        }
        try {
            const userId = auth.currentUser?.uid;
            if (!userId) {
                Alert.alert("Error", "You must be logged in to save.");
                return;
            }
            await insertEntry(text, attachments, userId);
            // Fancy success feedback could go here, for now just back
            router.back();
        } catch (error) {
            Alert.alert("Error", "Failed to save entry");
        }
    };

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            setAttachments([...attachments, { type: 'image', uri: result.assets[0].uri }]);
        }
    };

    const takePhoto = async () => {
        if (cameraRef.current) {
            const photo = await cameraRef.current.takePictureAsync();
            if (photo) {
                setAttachments([...attachments, { type: 'image', uri: photo.uri }]);
                setCameraVisible(false);
            }
        }
    };

    async function startRecording() {
        try {
            if (!audioPermission?.granted) await Audio.requestPermissionsAsync();
            await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
            const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
            setRecording(recording);
            setIsRecording(true);
        } catch (err) {
            console.error('Failed to start recording', err);
        }
    }

    async function stopRecording() {
        if (!recording) return;
        setIsRecording(false);
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        if (uri) setAttachments([...attachments, { type: 'audio', uri: uri }]);
        setRecording(null);
    }

    const handleLocation = async () => {
        setIsFetchingLocation(true);
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Location Permission', 'Permission to access location was denied');
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            let geocode = await Location.reverseGeocodeAsync({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude
            });
            
            if (geocode.length > 0) {
                const place = geocode[0];
                const locationString = `\n\n📍 ${place.city || place.subregion || place.name || ''}, ${place.region || place.country || ''}`;
                setText(prev => prev + locationString);
            } else {
                const coordsString = `\n\n📍 Lat: ${location.coords.latitude.toFixed(4)}, Lon: ${location.coords.longitude.toFixed(4)}`;
                setText(prev => prev + coordsString);
            }
        } catch (e) {
            Alert.alert('Error', 'Failed to fetch location');
        } finally {
            setIsFetchingLocation(false);
        }
    }

    const handleCollabPress = () => {
        Alert.alert(
            "Cloud Sync Required",
            "To collaborate on this memory, the entry securely uploads to the cloud. Do you want to proceed?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Upload & Continue", 
                    onPress: () => {
                        // Mock upload, then show collab modal
                        setCollabVisible(true);
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#fff', '#f8f9ff']} style={StyleSheet.absoluteFill} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
                    <Ionicons name="close" size={28} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.date}>{new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })}</Text>
                <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
                    <Text style={styles.saveText}>Save</Text>
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <TextInput
                        style={styles.titleInput}
                        placeholder="Title..."
                        placeholderTextColor="#ccc"
                        // Assuming first line is title logic or just big text
                        multiline={false}
                    />
                    <TextInput
                        style={styles.textInput}
                        multiline
                        placeholder="Start writing..."
                        placeholderTextColor="#ccc"
                        value={text}
                        onChangeText={setText}
                        autoFocus
                    />

                    {/* Attachments Grid */}
                    <View style={styles.attachmentsContainer}>
                        {attachments.map((item, index) => (
                            <MotiView
                                key={index}
                                from={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                style={styles.mediaWrapper}
                            >
                                {item.type === 'image' && (
                                    <Image source={{ uri: item.uri }} style={styles.attachedImage} />
                                )}
                                {item.type === 'audio' && (
                                    <LinearGradient colors={['#eee', '#e0e0e0']} style={styles.audioBubble}>
                                        <Ionicons name="mic" size={20} color={COLORS.textSecondary} />
                                        <Text style={styles.audioText}>Audio {index + 1}</Text>
                                    </LinearGradient>
                                )}
                                <TouchableOpacity
                                    style={styles.removeMedia}
                                    onPress={() => {
                                        const newAtt = [...attachments];
                                        newAtt.splice(index, 1);
                                        setAttachments(newAtt);
                                    }}
                                >
                                    <Ionicons name="close-circle" size={22} color={COLORS.error} />
                                </TouchableOpacity>
                            </MotiView>
                        ))}
                    </View>
                </ScrollView>

                {/* Modern Toolbar */}
                <MotiView
                    from={{ translateY: 100 }}
                    animate={{ translateY: 0 }}
                    transition={{ type: 'spring', delay: 300 }}
                    style={styles.toolbar}
                >
                    <View style={styles.toolGroup}>
                        <TouchableOpacity style={styles.toolIcon} onPress={pickImage}>
                            <Ionicons name="images-outline" size={24} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.toolIcon} onPress={() => {
                            if (!cameraPermission?.granted) requestCameraPermission();
                            setCameraVisible(true);
                        }}>
                            <Ionicons name="camera-outline" size={24} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[styles.micButton, isRecording && { backgroundColor: COLORS.error }]}
                        onPress={isRecording ? stopRecording : startRecording}
                    >
                        <Ionicons name={isRecording ? "stop" : "mic"} size={28} color="#fff" />
                    </TouchableOpacity>

                    <View style={styles.toolGroup}>
                        <TouchableOpacity style={styles.toolIcon} onPress={handleCollabPress}>
                            <Ionicons name="people-outline" size={24} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.toolIcon} onPress={handleLocation} disabled={isFetchingLocation}>
                            {isFetchingLocation ? <ActivityIndicator size="small" color={COLORS.primary} /> : <Ionicons name="location-outline" size={24} color={COLORS.textSecondary} />}
                        </TouchableOpacity>
                    </View>
                </MotiView>
            </KeyboardAvoidingView>

            {/* Camera Modal */}
            <Modal visible={cameraVisible} animationType="slide">
                <CameraView style={styles.camera} ref={cameraRef}>
                    <View style={styles.cameraControls}>
                        <TouchableOpacity onPress={() => setCameraVisible(false)} style={styles.closeCamera}>
                            <Text style={styles.textWhite}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={takePhoto} style={styles.captureButton}>
                            <View style={styles.captureInner} />
                        </TouchableOpacity>
                    </View>
                </CameraView>
            </Modal>

            {/* Collaboration Modal */}
            <Modal visible={collabVisible} animationType="fade" transparent>
                <View style={styles.modalOverlay}>
                    <MotiView
                        from={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={styles.modalContent}
                    >
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Collab with a Friend</Text>
                            <TouchableOpacity onPress={() => setCollabVisible(false)}>
                                <Ionicons name="close" size={24} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.modalSubtitle}>Tag a friend to share this memory.</Text>

                        <TextInput
                            style={styles.modalInput}
                            placeholder="Friend's Email or Username"
                            placeholderTextColor="#ccc"
                            value={collabEmail}
                            onChangeText={setCollabEmail}
                            autoCapitalize="none"
                        />

                        <TouchableOpacity
                            style={styles.inviteButton}
                            onPress={async () => {
                                const email = collabEmail.trim();
                                if (email === '') {
                                    Alert.alert("Error", "Please enter a valid user email.");
                                    return;
                                }
                                
                                try {
                                    // Verify user exists in Firebase
                                    const methods = await fetchSignInMethodsForEmail(auth, email);
                                    if (methods.length === 0) {
                                        Alert.alert("User Not Found", "No registered account uses this email address. Please ask them to sign up first.");
                                        return;
                                    }

                                    // Valid User Found
                                    setText(prev => prev + `\n\n🤝 Collaborating with: @${email}`);
                                    Alert.alert("Invite Sent!", `${email} has been tagged in this entry.`);
                                    setCollabEmail('');
                                    setCollabVisible(false);
                                } catch (error: any) {
                                    Alert.alert("Error Validating User", error.message);
                                }
                            }}
                        >
                            <Text style={styles.inviteText}>Send Invite</Text>
                        </TouchableOpacity>
                    </MotiView>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
    },
    iconBtn: { padding: 8 },
    date: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    saveBtn: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        ...SHADOWS.light,
    },
    saveText: { color: '#fff', fontWeight: 'bold' },

    scrollContent: { padding: 25, paddingBottom: 120 },
    titleInput: {
        fontSize: 28,
        fontWeight: '800',
        color: COLORS.text,
        marginBottom: 10,
    },
    textInput: {
        fontSize: 18,
        color: COLORS.text,
        lineHeight: 28,
        minHeight: 100,
        textAlignVertical: 'top',
    },

    attachmentsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 30,
    },
    mediaWrapper: {
        marginRight: 15,
        marginBottom: 15,
    },
    attachedImage: {
        width: 100,
        height: 100,
        borderRadius: 16,
    },
    audioBubble: {
        width: 100,
        height: 100,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    audioText: {
        marginTop: 5,
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    removeMedia: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: '#fff',
        borderRadius: 12,
    },

    toolbar: {
        position: 'absolute',
        bottom: 30,
        left: 20,
        right: 20,
        height: 70,
        backgroundColor: '#fff',
        borderRadius: 35,
        borderWidth: 1,
        borderColor: '#f0f0f0',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        ...SHADOWS.medium,
    },
    toolGroup: {
        flexDirection: 'row',
        gap: 15,
    },
    toolIcon: {
        padding: 5,
    },
    micButton: {
        top: -20,
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#fff',
        ...SHADOWS.medium,
    },

    camera: { flex: 1 },
    cameraControls: {
        position: 'absolute', bottom: 50, left: 0, right: 0,
        flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center'
    },
    captureButton: {
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center', alignItems: 'center',
    },
    captureInner: {
        width: 60, height: 60, borderRadius: 30, backgroundColor: '#fff',
    },
    closeCamera: { padding: 20 },
    textWhite: { color: '#fff', fontSize: 18, fontWeight: '600' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContent: { width: '100%', backgroundColor: '#fff', borderRadius: 24, padding: 25, ...SHADOWS.medium },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
    modalSubtitle: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 20 },
    modalInput: { backgroundColor: '#f8f9ff', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#eee', fontSize: 16, marginBottom: 20, color: COLORS.text },
    inviteButton: { backgroundColor: COLORS.primary, padding: 16, borderRadius: 12, alignItems: 'center' },
    inviteText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
