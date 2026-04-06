import React, { useState } from "react";
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, 
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StatusBar 
} from "react-native";
import { Lock, KeyRound, Eye, EyeOff } from "lucide-react-native";
import api from "../services/api";

// Modern Brand Palette
const PRIMARY_NAVY = "#0F172A"; 
const SLATE_TEXT = "#64748B";    
const SOFT_BG = "#F8FAFC";       
const WHITE = "#FFFFFF";
const BORDER_COLOR = "#E2E8F0";

export default function ResetPasswordScreen({ route, navigation }) {
  // Get email passed from ForgotPasswordScreen
  const { email } = route.params || { email: "" };
  
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!token || !password) {
      return Alert.alert("Error", "Please enter the token and your new password.");
    }
    
    if (password !== confirmPassword) {
      return Alert.alert("Error", "Passwords do not match.");
    }

    if (password.length < 8) {
      return Alert.alert("Error", "Password must be at least 8 characters long.");
    }

    setLoading(true);
    try {
      await api.post("/auth/password-reset-confirm/", { 
        email, 
        token: token.trim(), 
        new_password: password 
      });
      
      Alert.alert(
        "Success", 
        "Your password has been updated!",
        [{ text: "Back to Login", onPress: () => navigation.navigate("Login") }]
      );
    } catch (err) {
      const errorDetail = err.response?.data?.detail || "Invalid token or expired request.";
      Alert.alert("Reset Failed", errorDetail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.mainContainer}
    >
      <StatusBar barStyle="dark-content" />
      <ScrollView 
        contentContainerStyle={styles.scrollContainer} 
        bounces={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerContainer}>
          <Text style={styles.title}>New Password</Text>
          <Text style={styles.subtitle}>
            Enter the token sent to <Text style={styles.emailBold}>{email}</Text> and your new credentials.
          </Text>
        </View>

        <View style={styles.formContainer}>
          {/* Token Input */}
          <Text style={styles.label}>Verification Token</Text>
          <View style={styles.inputWrapper}>
            <KeyRound size={18} color={SLATE_TEXT} style={styles.icon} />
            <TextInput
              placeholder="Enter 6-digit code"
              placeholderTextColor="#94A3B8"
              value={token}
              onChangeText={setToken}
              style={styles.input}
              keyboardType="number-pad"
            />
          </View>

          {/* Password Input */}
          <Text style={styles.label}>New Password</Text>
          <View style={styles.inputWrapper}>
            <Lock size={18} color={SLATE_TEXT} style={styles.icon} />
            <TextInput
              placeholder="At least 8 characters"
              placeholderTextColor="#94A3B8"
              value={password}
              onChangeText={setPassword}
              style={styles.input}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff size={20} color={SLATE_TEXT} /> : <Eye size={20} color={SLATE_TEXT} />}
            </TouchableOpacity>
          </View>

          {/* Confirm Password Input */}
          <Text style={styles.label}>Confirm Password</Text>
          <View style={styles.inputWrapper}>
            <Lock size={18} color={SLATE_TEXT} style={styles.icon} />
            <TextInput
              placeholder="Repeat new password"
              placeholderTextColor="#94A3B8"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              style={styles.input}
              secureTextEntry={!showPassword}
            />
          </View>

          <TouchableOpacity 
            style={[styles.button, (!token || !password) && styles.buttonDisabled]} 
            onPress={handleResetPassword} 
            disabled={loading || !token || !password}
          >
            {loading ? (
              <ActivityIndicator color={WHITE} />
            ) : (
              <Text style={styles.buttonText}>Update Password</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: SOFT_BG },
  scrollContainer: { 
    flexGrow: 1, 
    justifyContent: "center", 
    paddingHorizontal: 25, 
    paddingVertical: 40 
  },
  headerContainer: { marginBottom: 35 },
  title: { 
    fontSize: 32, 
    fontWeight: "800", 
    color: PRIMARY_NAVY, 
    letterSpacing: -0.5 
  },
  subtitle: { 
    fontSize: 16, 
    color: SLATE_TEXT, 
    lineHeight: 24, 
    marginTop: 8 
  },
  emailBold: { color: PRIMARY_NAVY, fontWeight: "700" },
  formContainer: { width: "100%" },
  label: { 
    fontSize: 14, 
    fontWeight: "600", 
    color: PRIMARY_NAVY, 
    marginBottom: 8, 
    marginLeft: 4 
  },
  inputWrapper: { 
    flexDirection: "row", 
    alignItems: "center", 
    backgroundColor: WHITE, 
    borderRadius: 16, 
    marginBottom: 20, 
    paddingHorizontal: 16, 
    height: 56, 
    borderWidth: 1, 
    borderColor: BORDER_COLOR,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 2,
  },
  icon: { marginRight: 12 },
  input: { 
    flex: 1, 
    fontSize: 16, 
    color: PRIMARY_NAVY, 
    fontWeight: "500" 
  },
  button: { 
    backgroundColor: PRIMARY_NAVY, 
    height: 56, 
    borderRadius: 16, 
    justifyContent: "center", 
    alignItems: "center",
    marginTop: 20,
    shadowColor: PRIMARY_NAVY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4
  },
  buttonDisabled: { backgroundColor: "#94A3B8", shadowOpacity: 0 },
  buttonText: { 
    color: WHITE, 
    fontWeight: "700", 
    fontSize: 18 
  }
});