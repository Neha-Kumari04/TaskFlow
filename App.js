import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import * as ExpoSplashScreen from 'expo-splash-screen';

import * as Font from 'expo-font';

import RootNavigator from './src/navigation/RootNavigator';
import { TaskProvider, useTasks } from './src/context/TaskContext';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import SplashScreen from './src/components/SplashScreen';

// Keep native splash screen visible while JavaScript engine starts
ExpoSplashScreen.preventAutoHideAsync().catch(() => {});

function AppShell() {
  const { colors, isDark, isReady: isThemeReady } = useTheme();
  const { isLoading: isTasksLoading } = useTasks();
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    async function loadResources() {
      try {
        await Font.loadAsync({
          Ionicons: require('react-native-vector-icons/Fonts/Ionicons.ttf'),
          ionicons: require('react-native-vector-icons/Fonts/Ionicons.ttf'),
        });
      } catch (err) {
        console.warn('Failed to load Ionicons font:', err);
      } finally {
        setFontsLoaded(true);
      }
    }
    loadResources();
  }, []);

  const isAppReady = isThemeReady && !isTasksLoading && fontsLoaded;

  useEffect(() => {
    // Hide native splash once custom animated splash is rendered
    ExpoSplashScreen.hideAsync().catch(() => {});
  }, []);

  const navigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme : DefaultTheme).colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      notification: colors.danger,
    },
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar style={showSplash ? 'light' : isDark ? 'light' : 'dark'} />
      <SafeAreaView style={styles.safeTop} edges={['top']}>
        <NavigationContainer theme={navigationTheme}>
          <RootNavigator />
        </NavigationContainer>
      </SafeAreaView>

      {showSplash && (
        <SplashScreen
          isReady={isAppReady}
          onFinish={() => setShowSplash(false)}
        />
      )}
    </View>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ThemeProvider>
          <TaskProvider>
            <AppShell />
          </TaskProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeTop: {
    flex: 1,
  },
});
