// LoginScreen.js
import React, { useState, useEffect } from "react";
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Switch, StatusBar
} from "react-native";
import { Mail, Lock, Chrome } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { loginUser, getCurrentUser } from "../services/auth";

const PRIMARY_NAVY = "#0F172A"; 
const SLATE_TEXT = "#64748B";   
const SOFT_BG = "#F8FAFC";      
const WHITE = "#FFFFFF";
const BORDER_COLOR = "#E2E8F0";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const loadSavedData = async () => {
      const savedEmail = await AsyncStorage.getItem("rememberedEmail");
      const savedStatus = await AsyncStorage.getItem("rememberMeStatus");
      if (savedEmail) setEmail(savedEmail);
      if (savedStatus === "true") setRememberMe(true);
    };
    loadSavedData();
  }, []);

  const handleLogin = async () => {
  if (!email || !password) {
    Alert.alert("Error", "Please enter email and password");
    return;
  }

  setLoading(true);

  try {
    // Save/Remove Remember Me info
    if (rememberMe) {
      await AsyncStorage.setItem("rememberedEmail", email);
      await AsyncStorage.setItem("rememberMeStatus", "true");
    } else {
      await AsyncStorage.removeItem("rememberedEmail");
      await AsyncStorage.setItem("rememberMeStatus", "false");
    }

    // Perform login
    const loginResult = await loginUser({ email, password });

    if (loginResult.errors) {
      setLoading(false);
      Alert.alert("Login Failed", "Please check your credentials.");
      return;
    }

    // Fetch the current user
    const user = await getCurrentUser();
    setLoading(false);

    if (!user) {
      Alert.alert("Error", "Failed to fetch user info");
      return;
    }

    console.log("Logged in user:", user);

    // Validate role and navigate accordingly
    if (user.role?.toLowerCase() === "driver") {
      navigation.replace("DriverHome", { driver: user });
    } else if (user.role?.toLowerCase() === "passenger") {
      navigation.replace("MainTabs", { user });
    } else {
      Alert.alert(
        "Unknown Role",
        `Your account role is not recognized: ${JSON.stringify(user.role)}`
      );
    }

  } catch (err) {
    setLoading(false);
    console.error("Login error:", err);
    Alert.alert("Error", "Network error. Please try again.");
  }
};


  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Text style={{ fontSize: 28, fontWeight: "800", marginBottom: 30 }}>Welcome Back</Text>

      {/* Email */}
      <View style={styles.inputContainer}>
        <Mail size={20} color={SLATE_TEXT} style={{ marginRight: 12 }} />
        <TextInput
          placeholder="Email Address"
          placeholderTextColor={SLATE_TEXT}
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          autoCapitalize="none"
        />
      </View>

      {/* Password */}
      <View style={styles.inputContainer}>
        <Lock size={20} color={SLATE_TEXT} style={{ marginRight: 12 }} />
        <TextInput
          placeholder="Password"
          placeholderTextColor={SLATE_TEXT}
          value={password}
          onChangeText={setPassword}
          style={styles.input}
          secureTextEntry
        />
      </View>

      {/* Remember me */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginVertical: 15 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Switch value={rememberMe} onValueChange={setRememberMe} />
          <Text style={{ marginLeft: 6 }}>Remember me</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
          <Text style={{ color: PRIMARY_NAVY }}>Forgot Password?</Text>
        </TouchableOpacity>
      </View>

      {/* Login button */}
      <TouchableOpacity 
        style={[styles.loginButton, loading && { opacity: 0.6 }]} 
        onPress={handleLogin} 
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: WHITE }}>Log In</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SOFT_BG, justifyContent: "center", padding: 25 },
  inputContainer: { flexDirection: "row", alignItems: "center", backgroundColor: WHITE, borderRadius: 12, marginBottom: 15, paddingHorizontal: 15, height: 50, borderWidth: 1, borderColor: BORDER_COLOR },
  input: { flex: 1, fontSize: 16 },
  loginButton: { backgroundColor: PRIMARY_NAVY, height: 50, borderRadius: 12, justifyContent: "center", alignItems: "center", marginTop: 10 },
});
