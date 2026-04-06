import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View, Text, FlatList, StyleSheet, TextInput, TouchableOpacity,
  LayoutAnimation, StatusBar, RefreshControl, ActivityIndicator,
  Animated, Dimensions, ScrollView, Platform
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../services/api";
import {
  Search, ChevronLeft, ChevronDown, ChevronUp,
  Heart, MapPin, Clock, Bus, Zap, Activity,
  Navigation, Star, TrendingUp, Users, ArrowRight
} from "lucide-react-native";

const { width } = Dimensions.get("window");

// ── Design tokens ─────────────────────────────────────────────────────────────
const INK      = "#0D1B2A";
const NAVY     = "#1E3A5F";
const BLUE     = "#2563EB";
const BLUE_S   = "#EFF6FF";
const BLUE_M   = "#BFDBFE";
const GREEN    = "#059669";
const GREEN_S  = "#D1FAE5";
const AMBER    = "#D97706";
const AMBER_S  = "#FEF3C7";
const RED      = "#DC2626";
const RED_S    = "#FEE2E2";
const SLATE    = "#64748B";
const MUTED    = "#94A3B8";
const BORDER   = "#E2E8F0";
const SURFACE  = "#F8FAFC";
const WHITE    = "#FFFFFF";

const FAV_KEY  = "nimble_fav_routes";

// ── Fare estimation based on stop count ──────────────────────────────────────
const estimateFare = (stopCount) => {
  if (!stopCount || stopCount <= 1) return "Rs. 20";
  if (stopCount <= 4)  return "Rs. 20 – 25";
  if (stopCount <= 8)  return "Rs. 25 – 30";
  return "Rs. 30 – 35";
};

// ── Avg travel time based on stop count ──────────────────────────────────────
const estimateTime = (stopCount, durationMin) => {
  if (durationMin) return `~${durationMin} min`;
  if (!stopCount)  return "N/A";
  return `~${stopCount * 5} min`;
};

// ── Tag chip ─────────────────────────────────────────────────────────────────
function Chip({ label, color, bg, icon: Icon, size = 10 }) {
  return (
    <View style={[styles.chip, { backgroundColor: bg }]}>
      {Icon && <Icon size={size} color={color} />}
      <Text style={[styles.chipTxt, { color }]}>{label}</Text>
    </View>
  );
}

