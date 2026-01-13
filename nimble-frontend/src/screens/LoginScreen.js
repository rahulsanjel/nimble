import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ActivityIndicator,
  Switch,
  StatusBar
} from "react-native";
import { Mail, Lock, Chrome } from "lucide-react-native"; // Consistent with other screens
import AsyncStorage from "@react-native-async-storage/async-storage";
import { loginUser, getCurrentUser } from "../services/auth";

// BRAND COLORS
const PRIMARY_NAVY = "#0F172A"; 
const SLATE_TEXT = "#64748B";   
const SOFT_BG = "#F8FAFC";      // Soft neutral background
const WHITE = "#FFFFFF";
const BORDER_COLOR = "#E2E8F0";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const savedEmail = await AsyncStorage.getItem("rememberedEmail");
        const savedStatus = await AsyncStorage.getItem("rememberMeStatus");
        if (savedEmail) setEmail(savedEmail);
        if (savedStatus === "true") setRememberMe(true);
      } catch (e) {
        console.error("Failed to load local storage", e);
      }
    };
    loadSavedData();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter email and password");
      return;
    }
    setLoading(true);

    if (rememberMe) {
      await AsyncStorage.setItem("rememberedEmail", email);
      await AsyncStorage.setItem("rememberMeStatus", "true");
    } else {
      await AsyncStorage.removeItem("rememberedEmail");
      await AsyncStorage.setItem("rememberMeStatus", "false");
    }

    try {
      const loginResult = await loginUser({ email, password });
      if (loginResult.errors) {
        setLoading(false);
        Alert.alert("Login Failed", "Please check your credentials.");
        return;
      }
      const user = await getCurrentUser();
      setLoading(false);
      if (user) navigation.replace("MainTabs", { user });
    } catch (err) {
      setLoading(false);
      Alert.alert("Error", "Network error. Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Enter your credentials to access your Nimble account.</Text>
      </View>

      {/* Input Fields */}
      <View style={styles.inputContainer}>
        <Mail size={20} color={SLATE_TEXT} style={styles.inputIcon} />
        <TextInput
          placeholder="Email Address"
          placeholderTextColor={SLATE_TEXT}
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputContainer}>
        <Lock size={20} color={SLATE_TEXT} style={styles.inputIcon} />
        <TextInput
          placeholder="Password"
          placeholderTextColor={SLATE_TEXT}
          value={password}
          onChangeText={setPassword}
          style={styles.input}
          secureTextEntry
        />
      </View>

      {/* Options Row */}
      <View style={styles.optionsRow}>
        <View style={styles.switchContainer}>
          <Switch
            value={rememberMe}
            onValueChange={setRememberMe}
            trackColor={{ false: "#CBD5E1", true: PRIMARY_NAVY }}
            thumbColor={WHITE}
            style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
          />
          <Text style={styles.rememberText}>Remember me</Text>
        </View>

        <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
          <Text style={styles.forgotText}>Forgot Password?</Text>
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      <TouchableOpacity 
        style={[styles.loginButton, loading && styles.buttonDisabled]} 
        onPress={handleLogin} 
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginButtonText}>Log In</Text>}
      </TouchableOpacity>

      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.orText}>OR</Text>
        <View style={styles.dividerLine} />
      </View>

      <TouchableOpacity style={styles.googleButton}>
        <Chrome size={20} color={PRIMARY_NAVY} style={{ marginRight: 10 }} />
        <Text style={styles.googleButtonText}>Continue with Google</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("Signup")} style={styles.signupContainer}>
        <Text style={styles.footerText}>
          Don't have an account? <Text style={styles.signupLink}>Sign up</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SOFT_BG,
    justifyContent: "center",
    paddingHorizontal: 25,
  },
  headerContainer: {
    alignItems: "flex-start",
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    color: PRIMARY_NAVY,
    fontWeight: "800",
    letterSpacing: -1,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: SLATE_TEXT,
    fontWeight: "500",
    lineHeight: 22,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: WHITE,
    borderRadius: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 60,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    // Soft depth
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: PRIMARY_NAVY, fontWeight: "600" },
  optionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },
  switchContainer: { flexDirection: "row", alignItems: "center" },
  rememberText: { fontSize: 14, color: SLATE_TEXT, fontWeight: "600", marginLeft: 4 },
  forgotText: { color: PRIMARY_NAVY, fontWeight: "700", fontSize: 14 },
  loginButton: {
    backgroundColor: PRIMARY_NAVY,
    borderRadius: 16,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: PRIMARY_NAVY,
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  loginButtonText: { color: WHITE, fontSize: 16, fontWeight: "800" },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: BORDER_COLOR },
  orText: { marginHorizontal: 15, color: SLATE_TEXT, fontSize: 12, fontWeight: "800" },
  googleButton: {
    flexDirection: "row",
    backgroundColor: WHITE,
    borderRadius: 16,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 25,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  googleButtonText: { color: PRIMARY_NAVY, fontSize: 15, fontWeight: "700" },
  signupContainer: { marginTop: 10 },
  footerText: { textAlign: "center", color: SLATE_TEXT, fontWeight: "600" },
  signupLink: { color: PRIMARY_NAVY, fontWeight: "800" },
  buttonDisabled: { opacity: 0.7 },
});