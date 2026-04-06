import React, { useState, useCallback, useRef } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import api from "../services/api";
import {
  Heart, Clock, Bus, MapPin, ChevronRight, Zap, Navigation,
  Ticket, ArrowRight, BookMarked, ReceiptText, TrendingUp,
} from "lucide-react-native";

// ── Design tokens ─────────────────────────────────────────────────────────────
const INK     = "#0D1B2A";
const BLUE    = "#2563EB";
const BLUE_S  = "#EFF6FF";
const BLUE_M  = "#BFDBFE";
const GREEN   = "#059669";
const GREEN_S = "#D1FAE5";
const AMBER   = "#D97706";
const AMBER_S = "#FEF3C7";
const RED     = "#DC2626";
const RED_S   = "#FEE2E2";
const SLATE   = "#64748B";
const MUTED   = "#94A3B8";
const BORDER  = "#E2E8F0";
const SURFACE = "#F8FAFC";
const WHITE   = "#FFFFFF";

const FAV_KEY = "nimble_fav_routes";

const estimateFare = (n) => !n || n <= 4 ? "Rs. 20" : n <= 8 ? "Rs. 20–30" : "Rs. 30–35";
const estimateTime = (n, d) => d ? `~${d} min` : `~${(n || 0) * 5} min`;

