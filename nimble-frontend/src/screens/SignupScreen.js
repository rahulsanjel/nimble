import React, { useState } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ActivityIndicator,
  ScrollView,
  StatusBar
} from "react-native";
import { User, Mail, Lock, ShieldCheck, Chrome } from 'lucide-react-native'; // Consistent Lucide icons
import { registerUser } from "../services/auth";

// BRAND COLORS
const PRIMARY_NAVY = "#0F172A"; 
const SLATE_TEXT = "#64748B";   
const SOFT_BG = "#F8FAFC";      // Soft neutral background
const WHITE = "#FFFFFF";
const BORDER_COLOR = "#E2E8F0";

export default function SignupScreen({ navigation }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!fullName || !email || !password || !password2) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (password !== password2) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    setLoading(true);
    const result = await registerUser({ full_name: fullName, email, password, password2 });
    setLoading(false);

    if (result.errors) {
      Alert.alert("Signup Failed", JSON.stringify(result.errors));
    } else {
      Alert.alert("Success", "Account created! Please login.");
      navigation.replace("Login");
    }
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" />
      <ScrollView 
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>
            Join Nimble today to track your commute and save valuable time.
          </Text>
        </View>

        {/* Input Fields */}
        <View style={styles.inputContainer}>
          <User size={20} color={SLATE_TEXT} style={styles.inputIcon} />
          <TextInput 
            placeholder="Full Name" 
            placeholderTextColor={SLATE_TEXT}
            value={fullName} 
            onChangeText={setFullName} 
            style={styles.input} 
          />
        </View>

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
            placeholder="Create Password" 
            placeholderTextColor={SLATE_TEXT}
            value={password} 
            onChangeText={setPassword} 
            style={styles.input} 
            secureTextEntry 
          />
        </View>

        <View style={styles.inputContainer}>
          <ShieldCheck size={20} color={SLATE_TEXT} style={styles.inputIcon} />
          <TextInput 
            placeholder="Confirm Password" 
            placeholderTextColor={SLATE_TEXT}
            value={password2} 
            onChangeText={setPassword2} 
            style={styles.input} 
            secureTextEntry 
          />
        </View>

        {/* Sign Up Button */}
        <TouchableOpacity 
          style={[styles.signupButton, loading && styles.buttonDisabled]} 
          onPress={handleSignup}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.signupButtonText}>Create Account</Text>
          )}
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.orText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Google Sign Up */}
        <TouchableOpacity style={styles.googleButton}>
          <Chrome size={20} color={PRIMARY_NAVY} style={{ marginRight: 10 }} />
          <Text style={styles.googleButtonText}>Continue with Google</Text>
        </TouchableOpacity>

        {/* Footer */}
        <TouchableOpacity onPress={() => navigation.navigate("Login")} style={styles.loginLinkContainer}>
          <Text style={styles.footerText}>
            Already have an account? <Text style={styles.loginLink}>Log In</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: SOFT_BG,
  },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 25,
    paddingVertical: 40,
  },
  headerContainer: {
    alignItems: "flex-start", // Left-aligned for modern feel
    marginBottom: 35,
  },
  title: {
    fontSize: 32,
    color: PRIMARY_NAVY,
    fontWeight: "800",
    letterSpacing: -1,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: SLATE_TEXT,
    lineHeight: 22,
    fontWeight: "500",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: WHITE,
    borderRadius: 16, // Modern squircle
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 60,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    // Soft depth shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: PRIMARY_NAVY,
    fontWeight: "600",
  },
  signupButton: {
    backgroundColor: PRIMARY_NAVY,
    borderRadius: 16,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
    shadowColor: PRIMARY_NAVY,
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  signupButtonText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: "800",
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: BORDER_COLOR,
  },
  orText: {
    marginHorizontal: 15,
    color: SLATE_TEXT,
    fontSize: 12,
    fontWeight: "800",
  },
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
  googleButtonText: {
    color: PRIMARY_NAVY,
    fontSize: 15,
    fontWeight: "700",
  },
  loginLinkContainer: {
    marginTop: 5,
  },
  footerText: {
    textAlign: "center",
    color: SLATE_TEXT,
    fontWeight: "600",
    fontSize: 14,
  },
  loginLink: {
    color: PRIMARY_NAVY,
    fontWeight: "800",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});