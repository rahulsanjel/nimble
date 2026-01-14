import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, StatusBar } from "react-native";
import { getCurrentUser } from "../services/auth";

const PRIMARY_NAVY = "#0F172A";
const SLATE_TEXT = "#64748B";
const SOFT_BG = "#F8FAFC";
const WHITE = "#FFFFFF";
const ACCENT_BLUE = "#2563EB";

export default function DriverHomeScreen() {
  const [driver, setDriver] = useState(null);

  useEffect(() => {
    fetchDriverInfo();
  }, []);

  const fetchDriverInfo = async () => {
    const user = await getCurrentUser();
    if (user) setDriver(user);
  };

  if (!driver) return null;

  return (
    <ScrollView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Greeting */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Good Day, {driver.full_name.split(" ")[0]}</Text>
        {driver.profile_picture ? (
          <Image source={{ uri: driver.profile_picture }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}><Text style={{ color: "#FFF" }}>{driver.full_name[0]}</Text></View>
        )}
      </View>

      {/* Driver Info Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Driver Info</Text>
        <Text>Name: {driver.full_name}</Text>
        <Text>Email: {driver.email}</Text>
        <Text>Phone: {driver.phone}</Text>
      </View>

      {/* Bus Info Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Bus Assignment</Text>
        {driver.assigned_bus ? (
          <>
            <Text>Bus Number: {driver.assigned_bus.number}</Text>
            <Text>Route: {driver.assigned_bus.route}</Text>
            <Text>Status: {driver.assigned_bus.status}</Text>
            <TouchableOpacity style={styles.startButton}>
              <Text style={{ color: WHITE }}>Start Trip</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text>No bus assigned</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SOFT_BG, padding: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 25 },
  greeting: { fontSize: 24, fontWeight: "700", color: PRIMARY_NAVY },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: "#999" },
  avatarPlaceholder: { width: 50, height: 50, borderRadius: 25, backgroundColor: PRIMARY_NAVY, justifyContent: "center", alignItems: "center" },
  card: { backgroundColor: WHITE, borderRadius: 16, padding: 20, marginBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: "700", marginBottom: 10, color: PRIMARY_NAVY },
  startButton: { marginTop: 12, backgroundColor: ACCENT_BLUE, paddingVertical: 12, borderRadius: 12, justifyContent: "center", alignItems: "center" }
});
