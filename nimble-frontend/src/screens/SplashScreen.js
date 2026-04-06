import React, { useEffect, useRef } from "react";
import {
  View, Text, StyleSheet, StatusBar, Animated, Easing, Dimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Bus } from "lucide-react-native";

const { width, height } = Dimensions.get("window");

// Match app.json splash backgroundColor exactly
const BG       = "#0D1B2A";
const WHITE    = "#FFFFFF";
const BLUE     = "#2563EB";
const MUTED    = "rgba(255,255,255,0.35)";

export default function SplashScreen({ navigation }) {
  // ── Animation refs ────────────────────────────────────────────────────────
  // Ring scale + opacity (burst in)
  const ringScale   = useRef(new Animated.Value(0.3)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;

  // Logo icon scale + opacity
  const iconScale   = useRef(new Animated.Value(0.4)).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;

  // Brand name slide up + fade
  const nameTransY  = useRef(new Animated.Value(20)).current;
  const nameOpacity = useRef(new Animated.Value(0)).current;

  // Tagline fade in
  const tagOpacity  = useRef(new Animated.Value(0)).current;

  // Progress bar width (0 → width)
  const barWidth    = useRef(new Animated.Value(0)).current;

  // Subtle background radial glow opacity
  const glowOpacity = useRef(new Animated.Value(0)).current;

  // Version fade
  const versionOpacity = useRef(new Animated.Value(0)).current;

  // Whole screen fade out before navigation
  const screenOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    /**
     * Animation timeline:
     *  0ms    → glow fades in
     *  100ms  → ring bursts in (spring)
     *  300ms  → icon scales in (spring)
     *  600ms  → brand name slides up
     *  900ms  → tagline fades in
     *  1100ms → progress bar sweeps across
     *  2200ms → version fades in
     *  2600ms → whole screen fades out → navigate
     */

    Animated.sequence([
      // 1. Glow
      Animated.timing(glowOpacity, {
        toValue: 1, duration: 400, useNativeDriver: true,
      }),

      // 2. Ring burst + icon appear (parallel)
      Animated.parallel([
        Animated.spring(ringScale, {
          toValue: 1, tension: 80, friction: 6, useNativeDriver: true,
        }),
        Animated.timing(ringOpacity, {
          toValue: 1, duration: 300, useNativeDriver: true,
        }),
        Animated.spring(iconScale, {
          toValue: 1, tension: 100, friction: 7, delay: 150, useNativeDriver: true,
        }),
        Animated.timing(iconOpacity, {
          toValue: 1, duration: 250, delay: 150, useNativeDriver: true,
        }),
      ]),

      // 3. Name slides up
      Animated.parallel([
        Animated.timing(nameTransY, {
          toValue: 0, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: true,
        }),
        Animated.timing(nameOpacity, {
          toValue: 1, duration: 350, useNativeDriver: true,
        }),
      ]),

      // 4. Tagline fades in
      Animated.timing(tagOpacity, {
        toValue: 1, duration: 300, useNativeDriver: true,
      }),

      // 5. Progress bar sweeps (not native driver — width not supported)
      Animated.timing(barWidth, {
        toValue: width * 0.55,
        duration: 900,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        useNativeDriver: false,
      }),

      // 6. Version tag
      Animated.timing(versionOpacity, {
        toValue: 1, duration: 300, useNativeDriver: true,
      }),

      // 7. Hold then fade out
      Animated.delay(300),
      Animated.timing(screenOpacity, {
        toValue: 0, duration: 350, useNativeDriver: true,
      }),
    ]).start();

    // ── Navigation logic ─────────────────────────────────────────────────────
    const navigate = async () => {
      try {
        const token     = await AsyncStorage.getItem("userToken");
        const onboarded = await AsyncStorage.getItem("@onboarding_viewed");

        // Total anim runtime ≈ 2800ms; add small buffer
        await new Promise(r => setTimeout(r, 3000));

        if (!onboarded) {
          navigation.replace("Onboarding");
        } else if (token) {
          navigation.replace("MainTabs");
        } else {
          navigation.replace("Login");
        }
      } catch {
        navigation.replace("Login");
      }
    };

    navigate();
  }, []);

  return (
    <Animated.View style={[styles.root, { opacity: screenOpacity }]}>
      <StatusBar barStyle="light-content" backgroundColor={BG} translucent />

      {/* Background radial glow */}
      <Animated.View style={[styles.glow, { opacity: glowOpacity }]} />

      {/* ── Logo block ── */}
      <View style={styles.center}>

        {/* Outer ring */}
        <Animated.View style={[
          styles.ring,
          { opacity: ringOpacity, transform: [{ scale: ringScale }] },
        ]}>
          {/* Inner logo circle */}
          <Animated.View style={[
            styles.logoCircle,
            { opacity: iconOpacity, transform: [{ scale: iconScale }] },
          ]}>
            <Bus size={46} color={BG} strokeWidth={2} />
          </Animated.View>
        </Animated.View>

        {/* Brand name */}
        <Animated.Text style={[
          styles.brandName,
          { opacity: nameOpacity, transform: [{ translateY: nameTransY }] },
        ]}>
          nimble
        </Animated.Text>

        {/* Tagline */}
        <Animated.Text style={[styles.tagline, { opacity: tagOpacity }]}>
          Kathmandu Transit, Simplified
        </Animated.Text>

        {/* Progress bar */}
        <View style={styles.barTrack}>
          <Animated.View style={[styles.barFill, { width: barWidth }]} />
        </View>
      </View>

      {/* Bottom version */}
      <Animated.View style={[styles.footer, { opacity: versionOpacity }]}>
        <Text style={styles.madeBy}>Made in Kathmandu 🇳🇵</Text>
        <Text style={styles.version}>v 1.0.0</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
    justifyContent: "center",
    alignItems: "center",
  },

  // Radial glow behind logo
  glow: {
    position: "absolute",
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: BLUE,
    opacity: 0.07,
    top: height / 2 - 220,
    alignSelf: "center",
  },

  center: {
    alignItems: "center",
  },

  // Outer translucent ring
  ring: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(255,255,255,0.05)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 28,
  },

  // White logo circle
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: WHITE,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 20,
  },

  brandName: {
    fontSize: 46,
    fontWeight: "900",
    color: WHITE,
    letterSpacing: -1.5,
    marginBottom: 8,
  },

  tagline: {
    fontSize: 13,
    color: MUTED,
    letterSpacing: 0.5,
    fontWeight: "500",
    marginBottom: 36,
  },

  // Loading bar
  barTrack: {
    width: width * 0.55,
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 2,
    backgroundColor: BLUE,
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 44,
    alignItems: "center",
    gap: 4,
  },
  madeBy:  { color: "rgba(255,255,255,0.3)", fontSize: 12, fontWeight: "500" },
  version: { color: "rgba(255,255,255,0.2)", fontSize: 11, fontWeight: "600" },
});