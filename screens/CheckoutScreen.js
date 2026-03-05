// screens/CheckoutScreen.js — SymphPay subscription checkout
// Wired for SymphPay Stripe flow. Needs env vars set once merchant is created.
//
// REQUIRED env (ask Ralph to create ReadStreak SymphPay merchant):
//   EXPO_PUBLIC_SYMPH_PAY_API_URL=https://symph-pay-test.df.r.appspot.com
//   EXPO_PUBLIC_SYMPH_PAY_PUBLIC_KEY=pk_test_...     (PayMongo pub key)
//   EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...   (Stripe pub key)
//   EXPO_PUBLIC_SYMPH_PAY_PLAN_PREMIUM_USD=<plan_id>
//   EXPO_PUBLIC_SYMPH_PAY_PLAN_PREMIUM_PHP=<plan_id>
//   SYMPH_PAY_API_KEY=<merchant_api_key>             (server-side only)

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { useFonts } from 'expo-font';
import {
  Fraunces_700Bold,
} from '@expo-google-fonts/fraunces';
import { Caveat_600SemiBold } from '@expo-google-fonts/caveat';

// ── Config ───────────────────────────────────────────────────────────────────
const SYMPH_PAY_API_URL = process.env.EXPO_PUBLIC_SYMPH_PAY_API_URL
  || 'https://symph-pay-test.df.r.appspot.com';

// Plan IDs — set once Ralph creates the ReadStreak merchant on SymphPay
// Until then, the checkout gracefully shows a "coming soon" state.
const PLAN_PREMIUM_USD = process.env.EXPO_PUBLIC_SYMPH_PAY_PLAN_PREMIUM_USD || 'PENDING';
const PLAN_PREMIUM_PHP = process.env.EXPO_PUBLIC_SYMPH_PAY_PLAN_PREMIUM_PHP || 'PENDING';

const IS_CONFIGURED = PLAN_PREMIUM_USD !== 'PENDING';

// ── Helpers ──────────────────────────────────────────────────────────────────
function detectPH() {
  // TODO: use expo-localization for proper locale detection
  return false;
}

