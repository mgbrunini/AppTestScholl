import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { OfflineIndicator } from './src/components/OfflineIndicator';
import OfflineService from './src/services/OfflineService';
import { useEffect } from 'react';

export default function App() {
  useEffect(() => {
    OfflineService.init();
  }, []);

  return (
    <SafeAreaProvider>
      <OfflineIndicator />
      <AppNavigator />
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}
