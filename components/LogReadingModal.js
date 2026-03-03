/**
 * LogReadingModal.js
 *
 * "Log Reading" bottom-sheet modal with two tabs:
 *   - Pages: manual page count input
 *   - Time:  start/stop timer using wall-clock time (handles phone standby)
 *            + push notification when timer starts
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

const TIMER_START_KEY = 'reading_timer_start';
const NOTIFICATION_ID_KEY = 'reading_timer_notification_id';

const COLORS = {
  bg: '#f9f6f1',
  green: '#6d9e79',
  brown: '#7b5e3b',
  lightBrown: '#e0d8c3',
  cream: '#f5e9c8',
  dark: '#3e2c13',
  orange: '#e67e22',
  white: '#ffffff',
};

// ── Notification setup ────────────────────────────────────────────────────────

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

async function requestNotificationPermission() {
  if (Platform.OS === 'web') return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

async function sendTimerStartNotification() {
  if (Platform.OS === 'web') return null;
  try {
    const granted = await requestNotificationPermission();
    if (!granted) return null;
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Timer started ⏱️',
        body: 'Your reading timer is running.',
      },
      trigger: null,
    });
    return id;
  } catch (e) {
    console.warn('Notification error:', e);
    return null;
  }
}

async function cancelTimerNotification() {
  if (Platform.OS === 'web') return;
  try {
    const id = await AsyncStorage.getItem(NOTIFICATION_ID_KEY);
    if (id) {
      await Notifications.cancelScheduledNotificationAsync(id);
      await AsyncStorage.removeItem(NOTIFICATION_ID_KEY);
    }
  } catch (e) {}
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatElapsed(ms) {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) {
    return h + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }
  return m + ':' + String(s).padStart(2, '0');
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function LogReadingModal({ visible, onClose, bookTitle, onSave }) {
  const title = bookTitle || "Today's Session";
  const [tab, setTab] = useState('time');
  const [pages, setPages] = useState('');

  const [timerState, setTimerState] = useState('idle'); // 'idle' | 'running' | 'stopped'
  const [startTimestamp, setStartTimestamp] = useState(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [extraMs, setExtraMs] = useState(0);

  const intervalRef = useRef(null);

  // Resume timer if it was already running when modal opens
  useEffect(() => {
    if (!visible) return;
    AsyncStorage.getItem(TIMER_START_KEY).then((stored) => {
      if (stored) {
        const ts = parseInt(stored, 10);
        setStartTimestamp(ts);
        setElapsedMs(Date.now() - ts);
        setTimerState('running');
      }
    });
  }, [visible]);

  // Tick interval
  useEffect(() => {
    if (timerState === 'running' && startTimestamp) {
      intervalRef.current = setInterval(() => {
        setElapsedMs(Date.now() - startTimestamp); // wall-clock diff
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [timerState, startTimestamp]);

  // Reset state when modal closes (unless timer is running)
  useEffect(() => {
    if (!visible && timerState !== 'running') {
      setTimerState('idle');
      setElapsedMs(0);
      setExtraMs(0);
      setStartTimestamp(null);
      setPages('');
      setTab('time');
    }
  }, [visible]);

  const handleStartTimer = async () => {
    const now = Date.now();
    setStartTimestamp(now);
    setElapsedMs(0);
    setExtraMs(0);
    setTimerState('running');
    await AsyncStorage.setItem(TIMER_START_KEY, String(now));
    const notifId = await sendTimerStartNotification();
    if (notifId) await AsyncStorage.setItem(NOTIFICATION_ID_KEY, notifId);
  };

  const handlePauseTimer = async () => {
    const wallElapsed = startTimestamp ? Date.now() - startTimestamp : elapsedMs;
    clearInterval(intervalRef.current);
    setElapsedMs(wallElapsed);
    setStartTimestamp(null);
    setTimerState('paused');
    await AsyncStorage.removeItem(TIMER_START_KEY);
    await cancelTimerNotification();
  };

  const handleResumeTimer = async () => {
    // Adjust startTimestamp so elapsed time is preserved
    const now = Date.now();
    const adjustedStart = now - elapsedMs;
    setStartTimestamp(adjustedStart);
    setTimerState('running');
    await AsyncStorage.setItem(TIMER_START_KEY, String(adjustedStart));
    const notifId = await sendTimerStartNotification();
    if (notifId) await AsyncStorage.setItem(NOTIFICATION_ID_KEY, notifId);
  };

  const handleStopTimer = async () => {
    const wallElapsed = startTimestamp ? Date.now() - startTimestamp : elapsedMs;
    clearInterval(intervalRef.current);
    setElapsedMs(wallElapsed);
    setTimerState('stopped');
    await AsyncStorage.removeItem(TIMER_START_KEY);
    await cancelTimerNotification();
  };

  const handleReset = async () => {
    clearInterval(intervalRef.current);
    setTimerState('idle');
    setElapsedMs(0);
    setExtraMs(0);
    setStartTimestamp(null);
    await AsyncStorage.removeItem(TIMER_START_KEY);
    await cancelTimerNotification();
  };

  const addTime = (minutes) => {
    setExtraMs((prev) => prev + minutes * 60 * 1000);
  };

  const totalElapsedMs = elapsedMs + extraMs;

  const handleSave = async () => {
    if (tab === 'time') {
      if (totalElapsedMs === 0 && (timerState === 'idle' || timerState === 'paused')) {
        Alert.alert('No time logged', 'Start the timer first.');
        return;
      }
      if (timerState === 'running') {
        await handleStopTimer();
      }
      onSave && onSave({ type: 'time', ms: totalElapsedMs });
    } else {
      const p = parseInt(pages);
      if (!pages.trim() || isNaN(p) || p <= 0) {
        Alert.alert('Enter pages', 'Please enter the number of pages you read.');
        return;
      }
      onSave && onSave({ type: 'pages', pages: p });
    }
    await handleReset();
    onClose && onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }} />
            <Text style={styles.title}>Log Reading</Text>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.subtitle} numberOfLines={1}>{title}</Text>

          {/* Tabs */}
          <View style={styles.tabRow}>
            <TouchableOpacity style={[styles.tab, tab === 'pages' && styles.tabActive]} onPress={() => setTab('pages')}>
              <Text style={[styles.tabText, tab === 'pages' && styles.tabTextActive]}>Pages</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tab, tab === 'time' && styles.tabActive]} onPress={() => setTab('time')}>
              <Text style={[styles.tabText, tab === 'time' && styles.tabTextActive]}>Time</Text>
            </TouchableOpacity>
          </View>

          {/* Pages tab */}
          {tab === 'pages' && (
            <View style={styles.tabContent}>
              <Text style={styles.inputLabel}>Pages read</Text>
              <TextInput
                style={styles.pagesInput}
                value={pages}
                onChangeText={setPages}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor="#b8a98c"
                maxLength={5}
              />
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Time tab */}
          {tab === 'time' && (
            <View style={styles.tabContent}>

              {timerState === 'idle' && (
                <>
                  <Text style={styles.timerDisplayZero}>0:00</Text>
                  <TouchableOpacity style={styles.startBtn} onPress={handleStartTimer}>
                    <Text style={styles.startBtnText}>▶  Start</Text>
                  </TouchableOpacity>
                </>
              )}

              {timerState === 'running' && (
                <>
                  <Text style={styles.timerDisplay}>{formatElapsed(elapsedMs)}</Text>
                  <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
                    <TouchableOpacity style={[styles.stopBtn, { flex: 1, backgroundColor: '#b8860b' }]} onPress={handlePauseTimer}>
                      <Text style={styles.stopBtnText}>⏸  Pause</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.stopBtn, { flex: 1 }]} onPress={handleStopTimer}>
                      <Text style={styles.stopBtnText}>■  Stop</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {timerState === 'paused' && (
                <>
                  <Text style={styles.timerDisplay}>{formatElapsed(elapsedMs)}</Text>
                  <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
                    <TouchableOpacity style={[styles.startBtn, { flex: 1 }]} onPress={handleResumeTimer}>
                      <Text style={styles.startBtnText}>▶  Resume</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.stopBtn, { flex: 1 }]} onPress={handleStopTimer}>
                      <Text style={styles.stopBtnText}>■  Stop</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {timerState === 'stopped' && (
                <>
                  <Text style={styles.timerDisplay}>{formatElapsed(totalElapsedMs)}</Text>
                  <View style={styles.chipsRow}>
                    {[15, 30, 60].map((min) => (
                      <TouchableOpacity key={min} style={styles.chip} onPress={() => addTime(min)}>
                        <Text style={styles.chipText}>+{min}m</Text>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity style={styles.chip} onPress={() => addTime(60)}>
                      <Text style={styles.chipText}>+1h</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity onPress={handleReset}>
                    <Text style={styles.resetText}>Reset</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                    <Text style={styles.saveBtnText}>Save</Text>
                  </TouchableOpacity>
                </>
              )}

            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    paddingHorizontal: 24,
    minHeight: 400,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#d4c9b5',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#3e2c13',
    textAlign: 'center',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e0d8c3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#7b5e3b',
    fontSize: 14,
    fontWeight: '600',
  },
  subtitle: {
    textAlign: 'center',
    color: '#9a8070',
    fontSize: 14,
    marginBottom: 16,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#e0d8c3',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabActive: { backgroundColor: '#6d9e79' },
  tabText: { fontSize: 15, fontWeight: '600', color: '#7b5e3b' },
  tabTextActive: { color: '#ffffff' },
  tabContent: { alignItems: 'center' },
  inputLabel: {
    color: '#7b5e3b',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    alignSelf: 'flex-start',
    width: '100%',
  },
  pagesInput: {
    width: '100%',
    backgroundColor: '#f5e9c8',
    borderRadius: 10,
    padding: 14,
    fontSize: 18,
    textAlign: 'center',
    color: '#3e2c13',
    marginBottom: 16,
    fontWeight: '700',
  },
  timerDisplayZero: {
    fontSize: 72,
    fontWeight: '800',
    color: '#d4c9b5',
    letterSpacing: 2,
    marginVertical: 20,
  },
  timerDisplay: {
    fontSize: 72,
    fontWeight: '800',
    color: '#3e2c13',
    letterSpacing: 2,
    marginVertical: 20,
  },
  startBtn: {
    backgroundColor: '#6d9e79',
    borderRadius: 14,
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
  },
  startBtnText: { color: '#ffffff', fontSize: 17, fontWeight: '700' },
  stopBtn: {
    backgroundColor: '#e05050',
    borderRadius: 14,
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
    marginBottom: 8,
  },
  stopBtnText: { color: '#ffffff', fontSize: 17, fontWeight: '700' },
  chipsRow: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 10,
  },
  chip: {
    borderWidth: 1.5,
    borderColor: '#e0d8c3',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  chipText: { color: '#7b5e3b', fontSize: 14, fontWeight: '600' },
  resetText: {
    color: '#6d9e79',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
    marginTop: 4,
  },
  saveBtn: {
    backgroundColor: '#6d9e79',
    borderRadius: 14,
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
    marginTop: 4,
  },
  saveBtnText: { color: '#ffffff', fontSize: 17, fontWeight: '700' },
});
