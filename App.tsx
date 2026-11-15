import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootStackParamList } from './src/types';
import { HomeScreen } from './src/screens/HomeScreen';
import { ScannerScreen } from './src/screens/ScannerScreen';
import { ContactPreviewScreen } from './src/screens/ContactPreviewScreen';
import { GreetingPreviewScreen } from './src/screens/GreetingPreviewScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { getDatabase } from './src/database/database';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  useEffect(() => {
    // Warm up SQLite database on boot
    getDatabase().catch((err) => console.error('Database initialization error:', err));
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen
            name="Scanner"
            component={ScannerScreen}
            options={{ animation: 'fade' }}
          />
          <Stack.Screen name="ContactPreview" component={ContactPreviewScreen} />
          <Stack.Screen name="GreetingPreview" component={GreetingPreviewScreen} />
          <Stack.Screen name="History" component={HistoryScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