// ── Route card ────────────────────────────────────────────────────────────────
function RouteCard({ route, activeBuses, isFav, onToggleFav, onTrack, expanded, onToggleExpand }) {
  const expandAnim = useRef(new Animated.Value(0)).current;

  const busesOnRoute = activeBuses.filter(b => b.route_name === route.name);
  const isActive     = busesOnRoute.length > 0;
  const stopCount    = route.stops?.length ?? 0;

  useEffect(() => {
    Animated.timing(expandAnim, {
      toValue: expanded ? 1 : 0,
      duration: 260,
      useNativeDriver: false,
    }).start();
  }, [expanded]);

  const chevronRotate = expandAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] });

  return (
    <View style={[styles.card, isActive && styles.cardActive]}>
      {/* ── Active bar ── */}
      {isActive && <View style={styles.activeBar} />}

      {/* ── Header row ── */}
      <TouchableOpacity style={styles.cardHeader} onPress={onToggleExpand} activeOpacity={0.7}>
        <View style={styles.cardHeaderLeft}>
          {/* Bus icon badge */}
          <View style={[styles.routeBadge, { backgroundColor: isActive ? BLUE : SURFACE }]}>
            <Bus size={18} color={isActive ? WHITE : SLATE} />
            {isActive && <View style={styles.activePulseDot} />}
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.routeName} numberOfLines={1}>{route.name}</Text>
            {/* Chips row */}
            <View style={styles.chipsRow}>
              {isActive
                ? <Chip label={`${busesOnRoute.length} bus${busesOnRoute.length > 1 ? "es" : ""} live`} color={GREEN} bg={GREEN_S} icon={Activity} />
                : <Chip label="No bus now" color={SLATE} bg={SURFACE} />
              }
              <Chip label={`${stopCount} stops`} color={NAVY} bg={BLUE_S} icon={MapPin} size={9} />
            </View>
          </View>
        </View>

        <View style={styles.cardHeaderRight}>
          <TouchableOpacity
            onPress={onToggleFav}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.favBtn}
          >
            <Heart
              size={20}
              color={isFav ? RED : MUTED}
              fill={isFav ? RED : "transparent"}
            />
          </TouchableOpacity>
          <Animated.View style={{ transform: [{ rotate: chevronRotate }], marginLeft: 4 }}>
            <ChevronDown size={18} color={SLATE} />
          </Animated.View>
        </View>
      </TouchableOpacity>

      {/* ── Stats bar ── */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Clock size={12} color={AMBER} />
          <Text style={styles.statVal}>{estimateTime(stopCount, route.duration_min)}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Zap size={12} color={BLUE} />
          <Text style={styles.statVal}>{estimateFare(stopCount)}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Bus size={12} color={isActive ? GREEN : MUTED} />
          <Text style={[styles.statVal, { color: isActive ? GREEN : MUTED }]}>
            {isActive ? `${busesOnRoute.length} active` : "Offline"}
          </Text>
        </View>
      </View>

      {/* ── Expanded stops ── */}
      {expanded && (
        <View style={styles.expandedBody}>
          <View style={styles.expandDivider} />

          {/* Active bus info if any */}
          {busesOnRoute.length > 0 && (
            <View style={styles.liveBusRow}>
              <View style={styles.liveDot} />
              <Text style={styles.liveBusTxt}>
                {busesOnRoute.map(b => `Bus ${b.bus_number}`).join("  •  ")} on this route
              </Text>
            </View>
          )}

          <Text style={styles.stopsLabel}>STOPS</Text>
          {route.stops?.map((stop, idx) => {
            const isFirst = idx === 0;
            const isLast  = idx === stopCount - 1;
            return (
              <View key={idx} style={styles.stopRow}>
                <View style={styles.timeline}>
                  <View style={[
                    styles.dot,
                    isFirst && { backgroundColor: BLUE,  width: 11, height: 11, borderRadius: 6 },
                    isLast  && { backgroundColor: RED,   width: 11, height: 11, borderRadius: 6 },
                  ]} />
                  {!isLast && <View style={styles.connLine} />}
                </View>
                <View style={styles.stopTextWrap}>
                  <Text style={[styles.stopName, (isFirst || isLast) && styles.stopNameBold]}>
                    {stop.stop_name}
                  </Text>
                  {isFirst && <Text style={styles.endTag}>ORIGIN</Text>}
                  {isLast  && <Text style={[styles.endTag, { color: RED }]}>DESTINATION</Text>}
                </View>
              </View>
            );
          })}

          <TouchableOpacity style={styles.trackBtn} onPress={onTrack} activeOpacity={0.85}>
            <Navigation size={15} color={WHITE} />
            <Text style={styles.trackBtnTxt}>Track Live on Map</Text>
            <ArrowRight size={14} color={WHITE} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ── Filter tabs ───────────────────────────────────────────────────────────────
const TABS = ["All", "Active", "Saved"];

// ── Main screen ───────────────────────────────────────────────────────────────
export default function AllRoutesScreen({ navigation }) {
  const [routes,       setRoutes]       = useState([]);
  const [activeBuses,  setActiveBuses]  = useState([]);
  const [favourites,   setFavourites]   = useState([]);
  const [search,       setSearch]       = useState("");
  const [tab,          setTab]          = useState("All");
  const [expandedId,   setExpandedId]   = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);

  // Poll active buses every 8s
  useEffect(() => {
    fetchAll();
    AsyncStorage.getItem(FAV_KEY).then(raw => raw && setFavourites(JSON.parse(raw)));
    const iv = setInterval(fetchActiveBuses, 8000);
    return () => clearInterval(iv);
  }, []);

  const fetchAll = async () => {
    try {
      const [rRes, bRes] = await Promise.all([api.get("/routes/"), api.get("/active-buses/")]);
      setRoutes(rRes.data);
      setActiveBuses(bRes.data);
    } catch (e) { console.error("AllRoutes fetch:", e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const fetchActiveBuses = async () => {
    try {
      const res = await api.get("/active-buses/");
      setActiveBuses(res.data);
    } catch (e) { console.log("Bus poll error:", e); }
  };

  const toggleFav = async (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const updated = favourites.includes(id)
      ? favourites.filter(f => f !== id)
      : [...favourites, id];
    setFavourites(updated);
    await AsyncStorage.setItem(FAV_KEY, JSON.stringify(updated));
  };

  const toggleExpand = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(prev => (prev === id ? null : id));
  };

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = routes.filter(r => {
    const q   = search.toLowerCase();
    const hit = !q ||
      r.name.toLowerCase().includes(q) ||
      r.stops?.some(s => s.stop_name.toLowerCase().includes(q));
    if (!hit) return false;
    if (tab === "Active") return activeBuses.some(b => b.route_name === r.name);
    if (tab === "Saved")  return favourites.includes(r.id);
    return true;
  });

  const activeCount = routes.filter(r => activeBuses.some(b => b.route_name === r.name)).length;

  if (loading) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="large" color={BLUE} />
        <Text style={styles.loaderTxt}>Loading routes…</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={WHITE} />

      {/* ── Header ── */}
      <SafeAreaView edges={["top"]} style={{ backgroundColor: WHITE }}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <ChevronLeft size={24} color={INK} />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>Bus Network</Text>
              <Text style={styles.headerSub}>{activeCount} routes active now</Text>
            </View>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveTxt}>Live</Text>
            </View>
          </View>

          {/* Search */}
          <View style={styles.searchWrap}>
            <Search size={16} color={SLATE} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search routes or stops…"
              placeholderTextColor={MUTED}
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
            />
            {!!search && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Text style={{ color: BLUE, fontWeight: "700", fontSize: 13 }}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            {TABS.map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
                onPress={() => setTab(t)}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabTxt, tab === t && styles.tabTxtActive]}>{t}</Text>
                {t === "Active" && (
                  <View style={styles.tabBadge}>
                    <Text style={styles.tabBadgeTxt}>{activeCount}</Text>
                  </View>
                )}
                {t === "Saved" && favourites.length > 0 && (
                  <View style={[styles.tabBadge, { backgroundColor: RED }]}>
                    <Text style={styles.tabBadgeTxt}>{favourites.length}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </SafeAreaView>

      {/* ── List ── */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAll(); }} tintColor={BLUE} />
        }
        renderItem={({ item }) => (
          <RouteCard
            route={item}
            activeBuses={activeBuses}
            isFav={favourites.includes(item.id)}
            onToggleFav={() => toggleFav(item.id)}
            onTrack={() => navigation.navigate("LiveMap", { selectedRoute: item })}
            expanded={expandedId === item.id}
            onToggleExpand={() => toggleExpand(item.id)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Bus size={40} color={MUTED} />
            <Text style={styles.emptyTxt}>
              {tab === "Saved" ? "No saved routes yet.\nTap ♥ on any route to save it." :
               tab === "Active" ? "No buses are active right now." :
               "No routes match your search."}
            </Text>
          </View>
        }
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: SURFACE },
  loaderWrap:    { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  loaderTxt:     { color: SLATE, fontWeight: "600" },

  // Header
  header:        { paddingHorizontal: 20, paddingBottom: 16, paddingTop: 8, backgroundColor: WHITE },
  headerTop:     { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  backBtn:       { width: 38, height: 38, borderRadius: 12, backgroundColor: SURFACE, justifyContent: "center", alignItems: "center" },
  headerTitle:   { fontSize: 20, fontWeight: "900", color: INK, letterSpacing: -0.5 },
  headerSub:     { fontSize: 12, color: SLATE, fontWeight: "500", marginTop: 1 },
  liveIndicator: { marginLeft: "auto", flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: GREEN_S, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  liveDot:       { width: 7, height: 7, borderRadius: 4, backgroundColor: GREEN },
  liveTxt:       { fontSize: 11, fontWeight: "800", color: GREEN },

  searchWrap:    { flexDirection: "row", alignItems: "center", backgroundColor: SURFACE, borderRadius: 14, paddingHorizontal: 14, height: 46, gap: 10, borderWidth: 1, borderColor: BORDER, marginBottom: 14 },
  searchInput:   { flex: 1, fontSize: 14, color: INK, fontWeight: "500" },

  tabs:          { flexDirection: "row", gap: 8 },
  tabBtn:        { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER },
  tabBtnActive:  { backgroundColor: INK, borderColor: INK },
  tabTxt:        { fontSize: 13, fontWeight: "700", color: SLATE },
  tabTxtActive:  { color: WHITE },
  tabBadge:      { backgroundColor: GREEN, borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1 },
  tabBadgeTxt:   { fontSize: 9, fontWeight: "800", color: WHITE },

  // List
  list:          { padding: 16, paddingBottom: 40 },

  // Card
  card:          { backgroundColor: WHITE, borderRadius: 20, marginBottom: 14, borderWidth: 1, borderColor: BORDER, overflow: "hidden", elevation: 2, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  cardActive:    { borderColor: BLUE_M },
  activeBar:     { height: 3, backgroundColor: BLUE },

  cardHeader:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, paddingBottom: 0 },
  cardHeaderLeft:{ flexDirection: "row", alignItems: "center", flex: 1, gap: 12 },
  cardHeaderRight:{ flexDirection: "row", alignItems: "center", gap: 2 },

  routeBadge:    { width: 44, height: 44, borderRadius: 14, justifyContent: "center", alignItems: "center", position: "relative" },
  activePulseDot:{ position: "absolute", top: 7, right: 7, width: 8, height: 8, borderRadius: 4, backgroundColor: GREEN, borderWidth: 1.5, borderColor: WHITE },

  routeName:     { fontSize: 15, fontWeight: "800", color: INK, marginBottom: 5 },
  chipsRow:      { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  chip:          { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  chipTxt:       { fontSize: 10, fontWeight: "700" },
  favBtn:        { padding: 6 },

  // Stats bar
  statsBar:      { flexDirection: "row", alignItems: "center", padding: 12, paddingHorizontal: 16, marginTop: 10, borderTopWidth: 1, borderTopColor: BORDER },
  statItem:      { flexDirection: "row", alignItems: "center", gap: 5, flex: 1, justifyContent: "center" },
  statVal:       { fontSize: 11, fontWeight: "700", color: SLATE },
  statDivider:   { width: 1, height: 16, backgroundColor: BORDER },

  // Expanded
  expandedBody:  { paddingHorizontal: 16, paddingBottom: 16 },
  expandDivider: { height: 1, backgroundColor: BORDER, marginVertical: 14 },

  liveBusRow:    { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: GREEN_S, borderRadius: 10, padding: 10, marginBottom: 14 },
  liveBusTxt:    { fontSize: 12, fontWeight: "700", color: GREEN },

  stopsLabel:    { fontSize: 10, fontWeight: "900", color: MUTED, letterSpacing: 1.2, marginBottom: 12 },

  stopRow:       { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  timeline:      { width: 16, alignItems: "center", paddingTop: 2 },
  dot:           { width: 8, height: 8, borderRadius: 4, backgroundColor: BORDER, zIndex: 2 },
  connLine:      { width: 2, height: 36, backgroundColor: BORDER, marginTop: 2 },
  stopTextWrap:  { flex: 1, paddingBottom: 24 },
  stopName:      { fontSize: 13, fontWeight: "500", color: SLATE },
  stopNameBold:  { fontWeight: "800", color: INK },
  endTag:        { fontSize: 9, fontWeight: "800", color: BLUE, marginTop: 2, letterSpacing: 0.5 },

  trackBtn:      { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: INK, borderRadius: 14, paddingVertical: 14, marginTop: 8 },
  trackBtnTxt:   { color: WHITE, fontWeight: "800", fontSize: 14 },

  // Empty
  empty:         { alignItems: "center", paddingTop: 80, gap: 14 },
  emptyTxt:      { fontSize: 14, color: MUTED, fontWeight: "600", textAlign: "center", lineHeight: 22 },
});