import React, { useEffect, useState, useRef } from "react";
import {
  StyleSheet, View, Text, TouchableOpacity, StatusBar,
  Animated, PanResponder, Dimensions, FlatList, TextInput,
  ScrollView, Alert, Platform, ActivityIndicator
} from "react-native";
import { WebView } from "react-native-webview";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../services/api";
import { initNotifications, sendLocalAlert } from "../services/notificationService";
import {
  ChevronLeft, Bus, MapPin, Search, Navigation, Heart,
  X, Navigation2, ChevronRight, Clock, Radio,
  AlertCircle, Zap, ArrowRight
} from "lucide-react-native";

// ── Leaflet HTML ──────────────────────────────────────────────────────────────
// Built with array-join (no backticks inside the content) to avoid the Metro /
// Hermes bug where escaped \`...\` inside a JSX string crashes the bundle.
const LEAFLET_HTML = (function buildLeafletHTML() {
  var BLUE = "#2563EB";
  var INK  = "#0F172A";
  var lines = [
    "<!DOCTYPE html>",
    "<html>",
    "<head>",
    '<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>',
    '<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>',
    '<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script>',
    '<script src="https://cdn.jsdelivr.net/npm/@mapbox/polyline@1.2.1/src/polyline.js"><\/script>',
    "<style>",
    "  * { margin:0; padding:0; box-sizing:border-box; }",
    "  body { background:#e2e8f0; }",
    "  #map { height:100vh; width:100vw; }",
    "  .stop-mid  { width:9px;  height:9px;  background:#fff; border:2.5px solid " + INK + "; border-radius:50%; }",
    "  .stop-term { width:12px; height:12px; background:" + BLUE + "; border:2.5px solid #fff; border-radius:50%; }",
    "  .bus-wrap  { width:32px; height:32px; background:" + BLUE + "; border:2.5px solid #fff; border-radius:50%; display:flex; justify-content:center; align-items:center; box-shadow:0 2px 8px rgba(37,99,235,.5); }",
    "  .user-pulse { width:16px; height:16px; background:" + BLUE + "; border:3px solid #fff; border-radius:50%; box-shadow:0 0 0 6px rgba(37,99,235,.2); }",
    "</style>",
    "</head>",
    "<body>",
    '<div id="map"></div>',
    "<script>",
    'var map = L.map("map", { zoomControl: false }).setView([27.7172, 85.3240], 13);',
    'L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", { attribution: "\\u00a9OpenStreetMap" }).addTo(map);',
    "var routeLayer = null;",
    "var stopLayer  = L.layerGroup().addTo(map);",
    "var busLayer   = L.layerGroup().addTo(map);",
    "var userMarker = null;",
    "var zoomDone   = false;",
    "function makeIcon(html, w, h) { return L.divIcon({ className: '', html: html, iconSize: [w,h], iconAnchor: [w/2,h/2] }); }",
    "var termIcon = makeIcon('<div class=\"stop-term\"></div>', 12, 12);",
    "var midIcon  = makeIcon('<div class=\"stop-mid\"></div>',  9,  9);",
    "var busSVG = '<div class=\"bus-wrap\"><svg width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"white\"><rect x=\"1\" y=\"3\" width=\"15\" height=\"13\" rx=\"2\"/><path d=\"M16 8h1a2 2 0 0 1 2 2v3h1a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-1\"/><circle cx=\"5.5\" cy=\"18.5\" r=\"2.5\"/><circle cx=\"14.5\" cy=\"18.5\" r=\"2.5\"/></svg></div>';",
    "var busIcon = makeIcon(busSVG, 32, 32);",
    "window.resetZoomGuard = function() { zoomDone = false; };",
    "window.updateUserLocation = function(lat, lng) {",
    "  var ll = [lat, lng];",
    "  if (!userMarker) { userMarker = L.marker(ll, { icon: makeIcon('<div class=\"user-pulse\"></div>', 16, 16) }).addTo(map); }",
    "  else { userMarker.setLatLng(ll); }",
    "  map.flyTo(ll, 16, { duration: 1.2 });",
    "};",
    "window.filterMap = function(route, buses) {",
    "  if (routeLayer) { map.removeLayer(routeLayer); routeLayer = null; }",
    "  stopLayer.clearLayers(); busLayer.clearLayers();",
    "  if (!route) return;",
    "  var routeBounds = null;",
    "  if (route.polyline && route.polyline.length > 0) {",
    "    try {",
    "      var latlngs = polyline.decode(route.polyline, 6);",
    '      routeLayer = L.polyline(latlngs, { color: "' + INK + '", weight: 4, opacity: 0.85 }).addTo(map);',
    "      routeBounds = routeLayer.getBounds();",
    "    } catch(err) { console.warn('Polyline decode failed:', err); }",
    "  }",
    "  if (!routeLayer && route.stops && route.stops.length >= 2) {",
    "    var coords = route.stops.map(function(s) { return [parseFloat(s.lat), parseFloat(s.lng)]; });",
    '    routeLayer = L.polyline(coords, { color: "' + INK + '", weight: 4, opacity: 0.85, dashArray: "8,5" }).addTo(map);',
    "    routeBounds = routeLayer.getBounds();",
    "  }",
    "  if (route.stops) {",
    "    var lastIdx = route.stops.length - 1;",
    "    route.stops.forEach(function(stop, i) {",
    "      var icon = (i === 0 || i === lastIdx) ? termIcon : midIcon;",
    "      L.marker([parseFloat(stop.lat), parseFloat(stop.lng)], { icon: icon })",
    '       .addTo(stopLayer).bindTooltip(stop.stop_name, { permanent: false, direction: "top", offset: [0,-6] });',
    "    });",
    "  }",
    "  buses.forEach(function(b) {",
    "    if (b.route_name === route.name) {",
    "      L.marker([parseFloat(b.lat), parseFloat(b.lng)], { icon: busIcon })",
    "       .addTo(busLayer).bindPopup('<b>Bus ' + b.bus_number + '</b><br/>' + route.name);",
    "    }",
    "  });",
    "  if (!zoomDone && routeBounds) { map.fitBounds(routeBounds, { padding: [60,60] }); zoomDone = true; }",
    "};",
    "<\/script>",
    "</body>",
    "</html>",
  ];
  return lines.join("\n");
}());

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const SNAP_TOP = 80;
const SNAP_MID = SCREEN_HEIGHT * 0.44;
const SNAP_LOW = SCREEN_HEIGHT * 0.76;

