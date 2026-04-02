import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import OnboardingScreen from './screens/OnboardingScreen';
import ContentScreen from './screens/ContentScreen';
import CommunityScreen from './screens/CommunityScreen';
import PricingScreen from './screens/PricingScreen';
import { NotificationPrompt } from './components/NotificationPrompt';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#f9f6f1',
          borderTopColor: '#e0d8c3',
          borderTopWidth: 1,
          paddingBottom: 6,
          paddingTop: 6,
          height: 58,
        },
        tabBarActiveTintColor: '#e67e22',
        tabBarInactiveTintColor: '#b8a98c',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="Home"
        component={ContentScreen}
        options={{
          tabBarLabel: 'Today',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>📖</Text>,
        }}
      />
      <Tab.Screen
        name="Community"
        component={CommunityScreen}
        options={{
          tabBarLabel: 'Friends',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>👥</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isSignedIn, setIsSignedIn] = useState(null);
  const [initialRoute, setInitialRoute] = useState('Main');

  useEffect(() => {
    const init = async () => {
      // ── Handle Stripe success redirect on web ──────────────────────────────
      if (typeof window !== 'undefined' && window.location && window.location.search) {
        const params = new URLSearchParams(window.location.search);
        const payment = params.get('payment');

        if (payment === 'freeze-success') {
          // Award the freeze
          try {
            const val = await AsyncStorage.getItem('streak_freezes');
            const count = val ? parseInt(val) : 0;
            await AsyncStorage.setItem('streak_freezes', String(count + 1));
            await AsyncStorage.setItem('freeze_just_bought', 'true');
          } catch (e) { /* ignore */ }
          // Clean the URL so it doesn't re-trigger on refresh
          window.history.replaceState({}, '', '/');
        } else if (payment === 'coffee-success') {
          try {
            await AsyncStorage.setItem('has_bought_coffee', 'true');
            await AsyncStorage.setItem('coffee_just_bought', 'true');
          } catch (e) { /* ignore */ }
          window.history.replaceState({}, '', '/');
        } else if (payment === 'failed' || payment === 'cancelled') {
          // Just clean the URL — user stays on current screen
          window.history.replaceState({}, '', '/');
        }
      }

      // DEV: always signed in on web so ContentScreen always loads
      setIsSignedIn(true);
    };

    init();
  }, []);

  if (isSignedIn === null) return null;

  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName={isSignedIn ? 'Main' : 'Onboarding'}>
          <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Main" component={TabNavigator} options={{ headerShown: false }} />
          <Stack.Screen
            name="Pricing"
            component={PricingScreen}
            options={{
              headerShown: true,
              title: 'Plans & Pricing',
              headerStyle: { backgroundColor: '#f9f6f1' },
              headerTintColor: '#7b5e3b',
              headerShadowVisible: false,
              headerBackTitle: 'Back',
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
      <NotificationPrompt />
    </View>
  );
}
