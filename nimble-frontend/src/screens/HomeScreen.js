import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, StatusBar, Image, Alert, Dimensions,
  ActivityIndicator, Animated
} from "react-native";
import {
  Zap, MapPin, Ticket, Search, User, Clock, LogOut,
  AlertTriangle, MessageSquareWarning, RadioTower,
  Navigation, TrendingUp, Bell, Settings, ChevronRight,
  Heart, Bus, Shield
} from "lucide-react-native";
import api from "../services/api";
import { getCurrentUser, logoutUser } from "../services/auth";
import { SafeAreaView } from "react-native-safe-area-context";
import { CommonActions, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");

const INK       = "#0D1B2A";
const NAVY      = "#1E3A5F";
const BLUE      = "#2563EB";
const BLUE_S    = "#EFF6FF";
const GREEN     = "#059669";
const GREEN_S   = "#D1FAE5";
const AMBER     = "#D97706";
const AMBER_S   = "#FEF3C7";
const RED       = "#DC2626";
const RED_S     = "#FEE2E2";
const VIOLET    = "#7C3AED";
const VIOLET_S  = "#EDE9FE";
const ORANGE    = "#EA580C";
const ORANGE_S  = "#FFF7ED";
const SLATE     = "#64748B";
const MUTED     = "#94A3B8";
const BORDER    = "#E2E8F0";
const SURFACE   = "#F8FAFC";
const WHITE     = "#FFFFFF";

const FAV_KEY = "nimble_fav_routes";

// ── Greeting ─────────────────────────────────────────────────────────────────
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

// ── Quick action definitions ──────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { id: "map",       label: "Live Map",    Icon: Zap,              color: AMBER,   bg: AMBER_S,  route: "LiveMap",           desc: "Track buses" },
  { id: "routes",    label: "Routes",      Icon: MapPin,           color: BLUE,    bg: BLUE_S,   route: "AllRoutesScreen",   desc: "All routes" },
  { id: "tickets",   label: "My Tickets",  Icon: Ticket,           color: GREEN,   bg: GREEN_S,  route: "TicketScreen",      desc: "Trip history" },
  { id: "track",     label: "Track Bus",   Icon: RadioTower,       color: VIOLET,  bg: VIOLET_S, route: "TrackBusScreen",    desc: "Bus arrival" },
  { id: "complaint", label: "Complaint",   Icon: MessageSquareWarning, color: ORANGE, bg: ORANGE_S, route: "ComplaintScreen", desc: "Report issue" },
  { id: "logout",    label: "Sign Out",    Icon: LogOut,           color: RED,     bg: RED_S,    route: null,                desc: "Log out" },
];

// ── Full-width action card ────────────────────────────────────────────────────
function ActionCard({ item, onPress, badge }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const handlePressIn  = () => Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true, tension: 200 }).start();
  const handlePressOut = () => Animated.spring(scaleAnim, { toValue: 1,    useNativeDriver: true, tension: 200 }).start();

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, styles.actionCardWrap]}>
      <TouchableOpacity
        style={styles.actionCard}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <View style={[styles.actionIconCircle, { backgroundColor: item.bg }]}>
          <item.Icon size={22} color={item.color} strokeWidth={2.2} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.actionLabel}>{item.label}</Text>
          <Text style={styles.actionDesc}>{item.desc}</Text>
        </View>
        {badge != null && badge > 0 && (
          <View style={[styles.actionBadge, { backgroundColor: item.color }]}>
            <Text style={styles.actionBadgeTxt}>{badge}</Text>
          </View>
        )}
        <ChevronRight size={16} color={MUTED} />
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Trip history item ─────────────────────────────────────────────────────────
function TripItem({ trip }) {
  const statusColor = trip.status === "COMPLETED" ? GREEN : trip.status === "ONBOARD" ? BLUE : AMBER;
  const statusBg    = trip.status === "COMPLETED" ? GREEN_S : trip.status === "ONBOARD" ? BLUE_S : AMBER_S;
  return (
    <View style={styles.tripItem}>
      <View style={[styles.tripIcon, { backgroundColor: statusBg }]}>
        <Bus size={16} color={statusColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.tripTitle} numberOfLines={1}>
          {trip.start_stop_name || "Bus Trip"}{trip.end_stop_name ? ` → ${trip.end_stop_name}` : ""}
        </Text>
        <Text style={styles.tripSub}>{new Date(trip.created_at).toLocaleDateString("en-US", { day: "numeric", month: "short" })}</Text>
      </View>
      <View>
        <Text style={styles.tripFare}>Rs. {trip.fare_amount}</Text>
        <View style={[styles.tripStatusBadge, { backgroundColor: statusBg }]}>
          <Text style={[styles.tripStatusTxt, { color: statusColor }]}>{trip.status}</Text>
        </View>
      </View>
    </View>
  );
}

