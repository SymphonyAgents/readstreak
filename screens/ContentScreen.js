import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  TextInput,
  Alert,
  Modal,
  Share,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Dimensions } from 'react-native';

const screenHeight = Dimensions.get('window').height;
const ARTICLES = [
  {
    title: "The Power of Daily Reading",
    url: "https://www.nytimes.com/guides/smarterliving/how-to-be-better-at-stress",
    blurb: "A few minutes a day can transform your mind and habits.",
  },
  {
    title: "Why Books Still Matter",
    url: "https://www.theatlantic.com/magazine/archive/2020/01/why-books-matter/603040/",
    blurb: "Books shape our culture like nothing else.",
  },
  {
    title: "How to Build a Reading Habit",
    url: "https://jamesclear.com/reading-habit",
    blurb: "Make reading a joyful daily ritual.",
  },
];

function getFormattedDate() {
  const now = new Date();
  return now.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
}

const StreakIcon = () => <Text style={styles.icon}>🔥</Text>;

export default function ContentScreen() {
  const [readCount, setReadCount] = useState(0);
  const [streak, setStreak] = useState(3); // Dummy streak

  // Recommendation form state
  const [recUrl, setRecUrl] = useState('');
  const [recNote, setRecNote] = useState('');
  const [thanks, setThanks] = useState(false);
  const [showRecommend, setShowRecommend] = useState(false);

  // Share modal state
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const count = await AsyncStorage.getItem('read_count');
      setReadCount(count ? parseInt(count) : 0);

      const streakVal = await AsyncStorage.getItem('reading_streak');
      setStreak(streakVal ? parseInt(streakVal) : 3);
    };
    loadData();
  }, []);

  const openArticle = async (url) => {
    const newCount = readCount + 1;
    setReadCount(newCount);
    await AsyncStorage.setItem('read_count', newCount.toString());
    Linking.openURL(url);
  };

  // Handle recommendation submit
  const handleRecommend = async () => {
    if (!recUrl.trim()) {
      Alert.alert('Please enter a link to recommend.');
      return;
    }
    const newRec = {
      url: recUrl.trim(),
      note: recNote.trim(),
      timestamp: new Date().toISOString(),
    };
    try {
      const prev = await AsyncStorage.getItem('recommended_articles');
      let arr = prev ? JSON.parse(prev) : [];
      arr.push(newRec);
      await AsyncStorage.setItem('recommended_articles', JSON.stringify(arr));
      setRecUrl('');
      setRecNote('');
      setThanks(true);
      setTimeout(() => setThanks(false), 2000);
      setShowRecommend(false);
    } catch (e) {
      Alert.alert('Error', 'Could not save your recommendation.');
    }
  };

  // Handle share
  const handleShare = async () => {
    try {
      await Share.share({
        message: `🔥 I'm on a ${streak}-day reading streak on ReadStreak!\nYou've read ${readCount} times this week.\n\nBuild your reading habit: readstreak.app`,
        title: `🔥 ${streak}-Day Reading Streak!`,
      });
    } catch (e) {
      Alert.alert('Error', 'Could not open share dialog.');
    }
  };

  // Handle save
  const handleSave = () => {
    Alert.alert('Save Streak Card 📸', 'Take a screenshot to save your streak card!');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.date}>Today's Read – {getFormattedDate()}</Text>

      {/* Articles Section */}
      <View style={styles.articlesList}>
        {ARTICLES.slice(0, 3).map((article, index) => (
          <TouchableOpacity
            key={index}
            style={styles.articleRow}
            onPress={() => openArticle(article.url)}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{article.title}</Text>
              <Text style={styles.blurb}>{article.blurb}</Text>
            </View>
            <Text style={styles.arrow}>&gt;</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Streak and Read Count Section */}
      <View style={styles.centerSection}>
        <View style={styles.centerRow}>
          <StreakIcon />
          <Text style={styles.streakText}>{streak} day streak</Text>
        </View>
        <Text style={styles.counter}>You've read {readCount} times this week</Text>

        {/* Share Your Streak Button */}
        <TouchableOpacity
          style={styles.shareStreakButton}
          onPress={() => setShowShareModal(true)}
        >
          <Text style={styles.shareStreakButtonText}>Share your streak 📤</Text>
        </TouchableOpacity>
      </View>

      {/* Recommend Section */}
      <View style={styles.recommendSection}>
        {!showRecommend ? (
          <TouchableOpacity
            style={styles.recommendButton}
            onPress={() => setShowRecommend(true)}
          >
            <Text style={styles.recommendButtonText}>Recommend an article</Text>
          </TouchableOpacity>
        ) : (
          <>
            <Text style={styles.recommendTitle}>Recommend an article for others</Text>
            <TextInput
              style={styles.input}
              placeholder="Paste article link"
              value={recUrl}
              onChangeText={setRecUrl}
              autoCapitalize="none"
              keyboardType="url"
              placeholderTextColor="#b8a98c"
            />
            <TextInput
              style={[styles.input, { marginBottom: 10 }]}
              placeholder="Why do you recommend it? (optional)"
              value={recNote}
              onChangeText={setRecNote}
              placeholderTextColor="#b8a98c"
            />
            <View style={{ flexDirection: 'row', width: '100%', justifyContent: 'space-between' }}>
              <TouchableOpacity
                style={[styles.submitButton, { flex: 1, marginRight: 8 }]}
                onPress={handleRecommend}
              >
                <Text style={styles.submitButtonText}>Submit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.cancelButton, { flex: 1, marginLeft: 8 }]}
                onPress={() => {
                  setShowRecommend(false);
                  setRecUrl('');
                  setRecNote('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
            {thanks && <Text style={styles.thanks}>Thanks for your recommendation!</Text>}
          </>
        )}
      </View>

      {/* Share Modal */}
      <Modal
        visible={showShareModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowShareModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>

            {/* Share Card Preview */}
            <View style={styles.shareCard}>
              <Text style={styles.shareCardBrand}>🔥 ReadStreak</Text>
              <View style={styles.shareCardDivider} />
              <Text style={styles.shareCardStreak}>🔥 {streak}-DAY STREAK 🔥</Text>
              <Text style={styles.shareCardTagline}>You've built a reading habit!</Text>
              <View style={styles.shareCardDivider} />
              <Text style={styles.shareCardCount}>You've read {readCount} times this week</Text>
              <View style={styles.shareCardSpacer} />
              <Text style={styles.shareCardUrl}>readstreak.app</Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.shareButton}
                onPress={handleShare}
              >
                <Text style={styles.shareButtonText}>📤 Share</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
              >
                <Text style={styles.saveButtonText}>⬇️ Save</Text>
              </TouchableOpacity>
            </View>

            {/* Close Button */}
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowShareModal(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f9f6f1',
    justifyContent: 'flex-start',
  },
  date: {
    fontSize: 18,
    color: '#7b5e3b',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
    marginTop: 40,
  },
  centerSection: {
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 24,
  },
  centerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  icon: {
    fontSize: 22,
    marginRight: 6,
  },
  streakText: {
    fontSize: 16,
    color: '#e67e22',
    fontWeight: '600',
    marginLeft: 4,
  },
  counter: {
    color: '#7b5e3b',
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  shareStreakButton: {
    marginTop: 12,
    backgroundColor: '#e67e22',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 28,
    alignItems: 'center',
    shadowColor: '#e67e22',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  shareStreakButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
    letterSpacing: 0.3,
  },
  articlesList: {
    marginTop: 10,
    flexGrow: 0,
  },
  articleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
    borderBottomColor: '#ddd',
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3e2c13',
    marginBottom: 4,
  },
  blurb: {
    fontSize: 14,
    color: '#5a4630',
    fontStyle: 'italic',
  },
  arrow: {
    fontSize: 20,
    color: '#7b5e3b',
    marginLeft: 10,
  },
  recommendSection: {
    borderTopWidth: 1,
    borderTopColor: '#e0d8c3',
    marginTop: 18,
    paddingTop: 18,
    alignItems: 'center',
  },
  recommendButton: {
    backgroundColor: '#e0d8c3',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 30,
    alignItems: 'center',
    width: '100%',
  },
  recommendButtonText: {
    color: '#7b5e3b',
    fontWeight: 'bold',
    fontSize: 15,
  },
  recommendTitle: {
    fontSize: 15,
    color: '#7b5e3b',
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 4,
  },
  input: {
    width: '100%',
    backgroundColor: '#f5e9c8',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    fontSize: 14,
    color: '#3e2c13',
  },
  submitButton: {
    backgroundColor: '#7b5e3b',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 6,
  },
  submitButtonText: {
    color: '#f9f6f1',
    fontWeight: 'bold',
    fontSize: 15,
  },
  cancelButton: {
    backgroundColor: '#e0d8c3',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 6,
  },
  cancelButtonText: {
    color: '#7b5e3b',
    fontWeight: 'bold',
    fontSize: 15,
  },
  thanks: {
    color: '#e67e22',
    marginTop: 6,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(62, 44, 19, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    backgroundColor: '#f9f6f1',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    shadowColor: '#3e2c13',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },

  // Share Card
  shareCard: {
    width: '100%',
    backgroundColor: '#fff8ee',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e67e22',
    marginBottom: 20,
  },
  shareCardBrand: {
    fontSize: 18,
    fontWeight: '800',
    color: '#e67e22',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  shareCardDivider: {
    width: '80%',
    height: 1,
    backgroundColor: '#f0d9b5',
    marginVertical: 12,
  },
  shareCardStreak: {
    fontSize: 22,
    fontWeight: '900',
    color: '#3e2c13',
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  shareCardTagline: {
    fontSize: 13,
    color: '#7b5e3b',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  shareCardCount: {
    fontSize: 14,
    color: '#3e2c13',
    fontWeight: '600',
    textAlign: 'center',
  },
  shareCardSpacer: {
    height: 16,
  },
  shareCardUrl: {
    fontSize: 12,
    color: '#b8a98c',
    letterSpacing: 0.8,
    textAlign: 'center',
  },

  // Modal action buttons
  modalActions: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
    marginBottom: 12,
  },
  shareButton: {
    flex: 1,
    backgroundColor: '#e67e22',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  shareButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#7b5e3b',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  modalCloseButton: {
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  modalCloseText: {
    color: '#b8a98c',
    fontSize: 14,
    fontWeight: '500',
  },
});