// ── Tab bar ───────────────────────────────────────────────────────────────────
function TabBar({ active, onSelect, savedCount, tripCount }) {
  const tabs = [
    { id: "saved",   label: "Saved Routes", Icon: Heart,      count: savedCount },
    { id: "history", label: "Trip History",  Icon: ReceiptText, count: tripCount },
  ];
  return (
    <View style={styles.tabBar}>
      {tabs.map(t => (
        <TouchableOpacity
          key={t.id}
          style={[styles.tab, active === t.id && styles.tabActive]}
          onPress={() => onSelect(t.id)}
          activeOpacity={0.8}
        >
          <t.Icon size={14} color={active === t.id ? BLUE : MUTED} />
          <Text style={[styles.tabTxt, active === t.id && styles.tabTxtActive]}>{t.label}</Text>
          {t.count > 0 && (
            <View style={[styles.tabCount, active === t.id && styles.tabCountActive]}>
              <Text style={[styles.tabCountTxt, active === t.id && styles.tabCountTxtActive]}>{t.count}</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── Saved route card ──────────────────────────────────────────────────────────
function SavedRouteCard({ route, activeBuses, onPress, onUnfav }) {
  const busesOnRoute = activeBuses.filter(b => b.route_name === route.name);
  const isActive     = busesOnRoute.length > 0;
  const stopCount    = route.stops?.length ?? 0;
  const scaleAnim    = useRef(new Animated.Value(1)).current;

  const pressIn  = () => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, tension: 200 }).start();
  const pressOut = () => Animated.spring(scaleAnim, { toValue: 1,    useNativeDriver: true, tension: 200 }).start();

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={styles.routeCard}
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        activeOpacity={1}
      >
        {isActive && <View style={styles.activeAccent} />}

        <View style={styles.routeCardPad}>
          {/* Top row */}
          <View style={styles.routeTop}>
            <View style={[styles.busIcon, { backgroundColor: isActive ? BLUE : SURFACE }]}>
              <Bus size={18} color={isActive ? WHITE : SLATE} />
              {isActive && <View style={styles.pulseDot} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.routeName} numberOfLines={1}>{route.name}</Text>
              {isActive
                ? <View style={styles.liveChip}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveChipTxt}>{busesOnRoute.length} bus live</Text>
                  </View>
                : <Text style={styles.offlineTxt}>No bus currently</Text>}
            </View>
            <TouchableOpacity onPress={onUnfav} style={styles.heartBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Heart size={20} color={RED} fill={RED} />
            </TouchableOpacity>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statChip}>
              <MapPin size={11} color={MUTED} />
              <Text style={styles.statChipTxt}>{stopCount} stops</Text>
            </View>
            <View style={styles.statChip}>
              <Clock size={11} color={MUTED} />
              <Text style={styles.statChipTxt}>{estimateTime(stopCount, route.duration_min)}</Text>
            </View>
            <View style={styles.statChip}>
              <Zap size={11} color={MUTED} />
              <Text style={styles.statChipTxt}>{estimateFare(stopCount)}</Text>
            </View>
          </View>

          {/* Stops preview */}
          {route.stops?.length >= 2 && (
            <View style={styles.stopsBar}>
              <View style={styles.stopItem}>
                <View style={[styles.stopDot, { backgroundColor: BLUE }]} />
                <Text style={styles.stopTxt} numberOfLines={1}>{route.stops[0].stop_name}</Text>
              </View>
              <ArrowRight size={12} color={MUTED} />
              <View style={styles.stopItem}>
                <View style={[styles.stopDot, { backgroundColor: INK }]} />
                <Text style={styles.stopTxt} numberOfLines={1}>{route.stops[route.stops.length - 1].stop_name}</Text>
              </View>
            </View>
          )}

          {/* Track CTA */}
          <View style={styles.trackRow}>
            <Navigation size={12} color={BLUE} />
            <Text style={styles.trackTxt}>Track on Map</Text>
            <ChevronRight size={12} color={BLUE} />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Trip card (ticket style) ──────────────────────────────────────────────────
function TripCard({ trip, onPress }) {
  const statusMap = {
    COMPLETED:       { color: GREEN, bg: GREEN_S, label: "Completed" },
    ONBOARD:         { color: BLUE,  bg: BLUE_S,  label: "On Board"  },
    PAYMENT_PENDING: { color: AMBER, bg: AMBER_S, label: "Pay Now"   },
    CANCELLED:       { color: MUTED, bg: SURFACE, label: "Cancelled" },
  };
  const { color, bg, label } = statusMap[trip.status] || statusMap.CANCELLED;

  return (
    <TouchableOpacity style={styles.tripCard} onPress={onPress} activeOpacity={0.85}>
      {/* Colored left accent */}
      <View style={[styles.tripAccent, { backgroundColor: color }]} />

      <View style={styles.tripBody}>
        {/* Header */}
        <View style={styles.tripHeader}>
          <View style={styles.tripBusChip}>
            <Bus size={13} color={BLUE} />
            <Text style={styles.tripBusNum}>Bus #{trip.bus_number || "—"}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: bg }]}>
            <Text style={[styles.statusTxt, { color }]}>{label}</Text>
          </View>
        </View>

        {trip.route_name && (
          <Text style={styles.tripRoute} numberOfLines={1}>{trip.route_name}</Text>
        )}

        {/* Stops */}
        <View style={styles.tripStops}>
          <View style={styles.tripStopRow}>
            <View style={[styles.tripStopDot, { backgroundColor: BLUE }]} />
            <Text style={styles.tripStopTxt} numberOfLines={1}>{trip.start_stop_name || "—"}</Text>
          </View>
          <View style={styles.tripStopConnector} />
          <View style={styles.tripStopRow}>
            <View style={[styles.tripStopDot, { backgroundColor: INK }]} />
            <Text style={styles.tripStopTxt} numberOfLines={1}>{trip.end_stop_name || "In progress"}</Text>
          </View>
        </View>

        {/* Tear line */}
        <View style={styles.tearRow}>
          <View style={styles.tearCircle} />
          <View style={styles.tearDash} />
          <View style={styles.tearCircle} />
        </View>

        {/* Footer */}
        <View style={styles.tripFooter}>
          <View style={styles.tripDateRow}>
            <Clock size={11} color={MUTED} />
            <Text style={styles.tripDate}>
              {new Date(trip.created_at).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
            </Text>
          </View>
          <Text style={styles.tripFare}>Rs. {trip.fare_amount}</Text>
        </View>

        {trip.status === "PAYMENT_PENDING" && (
          <View style={styles.payBanner}>
            <Text style={styles.payBannerTxt}>Tap to complete payment →</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ── Summary stats row ─────────────────────────────────────────────────────────
function SummaryRow({ savedCount, tripCount, totalSpent }) {
  return (
    <View style={styles.summaryRow}>
      <View style={styles.summaryItem}>
        <Heart size={16} color={RED} fill={RED} />
        <Text style={styles.summaryVal}>{savedCount}</Text>
        <Text style={styles.summaryLab}>Saved</Text>
      </View>
      <View style={styles.summaryDivider} />
      <View style={styles.summaryItem}>
        <Ticket size={16} color={BLUE} />
        <Text style={styles.summaryVal}>{tripCount}</Text>
        <Text style={styles.summaryLab}>Trips</Text>
      </View>
      <View style={styles.summaryDivider} />
      <View style={styles.summaryItem}>
        <TrendingUp size={16} color={GREEN} />
        <Text style={styles.summaryVal}>Rs.{totalSpent}</Text>
        <Text style={styles.summaryLab}>Spent</Text>
      </View>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function SavedScreen({ navigation }) {
  const [tab,         setTab]         = useState("saved");
  const [routes,      setRoutes]      = useState([]);
  const [favIds,      setFavIds]      = useState([]);
  const [activeBuses, setActiveBuses] = useState([]);
  const [trips,       setTrips]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchAll();
      const iv = setInterval(fetchActiveBuses, 8000);
      return () => clearInterval(iv);
    }, [])
  );

  const fetchAll = async () => {
    try { await Promise.all([fetchRouteData(), fetchTrips(), fetchActiveBuses()]); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const fetchRouteData = async () => {
    try {
      const raw = await AsyncStorage.getItem(FAV_KEY);
      const ids = raw ? JSON.parse(raw) : [];
      setFavIds(ids);
      if (ids.length > 0) { const res = await api.get("/routes/"); setRoutes(res.data); }
    } catch (e) { console.log(e); }
  };

  const fetchActiveBuses = async () => {
    try { const res = await api.get("/active-buses/"); setActiveBuses(res.data); }
    catch (e) { console.log(e); }
  };

  const fetchTrips = async () => {
    try { const res = await api.get("/trips/"); setTrips(res.data); }
    catch (e) { console.log(e); }
  };

  const unfavRoute = async (id) => {
    const updated = favIds.filter(f => f !== id);
    setFavIds(updated);
    await AsyncStorage.setItem(FAV_KEY, JSON.stringify(updated));
  };

  const savedRoutes   = routes.filter(r => favIds.includes(r.id));
  const visibleTrips  = trips.filter(t => t.status !== "CANCELLED");
  const totalSpent    = trips.reduce((acc, t) => acc + (parseFloat(t.fare_amount) || 0), 0);

  if (loading) return (
    <View style={styles.loader}>
      <ActivityIndicator size="large" color={BLUE} />
    </View>
  );

  return (
    <View style={styles.root}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <SafeAreaView edges={["top"]}>
          <View style={styles.headerInner}>
            <View>
              <Text style={styles.headerTitle}>My Nimble</Text>
              <Text style={styles.headerSub}>Saved routes & trip history</Text>
            </View>
          </View>

          <SummaryRow
            savedCount={savedRoutes.length}
            tripCount={visibleTrips.length}
            totalSpent={Math.round(totalSpent)}
          />

          <TabBar
            active={tab}
            onSelect={setTab}
            savedCount={savedRoutes.length}
            tripCount={visibleTrips.length}
          />
        </SafeAreaView>
      </View>

      {/* ── Content ── */}
      {tab === "saved" ? (
        <FlatList
          data={savedRoutes}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAll(); }} tintColor={BLUE} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIcon}><BookMarked size={32} color={MUTED} /></View>
              <Text style={styles.emptyTitle}>No saved routes</Text>
              <Text style={styles.emptySub}>Tap ♥ on any route to save it here for quick access.</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate("AllRoutesScreen")}>
                <Text style={styles.emptyBtnTxt}>Browse Routes</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <SavedRouteCard
              route={item}
              activeBuses={activeBuses}
              onPress={() => navigation.navigate("LiveMap", { selectedRoute: item })}
              onUnfav={() => unfavRoute(item.id)}
            />
          )}
        />
      ) : (
        <FlatList
          data={visibleTrips}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAll(); }} tintColor={BLUE} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIcon}><Ticket size={32} color={MUTED} /></View>
              <Text style={styles.emptyTitle}>No trips yet</Text>
              <Text style={styles.emptySub}>Your completed and active trips will appear here.</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate("LiveMap")}>
                <Text style={styles.emptyBtnTxt}>Find a Bus</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <TripCard trip={item} onPress={() => navigation.navigate("TicketScreen")} />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: SURFACE },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },

  // Header
  header:       { backgroundColor: INK, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, paddingBottom: 16 },
  headerInner:  { paddingHorizontal: 22, paddingTop: 10, paddingBottom: 18 },
  headerTitle:  { fontSize: 26, fontWeight: "900", color: WHITE, letterSpacing: -0.5 },
  headerSub:    { fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 3 },

  // Summary
  summaryRow:     { flexDirection: "row", marginHorizontal: 22, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 18, padding: 16, marginBottom: 14 },
  summaryItem:    { flex: 1, alignItems: "center", gap: 4 },
  summaryVal:     { fontSize: 16, fontWeight: "900", color: WHITE },
  summaryLab:     { fontSize: 11, fontWeight: "600", color: "rgba(255,255,255,0.45)" },
  summaryDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.1)" },

  // Tabs
  tabBar:        { flexDirection: "row", marginHorizontal: 22, backgroundColor: "rgba(255,255,255,0.07)", borderRadius: 16, padding: 4, gap: 4 },
  tab:           { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 11, borderRadius: 13 },
  tabActive:     { backgroundColor: WHITE },
  tabTxt:        { fontSize: 12, fontWeight: "700", color: "rgba(255,255,255,0.45)" },
  tabTxtActive:  { color: INK },
  tabCount:      { backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 },
  tabCountActive:{ backgroundColor: BLUE_S },
  tabCountTxt:   { fontSize: 10, fontWeight: "800", color: "rgba(255,255,255,0.6)" },
  tabCountTxtActive: { color: BLUE },

  // List
  list: { padding: 16, paddingTop: 20, paddingBottom: 48 },

  // Route card
  routeCard:    {
    backgroundColor: WHITE, borderRadius: 22, marginBottom: 14, overflow: "hidden",
    borderWidth: 1, borderColor: BORDER,
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 }, elevation: 3,
  },
  activeAccent: { height: 3, backgroundColor: BLUE },
  routeCardPad: { padding: 16 },
  routeTop:     { flexDirection: "row", alignItems: "center", gap: 13, marginBottom: 14 },
  busIcon:      { width: 46, height: 46, borderRadius: 16, justifyContent: "center", alignItems: "center", position: "relative" },
  pulseDot:     { position: "absolute", top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: GREEN, borderWidth: 1.5, borderColor: WHITE },
  routeName:    { fontSize: 15, fontWeight: "800", color: INK, marginBottom: 5 },
  liveChip:     { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: GREEN_S, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, alignSelf: "flex-start" },
  liveDot:      { width: 6, height: 6, borderRadius: 3, backgroundColor: GREEN },
  liveChipTxt:  { fontSize: 10, fontWeight: "800", color: GREEN },
  offlineTxt:   { fontSize: 11, color: MUTED, fontWeight: "600" },
  heartBtn:     { width: 36, height: 36, borderRadius: 12, backgroundColor: RED_S, justifyContent: "center", alignItems: "center" },

  statsRow:     { flexDirection: "row", gap: 8, marginBottom: 12 },
  statChip:     { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: SURFACE, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1, borderColor: BORDER },
  statChipTxt:  { fontSize: 11, fontWeight: "700", color: SLATE },

  stopsBar:     { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: SURFACE, borderRadius: 12, padding: 11, marginBottom: 12 },
  stopItem:     { flex: 1, flexDirection: "row", alignItems: "center", gap: 6 },
  stopDot:      { width: 7, height: 7, borderRadius: 4, flexShrink: 0 },
  stopTxt:      { fontSize: 11, fontWeight: "600", color: SLATE, flex: 1 },

  trackRow:     { flexDirection: "row", alignItems: "center", gap: 5, justifyContent: "flex-end" },
  trackTxt:     { fontSize: 12, fontWeight: "700", color: BLUE },

  // Trip card
  tripCard:     {
    backgroundColor: WHITE, borderRadius: 20, marginBottom: 14, overflow: "hidden",
    borderWidth: 1, borderColor: BORDER,
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 3,
    flexDirection: "row",
  },
  tripAccent:   { width: 4 },
  tripBody:     { flex: 1, padding: 16 },
  tripHeader:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  tripBusChip:  { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: BLUE_S, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  tripBusNum:   { fontSize: 12, fontWeight: "800", color: BLUE },
  statusBadge:  { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusTxt:    { fontSize: 10, fontWeight: "800" },
  tripRoute:    { fontSize: 14, fontWeight: "700", color: INK, marginBottom: 12 },

  tripStops:    { gap: 3, marginBottom: 12 },
  tripStopRow:  { flexDirection: "row", alignItems: "center", gap: 8 },
  tripStopDot:  { width: 8, height: 8, borderRadius: 4 },
  tripStopConnector: { width: 2, height: 12, backgroundColor: BORDER, marginLeft: 3 },
  tripStopTxt:  { fontSize: 13, fontWeight: "600", color: SLATE, flex: 1 },

  tearRow:      { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  tearCircle:   { width: 8, height: 8, borderRadius: 4, backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER },
  tearDash:     { flex: 1, height: 1, borderStyle: "dashed", borderWidth: 1, borderColor: BORDER, marginHorizontal: 2 },

  tripFooter:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  tripDateRow:  { flexDirection: "row", alignItems: "center", gap: 5 },
  tripDate:     { fontSize: 11, color: MUTED, fontWeight: "600" },
  tripFare:     { fontSize: 18, fontWeight: "900", color: BLUE },

  payBanner:    { backgroundColor: AMBER_S, borderRadius: 10, padding: 10, marginTop: 10, alignItems: "center" },
  payBannerTxt: { fontSize: 12, fontWeight: "700", color: AMBER },

  // Empty states
  empty:      { alignItems: "center", paddingTop: 72, paddingHorizontal: 32, gap: 12 },
  emptyIcon:  { width: 72, height: 72, borderRadius: 24, backgroundColor: WHITE, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: BORDER, marginBottom: 4 },
  emptyTitle: { fontSize: 18, fontWeight: "900", color: INK },
  emptySub:   { fontSize: 13, color: MUTED, textAlign: "center", lineHeight: 20 },
  emptyBtn:   { backgroundColor: INK, paddingHorizontal: 28, paddingVertical: 13, borderRadius: 20, marginTop: 4 },
  emptyBtnTxt:{ color: WHITE, fontWeight: "800", fontSize: 13 },
});