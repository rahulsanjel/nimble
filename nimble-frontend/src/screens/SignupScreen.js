import React, { useState, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
  ActivityIndicator, ScrollView, StatusBar, KeyboardAvoidingView,
  Platform, Animated,
} from "react-native";
import { User, Mail, Lock, ShieldCheck, Eye, EyeOff, Car, Users } from 'lucide-react-native';
import { registerUser } from "../services/auth";

const INK    = "#0D1B2A";
const BLUE   = "#2563EB";
const BLUE_S = "#EFF6FF";
const GREEN  = "#059669";
const SLATE  = "#64748B";
const MUTED  = "#94A3B8";
const BORDER = "#E2E8F0";
const SURFACE= "#F8FAFC";
const WHITE  = "#FFFFFF";

function StyledInput({ label, icon: Icon, value, onChangeText, secureEntry, keyboardType, autoCapitalize, right, error }) {
  const [focused, setFocused] = useState(false);
  const borderColor = error ? "#DC2626" : focused ? BLUE : BORDER;

  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={[styles.inputWrap, { borderColor }]}>
        <Icon size={17} color={focused ? BLUE : MUTED} style={{ marginRight: 11 }} />
        <TextInput
          placeholder={label}
          placeholderTextColor={MUTED}
          value={value}
          onChangeText={onChangeText}
          style={styles.input}
          secureTextEntry={secureEntry}
          keyboardType={keyboardType || "default"}
          autoCapitalize={autoCapitalize || "none"}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {right}
      </View>
      {error ? <Text style={styles.errorTxt}>{error}</Text> : null}
    </View>
  );
}

