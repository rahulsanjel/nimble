import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "../screens/LoginScreen";
import SignupScreen from "../screens/SignupScreen";
import TabNavigator from "./TabNavigator"; // Import the new tabs
import ProfileScreen from "../screens/ProfileScreen";
import DriverHomeScreen from "../screens/DriverHomeScreen";
import LiveMap from "../screens/LiveMap"; 

const Stack = createNativeStackNavigator();

export default function StackNavigator({ initialRoute }) {
  return (
    <Stack.Navigator 
      initialRouteName={initialRoute || "Login"} 
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      
      {/* 🔹 This is now the Tab Container */}
      <Stack.Screen name="MainTabs" component={TabNavigator} options={{ headerShown: false }} />
      {/* 🔹 Driver Home Screen */}
      <Stack.Screen name="DriverHome" component={DriverHomeScreen} />
      

      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="LiveMap" component={LiveMap} />
    </Stack.Navigator>
  );
}