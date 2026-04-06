import React, { useState, useEffect } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, StyleSheet, Platform, Text } from "react-native"; 
import { Home, Map, Ticket, Bell, Settings } from "lucide-react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from "@react-navigation/native";

import LiveMap from "../screens/LiveMap";
import HomeScreen from "../screens/HomeScreen";
import TicketScreen from "../screens/TicketScreen";
import NotificationScreen from "../screens/NotificationScreen"; // Import your new screen

const Tab = createBottomTabNavigator();

const PRIMARY_NAVY = "#0F172A"; 
const ACTIVE_ACCENT = "#FFFFFF"; 
const INACTIVE_ACCENT = "rgba(255, 255, 255, 0.4)";
const BADGE_RED = "#EF4444";

// --- UPDATED TabIcon to support Badges ---
const TabIcon = ({ Icon, focused, badgeCount }) => {
  return (
    <View style={styles.iconWrapper}>
      <Icon 
        color={focused ? ACTIVE_ACCENT : INACTIVE_ACCENT} 
        size={24} 
        strokeWidth={focused ? 2.5 : 2} 
      />
      
      {/* Red Badge for Notifications */}
      {badgeCount > 0 && (
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>{badgeCount > 9 ? '9+' : badgeCount}</Text>
        </View>
      )}

      {focused && <View style={styles.activeDot} />}
    </View>
  );
};

export default function TabNavigator() {
  const [unreadCount, setUnreadCount] = useState(0);

  // Poll for new notifications every few seconds so the badge updates live
  useEffect(() => {
    const checkNotifications = async () => {
      try {
        const data = await AsyncStorage.getItem('nimble_notifications');
        if (data) {
          const notifs = JSON.parse(data);
          const unread = notifs.filter(n => n.unread).length;
          setUnreadCount(unread);
        }
      } catch (e) { console.log(e); }
    };

    checkNotifications();
    const interval = setInterval(checkNotifications, 5000); 
    return () => clearInterval(interval);
  }, []);

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
        component={TicketScreen} 
        options={{ tabBarIcon: ({ focused }) => <TabIcon Icon={Ticket} focused={focused} /> }} 
      />
      <Tab.Screen 
        name="Maps" 
        component={LiveMap} 
        options={{ tabBarIcon: ({ focused }) => <TabIcon Icon={Map} focused={focused} /> }} 
      />
      <Tab.Screen 
        name="Notifications" 
        component={NotificationScreen} 
        options={{ 
            tabBarIcon: ({ focused }) => (
                <TabIcon Icon={Bell} focused={focused} badgeCount={unreadCount} /> 
            ) 
        }} 
      />
      <Tab.Screen 
        name="Settings" 
        component={HomeScreen} // Change to your actual Settings screen
        options={{ tabBarIcon: ({ focused }) => <TabIcon Icon={Settings} focused={focused} /> }} 
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: PRIMARY_NAVY,
    height: Platform.OS === 'ios' ? 90 : 70,
    borderTopWidth: 0,
    paddingBottom: Platform.OS === 'ios' ? 30 : 12,
    paddingTop: 12,
    elevation: 20,
  },
  iconWrapper: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  activeDot: {
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: ACTIVE_ACCENT, marginTop: 6,
    position: 'absolute', bottom: -2,
  },
  // --- BADGE STYLES ---
  badgeContainer: {
    position: 'absolute',
    top: -2,
    right: -6,
    backgroundColor: BADGE_RED,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: PRIMARY_NAVY, // Matches tab bar so it looks "cut out"
  },
  badgeText: {
    color: 'white',
    fontSize: 8,
    fontWeight: '900',
    textAlign: 'center',
  }
});