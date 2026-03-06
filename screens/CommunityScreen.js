import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'readstreak_friends_v1';

const MOCK_INITIAL = {
  incoming: [
    { id: 'r1', name: 'Sarah Kim', email: 'sarah@example.com', sentAt: '2 hours ago' },
    { id: 'r2', name: 'Liam Torres', email: 'liam@example.com', sentAt: 'Yesterday' },
  ],
  outgoing: [
    { id: 'o1', name: 'marco@example.com', email: 'marco@example.com', sentAt: '3 days ago' },
  ],
  friends: [
    { id: 'f1', name: 'Jake Lee', email: 'jake@example.com', streak: 14 },
  ],
};

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function CommunityScreen() {
  const [emailInput, setEmailInput] = useState('');
  const [sending, setSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [friends, setFriends] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const data = JSON.parse(raw);
          setIncoming(data.incoming || []);
          setOutgoing(data.outgoing || []);
          setFriends(data.friends || []);
        } else {
          setIncoming(MOCK_INITIAL.incoming);
          setOutgoing(MOCK_INITIAL.outgoing);
          setFriends(MOCK_INITIAL.friends);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_INITIAL));
        }
      } catch (e) {
        setIncoming(MOCK_INITIAL.incoming);
        setOutgoing(MOCK_INITIAL.outgoing);
        setFriends(MOCK_INITIAL.friends);
      }
    };
    load();
  }, []);

  const persist = async (inc, out, fri) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ incoming: inc, outgoing: out, friends: fri }));
    } catch (e) {}
  };

  const handleSendRequest = async () => {
    const email = emailInput.trim().toLowerCase();
    if (!validateEmail(email)) {
      Alert.alert('Invalid email', 'Please enter a valid email address.');
      return;
    }
    const allEmails = [...incoming, ...outgoing, ...friends].map(x => x.email.toLowerCase());
    if (allEmails.includes(email)) {
      Alert.alert('Already added', 'You already have a connection with this email.');
      return;
    }
    setSending(true);
    await new Promise(r => setTimeout(r, 600));
    const newRequest = { id: `o-${Date.now()}`, name: email, email, sentAt: 'Just now' };
    const newOutgoing = [...outgoing, newRequest];
    setOutgoing(newOutgoing);
    await persist(incoming, newOutgoing, friends);
    setEmailInput('');
    setSending(false);
    setSuccessMsg(`Request sent to ${email}`);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleAccept = async (request) => {
    const newFriend = { id: `f-${Date.now()}`, name: request.name, email: request.email, streak: 0 };
    const newIncoming = incoming.filter(r => r.id !== request.id);
    const newFriends = [...friends, newFriend];
    setIncoming(newIncoming);
    setFriends(newFriends);
    await persist(newIncoming, outgoing, newFriends);
  };

  const handleDecline = async (request) => {
    Alert.alert('Decline request?', `Remove friend request from ${request.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Decline', style: 'destructive',
        onPress: async () => {
          const newIncoming = incoming.filter(r => r.id !== request.id);
          setIncoming(newIncoming);
          await persist(newIncoming, outgoing, friends);
        },
      },
    ]);
  };

  const handleCancelOutgoing = async (request) => {
    Alert.alert('Cancel request?', `Cancel request to ${request.email}?`, [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Cancel Request', style: 'destructive',
        onPress: async () => {
          const newOutgoing = outgoing.filter(r => r.id !== request.id);
          setOutgoing(newOutgoing);
          await persist(incoming, newOutgoing, friends);
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.screenTitle}>Friends</Text>

        {/* ── Add Friend ─────────────────────────────────────────────────── */}
        <View style={styles.addSection}>
          <Text style={styles.addLabel}>Add friend by email</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.emailInput}
              value={emailInput}
              onChangeText={setEmailInput}
              placeholder="friend@email.com"
              placeholderTextColor="#b8a98c"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!emailInput.trim() || sending) && styles.sendBtnDisabled]}
              onPress={handleSendRequest}
              disabled={!emailInput.trim() || sending}
              activeOpacity={0.75}
            >
              <Text style={styles.sendBtnText}>{sending ? '...' : 'Add'}</Text>
            </TouchableOpacity>
          </View>
          {successMsg ? <Text style={styles.successMsg}>✓ {successMsg}</Text> : null}
        </View>

        {/* ── Friend Requests (Incoming) ──────────────────────────────────── */}
        {incoming.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Friend Requests
              <Text style={styles.sectionCount}> ({incoming.length})</Text>
            </Text>
            {incoming.map(req => (
              <View key={req.id} style={styles.card}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{req.name[0].toUpperCase()}</Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName}>{req.name}</Text>
                  <Text style={styles.cardMeta}>{req.email} · {req.sentAt}</Text>
                </View>
                <View style={styles.cardActions}>
                  <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAccept(req)}>
                    <Text style={styles.acceptText}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.declineBtn} onPress={() => handleDecline(req)}>
                    <Text style={styles.declineText}>Decline</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ── Pending (Outgoing) ──────────────────────────────────────────── */}
        {outgoing.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pending</Text>
            {outgoing.map(req => (
              <View key={req.id} style={styles.card}>
                <View style={[styles.avatar, styles.avatarPending]}>
                  <Text style={styles.avatarText}>{req.email[0].toUpperCase()}</Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName}>{req.email}</Text>
                  <Text style={styles.cardMeta}>Sent {req.sentAt}</Text>
                </View>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancelOutgoing(req)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* ── Friends ─────────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            My Friends
            {friends.length > 0 && <Text style={styles.sectionCount}> ({friends.length})</Text>}
          </Text>
          {friends.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📖</Text>
              <Text style={styles.emptyTitle}>No friends yet</Text>
              <Text style={styles.emptySub}>Add friends above to see their reading streaks</Text>
            </View>
          ) : (
            friends.map(f => (
              <View key={f.id} style={[styles.card, styles.friendCard]}>
                <View style={[styles.avatar, styles.avatarFriend]}>
                  <Text style={styles.avatarText}>{f.name[0].toUpperCase()}</Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName}>{f.name}</Text>
                  <Text style={styles.cardMeta}>{f.email}</Text>
                </View>
                {f.streak > 0 && (
                  <Text style={styles.streakBadge}>🔥 {f.streak}d</Text>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f6f1' },
  scroll: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 40 },

  screenTitle: { fontSize: 26, fontWeight: '800', color: '#3d2c1e', marginBottom: 20 },

  // Add Friend
  addSection: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#7b5e3b',
    shadowOpacity: 0.07,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  addLabel: { fontSize: 13, fontWeight: '600', color: '#7b5e3b', marginBottom: 10 },
  inputRow: { flexDirection: 'row', gap: 8 },
  emailInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#e0d8c3',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#3d2c1e',
    backgroundColor: '#faf8f4',
  },
  sendBtn: {
    backgroundColor: '#e67e22',
    borderRadius: 10,
    paddingHorizontal: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  successMsg: { marginTop: 8, color: '#4caf50', fontSize: 13, fontWeight: '600' },

  // Sections
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#3d2c1e', marginBottom: 10 },
  sectionCount: { color: '#9a845e', fontWeight: '500' },

  // Cards
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#7b5e3b',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  friendCard: { borderLeftWidth: 3, borderLeftColor: '#e67e22' },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e67e22',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarPending: { backgroundColor: '#c5b89a' },
  avatarFriend: { backgroundColor: '#7b5e3b' },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 14, fontWeight: '700', color: '#3d2c1e', marginBottom: 2 },
  cardMeta: { fontSize: 12, color: '#9a845e' },
  cardActions: { flexDirection: 'column', gap: 5 },
  acceptBtn: {
    backgroundColor: '#e67e22',
    borderRadius: 7,
    paddingHorizontal: 12,
    paddingVertical: 5,
    alignItems: 'center',
  },
  acceptText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  declineBtn: {
    backgroundColor: '#f0ebe0',
    borderRadius: 7,
    paddingHorizontal: 12,
    paddingVertical: 5,
    alignItems: 'center',
  },
  declineText: { color: '#9a845e', fontSize: 12, fontWeight: '600' },
  cancelBtn: {
    backgroundColor: '#f0ebe0',
    borderRadius: 7,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  cancelText: { color: '#9a845e', fontSize: 12, fontWeight: '600' },
  streakBadge: { fontSize: 13, fontWeight: '700', color: '#e67e22' },

  // Empty
  emptyState: {
    alignItems: 'center',
    paddingVertical: 28,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  emptyEmoji: { fontSize: 32, marginBottom: 8 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#3d2c1e', marginBottom: 4 },
  emptySub: { fontSize: 13, color: '#9a845e', textAlign: 'center', paddingHorizontal: 20 },
});
