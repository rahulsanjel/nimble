import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
  ActivityIndicator, StatusBar, KeyboardAvoidingView, Platform,
  Animated, ScrollView, Pressable,
} from "react-native";
import { Mail, Lock, Eye, EyeOff, CheckSquare, Square } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { loginUser } from "../services/auth";

const INK    = "#0D1B2A";
const BLUE   = "#2563EB";
const SLATE  = "#64748B";
const MUTED  = "#94A3B8";
const BORDER = "#E2E8F0";
const SURFACE= "#F8FAFC";
const WHITE  = "#FFFFFF";

function FloatingInput({ label, icon: Icon, value, onChangeText, secureEntry, keyboardType, right }) {
  const focused   = useRef(new Animated.Value(0)).current;
  const [isFocused, setFocused] = useState(false);

  const onFocus = () => { setFocused(true);  Animated.timing(focused, { toValue: 1, duration: 180, useNativeDriver: false }).start(); };
  const onBlur  = () => { setFocused(false); Animated.timing(focused, { toValue: 0, duration: 180, useNativeDriver: false }).start(); };

  const borderColor    = focused.interpolate({ inputRange: [0, 1], outputRange: [BORDER, BLUE] });
  const shadowOpacity  = focused.interpolate({ inputRange: [0, 1], outputRange: [0.04, 0.14] });

  return (
    <Animated.View style={[styles.inputWrapper, { borderColor, shadowOpacity }]}>
      <Icon size={18} color={isFocused ? BLUE : MUTED} style={{ marginRight: 12 }} />
      <TextInput
        placeholder={label}
        placeholderTextColor={MUTED}
        value={value}
        onChangeText={onChangeText}
        style={styles.input}
        secureTextEntry={secureEntry}
        keyboardType={keyboardType || "default"}
        autoCapitalize="none"
        onFocus={onFocus}
        onBlur={onBlur}
      />
      {right}
    </Animated.View>
  );
}

