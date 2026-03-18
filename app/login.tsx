import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { auth } from './config/firebase';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      if (isRegistering) {
        // Register
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (name) {
          await updateProfile(userCredential.user, { displayName: name });
        }
        Alert.alert('Success', 'Account created! Welcome ' + (name || 'Dreamer'));
      } else {
        // Login
        await signInWithEmailAndPassword(auth, email, password);
      }
      // Navigate to dashboard on success (both login and register)
      router.replace('/(tabs)');
    } catch (error: any) {
      let msg = error.message;
      if (msg.includes('auth/email-already-in-use')) msg = 'Email already in use.';
      if (msg.includes('auth/invalid-email')) msg = 'Invalid email address.';
      if (msg.includes('auth/weak-password')) msg = 'Password should be at least 6 characters.';
      if (msg.includes('auth/invalid-credential')) msg = 'Invalid email or password.';
      Alert.alert('Authentication Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <LinearGradient colors={['#f5f7fb', '#e0e7ff']} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.illustration}>🔐</Text>
            <Text style={styles.title}>{isRegistering ? 'Create Account' : 'Welcome Back 👋'}</Text>
            <Text style={styles.subtitle}>{isRegistering ? 'Start your journey' : 'Login to your diary'}</Text>
          </View>

          <View style={styles.form}>
            {isRegistering && (
              <TextInput
                style={styles.input}
                placeholder="Display Name (Optional)"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            )}

            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <Pressable
              style={({ pressed }) => [styles.button, pressed && { opacity: 0.9 }]}
              onPress={handleAuth}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>{isRegistering ? 'Sign Up' : 'Login'}</Text>
              )}
            </Pressable>

            <Pressable onPress={() => setIsRegistering(!isRegistering)} style={styles.switchParams}>
              <Text style={styles.registerText}>
                {isRegistering ? 'Already have an account? Login' : 'New user? Register'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 25,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  illustration: {
    fontSize: 60,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
  },
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  button: {
    backgroundColor: '#4f6df5',
    padding: 16,
    borderRadius: 12,
    marginTop: 10,
    alignItems: 'center',
    shadowColor: '#4f6df5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  switchParams: {
    marginTop: 25,
    padding: 10,
  },
  registerText: {
    textAlign: 'center',
    color: '#4f6df5',
    fontSize: 15,
    fontWeight: '600',
  },
});