export default function CheckoutScreen({ route, navigation }) {
  const { planType = 'premium' } = route?.params || {};

  const isPH = detectPH();
  const planId = isPH ? PLAN_PREMIUM_PHP : PLAN_PREMIUM_USD;
  const priceLabel = isPH ? '₱99/month' : '$1.99/month';

  const [fontsLoaded] = useFonts({ Fraunces_700Bold, Caveat_600SemiBold });

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('form'); // 'form' | 'processing' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('');

  const headingFont = fontsLoaded ? 'Fraunces_700Bold' : undefined;
  const caveatFont = fontsLoaded ? 'Caveat_600SemiBold' : undefined;

  // ── Not configured yet ─────────────────────────────────────────────────────
  if (!IS_CONFIGURED) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.comingSoonEmoji}>🚧</Text>
        <Text style={[styles.comingSoonTitle, { fontFamily: headingFont }]}>
          Payments coming soon
        </Text>
        <Text style={styles.comingSoonSub}>
          ReadStreak Premium is almost ready.{'\n'}
          We'll let you know when it launches!
        </Text>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Success ─────────────────────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.successEmoji}>🎉</Text>
        <Text style={[styles.successTitle, { fontFamily: headingFont }]}>
          You're Premium!
        </Text>
        <Text style={[styles.successSub, { fontFamily: caveatFont }]}>
          Your streak is protected. Go build that habit. 🔥
        </Text>
        <TouchableOpacity
          style={styles.subscribeBtn}
          onPress={() => navigation.navigate('Content')}
        >
          <Text style={styles.subscribeBtnText}>Start Reading →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Checkout Form ──────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!firstName || !email || !cardNumber || !expiry || !cvc) {
      Alert.alert('Missing fields', 'Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setStep('processing');

    try {
      // Step 1: Load SymphPay SDK
      let client;
      try {
        const SymphPay = (await import('@symphpay/sdk')).default;
        client = new SymphPay(
          process.env.EXPO_PUBLIC_SYMPH_PAY_PUBLIC_KEY,
          { stripePublishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY }
        );
      } catch {
        throw new Error('Payment SDK unavailable — please try again later.');
      }

      // Step 2: Parse expiry
      const [expMonthStr, expYearStr] = expiry.split('/');
      const expMonth = parseInt(expMonthStr?.trim());
      const expYear = parseInt('20' + expYearStr?.trim());

      // Step 3: Create Stripe payment method via SDK
      const pm = await client.createStripePaymentMethod(null, {
        name: `${firstName} ${lastName}`.trim(),
        email,
      });
      // Note: For full Stripe Elements PCI compliance, replace above with
      // client.getStripeElements() + cardElement flow (needs WebView on native)

      // Step 4: Create subscription via our backend
      const res = await fetch(`${SYMPH_PAY_API_URL}/api/subscription/create-with-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.SYMPH_PAY_API_KEY || '',
        },
        body: JSON.stringify({
          customerId: email,
          email,
          firstName,
          lastName,
          planId,
          paymentMethodId: pm.paymentMethodId,
          returnUrl: Platform.OS === 'web'
            ? `${window.location.origin}/payment/callback`
            : 'readstreak://payment/callback',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Payment failed. Please try again.');
      }

      // Step 5: Handle 3DS if required
      if (data.requiresAction) {
        const result = await client.confirmSubscriptionPayment(data);
        if (result.status === 'failed') {
          throw new Error(result.error?.message || 'Card authentication failed.');
        }
        // On web: if redirect needed, SDK handles it
      }

      setStep('success');
    } catch (err) {
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      {/* ── Header ── */}
      <View style={styles.headerRow}>
        <View style={styles.planPill}>
          <Text style={styles.planPillText}>ReadStreak Premium · {priceLabel}</Text>
        </View>
      </View>

      <Text style={[styles.headline, { fontFamily: headingFont }]}>
        Subscribe to Premium
      </Text>
      <Text style={[styles.subhead, { fontFamily: caveatFont }]}>
        protect your streak, set rest days
      </Text>

      {/* ── Error banner ── */}
      {step === 'error' && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>⚠️ {errorMsg}</Text>
          <TouchableOpacity onPress={() => setStep('form')}>
            <Text style={styles.errorRetry}>Try again</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Form ── */}
      <View style={styles.form}>
        <Text style={styles.sectionLabel}>YOUR DETAILS</Text>

        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.inputHalf]}
            placeholder="First name"
            placeholderTextColor="#b8a98c"
            value={firstName}
            onChangeText={setFirstName}
          />
          <TextInput
            style={[styles.input, styles.inputHalf]}
            placeholder="Last name"
            placeholderTextColor="#b8a98c"
            value={lastName}
            onChangeText={setLastName}
          />
        </View>

        <TextInput
          style={styles.input}
          placeholder="Email address"
          placeholderTextColor="#b8a98c"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <View style={styles.divider} />
        <Text style={styles.sectionLabel}>CARD DETAILS</Text>

        <TextInput
          style={styles.input}
          placeholder="Card number"
          placeholderTextColor="#b8a98c"
          value={cardNumber}
          onChangeText={setCardNumber}
          keyboardType="numeric"
          maxLength={19}
        />

        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.inputHalf]}
            placeholder="MM / YY"
            placeholderTextColor="#b8a98c"
            value={expiry}
            onChangeText={setExpiry}
            keyboardType="numeric"
            maxLength={7}
          />
          <TextInput
            style={[styles.input, styles.inputHalf]}
            placeholder="CVC"
            placeholderTextColor="#b8a98c"
            value={cvc}
            onChangeText={setCvc}
            keyboardType="numeric"
            maxLength={4}
            secureTextEntry
          />
        </View>
      </View>

      {/* ── Summary ── */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>ReadStreak Premium</Text>
          <Text style={styles.summaryAmount}>{priceLabel}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summarySubLabel}>2 streak freezes / month</Text>
          <Text style={styles.summaryCheck}>✓</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summarySubLabel}>Rest days</Text>
          <Text style={styles.summaryCheck}>✓</Text>
        </View>
      </View>

      {/* ── CTA ── */}
      <TouchableOpacity
        style={[styles.subscribeBtn, loading && styles.subscribeBtnDisabled]}
        onPress={handleSubmit}
        disabled={loading}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.subscribeBtnText}>
            Subscribe — {priceLabel} →
          </Text>
        )}
      </TouchableOpacity>

      <Text style={styles.legalText}>
        By subscribing, you authorize ReadStreak to charge your card {priceLabel} each month.
        Cancel anytime. Powered by SymphPay + Stripe.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#f9f6f1' },
  container: { padding: 24, paddingTop: 32, paddingBottom: 48 },

  centeredContainer: { flex: 1, backgroundColor: '#f9f6f1', alignItems: 'center', justifyContent: 'center', padding: 32 },
  comingSoonEmoji: { fontSize: 48, marginBottom: 16 },
  comingSoonTitle: { fontSize: 28, fontWeight: '700', color: '#3e2c13', textAlign: 'center', marginBottom: 10 },
  comingSoonSub: { fontSize: 15, color: '#7b5e3b', textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  successEmoji: { fontSize: 56, marginBottom: 16 },
  successTitle: { fontSize: 32, fontWeight: '700', color: '#3e2c13', textAlign: 'center', marginBottom: 8 },
  successSub: { fontSize: 20, color: '#7b5e3b', textAlign: 'center', marginBottom: 32, lineHeight: 26 },
  backBtn: { paddingVertical: 12, paddingHorizontal: 24 },
  backBtnText: { fontSize: 15, color: '#e67e22', fontWeight: '600' },

  headerRow: { marginBottom: 16 },
  planPill: { alignSelf: 'flex-start', backgroundColor: '#fff3e0', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, borderColor: '#f0c070' },
  planPillText: { fontSize: 13, fontWeight: '700', color: '#e67e22' },

  headline: { fontSize: 32, fontWeight: '700', color: '#3e2c13', marginBottom: 6 },
  subhead: { fontSize: 20, color: '#7b5e3b', marginBottom: 24 },

  errorBanner: { backgroundColor: '#fff0f0', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#ffcccc', marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 10 },
  errorBannerText: { flex: 1, fontSize: 13, color: '#c0392b', lineHeight: 18 },
  errorRetry: { fontSize: 13, color: '#e67e22', fontWeight: '700' },

  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#b8a98c', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 },
  form: { marginBottom: 20 },
  row: { flexDirection: 'row', gap: 10 },
  input: { backgroundColor: '#fffbf5', borderWidth: 1.5, borderColor: '#e8dece', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: '#3e2c13', marginBottom: 10, flex: 1 },
  inputHalf: { flex: 1 },

  divider: { height: 1, backgroundColor: '#e8dece', marginVertical: 16 },

  summaryCard: { backgroundColor: '#fff8ee', borderRadius: 16, padding: 18, borderWidth: 1.5, borderColor: '#f0d9b5', marginBottom: 20 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  summaryLabel: { fontSize: 15, fontWeight: '700', color: '#3e2c13' },
  summaryAmount: { fontSize: 15, fontWeight: '700', color: '#e67e22' },
  summarySubLabel: { fontSize: 13, color: '#7b5e3b' },
  summaryCheck: { fontSize: 14, color: '#27ae60', fontWeight: '700' },

  subscribeBtn: { backgroundColor: '#e67e22', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 14, shadowColor: '#e67e22', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  subscribeBtnDisabled: { opacity: 0.6 },
  subscribeBtnText: { fontSize: 17, fontWeight: '800', color: '#ffffff', letterSpacing: 0.3 },

  legalText: { fontSize: 11, color: '#c8b89a', textAlign: 'center', lineHeight: 17 },
});
