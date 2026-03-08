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
  TouchableOpacity,

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

const SHELF_KEY = 'readstreak_shelf_v1';
const INITIAL_SHELF = [
  { id: '1', title: 'Atomic Habits', author: 'James Clear', emoji: '⚛️', color: '#fff3e0' },
  { id: '2', title: 'Deep Work', author: 'Cal Newport', emoji: '🧠', color: '#e8f5e9' },
  { id: '3', title: 'The Alchemist', author: 'Paulo Coelho', emoji: '✨', color: '#ede7f6' },
];

function getFormattedDate() {
  const now = new Date();
  return now.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
}

export default function ContentScreen({ navigation }) {
  const [readCount, setReadCount] = useState(0);
  const [streak, setStreak] = useState(3);

  // Recommendation form state
  const [recUrl, setRecUrl] = useState('');
  const [recNote, setRecNote] = useState('');
  const [thanks, setThanks] = useState(false);
  const [showRecommend, setShowRecommend] = useState(false);

  // ─── Shelf state ──────────────────────────────────────────────────────────
  const [shelf, setShelf] = useState(INITIAL_SHELF);
  const [showAddBook, setShowAddBook] = useState(false);
  const [newBookTitle, setNewBookTitle] = useState('');
  const [newBookAuthor, setNewBookAuthor] = useState('');

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

      // Load shelf
      const shelfRaw = await AsyncStorage.getItem(SHELF_KEY);
      if (shelfRaw) {
        try { setShelf(JSON.parse(shelfRaw)); } catch (e) {}
      }
    };
    loadData();
  }, []);

  // ─── Shelf helpers ─────────────────────────────────────────────────────────
  const BOOK_COLORS = ['#fff3e0', '#e8f5e9', '#ede7f6', '#e3f2fd', '#fce4ec', '#f3e5f5'];
  const BOOK_EMOJIS = ['📗', '📘', '📙', '📕', '📓', '📔'];

  const addBook = async () => {
    if (!newBookTitle.trim()) return;
    const idx = shelf.length % BOOK_COLORS.length;
    const newBook = {
      id: `b-${Date.now()}`,
      title: newBookTitle.trim(),
      author: newBookAuthor.trim() || 'Unknown',
      emoji: BOOK_EMOJIS[idx],
      color: BOOK_COLORS[idx],
    };
    const updated = [...shelf, newBook];
    setShelf(updated);
    await AsyncStorage.setItem(SHELF_KEY, JSON.stringify(updated));
    setNewBookTitle('');
    setNewBookAuthor('');
    setShowAddBook(false);
  };

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

        {/* ── My Shelf Section ─────────────────────────────────────────────── */}
        <View style={styles.shelfSection}>
          <View style={styles.shelfHeader}>
            <Text style={styles.shelfTitle}>📚 My Shelf</Text>
            <TouchableOpacity onPress={() => setShowAddBook(!showAddBook)} style={styles.addBookBtn}>
              <Text style={styles.addBookBtnText}>+ Add</Text>
            </TouchableOpacity>
          </View>

          {/* Add Book inline form */}
          {showAddBook && (
            <View style={styles.addBookForm}>
              <TextInput
                style={styles.bookInput}
                placeholder="Book title"
                placeholderTextColor="#b8a98c"
                value={newBookTitle}
                onChangeText={setNewBookTitle}
              />
              <TextInput
                style={styles.bookInput}
                placeholder="Author (optional)"
                placeholderTextColor="#b8a98c"
                value={newBookAuthor}
                onChangeText={setNewBookAuthor}
              />
              <TouchableOpacity style={styles.addBookSaveBtn} onPress={addBook}>
                <Text style={styles.addBookSaveBtnText}>Add to Shelf</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Horizontal book scroll — scrolls naturally no matter how many books */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.shelfScrollContent}
          >
            {shelf.map((book) => (
              <View key={book.id} style={[styles.bookCard, { backgroundColor: book.color }]}>
                <Text style={styles.bookEmoji}>{book.emoji}</Text>
                <Text style={styles.bookTitle} numberOfLines={2}>{book.title}</Text>
                <Text style={styles.bookAuthor} numberOfLines={1}>{book.author}</Text>
              </View>
            ))}
            {shelf.length === 0 && (
              <View style={styles.shelfEmpty}>
                <Text style={styles.shelfEmptyText}>Add your first book! ☝️</Text>
              </View>
            )}
          </ScrollView>
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

        {/* ── Premium Upsell Banner ─────────────────────────────────────────── */}
        <TactileButton
          style={styles.premiumBanner}
          onPress={() => navigation.navigate('Pricing')}
        >
          <Text style={styles.premiumBannerText}>✦ Go Premium — protect your streak</Text>
          <Text style={styles.premiumBannerSub}>₱99/mo · 2 freezes + rest days →</Text>
        </TactileButton>
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

  // ── Shelf ─────────────────────────────────────────────────────────────────
  shelfSection: {
    marginTop: 22,
    marginBottom: 4,
  },
  shelfHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  shelfTitle: { fontSize: 15, fontWeight: '700', color: '#3d2c1e' },
  shelfHeaderRight: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  viewAllBtn: {
    backgroundColor: '#f5f0e8',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#e0d8c3',
  },
  viewAllText: { fontSize: 12, color: '#7b5e3b', fontWeight: '600' },
  addBookBtn: {
    backgroundColor: '#e67e22',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  addBookBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  // Add book form
  addBookForm: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0d8c3',
  },
  bookInput: {
    borderWidth: 1.5,
    borderColor: '#e0d8c3',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#3d2c1e',
    marginBottom: 8,
    backgroundColor: '#faf8f4',
  },
  addBookFormActions: { flexDirection: 'row', gap: 8 },
  addBookSaveBtn: {
    flex: 1,
    backgroundColor: '#e67e22',
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: 'center',
  },
  addBookSaveBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  addBookCancelBtn: {
    flex: 1,
    backgroundColor: '#e0d8c3',
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: 'center',
  },
  addBookCancelBtnText: { color: '#7b5e3b', fontWeight: '600', fontSize: 13 },

  // Shelf horizontal scroll
  shelfScrollWrapper: { position: 'relative' },
  shelfScrollContent: { paddingRight: 20, gap: 12 },
  bookCard: {
    width: 110,
    borderRadius: 12,
    padding: 12,
    justifyContent: 'flex-end',
    minHeight: 130,
    shadowColor: '#7b5e3b',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  bookEmoji: { fontSize: 32, marginBottom: 8 },
  bookTitle: { fontSize: 12, fontWeight: '700', color: '#3d2c1e', marginBottom: 2 },
  bookAuthor: { fontSize: 10, color: '#7b5e3b' },
  shelfEmpty: {
    width: 200,
    height: 130,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f0e8',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e0d8c3',
    borderStyle: 'dashed',
  },
  shelfEmptyText: { color: '#9a845e', fontSize: 13 },
  shelfFadeRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 32,
    backgroundColor: 'transparent',
    // React Native doesn't support CSS gradients natively, so use a simple overlay
  },

  // View All Modal
  modalContainer: { flex: 1, backgroundColor: '#f9f6f1' },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 56,
    borderBottomWidth: 1,
    borderBottomColor: '#e0d8c3',
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#3d2c1e' },
  modalClose: { fontSize: 14, color: '#e67e22', fontWeight: '600' },
  bookListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
    shadowColor: '#7b5e3b',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  bookListEmoji: { fontSize: 28, marginRight: 14 },
  bookListTitle: { fontSize: 14, fontWeight: '700', color: '#3d2c1e', marginBottom: 2 },
  bookListAuthor: { fontSize: 12, color: '#7b5e3b' },

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

  // ── Premium Banner ──────────────────────────────────────────────────────────
  premiumBanner: {
    backgroundColor: '#fff3e0',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderWidth: 1.5,
    borderColor: '#f0c070',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 4,
  },
  premiumBannerText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#e67e22',
    marginBottom: 2,
  },
  premiumBannerSub: {
    fontSize: 12,
    color: '#b8a98c',
  },

});