import React, { useState, useEffect } from "react";
import { 
  View, Text, FlatList, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, LayoutAnimation, UIManager, Platform, Dimensions, StatusBar
} from "react-native";
import { WebView } from "react-native-webview";
import { getAllRoutes, toggleFavoriteRoute } from "../services/routes";
import { Heart, ChevronDown, ChevronUp, Search, MapPinned, Clock } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// THEME CONSTANTS
const PRIMARY_NAVY = "#0F172A";
const SLATE_TEXT = "#64748B";
const NEUTRAL_BG = "#F8FAFC";
const ACCENT_RED = "#EF4444";
const BORDER_COLOR = "#E2E8F0";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function AllRoutesScreen({ navigation }) {
  const [routes, setRoutes] = useState([]);
  const [filteredRoutes, setFilteredRoutes] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      const data = await getAllRoutes();
      setRoutes(data);
      setFilteredRoutes(data);
      const favIds = data.filter(r => r.is_favorite).map(r => r.id);
      setFavorites(favIds);
    } catch (err) {
      console.log("Fetch routes error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text) => {
    setSearch(text);
    const filtered = routes.filter(r =>
      r.name.toLowerCase().includes(text.toLowerCase()) ||
      r.stops.some(s => s.name.toLowerCase().includes(text.toLowerCase()))
    );
    setFilteredRoutes(filtered);
  };

  const handleToggleExpand = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
  };

  const handleToggleFavorite = async (routeId) => {
    setFavorites(prev => prev.includes(routeId) ? prev.filter(id => id !== routeId) : [...prev, routeId]);
    try { await toggleFavoriteRoute(routeId); } catch (err) { console.log(err); }
  };

  const generateLeafletHTML = (stops) => {
    if (!stops || stops.length === 0) return "";
    const markersJS = stops.map(s => `L.marker([${s.lat}, ${s.lng}]).addTo(map);`).join("\n");
    const latLngs = stops.map(s => `[${s.lat}, ${s.lng}]`).join(",");
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
        <style> 
            #map { height: 100vh; width: 100vw; } 
            html, body { margin:0; padding:0; background: #F8FAFC; }
            .leaflet-control-attribution { display: none !important; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script>
          var map = L.map('map', {zoomControl: false}).fitBounds([${stops.map(s => `[${s.lat},${s.lng}]`).join(",")}]);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
          ${markersJS}
          var polyline = L.polyline([${latLngs}], {color:'${PRIMARY_NAVY}', weight: 4, opacity: 0.7}).addTo(map);
        </script>
      </body>
      </html>
    `;
  };

  const renderRoute = ({ item }) => {
    const isExpanded = expandedId === item.id;
    const isFavorite = favorites.includes(item.id);

    return (
      <TouchableOpacity
        style={[styles.routeCard, isExpanded && styles.activeCard]}
        activeOpacity={0.9}
        onPress={() => handleToggleExpand(item.id)}
      >
        <View style={styles.routeHeader}>
          <View style={styles.titleArea}>
            <Text style={styles.routeName}>{item.name}</Text>
            <View style={styles.badgeRow}>
               <View style={styles.metaBadge}>
                  <MapPinned size={12} color={SLATE_TEXT} />
                  <Text style={styles.metaText}>{item.stops.length} Stops</Text>
               </View>
               <View style={styles.metaBadge}>
                  <Clock size={12} color={SLATE_TEXT} />
                  <Text style={styles.metaText}>{item.duration_min} min</Text>
               </View>
            </View>
          </View>
          <TouchableOpacity onPress={() => handleToggleFavorite(item.id)} style={styles.favCircle}>
            <Heart size={20} fill={isFavorite ? ACCENT_RED : "transparent"} color={isFavorite ? ACCENT_RED : SLATE_TEXT} />
          </TouchableOpacity>
        </View>
        
        {isExpanded && (
          <View style={styles.expandedSection}>
            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>Route Stops</Text>
            <View style={styles.stopsTimeline}>
                {item.stops.map((stop, index) => (
                <View key={stop.id} style={styles.timelineItem}>
                    <View style={styles.timelineDot} />
                    <Text style={styles.stopName}>{stop.name}</Text>
                </View>
                ))}
            </View>

            <View style={styles.mapContainer}>
              <WebView
                originWhitelist={['*']}
                source={{ html: generateLeafletHTML(item.stops) }}
                style={styles.mapPreview}
                scrollEnabled={false}
              />
            </View>
          </View>
        )}

        <View style={styles.chevronWrapper}>
             {isExpanded ? <ChevronUp size={18} color={SLATE_TEXT} /> : <ChevronDown size={18} color={SLATE_TEXT} />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
            <Text style={styles.headerTitle}>Bus Routes</Text>
            <View style={styles.searchBox}>
                <Search size={18} color={SLATE_TEXT} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search routes or stops..."
                    placeholderTextColor={SLATE_TEXT}
                    value={search}
                    onChangeText={handleSearch}
                />
            </View>
        </View>
      </SafeAreaView>

      {loading ? (
        <ActivityIndicator size="large" color={PRIMARY_NAVY} style={{ marginTop: 50 }} />
      ) : filteredRoutes.length === 0 ? (
        <Text style={styles.noResult}>No routes found</Text>
      ) : (
        <FlatList
          data={filteredRoutes}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderRoute}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: NEUTRAL_BG },
  header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15 },
  headerTitle: { fontSize: 24, fontWeight: "800", color: PRIMARY_NAVY, marginBottom: 15 },
  searchBox: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFF', 
    paddingHorizontal: 15, 
    height: 50, 
    borderRadius: 15,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: PRIMARY_NAVY, fontWeight: "500" },
  listContent: { paddingHorizontal: 20, paddingBottom: 120 },
  routeCard: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  activeCard: { borderColor: PRIMARY_NAVY, borderWidth: 1.5 },
  routeHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: 'flex-start' },
  titleArea: { flex: 1 },
  routeName: { fontSize: 17, fontWeight: "800", color: PRIMARY_NAVY, marginBottom: 6 },
  badgeRow: { flexDirection: 'row', gap: 8 },
  metaBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: NEUTRAL_BG, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4 },
  metaText: { fontSize: 11, color: SLATE_TEXT, fontWeight: "700" },
  favCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: NEUTRAL_BG, alignItems: 'center', justifyContent: 'center' },
  expandedSection: { marginTop: 15 },
  divider: { height: 1, backgroundColor: BORDER_COLOR, marginBottom: 15 },
  sectionTitle: { fontSize: 14, fontWeight: "800", color: PRIMARY_NAVY, marginBottom: 12 },
  stopsTimeline: { paddingLeft: 10, marginBottom: 15 },
  timelineItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  timelineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: PRIMARY_NAVY, marginRight: 12 },
  stopName: { fontSize: 13, color: SLATE_TEXT, fontWeight: "500" },
  mapContainer: { width: "100%", height: 180, borderRadius: 16, overflow: "hidden", marginTop: 8, borderWidth: 1, borderColor: BORDER_COLOR },
  mapPreview: { flex: 1 },
  chevronWrapper: { alignSelf: 'center', marginTop: 10 },
  noResult: { textAlign: "center", marginTop: 50, fontSize: 15, color: SLATE_TEXT, fontWeight: "600" },
});