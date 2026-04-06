import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import SplashScreen from "../screens/SplashScreen"; 
import OnboardingScreen from "../screens/OnboardingScreen"; 
import LoginScreen from "../screens/LoginScreen";
import SignupScreen from "../screens/SignupScreen";
import ForgotPasswordScreen from "../screens/ForgotPasswordScreen"; 
import ResetPasswordScreen from "../screens/ResetPasswordScreen"; 
import TabNavigator from "./TabNavigator"; 
import ProfileScreen from "../screens/ProfileScreen";
import DriverHomeScreen from "../screens/DriverHomeScreen";
import LiveMap from "../screens/LiveMap"; 
import AllRoutesScreen from "../screens/AllRoutesScreen"; 
import TicketScreen from "../screens/TicketScreen";

const Stack = createNativeStackNavigator();

export default function StackNavigator() {
  return (
    <Stack.Navigator 
      // Always start with Splash to handle routing logic
      initialRouteName="Splash" 
      screenOptions={{ headerShown: false }}
    >
      {/* --- Launch & Intro --- */}
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />

      {/* --- Auth Screens --- */}
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />

      {/* --- Main App (Tabs) --- */}
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      
      {/* --- Other Screens --- */}
      <Stack.Screen name="DriverHome" component={DriverHomeScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="LiveMap" component={LiveMap} />
      <Stack.Screen name="AllRoutesScreen" component={AllRoutesScreen} />
      <Stack.Screen name="TicketScreen" component={TicketScreen} />  
    </Stack.Navigator>
  );
}