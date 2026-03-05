// screens/PricingScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import { useFonts } from 'expo-font';
import {
  Fraunces_700Bold,
  Fraunces_400Regular,
} from '@expo-google-fonts/fraunces';
import { Caveat_400Regular, Caveat_600SemiBold } from '@expo-google-fonts/caveat';

// ─── Payment Links ────────────────────────────────────────────────────────────
// TODO: Replace with real SymphPay / Stripe checkout links once merchant is set up
// Premium subscription — ₱99/month (PH) | $1.99/month (international)
const PREMIUM_SUB_LINK_PHP = 'https://buy.stripe.com/readstreak-premium-php-99'; // placeholder
const PREMIUM_SUB_LINK_USD = 'https://buy.stripe.com/readstreak-premium-usd-199'; // placeholder

// One-time streak freeze — ₱49 (PH) | $0.99 (international)
const FREEZE_LINK_PHP = 'https://buy.stripe.com/readstreak-freeze-php-49'; // placeholder
const FREEZE_LINK_USD = 'https://buy.stripe.com/readstreak-freeze-usd-099'; // placeholder

// ─── Feature lists ───────────────────────────────────────────────────────────
const FREE_FEATURES = [
  { icon: '📚', label: 'Unlimited books', desc: 'Track everything on your reading list' },
  { icon: '🔥', label: 'Streak tracking', desc: 'Build your daily reading streak' },
  { icon: '👥', label: 'Friends', desc: 'See what your friends are reading' },
  { icon: '🔔', label: 'Reminders', desc: 'Gentle nudges so you never miss a day' },
  { icon: '📤', label: 'Share your streak', desc: 'Brag (lovingly) about your reading habit' },
  { icon: '💡', label: 'Article picks', desc: 'Curated reads for your next session' },
];

const PREMIUM_FEATURES = [
  { icon: '❄️', label: '2 streak freezes / month', desc: 'Life happens — protect your streak on off days' },
  { icon: '😌', label: 'Rest days', desc: 'Schedule guilt-free days off without breaking your streak' },
  { icon: '⭐', label: 'Everything in Free', desc: 'All the features you already love, plus more' },
];