// ── Stat card (summary row) ──────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, bg }) {
  return (
    <View style={[styles.statCard, { backgroundColor: bg }]}>
      <Icon size={18} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function HomeScreen({ navigation }) {
  const [user,         setUser]         = useState(null);
  const [activeTrip,   setActiveTrip]   = useState(null);
  const [activeBuses,  setActiveBuses]  = useState([]);
  const [favRoutes,    setFavRoutes]    = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [unreadCount,  setUnreadCount]  = useState(0);
  const headerAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      fetchAll();
      loadUnread();
      const iv = setInterval(fetchActiveTrip, 15000);
      return () => clearInterval(iv);
    }, [])
  );

  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const fetchAll = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        await Promise.all([fetchActiveTrip(), fetchActiveBuses(), loadFavRoutes()]);
      }
    } catch (e) { console.log("Home fetch error:", e); }
    finally { setLoading(false); }
  };

  const fetchActiveTrip = async () => {
    try {
      const res = await api.get("/trips/");
      const cur = res.data.find(t => t.status === "ONBOARD" || t.status === "PAYMENT_PENDING");
      setActiveTrip(cur || null);
    } catch (e) { console.log("Trip error:", e); }
  };

  const fetchActiveBuses = async () => {
    try {
      const res = await api.get("/active-buses/");
      setActiveBuses(res.data);
    } catch (e) { console.log("Bus error:", e); }
  };

  const loadFavRoutes = async () => {
    try {
      const raw = await AsyncStorage.getItem(FAV_KEY);
      setFavRoutes(raw ? JSON.parse(raw) : []);
    } catch (e) {}
  };

  const loadUnread = async () => {
    try {
      const raw = await AsyncStorage.getItem("nimble_notifications");
      if (raw) {
        const list = JSON.parse(raw);
        setUnreadCount(list.filter(n => n.unread).length);
      }
    } catch (e) {}
  };

  const handleSOS = () =>
    Alert.alert("🆘 Emergency SOS", "This will alert emergency services and share your live location. Continue?", [
      { text: "Cancel", style: "cancel" },
      { text: "Send SOS", style: "destructive", onPress: () => navigation.navigate("SOSScreen") },
    ]);

  const handleLogout = () =>
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: async () => {
          await logoutUser();
          navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: "Login" }] }));
      }},
    ]);

  const handleAction = (item) => {
    if (item.id === "logout") return handleLogout();
    navigation.navigate(item.route);
  };

  // Trip progress
  const tripProgress = activeTrip?.status === "PAYMENT_PENDING" ? 100 : 40;

  // Completed trips this week
  const completedTrips = user?.trip_history?.filter(t => t.status === "COMPLETED")?.length ?? 0;
  const totalSpent     = user?.trip_history?.reduce((s, t) => s + parseFloat(t.fare_amount || 0), 0) ?? 0;

  if (loading) return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: SURFACE }}>
      <ActivityIndicator size="large" color={BLUE} />
    </View>
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={INK} />

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <SafeAreaView edges={["top"]}>
          <Animated.View style={[styles.headerInner, { opacity: headerAnim }]}>
            <View style={styles.headerRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.greetingTxt}>{getGreeting()} 👋</Text>
                <Text style={styles.nameTxt}>{user?.full_name?.split(" ")[0] || "Traveler"}</Text>
                <Text style={styles.dateTxt}>
                  {new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" })}
                </Text>
              </View>

              <View style={styles.headerIcons}>
                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={() => navigation.navigate("NotificationScreen")}
                >
                  <Bell size={20} color={WHITE} />
                  {unreadCount > 0 && (
                    <View style={styles.notifBadge}>
                      <Text style={styles.notifBadgeTxt}>{unreadCount}</Text>
                    </View>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.profileBtn}
                  onPress={() => navigation.navigate("Profile")}
                >
                  {user?.profile_picture
                    ? <Image source={{ uri: user.profile_picture }} style={styles.avatar} />
                    : <User color={WHITE} size={20} />
                  }
                </TouchableOpacity>
              </View>
            </View>

            {/* Search bar */}
            <TouchableOpacity
              style={styles.searchBar}
              onPress={() => navigation.navigate("LiveMap")}
              activeOpacity={0.85}
            >
              <Search color={SLATE} size={18} />
              <Text style={styles.searchPlaceholder}>Where are you going?</Text>
              <View style={styles.searchArrow}>
                <Navigation size={14} color={BLUE} />
              </View>
            </TouchableOpacity>

            {/* Stats row */}
            <View style={styles.statsRow}>
              <View style={styles.statPill}>
                <View style={styles.statDot} />
                <Text style={styles.statPillTxt}>{activeBuses.length} buses live</Text>
              </View>
              <View style={[styles.statPill, { backgroundColor: "rgba(255,255,255,0.1)" }]}>
                <Heart size={10} color={RED} fill={RED} />
                <Text style={styles.statPillTxt}>{favRoutes.length} saved routes</Text>
              </View>
            </View>
          </Animated.View>
        </SafeAreaView>
      </View>

      {/* ── SCROLL BODY ────────────────────────────────────────────────── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.body}
      >
        {/* LIVE TRIP CARD */}
        {activeTrip && (
          <TouchableOpacity
            style={styles.liveTripCard}
            onPress={() => navigation.navigate("LiveMap", { activeTrip })}
            activeOpacity={0.88}
          >
            <View style={styles.liveTripTop}>
              <View style={styles.liveBadge}>
                <View style={styles.pulseDot} />
                <Text style={styles.liveBadgeTxt}>LIVE TRIP</Text>
              </View>
              <Text style={styles.liveTripStatus}>
                {activeTrip.status === "PAYMENT_PENDING" ? "💳 Awaiting Payment" : "🚌 On Board"}
              </Text>
            </View>
            <Text style={styles.liveTripRoute}>{activeTrip.route_name || "Express Route"}</Text>
            <Text style={styles.liveTripStops}>
              {activeTrip.start_stop_name} → {activeTrip.end_stop_name || "In Progress"}
            </Text>
            <View style={styles.progressWrap}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${tripProgress}%` }]} />
              </View>
              <Text style={styles.progressPct}>{tripProgress}%</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* SUMMARY STATS */}
        <View style={styles.summaryRow}>
          <StatCard label="Trips" value={completedTrips} icon={TrendingUp} color={BLUE}   bg={BLUE_S} />
          <StatCard label="Spent"  value={`Rs.${Math.round(totalSpent)}`} icon={Ticket}  color={GREEN}  bg={GREEN_S} />
          <StatCard label="Active" value={activeBuses.length} icon={Bus}  color={AMBER}  bg={AMBER_S} />
        </View>

        {/* QUICK ACTIONS */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsWrap}>
          {QUICK_ACTIONS.map(item => (
            <ActionCard
              key={item.id}
              item={item}
              onPress={() => handleAction(item)}
              badge={item.id === "map" && activeBuses.length > 0 ? activeBuses.length : null}
            />
          ))}
        </View>

        {/* RECENT TRIPS */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Recent Trips</Text>
          <TouchableOpacity onPress={() => navigation.navigate("TicketScreen")}>
            <Text style={styles.seeAllTxt}>See All</Text>
          </TouchableOpacity>
        </View>

        {user?.trip_history?.length > 0 ? (
          <View style={styles.tripsCard}>
            {user.trip_history.slice(0, 4).map((trip, i) => (
              <TripItem key={trip.id ?? i} trip={trip} />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Bus size={32} color={MUTED} />
            <Text style={styles.emptyTxt}>No trips yet. Start your journey!</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate("LiveMap")}>
              <Text style={styles.emptyBtnTxt}>Find a Bus</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* ── SOS BUTTON ─────────────────────────────────────────────────── */}
      <TouchableOpacity style={styles.sosBtn} onPress={handleSOS} activeOpacity={0.85}>
        <Shield size={18} color={WHITE} />
        <Text style={styles.sosTxt}>SOS</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:  { flex: 1, backgroundColor: SURFACE },

  // Header
  header:        { backgroundColor: INK, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, paddingBottom: 28 },
  headerInner:   { paddingHorizontal: 22, paddingTop: 12 },
  headerRow:     { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  greetingTxt:   { color: "rgba(255,255,255,0.55)", fontSize: 13, fontWeight: "600" },
  nameTxt:       { color: WHITE, fontSize: 26, fontWeight: "900", letterSpacing: -0.5, marginTop: 2 },
  dateTxt:       { color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 4 },

  headerIcons:   { flexDirection: "row", gap: 10, alignItems: "center" },
  iconBtn:       { width: 42, height: 42, borderRadius: 13, backgroundColor: "rgba(255,255,255,0.1)", justifyContent: "center", alignItems: "center" },
  notifBadge:    { position: "absolute", top: 7, right: 7, width: 8, height: 8, borderRadius: 4, backgroundColor: RED, borderWidth: 1.5, borderColor: INK },
  notifBadgeTxt: { fontSize: 8, color: WHITE, fontWeight: "800" },
  profileBtn:    { width: 42, height: 42, borderRadius: 13, backgroundColor: "rgba(255,255,255,0.15)", justifyContent: "center", alignItems: "center", overflow: "hidden" },
  avatar:        { width: "100%", height: "100%" },

  searchBar:     { flexDirection: "row", alignItems: "center", backgroundColor: WHITE, borderRadius: 16, paddingHorizontal: 16, height: 50, gap: 10, marginBottom: 16, elevation: 4, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  searchPlaceholder: { flex: 1, fontSize: 15, color: MUTED, fontWeight: "500" },
  searchArrow:   { width: 30, height: 30, borderRadius: 10, backgroundColor: BLUE_S, justifyContent: "center", alignItems: "center" },

  statsRow:      { flexDirection: "row", gap: 8 },
  statPill:      { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(255,255,255,0.08)", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  statDot:       { width: 6, height: 6, borderRadius: 3, backgroundColor: GREEN },
  statPillTxt:   { color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: "600" },

  // Body
  body:          { paddingHorizontal: 20, paddingTop: 22, paddingBottom: 100 },

  // Live trip
  liveTripCard:  { backgroundColor: WHITE, borderRadius: 22, padding: 18, marginBottom: 20, borderWidth: 1.5, borderColor: BLUE_S, elevation: 4, shadowColor: BLUE, shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 3 } },
  liveTripTop:   { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  liveBadge:     { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: GREEN_S, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  pulseDot:      { width: 8, height: 8, borderRadius: 4, backgroundColor: GREEN },
  liveBadgeTxt:  { color: GREEN, fontWeight: "800", fontSize: 10, letterSpacing: 0.5 },
  liveTripStatus:{ fontSize: 13, fontWeight: "700", color: INK },
  liveTripRoute: { fontSize: 18, fontWeight: "900", color: INK, marginBottom: 4, letterSpacing: -0.3 },
  liveTripStops: { fontSize: 12, color: SLATE, marginBottom: 14 },
  progressWrap:  { flexDirection: "row", alignItems: "center", gap: 10 },
  progressTrack: { flex: 1, height: 6, backgroundColor: SURFACE, borderRadius: 3 },
  progressFill:  { height: "100%", backgroundColor: BLUE, borderRadius: 3 },
  progressPct:   { fontSize: 11, fontWeight: "800", color: BLUE },

  // Summary stats
  summaryRow:    { flexDirection: "row", gap: 10, marginBottom: 24 },
  statCard:      { flex: 1, borderRadius: 16, padding: 14, alignItems: "center", gap: 4 },
  statValue:     { fontSize: 16, fontWeight: "900" },
  statLabel:     { fontSize: 10, color: SLATE, fontWeight: "600" },

  // Section
  sectionTitle:  { fontSize: 17, fontWeight: "900", color: INK, marginBottom: 12, letterSpacing: -0.3 },
  sectionRow:    { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  seeAllTxt:     { color: BLUE, fontWeight: "700", fontSize: 13 },

  // Actions
  actionsWrap:   { gap: 8, marginBottom: 28 },
  actionCardWrap:{ borderRadius: 16, overflow: "hidden" },
  actionCard:    { flexDirection: "row", alignItems: "center", backgroundColor: WHITE, padding: 14, gap: 14, borderWidth: 1, borderColor: BORDER, borderRadius: 16 },
  actionIconCircle: { width: 46, height: 46, borderRadius: 15, justifyContent: "center", alignItems: "center" },
  actionLabel:   { fontSize: 14, fontWeight: "800", color: INK },
  actionDesc:    { fontSize: 11, color: SLATE, marginTop: 1 },
  actionBadge:   { borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  actionBadgeTxt:{ fontSize: 10, fontWeight: "800", color: WHITE },

  // Trips
  tripsCard:     { backgroundColor: WHITE, borderRadius: 20, overflow: "hidden", borderWidth: 1, borderColor: BORDER },
  tripItem:      { flexDirection: "row", alignItems: "center", padding: 14, gap: 12, borderBottomWidth: 1, borderBottomColor: BORDER },
  tripIcon:      { width: 38, height: 38, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  tripTitle:     { fontSize: 13, fontWeight: "700", color: INK },
  tripSub:       { fontSize: 11, color: MUTED, marginTop: 2 },
  tripFare:      { fontSize: 13, fontWeight: "800", color: BLUE, textAlign: "right" },
  tripStatusBadge:{ borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, marginTop: 3, alignSelf: "flex-end" },
  tripStatusTxt: { fontSize: 9, fontWeight: "700" },

  // Empty
  emptyState:    { alignItems: "center", padding: 30, gap: 10, backgroundColor: WHITE, borderRadius: 20, borderWidth: 1, borderColor: BORDER },
  emptyTxt:      { color: MUTED, fontSize: 14, fontWeight: "600" },
  emptyBtn:      { backgroundColor: BLUE, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20, marginTop: 4 },
  emptyBtnTxt:   { color: WHITE, fontWeight: "800", fontSize: 13 },

  // SOS
  sosBtn:        { position: "absolute", bottom: 28, right: 22, backgroundColor: RED, flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 13, borderRadius: 50, gap: 7, elevation: 10, shadowColor: RED, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  sosTxt:        { color: WHITE, fontWeight: "900", fontSize: 14, letterSpacing: 1.5 },
});