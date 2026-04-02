/**
 * NotificationPrompt.js
 *
 * Requests notification permissions and registers device for push notifications.
 * Displays a dismissible prompt if notifications aren't yet enabled.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

const NOTIFICATION_PROMPT_DISMISSED_KEY = 'notification_prompt_dismissed';
const DEVICE_TOKEN_KEY = 'expo_push_token';

export function NotificationPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkAndShowPrompt();
  }, []);

  const checkAndShowPrompt = async () => {
    // Skip on web for now (web notifications work differently)
    if (Platform.OS === 'web') return;

    try {
      // Check if user already dismissed the prompt
      const dismissed = await AsyncStorage.getItem(NOTIFICATION_PROMPT_DISMISSED_KEY);
      if (dismissed === 'true') return;

      // Check if notifications are already enabled
      const { status } = await Notifications.getPermissionsAsync();
      if (status === 'granted') {
        // Notifications already enabled, don't show prompt
        // But ensure we have a token registered
        await registerToken();
        return;
      }

      // Show prompt since notifications aren't enabled
      setShowPrompt(true);
    } catch (error) {
      console.error('Error checking notification permission:', error);
    }
  };

  const registerToken = async () => {
    if (Platform.OS === 'web') return;

    try {
      const token = await Notifications.getExpoPushTokenAsync();
      if (token.data) {
        await AsyncStorage.setItem(DEVICE_TOKEN_KEY, token.data);
        console.log('Expo Push Token registered:', token.data);
      }
    } catch (error) {
      console.error('Error registering push token:', error);
    }
  };

  const handleEnableNotifications = async () => {
    setLoading(true);
    try {
      const { status } = await Notifications.requestPermissionsAsync();

      if (status === 'granted') {
        // Permission granted, register the token
        await registerToken();
        setShowPrompt(false);
        // Optional: Show success message
        Alert.alert('Success', 'Notifications enabled! You\'ll now receive updates about ReadStreak.');
      } else {
        Alert.alert('Permission Denied', 'Notifications are not enabled. You can enable them in app settings.');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      Alert.alert('Error', 'Failed to request notification permission.');
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = async () => {
    try {
      await AsyncStorage.setItem(NOTIFICATION_PROMPT_DISMISSED_KEY, 'true');
      setShowPrompt(false);
    } catch (error) {
      console.error('Error dismissing prompt:', error);
    }
  };

  if (!showPrompt) return null;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Stay Updated 🔔</Text>
        <Text style={styles.message}>
          Get notified about ReadStreak milestones, friend nudges, and new features.
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleEnableNotifications}
            disabled={loading}
          >
            <Text style={styles.primaryButtonText}>
              {loading ? 'Enabling...' : 'Enable Notifications'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleDismiss}
            disabled={loading}
          >
            <Text style={styles.secondaryButtonText}>Maybe Later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 104,
    left: 16,
    right: 16,
    zIndex: 50,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c2c2c',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 16,
  },
  buttonContainer: {
    gap: 10,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#e67e22',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  secondaryButton: {
    backgroundColor: '#f5f5f5',
  },
  secondaryButtonText: {
    color: '#666666',
    fontWeight: '600',
    fontSize: 14,
  },
});
