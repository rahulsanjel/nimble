import React, { useEffect, useState, useRef } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, ActivityIndicator, Alert, RefreshControl, Animated,
} from "react-native";
import * as Location from 'expo-location';
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../services/api";
import { Power, LogOut, Clock, Bus, MapPin, AlertCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react-native';

const INK      = "#0D1B2A";
const BLUE     = "#2563EB";
const BLUE_S   = "#EFF6FF";
const GREEN    = "#059669";
const GREEN_S  = "#D1FAE5";
const RED      = "#DC2626";
const RED_S    = "#FEE2E2";
const AMBER    = "#D97706";
const AMBER_S  = "#FEF3C7";
const SLATE    = "#64748B";
const MUTED    = "#94A3B8";
const BORDER   = "#E2E8F0";
const SURFACE  = "#F8FAFC";
const WHITE    = "#FFFFFF";

export default function DriverHomeScreen({ navigation }) {
  const [user,          setUser]          = useState(null);
  const [isOnline,      setIsOnline]      = useState(false);
  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);
  const [secondsActive, setSecondsActive] = useState(0);

  const locationSub = useRef(null);
  const timerRef    = useRef(null);
  const pulseAnim   = useRef(new Animated.Value(1)).current;
  const fadeAnim    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchProfile();
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      locationSub.current?.remove();
    };
  }, []);

  // Pulse animation for LIVE dot
  useEffect(() => {
    if (isOnline) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.4, duration: 700, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1,   duration: 700, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [isOnline]);

  const fetchProfile = async () => {
    try {
      const res = await api.get("/auth/profile/");
      setUser(res.data);
      if (res.data.assigned_bus_details?.is_active && !isOnline) {
        setIsOnline(true); startTimer(); startGpsTracking();
      } else if (!res.data.assigned_bus_details?.is_active && isOnline) {
        setIsOnline(false); stopTracking();
      }
    } catch (err) {
      console.log("Sync Error:", err);
    } finally {
      setLoading(false); setRefreshing(false);
    }
  };

  const onRefresh = () => { setRefreshing(true); fetchProfile(); };

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setSecondsActive(p => p + 1), 1000);
  };

  const stopTracking = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    locationSub.current?.remove();
    setSecondsActive(0);
  };

  const formatTime = (sec) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
  };

  const startGpsTracking = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return;
    locationSub.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 5 },
      (loc) => api.post("/driver/update-location/", { lat: loc.coords.latitude, lng: loc.coords.longitude }).catch(() => {})
    );
  };

  const handleShiftToggle = async () => {
    if (!isOnline) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return Alert.alert("Permission Required", "GPS access is needed to go online.");
      try {
        const res = await api.post("/driver/toggle-shift/");
        if (res.data.is_active) { setIsOnline(true); startTimer(); await startGpsTracking(); }
      } catch {
        Alert.alert("Error", "Could not start shift. Ensure a bus is assigned.");
      }
    } else {
      Alert.alert("End Shift", "Are you sure you want to go offline?", [
        { text: "Cancel", style: "cancel" },
        { text: "End Shift", style: "destructive", onPress: async () => {
          try { await api.post("/driver/toggle-shift/"); stopTracking(); setIsOnline(false); }
          catch { Alert.alert("Error", "Could not end shift."); }
        }},
      ]);
    }
  };

  const handleLogout = () => Alert.alert("Logout", "Are you sure?", [
    { text: "Cancel", style: "cancel" },
    { text: "Logout", style: "destructive", onPress: () => navigation.replace("Login") },
  ]);

  if (loading) return (
    <View style={styles.loader}>
      <ActivityIndicator size="large" color={BLUE} />
      <Text style={styles.loaderTxt}>Loading dashboard…</Text>
    </View>
  );

  // ── Pending / Unverified state ───────────────────────────────────────────────
  if (!user?.is_verified || !user?.assigned_bus) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" />
        <View style={styles.pendingHeader}>
          <SafeAreaView edges={["top"]}>
            <View style={styles.pendingHeaderInner}>
              <Text style={styles.pendingAppName}>nimble driver</Text>
              <TouchableOpacity onPress={handleLogout} style={styles.logoutPill}>
                <LogOut size={15} color={RED} />
                <Text style={styles.logoutPillTxt}>Logout</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>

        <ScrollView contentContainerStyle={styles.pendingBody} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BLUE} />}>
          <View style={styles.pendingIcon}>
            <AlertCircle size={36} color={AMBER} />
          </View>
          <Text style={styles.pendingTitle}>
            {!user?.is_verified ? "Awaiting Verification" : "Assigning Your Bus"}
          </Text>
          <Text style={styles.pendingSub}>
            {!user?.is_verified
              ? "Your account is being reviewed by an administrator. You'll be notified once approved."
              : "You're verified! We're currently assigning a bus to your account."}
          </Text>

          <View style={styles.pendingSteps}>
            {[
              { label: "Account Created",   done: true  },
              { label: "Admin Verification", done: !!user?.is_verified },
              { label: "Bus Assignment",     done: !!user?.assigned_bus },
            ].map((step, i) => (
              <View key={i} style={styles.stepRow}>
                <View style={[styles.stepDot, step.done && styles.stepDotDone]}>
                  {step.done && <Text style={styles.stepDotCheck}>✓</Text>}
                </View>
                <Text style={[styles.stepLabel, step.done && styles.stepLabelDone]}>{step.label}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
            <RefreshCw size={16} color={WHITE} />
            <Text style={styles.refreshBtnTxt}>Check Status</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ── Active Dashboard ─────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={[styles.header, isOnline ? styles.headerOnline : styles.headerOffline]}>
        <SafeAreaView edges={["top"]}>
          <View style={styles.headerInner}>
            <View>
              <Text style={styles.headerSub}>Driver Dashboard</Text>
              <Text style={styles.headerName}>{user.full_name}</Text>
            </View>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
              <LogOut size={18} color={WHITE} />
            </TouchableOpacity>
          </View>

          {/* Status pill */}
          <View style={styles.statusPillRow}>
            <View style={[styles.statusPill, isOnline ? styles.pillOnline : styles.pillOffline]}>
              {isOnline
                ? <>
                    <Animated.View style={[styles.pulseDot, { transform: [{ scale: pulseAnim }] }]} />
                    <Wifi size={13} color={GREEN} />
                    <Text style={[styles.pillTxt, { color: GREEN }]}>LIVE · GPS Active</Text>
                  </>
                : <>
                    <WifiOff size={13} color={MUTED} />
                    <Text style={[styles.pillTxt, { color: MUTED }]}>OFFLINE</Text>
                  </>}
            </View>
          </View>
        </SafeAreaView>
      </View>

      <Animated.ScrollView
        style={{ opacity: fadeAnim }}
        contentContainerStyle={styles.body}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BLUE} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Bus & Route info */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}><Bus size={20} color={BLUE} /></View>
            <View>
              <Text style={styles.infoMeta}>Assigned Bus</Text>
              <Text style={styles.infoVal}>{user.assigned_bus_details?.bus_number || "N/A"}</Text>
            </View>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}><MapPin size={20} color={BLUE} /></View>
            <View>
              <Text style={styles.infoMeta}>Route</Text>
              <Text style={styles.infoVal}>{user.assigned_bus_details?.route_name || "N/A"}</Text>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Clock size={20} color={BLUE} />
            <Text style={styles.statVal}>{formatTime(secondsActive)}</Text>
            <Text style={styles.statLab}>Shift Duration</Text>
          </View>
          <View style={[styles.statCard, isOnline && styles.statCardActive]}>
            <Power size={20} color={isOnline ? GREEN : MUTED} />
            <Text style={[styles.statVal, { color: isOnline ? GREEN : MUTED }]}>
              {isOnline ? "LIVE" : "IDLE"}
            </Text>
            <Text style={styles.statLab}>GPS Status</Text>
          </View>
        </View>

        {/* Main CTA */}
        <TouchableOpacity
          style={[styles.shiftBtn, isOnline ? styles.shiftBtnStop : styles.shiftBtnStart]}
          onPress={handleShiftToggle}
          activeOpacity={0.85}
        >
          <Power size={26} color={WHITE} />
          <Text style={styles.shiftBtnTxt}>{isOnline ? "End My Shift" : "Go Online"}</Text>
        </TouchableOpacity>

        <Text style={styles.footerNote}>
          {isOnline
            ? "🟢 You are live. Passengers can see your location."
            : "Tap 'Go Online' to start broadcasting your location."}
        </Text>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: SURFACE },
  loader: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12, backgroundColor: SURFACE },
  loaderTxt: { color: SLATE, fontWeight: "600" },

  // Pending state
  pendingHeader:      { backgroundColor: INK },
  pendingHeaderInner: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 22, paddingVertical: 16 },
  pendingAppName:     { color: WHITE, fontSize: 18, fontWeight: "900", letterSpacing: -0.5 },
  logoutPill:         { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: RED_S, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  logoutPillTxt:      { color: RED, fontWeight: "700", fontSize: 13 },
  pendingBody:        { flexGrow: 1, alignItems: "center", padding: 32, paddingTop: 60 },
  pendingIcon:        { width: 80, height: 80, borderRadius: 28, backgroundColor: AMBER_S, justifyContent: "center", alignItems: "center", marginBottom: 24 },
  pendingTitle:       { fontSize: 24, fontWeight: "900", color: INK, textAlign: "center", letterSpacing: -0.5 },
  pendingSub:         { fontSize: 15, color: SLATE, textAlign: "center", lineHeight: 22, marginTop: 10, marginBottom: 32 },
  pendingSteps:       { width: "100%", backgroundColor: WHITE, borderRadius: 20, padding: 20, gap: 18, borderWidth: 1, borderColor: BORDER, marginBottom: 32 },
  stepRow:            { flexDirection: "row", alignItems: "center", gap: 14 },
  stepDot:            { width: 26, height: 26, borderRadius: 13, backgroundColor: SURFACE, borderWidth: 2, borderColor: BORDER, justifyContent: "center", alignItems: "center" },
  stepDotDone:        { backgroundColor: GREEN, borderColor: GREEN },
  stepDotCheck:       { color: WHITE, fontSize: 12, fontWeight: "900" },
  stepLabel:          { fontSize: 15, color: MUTED, fontWeight: "600" },
  stepLabelDone:      { color: INK },
  refreshBtn:         { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: BLUE, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 18 },
  refreshBtnTxt:      { color: WHITE, fontWeight: "800", fontSize: 15 },

  // Active header
  header:        { paddingBottom: 20 },
  headerOffline: { backgroundColor: INK },
  headerOnline:  { backgroundColor: "#062d1e" },
  headerInner:   { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingHorizontal: 22, paddingTop: 8, marginBottom: 16 },
  headerSub:     { color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: "600" },
  headerName:    { color: WHITE, fontSize: 26, fontWeight: "900", letterSpacing: -0.5, marginTop: 2 },
  logoutBtn:     { width: 40, height: 40, borderRadius: 13, backgroundColor: "rgba(255,255,255,0.1)", justifyContent: "center", alignItems: "center" },

  // Status pill
  statusPillRow: { paddingHorizontal: 22, marginBottom: 4 },
  statusPill:    { flexDirection: "row", alignItems: "center", gap: 7, alignSelf: "flex-start", paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  pillOnline:    { backgroundColor: GREEN_S },
  pillOffline:   { backgroundColor: "rgba(255,255,255,0.1)" },
  pulseDot:      { width: 8, height: 8, borderRadius: 4, backgroundColor: GREEN },
  pillTxt:       { fontSize: 12, fontWeight: "800", letterSpacing: 0.3 },

  // Body
  body: { padding: 20, paddingBottom: 48 },

  // Info card
  infoCard:     { backgroundColor: WHITE, borderRadius: 24, padding: 22, borderWidth: 1, borderColor: BORDER, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
  infoRow:      { flexDirection: "row", alignItems: "center", gap: 16 },
  infoIconBox:  { width: 44, height: 44, borderRadius: 14, backgroundColor: BLUE_S, justifyContent: "center", alignItems: "center" },
  infoMeta:     { fontSize: 11, fontWeight: "700", color: MUTED, textTransform: "uppercase", letterSpacing: 0.5 },
  infoVal:      { fontSize: 18, fontWeight: "900", color: INK, marginTop: 2 },
  infoDivider:  { height: 1, backgroundColor: BORDER, marginVertical: 16 },

  // Stats row
  statsRow:       { flexDirection: "row", gap: 12, marginBottom: 24 },
  statCard:       { flex: 1, backgroundColor: WHITE, borderRadius: 20, padding: 18, alignItems: "center", gap: 6, borderWidth: 1, borderColor: BORDER, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  statCardActive: { borderColor: GREEN, backgroundColor: GREEN_S },
  statVal:        { fontSize: 18, fontWeight: "900", color: INK },
  statLab:        { fontSize: 11, fontWeight: "600", color: MUTED },

  // Shift button
  shiftBtn:      { height: 72, borderRadius: 22, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 14, marginBottom: 20, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
  shiftBtnStart: { backgroundColor: BLUE, shadowColor: BLUE },
  shiftBtnStop:  { backgroundColor: RED,  shadowColor: RED  },
  shiftBtnTxt:   { color: WHITE, fontSize: 20, fontWeight: "900", letterSpacing: -0.3 },

  footerNote: { textAlign: "center", color: MUTED, fontSize: 13, fontWeight: "500", lineHeight: 20 },
});