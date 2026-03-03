import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

import OnboardingScreen from './screens/OnboardingScreen';
import ContentScreen from './screens/ContentScreen';
import PricingScreen from './screens/PricingScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [isSignedIn, setIsSignedIn] = useState(null);

  useEffect(() => {
    const checkSignIn = async () => {
      // DEV: always signed in on web so ContentScreen loads directly
      setIsSignedIn(true);
    };
    checkSignIn();
  }, []);

  if (isSignedIn === null) return null; // or a loading spinner

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={isSignedIn ? "Content" : "Onboarding"}>
        <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Content" component={ContentScreen} options={{ headerShown: false }} />
        <Stack.Screen
          name="Pricing"
          component={PricingScreen}
          options={{
            headerShown: true,
            title: 'Open Beta',
            headerStyle: { backgroundColor: '#f9f6f1' },
            headerTintColor: '#7b5e3b',
            headerShadowVisible: false,
            headerBackTitle: 'Back',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}