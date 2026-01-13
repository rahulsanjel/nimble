import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, StyleSheet, Platform } from "react-native"; 
import { Home, Map, Ticket, Bell, Settings } from "lucide-react-native";

import HomeScreen from "../screens/HomeScreen";

const Placeholder = () => <View style={{ flex: 1, backgroundColor: "#F8FAFC" }} />;
const Tab = createBottomTabNavigator();

// THEME COLORS
const PRIMARY_NAVY = "#0F172A"; // Brand Color for Tab Bar
const ACTIVE_ACCENT = "#FFFFFF"; // Pure White for active icon (pops on Navy)
const INACTIVE_ACCENT = "rgba(255, 255, 255, 0.4)"; // Faded white for inactive

const TabIcon = ({ Icon, focused }) => {
  return (
    <View style={styles.iconWrapper}>
      <Icon 
        color={focused ? ACTIVE_ACCENT : INACTIVE_ACCENT} 
        size={24} 
        strokeWidth={focused ? 2.5 : 2} 
      />
      {/* Indicator dot at the bottom to show active state */}
      {focused && <View style={styles.activeDot} />}
    </View>
  );
};

export default function TabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ tabBarIcon: ({ focused }) => <TabIcon Icon={Home} focused={focused} /> }} 
      />
      <Tab.Screen 
        name="Tickets" 
        component={Placeholder} 
        options={{ tabBarIcon: ({ focused }) => <TabIcon Icon={Ticket} focused={focused} /> }} 
      />
      <Tab.Screen 
        name="Maps" 
        component={Placeholder} 
        options={{ tabBarIcon: ({ focused }) => <TabIcon Icon={Map} focused={focused} /> }} 
      />
      <Tab.Screen 
        name="Notifications" 
        component={Placeholder} 
        options={{ tabBarIcon: ({ focused }) => <TabIcon Icon={Bell} focused={focused} /> }} 
      />
      <Tab.Screen 
        name="Settings" 
        component={Placeholder} 
        options={{ tabBarIcon: ({ focused }) => <TabIcon Icon={Settings} focused={focused} /> }} 
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: PRIMARY_NAVY, // Full Brand Color
    height: Platform.OS === 'ios' ? 90 : 70,
    borderTopWidth: 0,
    paddingBottom: Platform.OS === 'ios' ? 30 : 12,
    paddingTop: 12,
    // Add a subtle shadow for depth
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 20,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: ACTIVE_ACCENT,
    marginTop: 6,
    position: 'absolute',
    bottom: -2,
  }
});