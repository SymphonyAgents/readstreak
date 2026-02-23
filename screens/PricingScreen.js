// screens/PricingScreen.js
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Platform,
} from 'react-native';
import { useFonts } from 'expo-font';
import {
  Fraunces_700Bold,
  Fraunces_400Regular,
} from '@expo-google-fonts/fraunces';
import { Caveat_400Regular, Caveat_600SemiBold } from '@expo-google-fonts/caveat';

// ─── Coffee links ────────────────────────────────────────────────────────────
// Replace these with your actual payment links
const COFFEE_LINK_PHP = 'https://buy.stripe.com/readstreak-php-99'; // ₱99 GCash / GrabPay / card
const COFFEE_LINK_USD = 'https://buy.stripe.com/readstreak-usd-199'; // $1.99 international

// Detect Philippines locale heuristic (device language / region)
function isPhilippines() {
  const locale =
    Platform.OS === 'ios'
      ? '' // RN doesn't expose locale easily; fall back to showing both
      : '';
  // For now, always show both — cleaner than guessing wrong
  return null;
}

const FEATURES = [
  { icon: '📚', label: 'Unlimited books', desc: 'Track as many as you\'re reading (or meaning to read 😅)' },
  { icon: '🔥', label: 'Streak tracking', desc: 'Daily reading streaks to keep you coming back' },
  { icon: '👥', label: 'Friends', desc: 'See what your friends are reading and cheer them on' },
  { icon: '🔔', label: 'Reminders', desc: 'Gentle nudges so your streak never dies' },
  { icon: '📤', label: 'Share your streak', desc: 'Brag (lovingly) about your reading habit' },
  { icon: '💡', label: 'Article picks', desc: 'Curated reads to inspire your next session' },
];