export default function LoginScreen({ navigation }) {
  const [email,      setEmail]      = useState("");
  const [password,   setPassword]   = useState("");
  const [loading,    setLoading]    = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPwd,    setShowPwd]    = useState(false);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Load persisted credentials
    (async () => {
      const savedEmail  = await AsyncStorage.getItem("rememberedEmail");
      const savedStatus = await AsyncStorage.getItem("rememberMeStatus");
      if (savedStatus === "true" && savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    })();

    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      return Alert.alert("Missing Fields", "Please enter your email and password.");
    }
    setLoading(true);
    try {
      const result = await loginUser({ email: email.trim().toLowerCase(), password });

      if (result.errors) {
        setLoading(false);
        return Alert.alert("Login Failed", "Incorrect email or password.");
      }

      // ── BUG FIX: Save/clear remembered credentials after successful login ──
      if (rememberMe) {
        await AsyncStorage.setItem("rememberedEmail",  email.trim().toLowerCase());
        await AsyncStorage.setItem("rememberMeStatus", "true");
      } else {
        await AsyncStorage.removeItem("rememberedEmail");
        await AsyncStorage.setItem("rememberMeStatus", "false");
      }

      const user = result.user;
      if (!user) { setLoading(false); return Alert.alert("Error", "Server did not return user details."); }

      setLoading(false);
      if (user.role?.toLowerCase() === "driver") {
        navigation.replace("DriverHome", { driver: user });
      } else {
        navigation.replace("MainTabs", { user });
      }
    } catch (err) {
      setLoading(false);
      Alert.alert("Connection Error", "Could not reach the server. Check your network.");
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={SURFACE} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" bounces={false} showsVerticalScrollIndicator={false}>

        {/* Brand mark */}
        <Animated.View style={[styles.brand, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.logoCircle}><Text style={styles.logoTxt}>N</Text></View>
          <Text style={styles.appName}>nimble</Text>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Track your commute. Beat the crowd.</Text>
        </Animated.View>

        {/* Form card */}
        <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.fieldLabel}>Email Address</Text>
          <FloatingInput label="you@example.com" icon={Mail} value={email} onChangeText={setEmail} keyboardType="email-address" />

          <Text style={styles.fieldLabel}>Password</Text>
          <FloatingInput
            label="••••••••"
            icon={Lock}
            value={password}
            onChangeText={setPassword}
            secureEntry={!showPwd}
            right={
              <TouchableOpacity onPress={() => setShowPwd(v => !v)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                {showPwd ? <EyeOff size={18} color={MUTED} /> : <Eye size={18} color={MUTED} />}
              </TouchableOpacity>
            }
          />

          {/* Remember me + Forgot */}
          <View style={styles.remRow}>
            <Pressable style={styles.rememberTap} onPress={() => setRememberMe(v => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              {rememberMe ? <CheckSquare size={18} color={BLUE} /> : <Square size={18} color={MUTED} />}
              <Text style={styles.remText}>Remember me</Text>
            </Pressable>
            <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={[styles.loginBtn, loading && { opacity: 0.65 }]} onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
            {loading ? <ActivityIndicator color={WHITE} /> : <Text style={styles.loginBtnTxt}>Log In</Text>}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.divLine} /><Text style={styles.divTxt}>OR</Text><View style={styles.divLine} />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerTxt}>New to Nimble?  </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
              <Text style={styles.signupLink}>Create account</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: SURFACE },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 70, paddingBottom: 40 },

  brand:      { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 36 },
  logoCircle: { width: 40, height: 40, borderRadius: 14, backgroundColor: INK, justifyContent: "center", alignItems: "center" },
  logoTxt:    { color: WHITE, fontSize: 22, fontWeight: "900", letterSpacing: -1 },
  appName:    { fontSize: 22, fontWeight: "900", color: INK, letterSpacing: -0.5 },

  title:    { fontSize: 30, fontWeight: "900", color: INK, letterSpacing: -0.8, marginBottom: 6 },
  subtitle: { fontSize: 15, color: SLATE, marginBottom: 32, lineHeight: 22 },

  card: {
    backgroundColor: WHITE, borderRadius: 28, padding: 24,
    borderWidth: 1, borderColor: BORDER,
    shadowColor: "#000", shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07, shadowRadius: 24, elevation: 6,
  },

  fieldLabel: { fontSize: 13, fontWeight: "700", color: INK, marginBottom: 8, marginLeft: 2 },

  inputWrapper: {
    flexDirection: "row", alignItems: "center", backgroundColor: SURFACE,
    borderRadius: 14, marginBottom: 18, paddingHorizontal: 14, height: 54,
    borderWidth: 1.5, shadowColor: BLUE, shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10, elevation: 2,
  },
  input: { flex: 1, fontSize: 15, color: INK, fontWeight: "500" },

  remRow:      { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  rememberTap: { flexDirection: "row", alignItems: "center", gap: 8 },
  remText:     { fontSize: 14, color: SLATE, fontWeight: "600" },
  forgotText:  { fontSize: 14, color: BLUE, fontWeight: "700" },

  loginBtn: {
    backgroundColor: INK, height: 54, borderRadius: 14,
    justifyContent: "center", alignItems: "center",
    shadowColor: INK, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25, shadowRadius: 10, elevation: 5,
  },
  loginBtnTxt: { color: WHITE, fontSize: 17, fontWeight: "800", letterSpacing: 0.2 },

  divider: { flexDirection: "row", alignItems: "center", marginVertical: 20, gap: 12 },
  divLine: { flex: 1, height: 1, backgroundColor: BORDER },
  divTxt:  { fontSize: 11, fontWeight: "800", color: MUTED, letterSpacing: 1 },

  footer:     { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  footerTxt:  { fontSize: 14, color: SLATE },
  signupLink: { fontSize: 14, fontWeight: "800", color: INK },
});