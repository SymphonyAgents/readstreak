/**
 * ContentScreen.js
 *
 * Main reading screen with all 10 moodboard micro-interactions:
 *
 *  1. 📖 Reading Lamp    — warm glow on article row press        (AnimatedArticleRow)
 *  2. 📄 Page Flip       — 3D flip before opening article        (AnimatedArticleRow)
 *  3. 🔥 Streak Flame    — flicker + burst tap on flame icon     (StreakFlame)
 *  4. 📊 Progress Fill   — bouncy progress bar, reads/goal       (ProgressFill)
 *  5. 👆 Tactile Button  — press-depth on all primary buttons    (TactileButton)
 *  6. ✓  Checkmark Draw  — SVG check draws itself after read     (AnimatedArticleRow)
 *  7. ☕ Coffee Steam    — ambient steam near date header        (CoffeeSteam)
 *  8. 🔖 Bookmark Slide  — slides in/out after submit            (BookmarkSlide)
 *  9. 🃏 Card Wobble     — lift + tilt on article press-in       (AnimatedArticleRow)
 * 10. 🎉 Confetti Burst  — confetti on milestone reads (×5)     (ConfettiBurst)
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  ScrollView,
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  AnimatedArticleRow,
  StreakFlame,
  ProgressFill,
  TactileButton,
  CoffeeSteam,
  BookmarkSlide,
  ConfettiBurst,
} from '../components/MicroInteractions';

const ARTICLES = [
  {
    title: 'The Power of Daily Reading',
    url: 'https://www.nytimes.com/guides/smarterliving/how-to-be-better-at-stress',
    blurb: 'A few minutes a day can transform your mind and habits.',
  },
  {
    title: 'Why Books Still Matter',
    url: 'https://www.theatlantic.com/magazine/archive/2020/01/why-books-matter/603040/',
    blurb: 'Books shape our culture like nothing else.',
  },
  {
    title: 'How to Build a Reading Habit',
    url: 'https://jamesclear.com/reading-habit',
    blurb: 'Make reading a joyful daily ritual.',
  },
];

function getFormattedDate() {
  const now = new Date();
  return now.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
}

export default function ContentScreen() {
  const [readCount, setReadCount] = useState(0);
  const [streak, setStreak] = useState(3);

  // Recommendation form state
  const [recUrl, setRecUrl] = useState('');
  const [recNote, setRecNote] = useState('');
  const [thanks, setThanks] = useState(false);
  const [showRecommend, setShowRecommend] = useState(false);

  // Interaction #8 — Bookmark Slide trigger
  const [bookmarkTrigger, setBookmarkTrigger] = useState(0);

  // Interaction #10 — Confetti Burst trigger + milestone tracking
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const lastMilestone = useRef(0);

  // ─── Load persisted data ───────────────────────────────────────────────────
  useEffect(() => {
    const loadData = async () => {
      const count = await AsyncStorage.getItem('read_count');
      setReadCount(count ? parseInt(count) : 0);

      const streakVal = await AsyncStorage.getItem('reading_streak');
      setStreak(streakVal ? parseInt(streakVal) : 3);
    };
    loadData();
  }, []);

  // ─── Confetti milestone check (interaction #10) ────────────────────────────
  useEffect(() => {
    if (readCount > 0 && readCount % 5 === 0 && readCount !== lastMilestone.current) {
      lastMilestone.current = readCount;
      setConfettiTrigger((prev) => prev + 1);
    }
  }, [readCount]);

  // ─── Open article handler ──────────────────────────────────────────────────
  const openArticle = async (url) => {
    const newCount = readCount + 1;
    setReadCount(newCount);
    await AsyncStorage.setItem('read_count', newCount.toString());

    Linking.openURL(url);
  };

  // ─── Recommend submit handler ──────────────────────────────────────────────
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
      setShowRecommend(false);

      // Trigger bookmark slide (interaction #8)
      setBookmarkTrigger((prev) => prev + 1);

      setTimeout(() => setThanks(false), 2000);
    } catch (e) {
      Alert.alert('Error', 'Could not save your recommendation.');
    }
  };

  return (
    <View style={styles.container}>
      {/* ── Interaction #8: Bookmark Slide overlay ─────────────────────────── */}
      <BookmarkSlide triggerKey={bookmarkTrigger} />

      {/* ── Interaction #10: Confetti Burst overlay ────────────────────────── */}
      <ConfettiBurst triggerKey={confettiTrigger} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Date Header with Coffee Steam ─────────────────────────────────── */}
        <View style={styles.headerRow}>
          {/* Interaction #7: Coffee Steam */}
          <CoffeeSteam />
          <Text style={styles.date}>Today's Read – {getFormattedDate()}</Text>
          <View style={{ width: 34 }} />
        </View>

        {/* ── Articles Section ──────────────────────────────────────────────── */}
        {/* Interactions #1 (Lamp) #2 (Flip) #6 (Check) #9 (Wobble) */}
        <View style={styles.articlesList}>
          {ARTICLES.slice(0, 3).map((article, index) => (
            <AnimatedArticleRow
              key={index}
              article={article}
              onPress={openArticle}
            />
          ))}
        </View>

        {/* ── Streak + Progress Section ─────────────────────────────────────── */}
        <View style={styles.centerSection}>
          {/* Row: Flame + streak text */}
          <View style={styles.centerRow}>
            {/* Interaction #3: Streak Flame */}
            <StreakFlame />
            <Text style={styles.streakText}>{streak} day streak</Text>
          </View>

          <Text style={styles.counter}>
            You've read {readCount} {readCount === 1 ? 'time' : 'times'} this week
          </Text>

          {/* Interaction #4: Progress Fill */}
          <ProgressFill readCount={readCount} />

          {/* Interaction #5: Share Streak — Tactile Button */}
          <TactileButton
            style={styles.shareStreakButton}
            onPress={() => Alert.alert('Streak shared! 🔥')}
          >
            <Text style={styles.shareStreakText}>Share streak 🔥</Text>
          </TactileButton>
        </View>

        {/* ── Recommend Section ─────────────────────────────────────────────── */}
        <View style={styles.recommendSection}>
          {!showRecommend ? (
            /* Interaction #5: Recommend — Tactile Button */
            <TactileButton
              style={styles.recommendButton}
              onPress={() => setShowRecommend(true)}
            >
              <Text style={styles.recommendButtonText}>Recommend an article</Text>
            </TactileButton>
          ) : (
            <>
              <Text style={styles.recommendTitle}>
                Recommend an article for others
              </Text>
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
              <View style={styles.formButtons}>
                {/* Interaction #5: Submit — Tactile Button */}
                <TactileButton
                  wrapperStyle={{ flex: 1, marginRight: 8 }}
                  style={styles.submitButton}
                  onPress={handleRecommend}
                >
                  <Text style={styles.submitButtonText}>Submit</Text>
                </TactileButton>

                {/* Interaction #5: Cancel — Tactile Button */}
                <TactileButton
                  wrapperStyle={{ flex: 1, marginLeft: 8 }}
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowRecommend(false);
                    setRecUrl('');
                    setRecNote('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TactileButton>
              </View>

              {thanks && (
                <Text style={styles.thanks}>
                  Thanks for your recommendation!
                </Text>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f6f1',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 0,
    paddingBottom: 40,
  },

  // ── Date header ─────────────────────────────────────────────────────────────
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 52,
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  date: {
    fontSize: 18,
    color: '#7b5e3b',
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },

  // ── Articles ─────────────────────────────────────────────────────────────────
  articlesList: {
    marginTop: 4,
  },

  // ── Streak / Progress ─────────────────────────────────────────────────────────
  centerSection: {
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 20,
  },
  centerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
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
    marginBottom: 2,
  },
  shareStreakButton: {
    backgroundColor: '#e67e22',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 14,
  },
  shareStreakText: {
    color: '#f9f6f1',
    fontWeight: 'bold',
    fontSize: 14,
  },

  // ── Recommend ─────────────────────────────────────────────────────────────────
  recommendSection: {
    borderTopWidth: 1,
    borderTopColor: '#e0d8c3',
    marginTop: 4,
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
    width: '100%',
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
  formButtons: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
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
});