export default function PricingScreen() {
  const [fontsLoaded] = useFonts({
    Fraunces_700Bold,
    Fraunces_400Regular,
    Caveat_400Regular,
    Caveat_600SemiBold,
  });

  // Render with fallback fonts until custom fonts load
  const headingFont = fontsLoaded ? 'Fraunces_700Bold' : undefined;
  const caveatFont = fontsLoaded ? 'Caveat_600SemiBold' : undefined;
  const caveatRegular = fontsLoaded ? 'Caveat_400Regular' : undefined;

  const handleCoffee = (link) => {
    Linking.openURL(link).catch(() => {});
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ── */}
      <View style={styles.headerSection}>
        <Text style={[styles.betaBadge]}>✦ Open Beta ✦</Text>
        <Text style={[styles.headline, { fontFamily: headingFont }]}>
          Open Beta
        </Text>
        <Text style={[styles.subhead, { fontFamily: caveatFont }]}>
          everything's free while we're building
        </Text>
        <Text style={[styles.welcomeNote, { fontFamily: caveatRegular }]}>
          You're here early — and that means a lot to us 🙏
        </Text>
      </View>

      {/* ── Divider ── */}
      <View style={styles.divider} />

      {/* ── Features ── */}
      <View style={styles.featuresSection}>
        <Text style={styles.sectionLabel}>Everything included, for everyone</Text>

        {FEATURES.map((f, i) => (
          <View key={i} style={styles.featureRow}>
            <Text style={styles.featureIcon}>{f.icon}</Text>
            <View style={styles.featureText}>
              <Text style={styles.featureName}>{f.label}</Text>
              <Text style={styles.featureDesc}>{f.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* ── Divider ── */}
      <View style={styles.divider} />

      {/* ── Coming Soon ── */}
      <View style={styles.comingSoonCard}>
        <Text style={styles.comingSoonTitle}>✨ Premium features coming soon</Text>
        <Text style={styles.comingSoonText}>
          More powerful tools are on the way — reading goals, stats, book clubs, and more.
          {'\n\n'}
          <Text style={styles.comingSoonHighlight}>
            Early supporters get special perks.
          </Text>
          {' '}Stick around — we won't forget who believed in us first.
        </Text>
      </View>

      {/* ── Divider ── */}
      <View style={styles.divider} />

      {/* ── Coffee Tip Jar ── */}
      <View style={styles.coffeeCard}>
        <Text style={styles.coffeeEmoji}>☕</Text>
        <Text style={styles.coffeeTitle}>Buy us a coffee</Text>
        <Text style={[styles.coffeeTagline, { fontFamily: caveatFont }]}>
          Enjoying ReadStreak? Fuel our late-night coding sessions ☕
        </Text>
        <Text style={styles.coffeeSub}>
          Totally optional. No pressure, no guilt. But if ReadStreak has made you pick up a book when you otherwise wouldn't — this is a lovely way to say thanks.
        </Text>

        <View style={styles.coffeeButtons}>
          {/* PHP */}
          <TouchableOpacity
            style={[styles.coffeeBtn, styles.coffeeBtnPhp]}
            onPress={() => handleCoffee(COFFEE_LINK_PHP)}
            activeOpacity={0.8}
          >
            <Text style={styles.coffeeBtnFlag}>🇵🇭</Text>
            <View>
              <Text style={styles.coffeeBtnPrice}>₱99</Text>
              <Text style={styles.coffeeBtnLabel}>Philippines</Text>
            </View>
          </TouchableOpacity>

          {/* USD */}
          <TouchableOpacity
            style={[styles.coffeeBtn, styles.coffeeBtnUsd]}
            onPress={() => handleCoffee(COFFEE_LINK_USD)}
            activeOpacity={0.8}
          >
            <Text style={styles.coffeeBtnFlag}>🌏</Text>
            <View>
              <Text style={styles.coffeeBtnPrice}>$1.99</Text>
              <Text style={styles.coffeeBtnLabel}>International</Text>
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.coffeeDisclaimer}>
          One-time tip · Not a subscription · Never required
        </Text>
      </View>

      {/* ── Footer ── */}
      <Text style={[styles.footer, { fontFamily: caveatRegular }]}>
        Made with 📚 and a lot of ☕ by a small team who loves books
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#f9f6f1',
  },
  container: {
    padding: 24,
    paddingTop: 56,
    paddingBottom: 48,
  },

  // ── Header ──
  headerSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  betaBadge: {
    fontSize: 12,
    color: '#e67e22',
    letterSpacing: 3,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  headline: {
    fontSize: 48,
    fontWeight: '700',
    color: '#3e2c13',
    textAlign: 'center',
    lineHeight: 54,
    marginBottom: 8,
  },
  subhead: {
    fontSize: 26,
    color: '#7b5e3b',
    textAlign: 'center',
    marginBottom: 12,
  },
  welcomeNote: {
    fontSize: 17,
    color: '#b8a98c',
    textAlign: 'center',
    lineHeight: 24,
  },

  // ── Divider ──
  divider: {
    height: 1,
    backgroundColor: '#e8dece',
    marginVertical: 28,
    borderRadius: 1,
  },

  // ── Features ──
  featuresSection: {
    gap: 4,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#b8a98c',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0e8d8',
    gap: 14,
  },
  featureIcon: {
    fontSize: 22,
    marginTop: 1,
    width: 28,
    textAlign: 'center',
  },
  featureText: {
    flex: 1,
  },
  featureName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#3e2c13',
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 13,
    color: '#7b5e3b',
    lineHeight: 18,
  },

  // ── Coming Soon ──
  comingSoonCard: {
    backgroundColor: '#fff8ee',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#f0d9b5',
  },
  comingSoonTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3e2c13',
    marginBottom: 10,
  },
  comingSoonText: {
    fontSize: 14,
    color: '#7b5e3b',
    lineHeight: 21,
  },
  comingSoonHighlight: {
    fontWeight: '700',
    color: '#e67e22',
  },

  // ── Coffee ──
  coffeeCard: {
    backgroundColor: '#fffbf5',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#f0d9b5',
    shadowColor: '#c8955a',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  coffeeEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  coffeeTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#3e2c13',
    marginBottom: 6,
  },
  coffeeTagline: {
    fontSize: 19,
    color: '#7b5e3b',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 24,
  },
  coffeeSub: {
    fontSize: 13,
    color: '#b8a98c',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  coffeeButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 14,
  },
  coffeeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 10,
  },
  coffeeBtnPhp: {
    backgroundColor: '#fff3e0',
    borderWidth: 1.5,
    borderColor: '#f0c070',
  },
  coffeeBtnUsd: {
    backgroundColor: '#e8f5e9',
    borderWidth: 1.5,
    borderColor: '#a5d6a7',
  },
  coffeeBtnFlag: {
    fontSize: 22,
  },
  coffeeBtnPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#3e2c13',
  },
  coffeeBtnLabel: {
    fontSize: 11,
    color: '#7b5e3b',
    fontWeight: '600',
    marginTop: 1,
  },
  coffeeDisclaimer: {
    fontSize: 11,
    color: '#c8b89a',
    textAlign: 'center',
    letterSpacing: 0.3,
  },

  // ── Footer ──
  footer: {
    marginTop: 32,
    fontSize: 15,
    color: '#c8b89a',
    textAlign: 'center',
    lineHeight: 22,
  },
});
