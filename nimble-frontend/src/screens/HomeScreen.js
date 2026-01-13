import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Image,
} from "react-native";
import {
  Heart,
  Zap,
  MapPin,
  Ticket,
  Settings,
  Search,
  Mic,
  User,
  ArrowRight,
  ShieldCheck, // Added for SOS
} from "lucide-react-native";
import { getCurrentUser } from "../services/auth";
import { SafeAreaView } from "react-native-safe-area-context";

// THEME CONSTANTS
const PRIMARY_NAVY = "#0F172A";
const SLATE_TEXT = "#64748B";
const DANGER_RED = "#EF4444";
const NEUTRAL_BG = "#F8FAFC";
const ACCENT_BLUE = "#2563EB";

export default function HomeScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    const currentUser = await getCurrentUser();
    if (currentUser) setUser(currentUser);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    const name = user?.full_name ? `, ${user.full_name.split(' ')[0]}` : "";
    
    if (hour < 12) return `Good Morning${name}`;
    if (hour < 18) return `Good Afternoon${name}`;
    return `Good Evening${name}`;
  };

  // REFINED QUICK ACTIONS ARRAY
  const featureCards = [
    { label: "Live Radar", sub: "Nearby buses", Icon: Zap, route: "LiveMap", highlight: true },
    { label: "Trip Plan", sub: "A to B routes", Icon: MapPin, route: "TripPlanner" },
    { label: "Tickets", sub: "View active", Icon: Ticket, route: "Tickets" },
    { label: "Favorites", sub: "Saved stops", Icon: Heart, route: "Favourites" },
    { label: "Alerts", sub: "Service status", Icon: Settings, route: "Notifications" },
    { label: "SOS", sub: "Emergency", Icon: ShieldCheck, route: "SOS", danger: true },
  ];

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" />
      
      {/* HEADER BLOCK */}
      <View style={styles.headerBlock}>
        <SafeAreaView edges={['top']}>
          <View style={styles.topHeader}>
            <View style={styles.headerTopRow}>
              <View style={styles.greetingWrapper}>
                <Text style={styles.greetingText}>{getGreeting()}</Text>
                <Text style={styles.subGreeting}>Where are we going today?</Text>
              </View>
              
              <TouchableOpacity 
                style={styles.profileCircle}
                onPress={() => navigation.navigate("Profile")}
              >
                {user?.profile_picture ? (
                  <Image source={{ uri: user.profile_picture }} style={styles.avatarImage} />
                ) : (
                  <User color="#FFF" size={22} strokeWidth={2.5} />
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Search color={SLATE_TEXT} size={20} />
              <TextInput
                placeholder="Search bus, route or stop..."
                placeholderTextColor={SLATE_TEXT}
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.searchInput}
              />
              <TouchableOpacity style={styles.micIcon}>
                 <Mic color={PRIMARY_NAVY} size={20} />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContainer} 
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentBody}>
          
          {/* PROMO SECTION */}
          <TouchableOpacity activeOpacity={0.9} style={styles.promoCard}>
            <View style={styles.promoContent}>
              <View style={styles.promoBadge}>
                <Text style={styles.promoBadgeText}>LIMITED OFFER</Text>
              </View>
              <Text style={styles.promoTitle}>Monthly Pass Special</Text>
              <Text style={styles.promoSub}>Get 20% off on all inter-city routes this week.</Text>
              <View style={styles.promoActionRow}>
                <Text style={styles.promoActionText}>Claim Now</Text>
                <ArrowRight color="#FFF" size={16} strokeWidth={3} />
              </View>
            </View>
            <View style={styles.promoGraphicCircle} />
          </TouchableOpacity>

          {/* QUICK ACTIONS SECTION */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <TouchableOpacity onPress={() => navigation.navigate("AllFeatures")}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.grid}>
            {featureCards.map((card, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.categoryCard, 
                  card.danger && styles.dangerCard,
                  card.highlight && styles.highlightCard
                ]}
                onPress={() => navigation.navigate(card.route)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.iconContainer, 
                  card.danger && styles.dangerIconBg,
                  card.highlight && styles.highlightIconBg
                ]}>
                  <card.Icon
                    size={24}
                    color={card.danger ? DANGER_RED : card.highlight ? ACCENT_BLUE : PRIMARY_NAVY}
                    strokeWidth={2.5}
                  />
                </View>
                <View>
                  <Text style={styles.cardTitle}>{card.label}</Text>
                  <Text style={styles.cardSubtitle}>{card.sub}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: NEUTRAL_BG },
  headerBlock: {
    backgroundColor: PRIMARY_NAVY,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingBottom: 35, 
    zIndex: 10,
  },
  topHeader: { paddingHorizontal: 24, paddingTop: 10 },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 25,
  },
  greetingWrapper: { flex: 1, paddingRight: 10 },
  greetingText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  subGreeting: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    fontWeight: "500",
    marginTop: 4,
  },
  profileCircle: {
    backgroundColor: "rgba(255,255,255,0.12)",
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarImage: { width: "100%", height: "100%", resizeMode: "cover" },
  searchContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingHorizontal: 16,
    alignItems: "center",
    height: 60,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: PRIMARY_NAVY,
    marginHorizontal: 12,
    fontWeight: "500",
  },
  micIcon: { padding: 4 },
  scrollContainer: { paddingTop: 25, paddingBottom: 120 },
  contentBody: { paddingHorizontal: 24 },
  
  promoCard: {
    backgroundColor: PRIMARY_NAVY, 
    borderRadius: 24,
    padding: 20,
    marginBottom: 25,
    overflow: 'hidden', 
    elevation: 5,
    shadowColor: PRIMARY_NAVY,
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  promoContent: { zIndex: 2 },
  promoBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 12,
  },
  promoBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '800' },
  promoTitle: { color: '#FFF', fontSize: 20, fontWeight: '800', marginBottom: 6 },
  promoSub: { color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 18, marginBottom: 15, width: '70%' },
  promoActionRow: { flexDirection: 'row', alignItems: 'center' },
  promoActionText: { color: '#FFF', fontWeight: '700', marginRight: 6, fontSize: 14 },
  promoGraphicCircle: {
    position: 'absolute',
    right: -30,
    bottom: -30,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: PRIMARY_NAVY },
  seeAll: { color: SLATE_TEXT, fontWeight: "700", fontSize: 13 },
  
  grid: { 
    flexDirection: "row", 
    flexWrap: "wrap", 
    justifyContent: "space-between",
    marginTop: 5 
  },
  categoryCard: {
    backgroundColor: "#FFFFFF",
    width: "48%",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    minHeight: 120,
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
  },
  highlightCard: {
    borderColor: "#DBEAFE",
    backgroundColor: "#F0F7FF",
  },
  dangerCard: { 
    borderColor: "#FEE2E2",
    backgroundColor: "#FFFBFA" 
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  highlightIconBg: { backgroundColor: "#DBEAFE" },
  dangerIconBg: { backgroundColor: "#FEE2E2" },
  cardTitle: { fontSize: 15, fontWeight: "800", color: PRIMARY_NAVY, marginBottom: 2 },
  cardSubtitle: { fontSize: 11, color: SLATE_TEXT, fontWeight: "500" },
});