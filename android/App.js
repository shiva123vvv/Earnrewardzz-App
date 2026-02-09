import Ionicons from 'react-native-vector-icons/Ionicons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';

import React from 'react';
import { ActivityIndicator, Platform, StyleSheet, View, StatusBar } from 'react-native';
import { AuthProvider, useAuth } from './context/AuthContext';

// Screens
import BusinessPartnershipsScreen from './screens/BusinessPartnershipsScreen';
import DashboardScreen from './screens/DashboardScreen';
import EarnScreen from './screens/EarnScreen';
import GiveawayScreen from './screens/GiveawayScreen';
import LoginScreen from './screens/LoginScreen';
import OTPScreen from './screens/OTPScreen';
import PrivacyPolicyScreen from './screens/PrivacyPolicyScreen';
import ProfileScreen from './screens/ProfileScreen';
import RewardsHubScreen from './screens/RewardsHubScreen';
import SignupScreen from './screens/SignupScreen';
import SpinWheelScreen from './screens/SpinWheelScreen';
import WelcomeScreen from './screens/WelcomeScreen';
import WithdrawalScreen from './screens/WithdrawalScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: styles.tabBar,
                tabBarActiveTintColor: '#6366F1',
                tabBarInactiveTintColor: '#94A3B8',
                tabBarShowLabel: false, // Hide text labels
                tabBarHideOnKeyboard: true,
            }}
        >
            <Tab.Screen
                name="Home"
                component={DashboardScreen}
                options={{
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? "home" : "home-outline"} size={28} color={color} />
                    )
                }}
            />
            <Tab.Screen
                name="Earn"
                component={EarnScreen}
                options={{
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? "logo-usd" : "logo-usd"} size={28} color={color} />
                    )
                }}
            />
            <Tab.Screen
                name="Withdrawal"
                component={WithdrawalScreen}
                options={{
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? "wallet" : "wallet-outline"} size={28} color={color} />
                    )
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? "person" : "person-outline"} size={28} color={color} />
                    )
                }}
            />
        </Tab.Navigator>
    );
}

function Navigation() {
    const { user, loading } = useAuth();


    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#6366F1" />
            </View>
        );
    }

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {!user ? (
                <>
                    <Stack.Screen name="Welcome" component={WelcomeScreen} />
                    <Stack.Screen name="Signup" component={SignupScreen} />
                    <Stack.Screen name="Login" component={LoginScreen} />
                    <Stack.Screen name="OTP" component={OTPScreen} />
                </>
            ) : (
                <Stack.Screen name="Main" component={TabNavigator} />
            )}
            <Stack.Screen name="Giveaway" component={GiveawayScreen} />
            <Stack.Screen name="RewardsHub" component={RewardsHubScreen} />
            <Stack.Screen name="SpinWheel" component={SpinWheelScreen} />
            <Stack.Screen name="BusinessPartnerships" component={BusinessPartnershipsScreen} />
            <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
        </Stack.Navigator>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <StatusBar barStyle="dark-content" />
            <Navigation />
        </AuthProvider>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },
    tabBar: {
        backgroundColor: '#FFFFFF',
        height: Platform.OS === 'ios' ? 90 : 100,
        paddingBottom: Platform.OS === 'ios' ? 30 : 40,
        paddingTop: 10,
        borderTopWidth: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        elevation: 20,
        // Removed absolute positioning to prevent overlap and layout issues
    },
    tabBarLabel: {
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 1,
        marginTop: -5
    },
    customTabItem: {
        width: 45,
        height: 35,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
    },
    activeTabBg: {
        backgroundColor: '#EEF2FF', // Subtle indigo tint for active tabs
    }
});
