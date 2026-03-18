import { Stack } from 'expo-router';
// import { StatusBar } from 'expo-status-bar'; // Moved to ThemeContext
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemeProvider } from './context/ThemeContext';
import { initDB } from './db/database';

export const unstable_settings = {
  initialRouteName: 'login',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    initDB();
  }, []);

  return (
    <ThemeProvider>
      {/* NavThemeProvider can also be updated here if we want to sync Nav theme with our custom theme fully, 
            but for now we'll keep it simple or remove if conflicts. 
            Actually, let's keep it but ideally we sync it with our context. 
            For this iteration, I'll rely on our custom ThemeProvider for our UI components. */}
      <Stack>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        <Stack.Screen name="newentry" options={{ title: 'New Entry', headerBackTitle: 'Back' }} />
        <Stack.Screen name="entries" options={{ title: 'Your Journey' }} />
        <Stack.Screen name="calendar" options={{ title: 'Calendar' }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen name="chat" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}
