import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, Linking
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import api from "../services/api";
import {
  Bus, Clock, MapPin, CheckCircle, AlertCircle,
  Loader, XCircle, ChevronLeft, Ticket, RefreshCw,
  ArrowRight, Navigation
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
const ESEWA_GREEN = "#6DC643";

// ── eSewa payment URL builder ─────────────────────────────────────────────────
// Test environment base URL
const ESEWA_TEST_URL = "https://rc-epay.esewa.com.np/api/epay/main/v2/form";
const MERCHANT_CODE  = "EPAYTEST";
const SUCCESS_URL    = "https://your-app.com/esewa/verify"; // swap for real deeplink
const FAILURE_URL    = "https://your-app.com/esewa/failed";

const buildEsewaUrl = ({ fare, txn_uuid, signature }) => {
  const amt = parseFloat(fare).toFixed(2);
  const params = new URLSearchParams({
    amount:           amt,
    tax_amount:       "0",
    total_amount:     amt,
    transaction_uuid: txn_uuid,
    product_code:     MERCHANT_CODE,
    product_service_charge: "0",
    product_delivery_charge: "0",
    success_url:      SUCCESS_URL,
    failure_url:      FAILURE_URL,
    signed_field_names: "total_amount,transaction_uuid,product_code",
    signature,
  });
  return `${ESEWA_TEST_URL}?${params.toString()}`;
};

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS = {
  COMPLETED:       { label: "Completed",       color: GREEN,  bg: GREEN_S, Icon: CheckCircle  },
  ONBOARD:         { label: "On Board",         color: BLUE,   bg: BLUE_S,  Icon: Navigation   },
  PAYMENT_PENDING: { label: "Payment Pending",  color: AMBER,  bg: AMBER_S, Icon: AlertCircle  },
  CANCELLED:       { label: "Cancelled",        color: MUTED,  bg: SURFACE, Icon: XCircle      },
};

// ── Ticket card ───────────────────────────────────────────────────────────────
function TicketCard({ item, onPayNow, paying }) {
  const cfg = STATUS[item.status] || STATUS.CANCELLED;

  return (
    <View style={[styles.card, item.status === "PAYMENT_PENDING" && styles.cardPending]}>

      {/* ── Punched ticket top strip ── */}
      <View style={styles.ticketStrip}>
        <View style={styles.punchLeft} />
        <View style={styles.dashedLine} />
        <View style={styles.punchRight} />
      </View>

      <View style={styles.cardBody}>
        {/* ── Header: bus number + status ── */}
        <View style={styles.cardHeader}>
          <View style={styles.busChip}>
            <Bus size={14} color={BLUE} />
            <Text style={styles.busChipTxt}>Bus #{item.bus_number || "—"}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
            <cfg.Icon size={11} color={cfg.color} />
            <Text style={[styles.statusTxt, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        </View>

        {/* ── Route name ── */}
        {item.route_name && (
          <Text style={styles.routeName} numberOfLines={1}>{item.route_name}</Text>
        )}

        {/* ── Stop journey ── */}
        <View style={styles.journey}>
          <View style={styles.journeyStop}>
            <View style={[styles.stopDot, { backgroundColor: BLUE }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.journeyLabel}>FROM</Text>
              <Text style={styles.journeyStop_name} numberOfLines={1}>
                {item.start_stop_name || "—"}
              </Text>
            </View>
          </View>

          {/* Connecting line */}
          <View style={styles.journeyLine}>
            <View style={styles.journeyLineDash} />
            <ArrowRight size={14} color={MUTED} />
          </View>

          <View style={styles.journeyStop}>
            <View style={[styles.stopDot, { backgroundColor: INK }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.journeyLabel}>TO</Text>
              <Text style={styles.journeyStop_name} numberOfLines={1}>
                {item.end_stop_name || (item.status === "ONBOARD" ? "In progress…" : "—")}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Footer: date + fare ── */}
        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            <Clock size={12} color={MUTED} />
            <Text style={styles.footerDate}>
              {new Date(item.created_at).toLocaleDateString("en-US", {
                weekday: "short", day: "numeric", month: "short", year: "numeric"
              })}
            </Text>
          </View>
          <Text style={styles.fareAmt}>Rs. {item.fare_amount}</Text>
        </View>

        {/* ── eSewa Pay button for PAYMENT_PENDING ── */}
        {item.status === "PAYMENT_PENDING" && (
          <TouchableOpacity
            style={[styles.esewaBtn, paying && { opacity: 0.7 }]}
            onPress={() => onPayNow(item)}
            disabled={paying}
            activeOpacity={0.85}
          >
            {paying
              ? <ActivityIndicator color={WHITE} size="small" />
              : <>
                  <View style={styles.esewaLogo}>
                    <Text style={styles.esewaLogoTxt}>e</Text>
                  </View>
                  <Text style={styles.esewaBtnTxt}>Pay via eSewa</Text>
                  <Text style={styles.esewaFare}>Rs. {item.fare_amount}</Text>
                </>
            }
          </TouchableOpacity>
        )}

        {/* ── Dummy pay fallback (for test without real eSewa) ── */}
        {item.status === "PAYMENT_PENDING" && (
          <TouchableOpacity
            style={styles.dummyPayBtn}
            onPress={() => onPayNow(item, true)}
            disabled={paying}
          >
            <Text style={styles.dummyPayTxt}>Simulate Payment (Test Mode)</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function TicketScreen({ navigation }) {
  const [tickets,    setTickets]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payingId,   setPayingId]   = useState(null); // trip id being paid

  useFocusEffect(
    useCallback(() => {
      fetchTickets();
    }, [])
  );

  const fetchTickets = async () => {
    try {
      const res = await api.get("/trips/");
      // Newest first, exclude cancelled
      setTickets(res.data.filter(t => t.status !== "CANCELLED").reverse());
    } catch (e) {
      console.log("Ticket fetch error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handlePayNow = async (trip, simulate = false) => {
    setPayingId(trip.id);
    try {
      if (simulate) {
        // Dummy/test payment — directly marks as COMPLETED
        await api.post("/esewa/dummy-pay/", { trip_id: trip.id });
        Alert.alert("✅ Payment Successful", "Your ticket is confirmed!");
        fetchTickets();
      } else {
        // Real eSewa — need the signature & txn_uuid
        // We don't store these in the list response so we re-call end_trip logic
        // via the stored transaction_uuid on the trip (not in current serializer).
        // For now open eSewa test URL with what we have, or fall back to dummy.
        Alert.alert(
          "eSewa Payment",
          `Pay Rs. ${trip.fare_amount} via eSewa for this trip?`,
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Open eSewa",
              onPress: () => {
                // In production: Linking.openURL(buildEsewaUrl({...}))
                // We use dummy pay since txn details aren't in the list endpoint
                api.post("/esewa/dummy-pay/", { trip_id: trip.id })
                  .then(() => {
                    Alert.alert("✅ Confirmed", "Your ticket is confirmed!");
                    fetchTickets();
                  })
                  .catch(() => Alert.alert("Error", "Payment failed."));
              }
            },
          ]
        );
      }
    } catch (e) {
      Alert.alert("Payment Error", "Please try again.");
    } finally {
      setPayingId(null);
    }
  };

  const completed = tickets.filter(t => t.status === "COMPLETED").length;
  const pending   = tickets.filter(t => t.status === "PAYMENT_PENDING").length;
  const onboard   = tickets.filter(t => t.status === "ONBOARD").length;

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={BLUE} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: INK }}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ChevronLeft size={24} color={WHITE} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>My Tickets</Text>
            <Text style={styles.headerSub}>{tickets.length} total trips</Text>
          </View>
          <TouchableOpacity onPress={() => { setRefreshing(true); fetchTickets(); }} style={styles.refreshBtn}>
            <RefreshCw size={18} color={WHITE} />
          </TouchableOpacity>
        </View>

        {/* ── Summary pills ── */}
        <View style={styles.summaryRow}>
          <View style={[styles.pill, { backgroundColor: GREEN_S }]}>
            <CheckCircle size={13} color={GREEN} />
            <Text style={[styles.pillTxt, { color: GREEN }]}>{completed} done</Text>
          </View>
          {pending > 0 && (
            <View style={[styles.pill, { backgroundColor: AMBER_S }]}>
              <AlertCircle size={13} color={AMBER} />
              <Text style={[styles.pillTxt, { color: AMBER }]}>{pending} pending</Text>
            </View>
          )}
          {onboard > 0 && (
            <View style={[styles.pill, { backgroundColor: BLUE_S }]}>
              <Navigation size={13} color={BLUE} />
              <Text style={[styles.pillTxt, { color: BLUE }]}>{onboard} on board</Text>
            </View>
          )}
        </View>
      </SafeAreaView>

      <FlatList
        data={tickets}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchTickets(); }} tintColor={BLUE} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ticket size={48} color={MUTED} />
            <Text style={styles.emptyTitle}>No tickets yet</Text>
            <Text style={styles.emptySub}>Board a bus to get your first ticket.</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate("LiveMap")}>
              <Text style={styles.emptyBtnTxt}>Find a Bus</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <TicketCard
            item={item}
            onPayNow={handlePayNow}
            paying={payingId === item.id}
          />
        )}
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: SURFACE },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },

  // Header
  header:      { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 12 },
  backBtn:     { width: 38, height: 38, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.1)", justifyContent: "center", alignItems: "center" },
  refreshBtn:  { width: 38, height: 38, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.1)", justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 22, fontWeight: "900", color: WHITE, letterSpacing: -0.5 },
  headerSub:   { fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 1 },

  summaryRow:  { flexDirection: "row", gap: 8, paddingHorizontal: 20, paddingBottom: 16 },
  pill:        { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  pillTxt:     { fontSize: 11, fontWeight: "800" },

  // List
  list: { padding: 16, paddingBottom: 40 },

  // Card
  card:        { backgroundColor: WHITE, borderRadius: 20, marginBottom: 16, elevation: 2, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, overflow: "hidden" },
  cardPending: { borderWidth: 1.5, borderColor: AMBER },

  ticketStrip:   { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 8 },
  punchLeft:     { width: 14, height: 14, borderRadius: 7, backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER },
  punchRight:    { width: 14, height: 14, borderRadius: 7, backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER },
  dashedLine:    { flex: 1, height: 1, borderStyle: "dashed", borderWidth: 1, borderColor: BORDER, marginHorizontal: 4 },

  cardBody:    { paddingHorizontal: 18, paddingBottom: 18 },
  cardHeader:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },

  busChip:     { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: BLUE_S, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  busChipTxt:  { fontSize: 12, fontWeight: "800", color: BLUE },

  statusBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusTxt:   { fontSize: 10, fontWeight: "800" },

  routeName:   { fontSize: 15, fontWeight: "800", color: INK, marginBottom: 12 },

  // Journey
  journey:         { marginBottom: 14 },
  journeyStop:     { flexDirection: "row", alignItems: "center", gap: 10 },
  journeyLine:     { flexDirection: "row", alignItems: "center", paddingLeft: 3, gap: 4, marginVertical: 4 },
  journeyLineDash: { width: 2, height: 16, backgroundColor: BORDER },
  stopDot:         { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  journeyLabel:    { fontSize: 9, fontWeight: "700", color: MUTED, letterSpacing: 0.8 },
  journeyStop_name:{ fontSize: 14, fontWeight: "700", color: INK, marginTop: 1 },

  // Footer
  footer:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 12 },
  footerLeft: { flexDirection: "row", alignItems: "center", gap: 5 },
  footerDate: { fontSize: 11, color: MUTED, fontWeight: "600" },
  fareAmt:    { fontSize: 22, fontWeight: "900", color: BLUE },

  // eSewa pay
  esewaBtn:     { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: ESEWA_GREEN, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16, marginTop: 14, elevation: 3, shadowColor: ESEWA_GREEN, shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
  esewaLogo:    { width: 26, height: 26, borderRadius: 7, backgroundColor: WHITE, justifyContent: "center", alignItems: "center" },
  esewaLogoTxt: { fontSize: 15, fontWeight: "900", color: ESEWA_GREEN },
  esewaBtnTxt:  { flex: 1, fontSize: 14, fontWeight: "800", color: WHITE },
  esewaFare:    { fontSize: 14, fontWeight: "900", color: WHITE },

  dummyPayBtn:  { alignItems: "center", paddingVertical: 8, marginTop: 4 },
  dummyPayTxt:  { fontSize: 11, color: MUTED, fontWeight: "600", textDecorationLine: "underline" },

  // Empty
  empty:       { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyTitle:  { fontSize: 18, fontWeight: "800", color: INK },
  emptySub:    { fontSize: 13, color: MUTED, textAlign: "center" },
  emptyBtn:    { backgroundColor: BLUE, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 20, marginTop: 4 },
  emptyBtnTxt: { color: WHITE, fontWeight: "800", fontSize: 13 },
});