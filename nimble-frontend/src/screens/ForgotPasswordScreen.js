import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
  StatusBar, Animated
} from "react-native";
import { Mail, ArrowLeft, Send } from "lucide-react-native";
import api from "../services/api";

const INK    = "#0D1B2A";
const BLUE   = "#2563EB";
const BLUE_S = "#EFF6FF";
const SLATE  = "#64748B";
const MUTED  = "#94A3B8";
const BORDER = "#E2E8F0";
const SURFACE = "#F8FAFC";
const WHITE  = "#FFFFFF";
const SUCCESS = "#059669";
const SUCCESS_S = "#D1FAE5";

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [focused, setFocused] = useState(false);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const checkAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleSend = async () => {
    if (!email.trim()) return Alert.alert("Required", "Please enter your email address.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return Alert.alert("Invalid Email", "Please enter a valid email address.");

    setLoading(true);
    try {
      await api.post("/auth/password-reset/", { email: email.trim().toLowerCase() });

      // Animate success state
      setSent(true);
      Animated.spring(checkAnim, { toValue: 1, tension: 60, friction: 7, useNativeDriver: true }).start();

      setTimeout(() => navigation.navigate("ResetPassword", { email: email.trim().toLowerCase() }), 1600);
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.error || "Could not connect to server.";
      Alert.alert("Request Failed", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.root}
    >
      <StatusBar barStyle="dark-content" backgroundColor={SURFACE} />

      {/* Header bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <ArrowLeft size={22} color={INK} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* Icon */}
          <View style={styles.iconWrap}>
            <View style={styles.iconBg}>
              <Mail size={30} color={BLUE} />
            </View>
          </View>

          <Text style={styles.title}>Forgot Password?</Text>
          <Text style={styles.subtitle}>
            No worries! Enter your registered email and we'll send you a reset code.
          </Text>

          {/* Success state */}
          {sent ? (
            <Animated.View style={[styles.successCard, { transform: [{ scale: checkAnim }] }]}>
              <View style={styles.successDot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.successTitle}>Reset code sent!</Text>
                <Text style={styles.successSub}>Check your inbox for the 6-digit token.</Text>
              </View>
            </Animated.View>
          ) : (
            <>
              {/* Email input */}
              <Text style={styles.label}>Email Address</Text>
              <View style={[styles.inputWrap, focused && styles.inputWrapFocused]}>
                <Mail size={17} color={focused ? BLUE : MUTED} />
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor={MUTED}
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                />
              </View>

              {/* Submit button */}
              <TouchableOpacity
                style={[styles.sendBtn, (loading || !email) && styles.sendBtnDisabled]}
                onPress={handleSend}
                disabled={loading || !email}
                activeOpacity={0.85}
              >
                {loading
                  ? <ActivityIndicator color={WHITE} />
                  : <>
                      <Send size={17} color={WHITE} />
                      <Text style={styles.sendBtnTxt}>Send Reset Code</Text>
                    </>}
              </TouchableOpacity>
            </>
          )}

          {/* Back to login */}
          <TouchableOpacity style={styles.loginLink} onPress={() => navigation.navigate("Login")}>
            <ArrowLeft size={14} color={SLATE} />
            <Text style={styles.loginLinkTxt}>Back to Login</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: SURFACE },
  topBar: {
    paddingTop: Platform.OS === 'ios' ? 54 : 16,
    paddingHorizontal: 20, paddingBottom: 8,
  },
  backBtn: {
    width: 42, height: 42, borderRadius: 13,
    backgroundColor: WHITE, borderWidth: 1, borderColor: BORDER,
    justifyContent: 'center', alignItems: 'center',
  },

  scroll: { flexGrow: 1, paddingHorizontal: 26, paddingTop: 20, paddingBottom: 40 },

  iconWrap: { marginBottom: 24 },
  iconBg:   {
    width: 68, height: 68, borderRadius: 20,
    backgroundColor: BLUE_S, justifyContent: 'center', alignItems: 'center',
  },

  title:    { fontSize: 30, fontWeight: '900', color: INK, letterSpacing: -0.6, marginBottom: 10 },
  subtitle: { fontSize: 15, color: SLATE, lineHeight: 24, marginBottom: 32 },

  label:    { fontSize: 12, fontWeight: '700', color: INK, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 8 },

  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: WHITE, borderRadius: 14, borderWidth: 1.5,
    borderColor: BORDER, paddingHorizontal: 16, height: 54, marginBottom: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  inputWrapFocused: { borderColor: BLUE, backgroundColor: BLUE_S },
  input: { flex: 1, fontSize: 15, color: INK, fontWeight: '500' },

  sendBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, height: 56, borderRadius: 14, backgroundColor: INK,
    shadowColor: INK, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 6, marginBottom: 20,
  },
  sendBtnDisabled: { backgroundColor: '#94A3B8', shadowOpacity: 0 },
  sendBtnTxt: { color: WHITE, fontSize: 16, fontWeight: '800' },

  successCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: SUCCESS_S, borderRadius: 16, padding: 18, marginBottom: 24,
    borderWidth: 1.5, borderColor: SUCCESS + '40',
  },
  successDot:    { width: 10, height: 10, borderRadius: 5, backgroundColor: SUCCESS },
  successTitle:  { fontSize: 15, fontWeight: '800', color: SUCCESS, marginBottom: 2 },
  successSub:    { fontSize: 13, color: '#065F46' },

  loginLink:    { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', padding: 8 },
  loginLinkTxt: { fontSize: 14, color: SLATE, fontWeight: '600' },
});