export default function PricingScreen({ navigation }) {
  const [selectedPlan, setSelectedPlan] = useState('premium');

  const [fontsLoaded] = useFonts({
    Fraunces_700Bold,
    Fraunces_400Regular,
    Caveat_400Regular,
    Caveat_600SemiBold,
  });

  const headingFont = fontsLoaded ? 'Fraunces_700Bold' : undefined;
  const caveatFont = fontsLoaded ? 'Caveat_600SemiBold' : undefined;
  const caveatRegular = fontsLoaded ? 'Caveat_400Regular' : undefined;

  const isPH = false; // TODO: detect locale via expo-localization

  const handleSubscribe = () => {
    // Navigate to SymphPay checkout screen
    navigation.navigate('Checkout', { planType: 'premium' });
  };

  const handleBuyFreeze = (forcePhp = false) => {
    const msg = forcePhp ? 'One-time streak freeze — P49\n\nPayment coming soon!' : 'One-time streak freeze — $0.99\n\nPayment coming soon!';
    Alert.alert('Streak Freeze', msg, [{ text: 'OK' }]);
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ── */}
      <View style={styles.headerSection}>
        <Text style={[styles.headline, { fontFamily: headingFont }]}>
          Keep your streak alive
        </Text>
        <Text style={[styles.subhead, { fontFamily: caveatFont }]}>
          go premium — or grab a freeze when you need it
        </Text>
      </View>

      {/* ── Plan Toggle ── */}
      <View style={styles.planToggle}>
        <TouchableOpacity
          style={[styles.planTab, selectedPlan === 'free' && styles.planTabActive]}
          onPress={() => setSelectedPlan('free')}
          activeOpacity={0.8}
        >
          <Text style={[styles.planTabLabel, selectedPlan === 'free' && styles.planTabLabelActive]}>
            Free
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.planTab, selectedPlan === 'premium' && styles.planTabActive]}
          onPress={() => setSelectedPlan('premium')}
          activeOpacity={0.8}
        >
          <Text style={[styles.planTabLabel, selectedPlan === 'premium' && styles.planTabLabelActive]}>
            Premium ✦
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Premium Plan Card ── */}
      {selectedPlan === 'premium' && (
        <View style={styles.premiumCard}>
          <View style={styles.popularBadge}>
            <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
          </View>

          <View style={styles.priceRow}>
            <View style={styles.priceBlock}>
              <Text style={styles.priceFlag}>🇵🇭</Text>
              <Text style={[styles.priceAmount, { fontFamily: headingFont }]}>₱99</Text>
              <Text style={styles.pricePer}>/month</Text>
            </View>
            <View style={styles.priceDivider} />
            <View style={styles.priceBlock}>
              <Text style={styles.priceFlag}>🌏</Text>
              <Text style={[styles.priceAmount, { fontFamily: headingFont }]}>$1.99</Text>
              <Text style={styles.pricePer}>/month</Text>
            </View>
          </View>

          <View style={styles.featureList}>
            {PREMIUM_FEATURES.map((f, i) => (
              <View key={i} style={styles.featureRow}>
                <Text style={styles.featureIcon}>{f.icon}</Text>
                <View style={styles.featureText}>
                  <Text style={styles.featureName}>{f.label}</Text>
                  <Text style={styles.featureDesc}>{f.desc}</Text>
                </View>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.subscribeBtn}
            onPress={handleSubscribe}
            activeOpacity={0.85}
          >
            <Text style={styles.subscribeBtnText}>Start Premium →</Text>
          </TouchableOpacity>

          <Text style={[styles.disclaimer, { fontFamily: caveatRegular }]}>
            Cancel anytime · Billed monthly
          </Text>
        </View>
      )}

      {/* ── Free Plan Card ── */}
      {selectedPlan === 'free' && (
        <View style={styles.freeCard}>
          <View style={styles.freePriceRow}>
            <Text style={[styles.freePriceLabel, { fontFamily: headingFont }]}>Free</Text>
            <Text style={styles.freePriceSub}>forever</Text>
          </View>

          <View style={styles.featureList}>
            {FREE_FEATURES.map((f, i) => (
              <View key={i} style={styles.featureRow}>
                <Text style={styles.featureIcon}>{f.icon}</Text>
                <View style={styles.featureText}>
                  <Text style={styles.featureName}>{f.label}</Text>
                  <Text style={styles.featureDesc}>{f.desc}</Text>
                </View>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.freeBtn}
            onPress={() => setSelectedPlan('premium')}
            activeOpacity={0.85}
          >
            <Text style={styles.freeBtnText}>See Premium ✦</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Divider ── */}
      <View style={styles.divider} />

      {/* ── One-Time Streak Freeze ── */}
      <View style={styles.freezeCard}>
        <Text style={styles.freezeEmoji}>❄️</Text>
        <Text style={[styles.freezeTitle, { fontFamily: headingFont }]}>
          One-time streak freeze
        </Text>
        <Text style={[styles.freezeTagline, { fontFamily: caveatFont }]}>
          Not ready to subscribe? Grab a freeze when you need it.
        </Text>
        <Text style={styles.freezeDesc}>
          Life gets busy. A streak freeze lets you skip a day without losing your streak — no subscription required.
        </Text>

        <View style={styles.freezeButtons}>
          <TouchableOpacity
            style={[styles.freezeBtn, styles.freezeBtnPhp]}
            onPress={() => handleBuyFreeze(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.freezeBtnFlag}>🇵🇭</Text>
            <View>
              <Text style={styles.freezeBtnPrice}>₱49</Text>
              <Text style={styles.freezeBtnLabel}>Philippines</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.freezeBtn, styles.freezeBtnUsd]}
            onPress={() => handleBuyFreeze(false)}
            activeOpacity={0.8}
          >
            <Text style={styles.freezeBtnFlag}>🌏</Text>
            <View>
              <Text style={styles.freezeBtnPrice}>$0.99</Text>
              <Text style={styles.freezeBtnLabel}>International</Text>
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.freezeDisclaimer}>
          One-time purchase · No subscription · Never expires
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
  scroll: { flex: 1, backgroundColor: '#f9f6f1' },
  container: { padding: 24, paddingTop: 48, paddingBottom: 48 },

  headerSection: { alignItems: 'center', marginBottom: 28 },
  headline: { fontSize: 36, fontWeight: '700', color: '#3e2c13', textAlign: 'center', lineHeight: 42, marginBottom: 8 },
  subhead: { fontSize: 22, color: '#7b5e3b', textAlign: 'center', lineHeight: 28 },

  planToggle: { flexDirection: 'row', backgroundColor: '#f0e8d8', borderRadius: 14, padding: 4, marginBottom: 24 },
  planTab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  planTabActive: { backgroundColor: '#ffffff', shadowColor: '#c8955a', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  planTabLabel: { fontSize: 15, fontWeight: '600', color: '#b8a98c' },
  planTabLabelActive: { color: '#3e2c13' },

  premiumCard: { backgroundColor: '#fff8ee', borderRadius: 20, padding: 24, borderWidth: 2, borderColor: '#e67e22', shadowColor: '#e67e22', shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 4, marginBottom: 4 },
  popularBadge: { alignSelf: 'center', backgroundColor: '#e67e22', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 4, marginBottom: 20 },
  popularBadgeText: { fontSize: 11, fontWeight: '800', color: '#ffffff', letterSpacing: 1.5 },

  priceRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 20, marginBottom: 24 },
  priceBlock: { alignItems: 'center', gap: 2 },
  priceFlag: { fontSize: 18, marginBottom: 2 },
  priceAmount: { fontSize: 40, fontWeight: '700', color: '#3e2c13', lineHeight: 44 },
  pricePer: { fontSize: 13, color: '#b8a98c', fontWeight: '500' },
  priceDivider: { width: 1, height: 48, backgroundColor: '#f0d9b5' },

  freePriceRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 6, marginBottom: 24 },
  freePriceLabel: { fontSize: 40, fontWeight: '700', color: '#3e2c13' },
  freePriceSub: { fontSize: 16, color: '#b8a98c', fontWeight: '500', paddingBottom: 6 },

  featureList: { gap: 0, marginBottom: 24 },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0e8d8', gap: 14 },
  featureIcon: { fontSize: 20, marginTop: 1, width: 26, textAlign: 'center' },
  featureText: { flex: 1 },
  featureName: { fontSize: 15, fontWeight: '700', color: '#3e2c13', marginBottom: 2 },
  featureDesc: { fontSize: 13, color: '#7b5e3b', lineHeight: 18 },

  subscribeBtn: { backgroundColor: '#e67e22', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 10, shadowColor: '#e67e22', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  subscribeBtnText: { fontSize: 17, fontWeight: '800', color: '#ffffff', letterSpacing: 0.3 },
  disclaimer: { fontSize: 13, color: '#c8b89a', textAlign: 'center' },

  freeCard: { backgroundColor: '#fffbf5', borderRadius: 20, padding: 24, borderWidth: 1.5, borderColor: '#e8dece', marginBottom: 4 },
  freeBtn: { borderWidth: 2, borderColor: '#e67e22', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginBottom: 4 },
  freeBtnText: { fontSize: 16, fontWeight: '700', color: '#e67e22' },

  divider: { height: 1, backgroundColor: '#e8dece', marginVertical: 28, borderRadius: 1 },

  freezeCard: { backgroundColor: '#f0f7ff', borderRadius: 20, padding: 24, alignItems: 'center', borderWidth: 1.5, borderColor: '#b8d4f0', shadowColor: '#4a90d9', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  freezeEmoji: { fontSize: 36, marginBottom: 8 },
  freezeTitle: { fontSize: 22, fontWeight: '700', color: '#1e3a5f', marginBottom: 6, textAlign: 'center' },
  freezeTagline: { fontSize: 19, color: '#4a6fa5', textAlign: 'center', marginBottom: 12, lineHeight: 24 },
  freezeDesc: { fontSize: 13, color: '#6b8cbf', textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  freezeButtons: { flexDirection: 'row', gap: 12, width: '100%', marginBottom: 14 },
  freezeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 12, gap: 10 },
  freezeBtnPhp: { backgroundColor: '#e8f0ff', borderWidth: 1.5, borderColor: '#a0c0f0' },
  freezeBtnUsd: { backgroundColor: '#e8f5ff', borderWidth: 1.5, borderColor: '#90c8f0' },
  freezeBtnFlag: { fontSize: 22 },
  freezeBtnPrice: { fontSize: 18, fontWeight: '800', color: '#1e3a5f' },
  freezeBtnLabel: { fontSize: 11, color: '#4a6fa5', fontWeight: '600', marginTop: 1 },
  freezeDisclaimer: { fontSize: 11, color: '#8aabcf', textAlign: 'center', letterSpacing: 0.3 },

  footer: { marginTop: 32, fontSize: 15, color: '#c8b89a', textAlign: 'center', lineHeight: 22 },
});
