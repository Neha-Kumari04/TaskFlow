import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '../screens/HomeScreen';
import TaskListScreen from '../screens/TaskListScreen';
import TaskFormScreen from '../screens/TaskFormScreen';
import TaskDetailScreen from '../screens/TaskDetailScreen';
import BulkUploadScreen from '../screens/BulkUploadScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { useTheme } from '../theme/ThemeContext';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TAB_ICONS = {
  Home: ['home', 'home-outline'],
  Tasks: ['list', 'list-outline'],
  Settings: ['settings', 'settings-outline'],
};

function TabBarIcon({ routeName, focused, color }) {
  const [active, inactive] = TAB_ICONS[routeName] || ['ellipse', 'ellipse-outline'];
  return <Ionicons name={focused ? active : inactive} size={22} color={color} />;
}

function MainTabs() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: Platform.OS === 'ios' ? 86 : 62,
          paddingTop: 6,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
        tabBarIcon: ({ focused, color }) => (
          <TabBarIcon routeName={route.name} focused={focused} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="Tasks" component={TaskListScreen} options={{ title: 'Tasks' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '800', fontSize: 16 },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen
        name="TaskDetail"
        component={TaskDetailScreen}
        options={({ navigation }) => ({
          title: 'Task details',
          headerBackTitle: 'Back',
          headerRight: () => (
            <Text
              onPress={() => {
                const id = navigation.getState().routes.slice(-1)[0]?.params?.id;
                if (id) navigation.navigate('TaskForm', { id });
              }}
              style={[styles.headerAction, { color: colors.primary }]}
            >
              Edit
            </Text>
          ),
        })}
      />
      <Stack.Screen
        name="TaskForm"
        component={TaskFormScreen}
        options={({ navigation, route }) => ({
          title: route.params?.id ? 'Edit task' : 'Add task',
          presentation: Platform.OS === 'ios' ? 'modal' : 'card',
          headerRight: () => (
            <Text
              onPress={() => navigation.goBack()}
              style={[styles.headerAction, { color: colors.textMuted }]}
            >
              Cancel
            </Text>
          ),
        })}
      />
      <Stack.Screen
        name="BulkUpload"
        component={BulkUploadScreen}
        options={{ title: 'Bulk upload' }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  headerAction: {
    fontSize: 14.5,
    fontWeight: '700',
    paddingHorizontal: 4,
  },
});