const C = {
  blue:        "#2563EB",
  blueSoft:    "#EFF6FF",
  blueMid:     "#BFDBFE",
  green:       "#10B981",
  greenSoft:   "#D1FAE5",
  amber:       "#F59E0B",
  amberSoft:   "#FEF3C7",
  red:         "#EF4444",
  ink:         "#0F172A",
  slate:       "#475569",
  muted:       "#94A3B8",
  border:      "#E2E8F0",
  surface:     "#F8FAFC",
  white:       "#FFFFFF",
};

const FAV_KEY = "nimble_fav_routes";

const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ── Helpers for injectJavaScript ─────────────────────────────────────────────
// Using JSON.stringify ensures the payload is always valid JS regardless of
// what characters are in route names or stop names.
const jsFilterMap = (route, buses) =>
  `window.filterMap(${JSON.stringify(route)}, ${JSON.stringify(buses)});`;

const jsUpdateUser = (lat, lng) =>
  `window.updateUserLocation(${lat}, ${lng});`;

// ─────────────────────────────────────────────────────────────────────────────
export default function LiveMap({ navigation }) {
  const [mapData,       setMapData]       = useState({ buses: [], routes: [] });
  const [filteredItems, setFilteredItems] = useState([]);
  const [searchQuery,   setSearchQuery]   = useState("");
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [viewState,     setViewState]     = useState("menu");
  const [userLoc,       setUserLoc]       = useState(null);
  const [hasNotified,   setHasNotified]   = useState(false);
  const [favourites,    setFavourites]    = useState([]);
  const [activeBuses,   setActiveBuses]   = useState([]);

  // ── Boarding flow ─────────────────────────────────────────────────────────
  const [boardingStep,   setBoardingStep]   = useState(null); // null|"selectStart"|"selectEnd"|"confirm"|"paying"
  const [selectedBus,    setSelectedBus]    = useState(null);
  const [startStop,      setStartStop]      = useState(null);
  const [endStop,        setEndStop]        = useState(null);
  const [activeTrip,     setActiveTrip]     = useState(null); // {trip_id,fare,signature,txn_uuid}
  const [bookingLoading, setBookingLoading] = useState(false);

  const webviewRef = useRef(null);
  const pan        = useRef(new Animated.ValueXY({ x: 0, y: SNAP_LOW })).current;

  // Stable refs so polling closure always sees latest values
  const selectedRouteRef = useRef(null);
  const userLocRef       = useRef(null);
  const hasNotifiedRef   = useRef(false);
  useEffect(() => { selectedRouteRef.current = selectedRoute; }, [selectedRoute]);
  useEffect(() => { userLocRef.current       = userLoc;       }, [userLoc]);
  useEffect(() => { hasNotifiedRef.current   = hasNotified;   }, [hasNotified]);

  // ── Favourites ────────────────────────────────────────────────────────────
  useEffect(() => {
    AsyncStorage.getItem(FAV_KEY).then(raw => {
      if (raw) setFavourites(JSON.parse(raw));
    });
  }, []);

  const toggleFavourite = async (routeId) => {
    const updated = favourites.includes(routeId)
      ? favourites.filter(id => id !== routeId)
      : [...favourites, routeId];
    setFavourites(updated);
    await AsyncStorage.setItem(FAV_KEY, JSON.stringify(updated));
  };

  const isFav = (id) => favourites.includes(id);

  // ── Bootstrap ─────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      await initNotifications();
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({});
        setUserLoc(loc.coords);
      }
    })();
    fetchInitialData();
    const interval = setInterval(refreshBusPositions, 5000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchInitialData = async () => {
    try {
      const [r, b] = await Promise.all([api.get("/routes/"), api.get("/active-buses/")]);
      setMapData({ routes: r.data, buses: b.data });
      setFilteredItems(r.data);
      setActiveBuses(b.data);
    } catch (e) { console.error("Fetch Error:", e); }
  };

  const refreshBusPositions = async () => {
    try {
      const res = await api.get("/active-buses/");
      setMapData(prev => ({ ...prev, buses: res.data }));
      setActiveBuses(res.data);

      const route = selectedRouteRef.current;
      const loc   = userLocRef.current;
      if (loc && route) {
        const bus = res.data.find(b => b.route_name === route.name);
        if (bus) {
          const dist = getDistance(loc.latitude, loc.longitude, bus.lat, bus.lng);
          if (dist < 500 && !hasNotifiedRef.current) {
            sendLocalAlert("Bus Arriving!", `Bus ${bus.bus_number} is ${Math.round(dist)}m away.`);
            setHasNotified(true);
          } else if (dist > 1000) {
            setHasNotified(false);
          }
        }
      }

      if (route && webviewRef.current) {
        webviewRef.current.injectJavaScript(jsFilterMap(route, res.data));
      }
    } catch (e) { console.log("Poll error:", e); }
  };

  // ── Search: routes + stops ────────────────────────────────────────────────
  const handleSearch = (text) => {
    setSearchQuery(text);
    if (!text.trim()) {
      setFilteredItems(mapData.routes);
      return;
    }
    const q = text.toLowerCase();
    const routeMatches = mapData.routes
      .filter(r => r.name.toLowerCase().includes(q))
      .map(r => ({ ...r, _matchType: "route" }));

    const seenIds = new Set(routeMatches.map(r => r.id));
    const stopMatches = [];
    mapData.routes.forEach(route => {
      if (seenIds.has(route.id)) return;
      const hit = route.stops?.find(s => s.stop_name.toLowerCase().includes(q));
      if (hit) {
        stopMatches.push({ ...route, _matchType: "stop", _matchedStop: hit.stop_name });
        seenIds.add(route.id);
      }
    });

    setFilteredItems([...routeMatches, ...stopMatches]);
    if (viewState !== "list") setViewState("list");
  };

  // ── Route selection ───────────────────────────────────────────────────────
  const onSelectRoute = (route) => {
    setSelectedRoute(route);
    setHasNotified(false);
    setViewState("detail");
    webviewRef.current?.injectJavaScript(
      `window.resetZoomGuard(); ${jsFilterMap(route, mapData.buses)}`
    );
    animateTo(SNAP_MID);
  };

  // ── ETA ───────────────────────────────────────────────────────────────────
  const getETA = (stopOrder) => {
    if (!selectedRoute || !mapData.buses.length) return "--";
    const bus = mapData.buses.find(b => b.route_name === selectedRoute.name);
    if (!bus) return "N/A";
    const diff = stopOrder - (bus.current_stop_order || 0);
    if (diff < 0)  return "Passed";
    if (diff === 0) return "Here";
    return `~${diff * 7}m`;
  };

  const getETAColor = (eta) => {
    if (eta === "Here")                     return C.green;
    if (eta === "Passed" || eta === "N/A" || eta === "--") return C.muted;
    return C.blue;
  };

  // ── Sheet animation ───────────────────────────────────────────────────────
  const animateTo = (toValue) =>
    Animated.spring(pan.y, { toValue, useNativeDriver: false, tension: 65, friction: 11 }).start();

  const panResponder = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 6,
    onPanResponderMove:  (_, g) => pan.y.setValue(Math.max(SNAP_TOP, pan.y._value + g.dy)),
    onPanResponderRelease: (_, g) => {
      const pts     = [SNAP_TOP, SNAP_MID, SNAP_LOW];
      const closest = pts.reduce((p, c) =>
        Math.abs(c - pan.y._value) < Math.abs(p - pan.y._value) ? c : p
      );
      animateTo(g.vy > 0.5 ? SNAP_LOW : closest);
    },
  })).current;

  // ── Boarding flow handlers ────────────────────────────────────────────────
  const handleTakeBus = () => {
    // Find the live bus on this route
    const bus = activeBuses.find(b => b.route_name === selectedRoute.name);
    if (!bus) {
      Alert.alert("No Active Bus", "There is no active bus on this route right now.");
      return;
    }
    setSelectedBus(bus);
    setStartStop(null);
    setEndStop(null);
    setActiveTrip(null);
    setBoardingStep("selectStart");
    animateTo(SNAP_TOP);
  };

  const handleSelectStart = (stop) => {
    setStartStop(stop);
    setBoardingStep("selectEnd");
  };

  const handleSelectEnd = async (stop) => {
    if (stop.stop === startStop.stop) {
      Alert.alert("Invalid Stop", "Start and end stop cannot be the same.");
      return;
    }
    setEndStop(stop);
    setBoardingStep("confirm");
  };

  // Calculate fare client-side (mirrors backend logic) for preview
  const calcFarePreview = (startOrder, endOrder) => {
    const distance = Math.abs(endOrder - startOrder);
    if (distance <= 3) return 20;
    return Math.min(20 + (Math.floor((distance - 1) / 3) * 5), 35);
  };

  const confirmAndStartTrip = async () => {
    if (!selectedBus || !startStop) return;
    setBookingLoading(true);
    try {
      // 1. start_trip — creates ONBOARD trip
      const startRes = await api.post("/trips/start/", {
        bus_id:        selectedBus.bus,  // bus id from BusLocation serializer
        start_stop_id: startStop.stop,
      });
      const trip_id = startRes.data.trip_id;

      // 2. end_trip — calculates real fare + eSewa signature
      const endRes = await api.post(`/trips/${trip_id}/end/`, {
        end_stop_id: endStop.stop,
      });

      setActiveTrip({
        trip_id,
        fare:      endRes.data.fare,
        signature: endRes.data.signature,
        txn_uuid:  endRes.data.transaction_uuid,
      });
      setBoardingStep("paying");
    } catch (e) {
      Alert.alert("Error", "Could not start trip. Please try again.");
      console.error("Trip start error:", e);
    } finally {
      setBookingLoading(false);
    }
  };

  const handleEsewaPayment = async () => {
    if (!activeTrip) return;
    setBookingLoading(true);
    try {
      // Use dummy pay endpoint for test environment
      await api.post("/esewa/dummy-pay/", { trip_id: activeTrip.trip_id });
      setBoardingStep(null);
      setSelectedBus(null);
      setStartStop(null);
      setEndStop(null);
      Alert.alert("✅ Payment Confirmed!", "Your ticket has been issued. Enjoy the ride!");
      navigation.navigate("TicketScreen");
    } catch (e) {
      Alert.alert("Payment Failed", "Please try again.");
    } finally {
      setBookingLoading(false);
    }
  };

  const cancelBoarding = () => {
    setBoardingStep(null);
    setSelectedBus(null);
    setStartStop(null);
    setEndStop(null);
    setActiveTrip(null);
    animateTo(SNAP_MID);
  };

  const handleLocateMe = async () => {
    try {
      const loc = await Location.getCurrentPositionAsync({});
      setUserLoc(loc.coords);
      webviewRef.current?.injectJavaScript(jsUpdateUser(loc.coords.latitude, loc.coords.longitude));
    } catch { Alert.alert("GPS Error", "Ensure GPS is enabled."); }
  };

  const savedRoutes = mapData.routes.filter(r => favourites.includes(r.id));

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      <WebView
        ref={webviewRef}
        source={{ html: LEAFLET_HTML }}
        style={s.map}
        originWhitelist={["*"]}
        // Allows the CDN scripts to load inside WebView
        mixedContentMode="always"
        javaScriptEnabled
        domStorageEnabled
        onError={(e) => console.error("WebView error:", e.nativeEvent)}
      />

      {/* Top search bar */}
      <SafeAreaView style={s.topBar} pointerEvents="box-none">
        <View style={s.searchRow}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <ChevronLeft color={C.ink} size={22} />
          </TouchableOpacity>
          <View style={s.searchBox}>
            <Search color={C.muted} size={16} style={{ marginRight: 8 }} />
            <TextInput
              placeholder="Routes, stops, areas…"
              placeholderTextColor={C.muted}
              style={s.searchInput}
              value={searchQuery}
              onChangeText={handleSearch}
              returnKeyType="search"
            />
            {!!searchQuery && (
              <TouchableOpacity onPress={() => { handleSearch(""); setViewState("menu"); }}>
                <X color={C.muted} size={16} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>

      {/* Locate FAB */}
      <TouchableOpacity style={s.locateFab} onPress={handleLocateMe} activeOpacity={0.85}>
        <Navigation2 color={C.blue} size={20} />
      </TouchableOpacity>

      {/* Live bus pill */}
      {activeBuses.length > 0 && (
        <View style={s.livePill}>
          <View style={s.liveDot} />
          <Text style={s.livePillTxt}>{activeBuses.length} live</Text>
        </View>
      )}

      {/* Bottom sheet */}
      <Animated.View style={[s.sheet, { transform: [{ translateY: pan.y }] }]} {...panResponder.panHandlers}>
        <View style={s.handle} />

        {viewState === "menu" && (
          <MenuView
            onBuses={() => setViewState("list")}
            onLive={() => setViewState("live")}
            onSaved={() => setViewState("saved")}
            favCount={favourites.length}
            activeBusCount={activeBuses.length}
          />
        )}

        {viewState === "list" && (
          <View style={{ flex: 1 }}>
            <SheetHeader
              title="All Routes"
              subtitle={`${filteredItems.length} result${filteredItems.length !== 1 ? "s" : ""}`}
              onBack={() => { setViewState("menu"); handleSearch(""); }}
            />
            <FlatList
              data={filteredItems}
              keyExtractor={item => item.id.toString()}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <RouteCard
                  item={item}
                  isFav={isFav(item.id)}
                  onToggleFav={() => toggleFavourite(item.id)}
                  onPress={() => onSelectRoute(item)}
                  activeBuses={activeBuses}
                />
              )}
              ListEmptyComponent={<EmptyState icon={<AlertCircle color={C.muted} size={28} />} text="No routes found" />}
            />
          </View>
        )}

        {viewState === "live" && (
          <View style={{ flex: 1 }}>
            <SheetHeader
              title="Active Buses"
              subtitle={`${activeBuses.length} buses on road`}
              onBack={() => setViewState("menu")}
              accent={C.green}
            />
            <FlatList
              data={activeBuses}
              keyExtractor={(_, i) => i.toString()}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <LiveBusCard bus={item} onPress={() => {
                  const route = mapData.routes.find(r => r.name === item.route_name);
                  if (route) onSelectRoute(route);
                }} />
              )}
              ListEmptyComponent={<EmptyState icon={<AlertCircle color={C.muted} size={28} />} text="No active buses right now" />}
            />
          </View>
        )}

        {viewState === "saved" && (
          <View style={{ flex: 1 }}>
            <SheetHeader
              title="Saved Routes"
              subtitle={savedRoutes.length ? `${savedRoutes.length} saved` : "Tap ♥ on any route to save"}
              onBack={() => setViewState("menu")}
              accent={C.amber}
            />
            <FlatList
              data={savedRoutes}
              keyExtractor={item => item.id.toString()}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <RouteCard
                  item={item}
                  isFav={true}
                  onToggleFav={() => toggleFavourite(item.id)}
                  onPress={() => onSelectRoute(item)}
                  activeBuses={activeBuses}
                />
              )}
              ListEmptyComponent={
                <EmptyState
                  icon={<Heart color={C.muted} size={28} />}
                  text="No saved routes yet"
                  action={{ label: "Browse Routes", onPress: () => setViewState("list") }}
                />
              }
            />
          </View>
        )}

        {viewState === "detail" && selectedRoute && !boardingStep && (
          <View style={{ flex: 1 }}>
            <View style={s.detailHeader}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text style={s.detailTitle}>{selectedRoute.name}</Text>
                  <TouchableOpacity onPress={() => toggleFavourite(selectedRoute.id)}>
                    <Heart
                      color={isFav(selectedRoute.id) ? C.red : C.muted}
                      fill={isFav(selectedRoute.id) ? C.red : "none"}
                      size={20}
                    />
                  </TouchableOpacity>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 3 }}>
                  {(() => {
                    const busesHere = activeBuses.filter(b => b.route_name === selectedRoute.name);
                    const hasBus = busesHere.length > 0;
                    return (
                      <>
                        <View style={[s.liveTag, hasBus ? s.liveTagOn : s.liveTagOff]}>
                          <View style={[s.liveTagDot, { backgroundColor: hasBus ? C.green : C.muted }]} />
                          <Text style={[s.liveTagTxt, { color: hasBus ? C.green : C.muted }]}>
                            {hasBus ? `${busesHere.length} bus${busesHere.length > 1 ? "es" : ""} active` : "No Bus"}
                          </Text>
                        </View>
                        {hasBus && busesHere.map(b => (
                          <View key={b.bus} style={s.busNumTag}>
                            <Text style={s.busNumTxt}>#{b.bus_number}</Text>
                          </View>
                        ))}
                      </>
                    );
                  })()}
                  <Text style={s.stopCount}>{selectedRoute.stops?.length} stops</Text>
                </View>
              </View>
              <TouchableOpacity style={s.closeBtn} onPress={() => setViewState("list")}>
                <X color={C.slate} size={18} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: SCREEN_HEIGHT * 0.28 }}
              contentContainerStyle={{ paddingBottom: 8 }}
            >
              {selectedRoute.stops?.map((stop, i) => {
                const eta    = getETA(stop.order);
                const isLast = i === selectedRoute.stops.length - 1;
                return (
                  <View key={i} style={s.stopRow}>
                    <View style={s.stopLine}>
                      <View style={[
                        s.stopDot,
                        i === 0 ? { backgroundColor: C.blue, width: 10, height: 10 } :
                        isLast  ? { backgroundColor: C.ink,  width: 10, height: 10 } :
                                  { backgroundColor: C.border }
                      ]} />
                      {!isLast && <View style={s.pathLine} />}
                    </View>
                    <Text style={[s.stopName, (i === 0 || isLast) && { fontWeight: "700", color: C.ink }]}>
                      {stop.stop_name}
                    </Text>
                    <View style={[s.etaBadge, { backgroundColor: eta === "Here" ? C.greenSoft : C.blueSoft }]}>
                      <Clock size={10} color={getETAColor(eta)} />
                      <Text style={[s.etaTxt, { color: getETAColor(eta) }]}>{eta}</Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            <View style={s.actionRow}>
              <TouchableOpacity style={s.secondaryBtn}>
                <Navigation color={C.blue} size={18} />
                <Text style={s.secondaryTxt}>Navigate</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.mainBtn} onPress={handleTakeBus}>
                <Zap color="#fff" size={16} />
                <Text style={s.mainBtnTxt}>Take this Bus</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── BOARDING: Select Start Stop ── */}
        {boardingStep === "selectStart" && selectedRoute && (
          <View style={{ flex: 1 }}>
            <View style={s.boardingHeader}>
              <View style={s.boardingStep}><Text style={s.boardingStepTxt}>1 of 3</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={s.boardingTitle}>Where are you boarding?</Text>
                <Text style={s.boardingSub}>Bus #{selectedBus?.bus_number} · {selectedRoute.name}</Text>
              </View>
              <TouchableOpacity onPress={cancelBoarding} style={s.closeBtn}>
                <X color={C.slate} size={18} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
              {selectedRoute.stops?.map((stop, i) => (
                <TouchableOpacity key={i} style={s.stopPickRow} onPress={() => handleSelectStart(stop)} activeOpacity={0.7}>
                  <View style={[s.stopPickDot, { backgroundColor: i === 0 ? C.blue : i === selectedRoute.stops.length-1 ? C.ink : C.border }]} />
                  <Text style={s.stopPickName}>{stop.stop_name}</Text>
                  <ChevronRight color={C.muted} size={16} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── BOARDING: Select End Stop ── */}
        {boardingStep === "selectEnd" && selectedRoute && (
          <View style={{ flex: 1 }}>
            <View style={s.boardingHeader}>
              <View style={s.boardingStep}><Text style={s.boardingStepTxt}>2 of 3</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={s.boardingTitle}>Where are you getting off?</Text>
                <Text style={s.boardingSub}>From: {startStop?.stop_name}</Text>
              </View>
              <TouchableOpacity onPress={() => setBoardingStep("selectStart")} style={s.closeBtn}>
                <X color={C.slate} size={18} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
              {selectedRoute.stops?.map((stop, i) => {
                const isBeforeStart = stop.order <= startStop?.order;
                const fare = isBeforeStart ? null : calcFarePreview(startStop?.order, stop.order);
                return (
                  <TouchableOpacity
                    key={i}
                    style={[s.stopPickRow, isBeforeStart && s.stopPickRowDisabled]}
                    onPress={() => !isBeforeStart && handleSelectEnd(stop)}
                    activeOpacity={isBeforeStart ? 1 : 0.7}
                  >
                    <View style={[s.stopPickDot, {
                      backgroundColor: isBeforeStart ? C.border : (i === selectedRoute.stops.length-1 ? C.ink : C.blue)
                    }]} />
                    <Text style={[s.stopPickName, isBeforeStart && { color: C.muted }]}>{stop.stop_name}</Text>
                    {!isBeforeStart && (
                      <View style={s.farePreview}>
                        <Text style={s.farePreviewTxt}>Rs. {fare}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* ── BOARDING: Confirm & Pay ── */}
        {(boardingStep === "confirm" || boardingStep === "paying") && selectedRoute && startStop && endStop && (
          <View style={{ flex: 1 }}>
            <View style={s.boardingHeader}>
              <View style={s.boardingStep}><Text style={s.boardingStepTxt}>3 of 3</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={s.boardingTitle}>Confirm your trip</Text>
                <Text style={s.boardingSub}>{selectedRoute.name}</Text>
              </View>
              <TouchableOpacity onPress={cancelBoarding} style={s.closeBtn}>
                <X color={C.slate} size={18} />
              </TouchableOpacity>
            </View>

            {/* Trip summary card */}
            <View style={s.tripSummaryCard}>
              {/* Bus info */}
              <View style={s.tripSummaryRow}>
                <View style={s.tripSummaryIcon}><Bus color={C.blue} size={18} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.tripSummaryLabel}>Bus</Text>
                  <Text style={s.tripSummaryVal}>#{selectedBus?.bus_number} · {selectedRoute.name}</Text>
                </View>
              </View>
              <View style={s.tripSummaryDivider} />
              {/* Route stops */}
              <View style={s.tripSummaryRow}>
                <View style={[s.tripSummaryIcon, { backgroundColor: "#EFF6FF" }]}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: C.blue }} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.tripSummaryLabel}>From</Text>
                  <Text style={s.tripSummaryVal}>{startStop.stop_name}</Text>
                </View>
              </View>
              <View style={{ width: 2, height: 16, backgroundColor: C.border, marginLeft: 25 }} />
              <View style={s.tripSummaryRow}>
                <View style={[s.tripSummaryIcon, { backgroundColor: "#F8FAFC" }]}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: C.ink }} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.tripSummaryLabel}>To</Text>
                  <Text style={s.tripSummaryVal}>{endStop.stop_name}</Text>
                </View>
              </View>
              <View style={s.tripSummaryDivider} />
              {/* Fare */}
              <View style={s.fareRow}>
                <Text style={s.fareRowLabel}>Estimated Fare</Text>
                <Text style={s.fareRowAmt}>
                  Rs. {activeTrip?.fare ?? calcFarePreview(startStop.order, endStop.order)}
                </Text>
              </View>
            </View>

            {/* Pay via eSewa */}
            <TouchableOpacity
              style={[s.esewaBtn, bookingLoading && { opacity: 0.7 }]}
              onPress={boardingStep === "confirm" ? confirmAndStartTrip : handleEsewaPayment}
              disabled={bookingLoading}
              activeOpacity={0.85}
            >
              {bookingLoading
                ? <ActivityIndicator color="#fff" size="small" />
                : <>
                    <View style={s.esewaLogo}><Text style={s.esewaLogoTxt}>e</Text></View>
                    <Text style={s.esewaBtnTxt}>
                      {boardingStep === "confirm" ? "Start Trip" : "Pay via eSewa"}
                    </Text>
                    <Text style={s.esewaAmt}>
                      Rs. {activeTrip?.fare ?? calcFarePreview(startStop.order, endStop.order)}
                    </Text>
                  </>
              }
            </TouchableOpacity>

            <TouchableOpacity style={s.cancelLink} onPress={cancelBoarding}>
              <Text style={s.cancelLinkTxt}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MenuView({ onBuses, onLive, onSaved, favCount, activeBusCount }) {
  return (
    <View>
      <Text style={s.menuTitle}>Nimble Transit</Text>
      <Text style={s.menuSub}>Kathmandu's smartest bus tracker</Text>
      <View style={s.cardGrid}>
        <TouchableOpacity style={[s.bigCard, { backgroundColor: C.blueSoft }]} onPress={onBuses} activeOpacity={0.8}>
          <View style={[s.bigCardIcon, { backgroundColor: C.blue }]}><Bus color="#fff" size={22} /></View>
          <Text style={[s.bigCardTitle, { color: C.blue }]}>All Routes</Text>
          <Text style={s.bigCardSub}>Find your bus</Text>
          <ArrowRight color={C.blue} size={14} style={{ marginTop: 4 }} />
        </TouchableOpacity>
        <TouchableOpacity style={[s.bigCard, { backgroundColor: C.greenSoft }]} onPress={onLive} activeOpacity={0.8}>
          <View style={[s.bigCardIcon, { backgroundColor: C.green }]}><Radio color="#fff" size={22} /></View>
          <Text style={[s.bigCardTitle, { color: C.green }]}>Live Buses</Text>
          <Text style={s.bigCardSub}>{activeBusCount} active now</Text>
          <View style={s.liveDotRow}>
            <View style={[s.liveDot, { backgroundColor: C.green }]} />
            <Text style={[s.liveDotTxt, { color: C.green }]}>Live</Text>
          </View>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={s.savedBanner} onPress={onSaved} activeOpacity={0.85}>
        <View style={s.savedBannerLeft}>
          <View style={[s.bigCardIcon, { backgroundColor: C.amber, width: 40, height: 40 }]}>
            <Heart color="#fff" size={18} />
          </View>
          <View style={{ marginLeft: 14 }}>
            <Text style={s.savedBannerTitle}>Saved Routes</Text>
            <Text style={s.savedBannerSub}>{favCount ? `${favCount} route${favCount > 1 ? "s" : ""} saved` : "No saved routes yet"}</Text>
          </View>
        </View>
        <ChevronRight color={C.muted} size={18} />
      </TouchableOpacity>
      <View style={s.tipBox}>
        <AlertCircle color={C.blue} size={14} />
        <Text style={s.tipTxt}>Tap ♥ on any route to save it for quick access.</Text>
      </View>
    </View>
  );
}

function SheetHeader({ title, subtitle, onBack, accent = C.blue }) {
  return (
    <View style={s.sheetHeader}>
      <View>
        <Text style={s.sheetHeaderTitle}>{title}</Text>
        {subtitle ? <Text style={[s.sheetHeaderSub, { color: accent }]}>{subtitle}</Text> : null}
      </View>
      <TouchableOpacity onPress={onBack} style={s.sheetBackBtn}>
        <ChevronLeft color={C.slate} size={18} />
        <Text style={s.sheetBackTxt}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

function RouteCard({ item, isFav, onToggleFav, onPress, activeBuses }) {
  const isActive = activeBuses.some(b => b.route_name === item.name);
  return (
    <TouchableOpacity style={s.routeCard} onPress={onPress} activeOpacity={0.75}>
      <View style={[s.routeIcon, { backgroundColor: isActive ? C.blueSoft : C.surface }]}>
        <Bus color={isActive ? C.blue : C.muted} size={18} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.routeCardName}>{item.name}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 }}>
          <Text style={s.routeCardSub}>{item.stops?.length ?? 0} stops</Text>
          {item._matchType === "stop" && (
            <View style={s.stopMatchBadge}>
              <MapPin size={9} color={C.amber} />
              <Text style={s.stopMatchTxt}>via {item._matchedStop}</Text>
            </View>
          )}
          {isActive && (
            <View style={s.activeTag}>
              <View style={s.activeDot} />
              <Text style={s.activeTxt}>Active</Text>
            </View>
          )}
        </View>
      </View>
      <TouchableOpacity onPress={onToggleFav} style={s.favBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Heart color={isFav ? C.red : C.border} fill={isFav ? C.red : "none"} size={18} />
      </TouchableOpacity>
      <ChevronRight color={C.border} size={16} />
    </TouchableOpacity>
  );
}

function LiveBusCard({ bus, onPress }) {
  return (
    <TouchableOpacity style={s.liveBusCard} onPress={onPress} activeOpacity={0.8}>
      <View style={s.liveBusIcon}>
        <Bus color={C.green} size={18} />
        <View style={s.liveBusDot} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.liveBusNum}>Bus {bus.bus_number}</Text>
        <Text style={s.liveBusRoute}>{bus.route_name}</Text>
      </View>
      <View style={s.liveBusSpeed}>
        <Zap color={C.green} size={12} />
        <Text style={s.liveBusSpeedTxt}>{bus.speed ? `${bus.speed} km/h` : "Moving"}</Text>
      </View>
    </TouchableOpacity>
  );
}

function EmptyState({ icon, text, action }) {
  return (
    <View style={s.emptyBox}>
      {icon}
      <Text style={s.emptyTxt}>{text}</Text>
      {action && (
        <TouchableOpacity style={s.emptyAction} onPress={action.onPress}>
          <Text style={s.emptyActionTxt}>{action.label}</Text>
          <ArrowRight color={C.blue} size={14} />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:             { flex: 1, backgroundColor: "#e8edf4" },
  map:              { flex: 1 },
  topBar:           { position: "absolute", top: 0, width: "100%", paddingHorizontal: 16, paddingTop: Platform.OS === "ios" ? 0 : 12, zIndex: 20 },
  searchRow:        { flexDirection: "row", alignItems: "center", gap: 10 },
  backBtn:          { width: 44, height: 44, borderRadius: 14, backgroundColor: C.white, justifyContent: "center", alignItems: "center", elevation: 8, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  searchBox:        { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: C.white, borderRadius: 14, paddingHorizontal: 14, height: 44, elevation: 8, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  searchInput:      { flex: 1, fontSize: 14, color: C.ink },
  locateFab:        { position: "absolute", right: 16, bottom: SNAP_LOW - 65, width: 46, height: 46, borderRadius: 23, backgroundColor: C.white, justifyContent: "center", alignItems: "center", elevation: 8, shadowColor: C.blue, shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  livePill:         { position: "absolute", left: 16, bottom: SNAP_LOW - 55, flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: C.white, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, elevation: 6 },
  liveDot:          { width: 7, height: 7, borderRadius: 4, backgroundColor: C.green },
  livePillTxt:      { fontSize: 12, fontWeight: "700", color: C.green },
  sheet:            { position: "absolute", width: "100%", height: SCREEN_HEIGHT + 40, backgroundColor: C.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 12, elevation: 30, shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 20, shadowOffset: { width: 0, height: -4 } },
  handle:           { width: 36, height: 4, backgroundColor: C.border, borderRadius: 10, alignSelf: "center", marginBottom: 16 },
  menuTitle:        { fontSize: 22, fontWeight: "900", color: C.ink, letterSpacing: -0.5 },
  menuSub:          { fontSize: 12, color: C.muted, marginBottom: 18, marginTop: 2 },
  cardGrid:         { flexDirection: "row", gap: 12, marginBottom: 12 },
  bigCard:          { flex: 1, borderRadius: 20, padding: 16 },
  bigCardIcon:      { width: 46, height: 46, borderRadius: 14, justifyContent: "center", alignItems: "center", marginBottom: 10 },
  bigCardTitle:     { fontSize: 15, fontWeight: "800" },
  bigCardSub:       { fontSize: 11, color: C.slate, marginTop: 2 },
  liveDotRow:       { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 },
  liveDotTxt:       { fontSize: 10, fontWeight: "700" },
  savedBanner:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: C.amberSoft, borderRadius: 18, padding: 14, marginBottom: 12 },
  savedBannerLeft:  { flexDirection: "row", alignItems: "center" },
  savedBannerTitle: { fontSize: 14, fontWeight: "800", color: C.ink },
  savedBannerSub:   { fontSize: 11, color: C.slate, marginTop: 1 },
  tipBox:           { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: C.blueSoft, borderRadius: 10, padding: 10 },
  tipTxt:           { fontSize: 11, color: C.blue, flex: 1 },
  sheetHeader:      { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 },
  sheetHeaderTitle: { fontSize: 18, fontWeight: "800", color: C.ink },
  sheetHeaderSub:   { fontSize: 11, fontWeight: "600", marginTop: 2 },
  sheetBackBtn:     { flexDirection: "row", alignItems: "center", gap: 2 },
  sheetBackTxt:     { fontSize: 13, color: C.blue, fontWeight: "700" },
  routeCard:        { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border, gap: 12 },
  routeIcon:        { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  routeCardName:    { fontSize: 14, fontWeight: "700", color: C.ink },
  routeCardSub:     { fontSize: 11, color: C.muted },
  stopMatchBadge:   { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: C.amberSoft, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  stopMatchTxt:     { fontSize: 10, color: C.amber, fontWeight: "700" },
  activeTag:        { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: C.greenSoft, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  activeDot:        { width: 5, height: 5, borderRadius: 3, backgroundColor: C.green },
  activeTxt:        { fontSize: 10, color: C.green, fontWeight: "700" },
  favBtn:           { padding: 4 },
  liveBusCard:      { flexDirection: "row", alignItems: "center", backgroundColor: C.surface, borderRadius: 14, padding: 12, marginBottom: 8, gap: 12 },
  liveBusIcon:      { width: 40, height: 40, borderRadius: 12, backgroundColor: C.greenSoft, justifyContent: "center", alignItems: "center" },
  liveBusDot:       { position: "absolute", top: 6, right: 6, width: 7, height: 7, borderRadius: 4, backgroundColor: C.green, borderWidth: 1.5, borderColor: C.white },
  liveBusNum:       { fontSize: 14, fontWeight: "800", color: C.ink },
  liveBusRoute:     { fontSize: 11, color: C.muted, marginTop: 1 },
  liveBusSpeed:     { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: C.greenSoft, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  liveBusSpeedTxt:  { fontSize: 11, color: C.green, fontWeight: "700" },
  detailHeader:     { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 },
  detailTitle:      { fontSize: 18, fontWeight: "900", color: C.ink, letterSpacing: -0.3 },
  liveTag:          { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  liveTagOn:        { backgroundColor: C.greenSoft },
  liveTagOff:       { backgroundColor: C.surface },
  liveTagDot:       { width: 6, height: 6, borderRadius: 3 },
  liveTagTxt:       { fontSize: 10, fontWeight: "700" },
  stopCount:        { fontSize: 11, color: C.muted },
  closeBtn:         { width: 32, height: 32, borderRadius: 16, backgroundColor: C.surface, justifyContent: "center", alignItems: "center" },
  stopRow:          { flexDirection: "row", alignItems: "center", minHeight: 38, gap: 10 },
  stopLine:         { alignItems: "center", width: 16 },
  stopDot:          { width: 8, height: 8, borderRadius: 5, backgroundColor: C.border, zIndex: 2 },
  pathLine:         { width: 2, height: 30, backgroundColor: C.border, marginTop: 2 },
  stopName:         { flex: 1, fontSize: 13, color: C.slate, fontWeight: "500" },
  etaBadge:         { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  etaTxt:           { fontSize: 10, fontWeight: "700" },
  actionRow:        { flexDirection: "row", gap: 10, marginTop: 14 },
  secondaryBtn:     { flex: 0.3, height: 48, borderRadius: 14, borderWidth: 1.5, borderColor: C.blueMid, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6 },
  secondaryTxt:     { color: C.blue, fontWeight: "700", fontSize: 13 },
  mainBtn:          { flex: 0.7, height: 48, backgroundColor: C.blue, borderRadius: 14, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6, elevation: 4, shadowColor: C.blue, shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
  mainBtnTxt:       { color: C.white, fontWeight: "800", fontSize: 14 },
  emptyBox:         { alignItems: "center", paddingVertical: 40, gap: 10 },
  emptyTxt:         { fontSize: 14, color: C.muted, fontWeight: "600" },
  emptyAction:      { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  emptyActionTxt:   { color: C.blue, fontWeight: "700", fontSize: 13 },

  // ── Boarding flow ────────────────────────────────────────────────────────
  boardingHeader:   { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 },
  boardingStep:     { backgroundColor: C.blueSoft, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  boardingStepTxt:  { fontSize: 10, fontWeight: "800", color: C.blue },
  boardingTitle:    { fontSize: 15, fontWeight: "800", color: C.ink },
  boardingSub:      { fontSize: 11, color: C.muted, marginTop: 1 },

  busNumTag:        { backgroundColor: C.greenSoft, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 },
  busNumTxt:        { fontSize: 10, fontWeight: "800", color: C.green },

  stopPickRow:      { flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border, gap: 12 },
  stopPickRowDisabled: { opacity: 0.35 },
  stopPickDot:      { width: 10, height: 10, borderRadius: 5, backgroundColor: C.blue },
  stopPickName:     { flex: 1, fontSize: 14, fontWeight: "600", color: C.ink },
  farePreview:      { backgroundColor: C.blueSoft, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  farePreviewTxt:   { fontSize: 11, fontWeight: "800", color: C.blue },

  tripSummaryCard:  { backgroundColor: C.surface, borderRadius: 18, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: C.border },
  tripSummaryRow:   { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 6 },
  tripSummaryIcon:  { width: 36, height: 36, borderRadius: 10, backgroundColor: C.blueSoft, justifyContent: "center", alignItems: "center" },
  tripSummaryLabel: { fontSize: 10, color: C.muted, fontWeight: "600" },
  tripSummaryVal:   { fontSize: 14, fontWeight: "700", color: C.ink, marginTop: 1 },
  tripSummaryDivider:{ height: 1, backgroundColor: C.border, marginVertical: 8 },
  fareRow:          { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 4 },
  fareRowLabel:     { fontSize: 13, fontWeight: "700", color: C.slate },
  fareRowAmt:       { fontSize: 20, fontWeight: "900", color: C.blue },

  esewaBtn:         { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: "#6DC643", borderRadius: 16, paddingVertical: 16, marginBottom: 10, elevation: 4, shadowColor: "#6DC643", shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
  esewaLogo:        { width: 28, height: 28, borderRadius: 8, backgroundColor: "#fff", justifyContent: "center", alignItems: "center" },
  esewaLogoTxt:     { fontSize: 16, fontWeight: "900", color: "#6DC643" },
  esewaBtnTxt:      { fontSize: 15, fontWeight: "800", color: "#fff", flex: 1 },
  esewaAmt:         { fontSize: 15, fontWeight: "900", color: "#fff" },

  cancelLink:       { alignItems: "center", paddingVertical: 10 },
  cancelLinkTxt:    { fontSize: 13, color: C.muted, fontWeight: "600" },
});