export default function SignupScreen({ navigation }) {
  const [fullName,  setFullName]  = useState("");
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [password2, setPassword2] = useState("");
  const [role,      setRole]      = useState("passenger");
  const [loading,   setLoading]   = useState(false);
  const [showPwd,   setShowPwd]   = useState(false);
  const [showPwd2,  setShowPwd2]  = useState(false);

  const slideAnim = useRef(new Animated.Value(0)).current;

  const handleRoleChange = (r) => {
    setRole(r);
    Animated.spring(slideAnim, {
      toValue: r === "driver" ? 1 : 0,
      useNativeDriver: false,
      tension: 200,
      friction: 20,
    }).start();
  };

  const handleSignup = async () => {
    if (!fullName.trim() || !email.trim() || !password || !password2)
      return Alert.alert("Missing Fields", "Please fill in all fields.");
    if (password !== password2)
      return Alert.alert("Password Mismatch", "Passwords do not match.");
    if (password.length < 8)
      return Alert.alert("Weak Password", "Password must be at least 8 characters.");

    setLoading(true);
    try {
      const result = await registerUser({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        password, password2, role,
      });

      if (result.errors) {
        const msg = typeof result.errors === "object"
          ? Object.values(result.errors).flat().join("\n")
          : result.errors;
        Alert.alert("Signup Failed", msg || "Something went wrong.");
      } else {
        Alert.alert(
          "Account Created! 🎉",
          role === "driver"
            ? "Your driver account is pending admin verification."
            : "Welcome to Nimble! You can now log in.",
          [{ text: "Log In Now", onPress: () => navigation.replace("Login") }]
        );
      }
    } catch {
      Alert.alert("Network Error", "Could not connect. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const indicatorLeft = slideAnim.interpolate({ inputRange: [0, 1], outputRange: ["2%", "50%"] });

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={SURFACE} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Brand */}
        <View style={styles.brand}>
          <View style={styles.logoCircle}><Text style={styles.logoTxt}>N</Text></View>
          <Text style={styles.appName}>nimble</Text>
        </View>

        <Text style={styles.title}>Create account</Text>
        <Text style={styles.subtitle}>Join thousands tracking Kathmandu's buses.</Text>

        {/* Role selector */}
        <View style={styles.roleWrapper}>
          <View style={styles.roleTrack}>
            <Animated.View style={[styles.roleIndicator, { left: indicatorLeft }]} />
            <TouchableOpacity style={styles.roleOption} onPress={() => handleRoleChange("passenger")}>
              <Users size={16} color={role === "passenger" ? WHITE : MUTED} />
              <Text style={[styles.roleTxt, role === "passenger" && styles.roleTxtActive]}>Passenger</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.roleOption} onPress={() => handleRoleChange("driver")}>
              <Car size={16} color={role === "driver" ? WHITE : MUTED} />
              <Text style={[styles.roleTxt, role === "driver" && styles.roleTxtActive]}>Driver</Text>
            </TouchableOpacity>
          </View>
          {role === "driver" && (
            <View style={styles.driverNote}>
              <Text style={styles.driverNoteTxt}>Driver accounts require admin verification before activation.</Text>
            </View>
          )}
        </View>

        {/* Form */}
        <View style={styles.formCard}>
          <StyledInput
            label="Full Name"
            icon={User}
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />
          <StyledInput
            label="Email Address"
            icon={Mail}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />
          <StyledInput
            label="Password"
            icon={Lock}
            value={password}
            onChangeText={setPassword}
            secureEntry={!showPwd}
            right={
              <TouchableOpacity onPress={() => setShowPwd(v => !v)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                {showPwd ? <EyeOff size={17} color={MUTED} /> : <Eye size={17} color={MUTED} />}
              </TouchableOpacity>
            }
          />
          <StyledInput
            label="Confirm Password"
            icon={ShieldCheck}
            value={password2}
            onChangeText={setPassword2}
            secureEntry={!showPwd2}
            error={password2 && password !== password2 ? "Passwords don't match" : null}
            right={
              <TouchableOpacity onPress={() => setShowPwd2(v => !v)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                {showPwd2 ? <EyeOff size={17} color={MUTED} /> : <Eye size={17} color={MUTED} />}
              </TouchableOpacity>
            }
          />

          {/* Password strength hint */}
          {password.length > 0 && (
            <View style={styles.strengthRow}>
              {[1, 2, 3, 4].map(i => (
                <View key={i} style={[styles.strengthBar, {
                  backgroundColor: password.length >= i * 3
                    ? password.length >= 12 ? GREEN : BLUE
                    : BORDER,
                }]} />
              ))}
              <Text style={styles.strengthTxt}>
                {password.length < 6 ? "Too short" : password.length < 10 ? "Fair" : "Strong"}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.signupBtn, loading && { opacity: 0.7 }]}
            onPress={handleSignup}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color={WHITE} />
              : <Text style={styles.signupBtnTxt}>Create Account</Text>}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerTxt}>Already have an account?  </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text style={styles.loginLink}>Log In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: SURFACE },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },

  brand:      { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 28 },
  logoCircle: { width: 38, height: 38, borderRadius: 12, backgroundColor: INK, justifyContent: "center", alignItems: "center" },
  logoTxt:    { color: WHITE, fontSize: 20, fontWeight: "900", letterSpacing: -1 },
  appName:    { fontSize: 20, fontWeight: "900", color: INK, letterSpacing: -0.5 },

  title:    { fontSize: 28, fontWeight: "900", color: INK, letterSpacing: -0.8, marginBottom: 6 },
  subtitle: { fontSize: 15, color: SLATE, marginBottom: 28, lineHeight: 22 },

  // Role selector
  roleWrapper: { marginBottom: 24 },
  roleTrack:   { flexDirection: "row", backgroundColor: INK, borderRadius: 18, padding: 4, position: "relative", overflow: "hidden" },
  roleIndicator: {
    position: "absolute", top: 4, width: "48%", bottom: 4,
    backgroundColor: BLUE, borderRadius: 15,
  },
  roleOption:  { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, paddingVertical: 12, zIndex: 1 },
  roleTxt:     { fontSize: 14, fontWeight: "700", color: "rgba(255,255,255,0.4)" },
  roleTxtActive: { color: WHITE },
  driverNote:  { marginTop: 10, backgroundColor: "#FEF3C7", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  driverNoteTxt: { fontSize: 12, fontWeight: "600", color: "#92400E", lineHeight: 18 },

  // Form card
  formCard: {
    backgroundColor: WHITE, borderRadius: 24, padding: 22,
    borderWidth: 1, borderColor: BORDER,
    shadowColor: "#000", shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07, shadowRadius: 20, elevation: 5,
    marginBottom: 24,
  },

  inputLabel: { fontSize: 12, fontWeight: "700", color: INK, marginBottom: 8 },
  inputWrap:  {
    flexDirection: "row", alignItems: "center",
    backgroundColor: SURFACE, borderRadius: 13,
    paddingHorizontal: 14, height: 52,
    borderWidth: 1.5,
  },
  input:     { flex: 1, fontSize: 15, color: INK, fontWeight: "500" },
  errorTxt:  { fontSize: 11, color: "#DC2626", fontWeight: "600", marginTop: 4, marginLeft: 2 },

  // Password strength
  strengthRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: -8, marginBottom: 16 },
  strengthBar: { flex: 1, height: 3, borderRadius: 2 },
  strengthTxt: { fontSize: 11, fontWeight: "700", color: MUTED, minWidth: 48 },

  signupBtn:    {
    backgroundColor: INK, height: 54, borderRadius: 14,
    justifyContent: "center", alignItems: "center", marginTop: 8,
    shadowColor: INK, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25, shadowRadius: 10, elevation: 5,
  },
  signupBtnTxt: { color: WHITE, fontSize: 17, fontWeight: "800", letterSpacing: 0.2 },

  footer:    { flexDirection: "row", justifyContent: "center" },
  footerTxt: { fontSize: 14, color: SLATE },
  loginLink: { fontSize: 14, fontWeight: "800", color: INK },
});