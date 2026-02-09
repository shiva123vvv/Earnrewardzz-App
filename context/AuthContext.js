import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { createContext, useContext, useEffect, useState } from "react";
import { API_ROOT_URL } from '../config/api';

const AuthContext = createContext();
const API_URL = API_ROOT_URL;

// Set default timeout for all requests to 15 seconds
axios.defaults.timeout = 15000;

export const AuthProvider = ({ children }) => {
    // Separate State as requested
    const [user, setUser] = useState(null);
    const [wallet, setWallet] = useState({
        coins: { balance: 0, pending: 0, lifetime: 0 },
        tokens: { balance: 0, lifetime: 0, spins_left: 0 }
    });

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (token) {
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                // Run these in parallel and don't let them block the app boot forever
                Promise.all([
                    refreshWallet(),
                    fetchProfile()
                ]).catch(err => console.error("Initial data sync failed", err));
            }
        } catch (error) {
            console.error("Auth check error:", error);
            logout(); // Safety logout on error
        } finally {
            setLoading(false);
        }
    };

    const fetchProfile = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/auth/me`);
            if (res.data.success) {
                setUser(res.data.user);
            }
        } catch (e) { console.error("Profile fetch error", e); }
    };

    const refreshWallet = async () => {
        try {
            // STRICT SEPARATION: Parallel calls
            const [coinRes, tokenRes] = await Promise.all([
                axios.get(`${API_URL}/api/coins/wallet`).catch(e => ({ data: { balance: 0, pending: 0, lifetime: 0 } })),
                axios.get(`${API_URL}/api/tokens/wallet`).catch(e => ({ data: { balance: 0, lifetime: 0 } }))
            ]);

            setWallet({
                coins: coinRes.data,
                tokens: tokenRes.data
            });
        } catch (error) {
            console.error("Wallet sync failed:", error);
        }
    };

    // --- AUTH ---
    const requestOTP = async (email, phoneNumber, isSignup) => {
        try {
            // Use NEW endpoint
            const res = await axios.post(`${API_URL}/api/auth/otp/request`, { email, phoneNumber, isSignup });
            return res.data.success;
        } catch (err) {
            throw new Error(err.response?.data?.message || "OTP Request Failed");
        }
    };

    const loginWithOTP = async (email, otp, referralCode = null) => {
        try {
            // Include referralCode in backend request
            const res = await axios.post(`${API_URL}/api/auth/otp/verify`, { email, otp, referralCode });
            if (res.data.success) {
                const { token, user: profile } = res.data;
                await AsyncStorage.setItem('userToken', token);
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

                setUser(profile);
                await refreshWallet();
                return true;
            }
        } catch (err) {
            throw new Error(err.response?.data?.message || "Login Failed");
        }
        return false;
    };

    const logout = async () => {
        await AsyncStorage.removeItem('userToken');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
        setWallet({ coins: {}, tokens: {} });
    };

    // --- ACTIONS (Separated) ---

    // 1. Earn Coin (Ad)
    const earnCoin = async (source) => {
        try {
            const res = await axios.post(`${API_URL}/api/coins/earn/ad`, { source });
            if (res.data.success) {
                refreshWallet(); // Update state
                return true;
            }
        } catch (e) {
            console.error("Earn coin failed", e);
        }
        return false;
    };

    // 2. Earn Token (Daily/Spin)
    const earnToken = async (source, amount) => {
        try {
            const res = await axios.post(`${API_URL}/api/tokens/earn`, { source, amount });
            if (res.data.success) {
                refreshWallet(); // Update state
                return true;
            }
        } catch (e) {
            console.error("Earn token failed", e);
            throw e; // Throw so UI can show specific error (e.g. daily limit)
        }
        return false;
    };

    const requestWithdrawal = async (amountUSD, address, method) => {
        try {
            const res = await axios.post(`${API_URL}/api/coins/withdraw`, { amountUSD, address, method });
            if (res.data.success) {
                refreshWallet();
                return res.data;
            }
        } catch (e) {
            return { success: false, message: e.response?.data?.message || "Failed" };
        }
    };

    const buyTicket = async (giveawayId, ticketCount) => {
        try {
            const res = await axios.post(`${API_URL}/api/giveaways/buy`, { giveawayId, ticketCount });
            if (res.data.success) {
                refreshWallet();
                return res.data;
            }
        } catch (e) {
            return { success: false, message: e.response?.data?.message || "Failed" };
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            wallet, // Exposing separated wallet
            loading,
            requestOTP,
            loginWithOTP,
            logout,
            refreshUserData: refreshWallet, // Alias for backward compat if needed, but better use refreshWallet

            // Actions
            earnCoin,
            earnToken,
            requestWithdrawal,
            buyTicket
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
