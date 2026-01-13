import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "../screens/LoginScreen";
import SignupScreen from "../screens/SignupScreen";
import TabNavigator from "./TabNavigator"; // Import the new tabs
import ProfileScreen from "../screens/ProfileScreen";
import AllRoutesScreen from "../screens/AllRoutesScreen";

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
      
      {/* Keep Profile here if you want it to open full-screen (no tabs visible) */}
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="AllRoutes" component={AllRoutesScreen} />

    </Stack.Navigator>
  );
}