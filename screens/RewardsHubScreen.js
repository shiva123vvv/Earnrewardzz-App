import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

import LinearGradient from 'react-native-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Clipboard,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    RefreshControl,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

// --- SERVICE ---
// CONSTANTS
import { API_BASE_URL } from '../config/api';

const API_BASE = `${API_BASE_URL}/rewards`;
const USER_API_BASE = `${API_BASE_URL}/user`;

const rewardService = {
    getReferralCode: async () => {
        const token = await AsyncStorage.getItem('userToken');
        // Dedicate call to fetch persistent code
        const res = await axios.get(`${USER_API_BASE}/referral-code`, { headers: { Authorization: `Bearer ${token}` } });
        return res.data;
    },
    claimDaily: async () => {
        const token = await AsyncStorage.getItem('userToken');
        const res = await axios.post(`${API_BASE}/daily-checkin`, {}, { headers: { Authorization: `Bearer ${token}` } });
        return res.data;
    },
    getReferralDetails: async () => {
        const token = await AsyncStorage.getItem('userToken');
        const res = await axios.get(`${API_BASE}/referrals`, { headers: { Authorization: `Bearer ${token}` } });
        return res.data;
    },
    redeemCode: async (code) => {
        const token = await AsyncStorage.getItem('userToken');
        const res = await axios.post(`${API_BASE}/referrals/redeem`, { code }, { headers: { Authorization: `Bearer ${token}` } });
        return res.data;
    },
    spinWheel: async () => {
        const token = await AsyncStorage.getItem('userToken');
        const res = await axios.post(`${API_BASE}/spin`, {}, { headers: { Authorization: `Bearer ${token}` } });
        return res.data;
    },
    getHistory: async () => {
        const token = await AsyncStorage.getItem('userToken');
        const res = await axios.get(`${API_BASE}/history`, { headers: { Authorization: `Bearer ${token}` } });
        return res.data;
    }
};

// --- SUB-COMPONENTS ---

const TokenBalanceCard = ({ tokens }) => (
    <LinearGradient colors={['#FFFbeb', '#Fef3c7']} style={styles.tokenCard}>
        <View>
            <Text style={styles.tokenLabel}>TOKENS</Text>
            <Text style={styles.tokenValue}>{tokens}</Text>
        </View>
        <View style={styles.tokenIcon}>
            <Ionicons name="sparkles" size={20} color="#D97706" />
        </View>
    </LinearGradient>
);

const SectionContainer = ({ children, style }) => (
    <View style={[styles.cardContainer, style]}>
        {children}
    </View>
);

const DailyBonusCard = ({ onClaim, claimed, timeLeft }) => (
    <LinearGradient colors={claimed ? ['#1E293B', '#0F172A'] : ['#F59E0B', '#D97706']} style={styles.dailyCard}>
        <View style={{ flex: 1 }}>
            <View style={styles.cardHeaderRow}>
                <Ionicons name={claimed ? "lock-closed" : "calendar"} size={20} color={claimed ? "#94A3B8" : "#FFF"} />
                <Text style={[styles.cardTitle, claimed && { color: '#94A3B8' }]}>{claimed ? "Daily Locked" : "Daily Bonus"}</Text>
            </View>
            <Text style={styles.cardSub}>
                {claimed ? `Next Claim: ${timeLeft}` : "Daily Reward: 1 FREE SPIN!"}
            </Text>
        </View>
        <TouchableOpacity style={[styles.claimBtn, claimed && { backgroundColor: '#334155' }]} onPress={onClaim} disabled={claimed}>
            <Text style={[styles.claimBtnText, claimed && { color: '#94A3B8' }]}>{claimed ? "Claimed" : "Claim Free Spin"}</Text>
        </TouchableOpacity>
    </LinearGradient>
);

const ReferralSection = ({ code, stats, hasRedeemed, onRedeem, onRetry, loading }) => {
    const [inputCode, setInputCode] = useState('');

    const handleCopy = () => {
        if (!code) return;
        Clipboard.setString(code);
        Alert.alert("Copied", "Referral code copied to clipboard");
    };

    const handleShare = async () => {
        if (!code) return;
        try {
            await Share.share({ message: `Join EarnRewardzz! Use code ${code} to get 500 tokens instantly!` });
        } catch (error) {
            console.log(error);
        }
    };

    return (
        <View style={styles.refContainer}>
            <View style={styles.cardHeaderRow}>
                <Ionicons name="people" size={20} color="#4F46E5" />
                <Text style={[styles.cardTitle, { color: '#1E293B' }]}>Referrals</Text>
            </View>

            <Text style={styles.refDesc}>
                Invite friends using your referral code. Both of you get 500 tokens instantly!
            </Text>

            {/* My Code Section */}
            <View style={styles.codeSection}>
                <Text style={styles.sectionLabel}>YOUR REFERRAL CODE</Text>
                <View style={styles.codeRow}>
                    {/* Loading -> Code -> Retry */}
                    {loading ? (
                        <ActivityIndicator size="small" color="#4F46E5" />
                    ) : code ? (
                        <Text style={styles.codeDisplay}>{code}</Text>
                    ) : (
                        <TouchableOpacity onPress={onRetry} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Ionicons name="refresh-circle" size={18} color="#E11D48" />
                            <Text style={[styles.codeDisplay, { fontSize: 14, color: '#E11D48' }]}>Unable to load - Retry</Text>
                        </TouchableOpacity>
                    )}

                    <View style={styles.codeActions}>
                        <TouchableOpacity onPress={handleCopy} style={[styles.iconBtn, (!code || loading) && { opacity: 0.5 }]} disabled={!code || loading}>
                            <Ionicons name="copy-outline" size={20} color="#4F46E5" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleShare} style={[styles.iconBtn, (!code || loading) && { opacity: 0.5 }]} disabled={!code || loading}>
                            <Ionicons name="share-social-outline" size={20} color="#4F46E5" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* Redeem Input - Only show if NOT redeemed yet */}
            {!hasRedeemed ? (
                <View style={styles.redeemSection}>
                    <Text style={styles.sectionLabel}>ENTER REFERRAL CODE</Text>
                    <View style={styles.inputRow}>
                        <TextInput
                            style={styles.inputField}
                            placeholder="Example: REF123"
                            placeholderTextColor="#94A3B8"
                            value={inputCode}
                            onChangeText={setInputCode}
                            autoCapitalize="characters"
                        />
                        <TouchableOpacity style={styles.applyBtn} onPress={() => onRedeem(inputCode)}>
                            <Text style={styles.applyText}>APPLY CODE</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                <View style={styles.redeemedBadge}>
                    <Ionicons name="checkmark-circle" size={16} color="#059669" />
                    <Text style={styles.redeemedText}>Referral Code Applied (Pending)</Text>
                </View>
            )}

            {/* Stats Summary */}
            <View style={styles.statsRow}>
                <View style={styles.statItem}>
                    <Text style={styles.statVal}>{stats?.total || 0}</Text>
                    <Text style={styles.statLabel}>Total</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={styles.statVal}>{stats?.completed || 0}</Text>
                    <Text style={styles.statLabel}>Completed</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={styles.statVal}>{stats?.pending || 0}</Text>
                    <Text style={styles.statLabel}>Pending</Text>
                </View>
            </View>

        </View>
    );
};

export default function RewardsHubScreen({ navigation }) {
    const { user, wallet, refreshUserData } = useAuth();
    const [refreshing, setRefreshing] = useState(false);
    const [localTokens, setLocalTokens] = useState(wallet?.tokens?.balance || 0);


    // Referral State
    const [refData, setRefData] = useState({
        code: '',
        stats: { total: 0, completed: 0, pending: 0 },
        hasRedeemed: false
    });
    const [dailyClaimed, setDailyClaimed] = useState(false);
    const [timeLeft, setTimeLeft] = useState('00:00:00');
    // Add specific loading state for code to prevent flickering or "Tap to Load"
    const [codeLoading, setCodeLoading] = useState(true);

    // Spin State
    const [spinsAvailable, setSpinsAvailable] = useState(0);
    const [spinning, setSpinning] = useState(false);

    // History State
    const [history, setHistory] = useState([]);

    useEffect(() => {
        loadData();
    }, []);

    // Timer Logic
    useEffect(() => {
        const updateTimer = () => {
            const now = new Date();
            const tomorrow = new Date();
            tomorrow.setHours(24, 0, 0, 0);
            const diff = tomorrow - now;

            if (diff <= 0) {
                setTimeLeft("00:00:00");
                loadData(); // Auto Unlock
                return;
            }

            const h = Math.floor(diff / (1000 * 60 * 60));
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((diff % (1000 * 60)) / 1000);

            // Auto refresh at 00:00:00 edge
            if (h === 0 && m === 0 && s === 0) setTimeout(loadData, 2000);

            const pad = (n) => n < 10 ? '0' + n : n;
            setTimeLeft(`${pad(h)}:${pad(m)}:${pad(s)}`);
        };
        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (wallet?.tokens?.balance !== undefined) setLocalTokens(wallet.tokens.balance);
    }, [wallet]);


    const loadData = async () => {
        setRefreshing(true);
        setCodeLoading(true); // Ensure spinner shows on refresh

        try {
            // 1. Fetch persistent code specially
            let fetchedCode = null;
            try {
                const codeRes = await rewardService.getReferralCode();
                console.log("Referral Code API Success:", codeRes);
                if (codeRes && codeRes.success) {
                    fetchedCode = codeRes.code; // Adjusted to match API response: { success: true, code: '...' }
                    setRefData(prev => ({ ...prev, code: codeRes.code }));
                }
            } catch (err) {
                console.error("Referral Code API Failed:", err.message);
            } finally {
                setCodeLoading(false); // Stop code spinner regardless of success/fail
            }

            // 2. Fetch other details
            const [rData, hData] = await Promise.all([
                rewardService.getReferralDetails(),
                rewardService.getHistory()
            ]);

            if (rData.success) {
                setRefData(prev => ({
                    ...prev,
                    code: fetchedCode || rData.code || prev.code,
                    stats: rData.stats,
                    hasRedeemed: rData.hasRedeemed
                }));
                // Use wallet data for spins if available, or stay sync with rData
                setSpinsAvailable(wallet?.tokens?.spins_left || rData.spinsAvailable || 0);
                if (rData.dailyClaimed) setDailyClaimed(true);
                else setDailyClaimed(false);
            }

            if (hData.success) {
                setHistory(hData.history);
            }
        } catch (error) {
            console.log("Load error", error);
            setCodeLoading(false);
        } finally {
            setRefreshing(false);
        }
    };

    const handleDailyClaim = async () => {
        try {
            const res = await rewardService.claimDaily();
            Alert.alert(res.success ? "Success" : "Notice", res.message);
            if (res.success) {
                // setLocalTokens(prev => prev + 100); // Removed as daily bonus is now spin only
                // setSpinsAvailable(prev => prev + 1); // REMOVED: No optimistic updates.
                setDailyClaimed(true);

                // Use backend response if available, otherwise reload
                if (res.spinsLeft !== undefined) {
                    setSpinsAvailable(res.spinsLeft);
                } else {
                    loadData();
                }
            }
        } catch (error) {
            // Graceful handling of "Already claimed"
            if (error.response?.data?.message === "Already claimed today") {
                setDailyClaimed(true);
                // Optional: Don't alert if it's just a sync issue, but user clicked it so alert is ok.
                Alert.alert("Notice", "You have already claimed your daily spin today.");
            } else {
                Alert.alert("Error", error.response?.data?.message || "Claim failed");
            }
        }
    };

    const handleRedeem = async (code) => {
        if (!code) return Alert.alert("Required", "Please enter a code");
        try {
            const res = await rewardService.redeemCode(code);
            Alert.alert("Referral Applied", res.message);
            loadData();
        } catch (error) {
            Alert.alert("Redeem Failed", error.response?.data?.message || "Invalid code");
        }
    };

    // reload on focus to update spin count after returning
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            loadData();
        });
        return unsubscribe;
    }, [navigation]);

    const handleSpin = () => {
        navigation.navigate('SpinWheel');
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
            <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : undefined}
                    style={{ flex: 1 }}
                >
                    <ScrollView
                        style={{ flex: 1 }}
                        contentContainerStyle={{ padding: 20, paddingBottom: 150 }}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} />}
                        showsVerticalScrollIndicator={true}
                        scrollEventThrottle={16}
                    >
                        {/* Header Section */}
                        <View style={styles.header}>
                            <View style={styles.headerLeft}>
                                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                                    <Ionicons name="arrow-back" size={24} color="#1E293B" />
                                </TouchableOpacity>
                                <Text style={styles.pageTitle}>Rewards Hub</Text>
                            </View>
                            <TokenBalanceCard tokens={localTokens} />
                        </View>

                        <Text style={styles.pageSubtitle}>
                            Earn tokens through daily activity and referrals. Tokens can be used for exclusive giveaways.
                        </Text>

                        {/* Daily Bonus */}
                        <SectionContainer>
                            <DailyBonusCard onClaim={handleDailyClaim} claimed={dailyClaimed} timeLeft={timeLeft} />
                        </SectionContainer>

                        {/* Referral System */}
                        <SectionContainer style={{ padding: 0, overflow: 'hidden' }}>
                            <ReferralSection
                                code={refData.code}
                                stats={refData.stats}
                                hasRedeemed={refData.hasRedeemed}
                                onRedeem={handleRedeem}
                                onRetry={loadData}
                                loading={codeLoading}
                            />
                        </SectionContainer>

                        {/* Bonus Spin (Mini) */}
                        <TouchableOpacity style={[styles.spinCard, spinsAvailable <= 0 && { opacity: 0.8 }]} onPress={handleSpin} disabled={spinning}>
                            <LinearGradient colors={['#EC4899', '#DB2777']} style={styles.spinGradient}>
                                <View style={styles.spinContent}>
                                    <Ionicons name="aperture" size={24} color="#FFF" />
                                    <View style={{ marginLeft: 12 }}>
                                        <Text style={styles.spinTitle}>Bonus Spin</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                            <Text style={styles.spinSub}>{spinning ? "Spinning..." : "Try your luck!"}</Text>
                                            <View style={styles.badge}>
                                                <Text style={styles.badgeText}>{spinsAvailable} Left</Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#FFF" />
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* Giveaways Link */}
                        <TouchableOpacity style={styles.giveawayCard} onPress={() => navigation.navigate('Giveaway')}>
                            <LinearGradient colors={['#10B981', '#059669']} style={styles.gvGradient}>
                                <View style={styles.gvContent}>
                                    <Ionicons name="gift" size={24} color="#FFF" />
                                    <View style={{ marginLeft: 12 }}>
                                        <Text style={styles.gvTitle}>Active Giveaways</Text>
                                        <Text style={styles.gvSub}>View Prizes</Text>
                                    </View>
                                </View>
                                <Ionicons name="arrow-forward" size={20} color="#FFF" />
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* Transaction History */}
                        <Text style={styles.histHeader}>Recent Activity</Text>
                        {history.length > 0 ? (
                            history.map((item, index) => (
                                <View key={index} style={styles.histItem}>
                                    <View style={styles.histLeft}>
                                        <View style={[styles.histIcon, { backgroundColor: item.type.includes('bonus') ? '#FEF3C7' : '#E0E7FF' }]}>
                                            <Ionicons
                                                name={item.type === 'spin' ? 'aperture' : item.type === 'daily_bonus' ? 'calendar' : 'people'}
                                                size={16}
                                                color="#1E293B"
                                            />
                                        </View>
                                        <View>
                                            <Text style={styles.histTitle}>{item.type.replace('_', ' ').toUpperCase()}</Text>
                                            <Text style={styles.histDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
                                        </View>
                                    </View>
                                    <Text style={[styles.histAmount, { color: item.amount > 0 ? '#059669' : '#DC2626' }]}>
                                        {item.amount > 0 ? '+' : ''}{item.amount}
                                    </Text>
                                </View>
                            ))
                        ) : (
                            <Text style={styles.emptyText}>No recent activity.</Text>
                        )}

                        <View style={{ height: 20 }} />
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },

    // Header
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    headerLeft: { flexDirection: 'row', alignItems: 'center' },
    backBtn: { padding: 5, marginRight: 10 },
    pageTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A' },

    // Token Card
    tokenCard: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#FEF3C7' },
    tokenLabel: { fontSize: 8, fontWeight: '700', color: '#D97706', marginBottom: 2 },
    tokenValue: { fontSize: 14, fontWeight: '800', color: '#B45309' },
    tokenIcon: { marginLeft: 8 },

    scrollContent: { padding: 20 },
    pageSubtitle: { fontSize: 13, color: '#64748B', lineHeight: 20, marginBottom: 24 },

    // Cards
    cardContainer: { backgroundColor: '#FFF', borderRadius: 16, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { height: 2 } },

    // Daily Bonus
    dailyCard: { borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center' },
    cardHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
    cardTitle: { fontSize: 16, fontWeight: '700', color: '#FFF' },
    cardSub: { fontSize: 11, color: 'rgba(255,255,255,0.9)', lineHeight: 16, paddingRight: 10 },
    claimBtn: { backgroundColor: '#FFF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
    claimBtnText: { color: '#D97706', fontWeight: '800', fontSize: 12 },

    // Referral Section
    refContainer: { padding: 16 },
    refDesc: { fontSize: 12, color: '#64748B', marginBottom: 20, lineHeight: 18 },

    // Code Display
    codeSection: { marginBottom: 20 },
    sectionLabel: { fontSize: 10, fontWeight: '800', color: '#94A3B8', letterSpacing: 0.5, marginBottom: 8, textTransform: 'uppercase' },
    codeRow: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 12, padding: 12, justifyContent: 'space-between', alignItems: 'center' },
    codeDisplay: { fontSize: 18, fontWeight: '800', color: '#4F46E5', letterSpacing: 1 },
    codeActions: { flexDirection: 'row', gap: 12 },
    iconBtn: { padding: 4 },

    // Redeem Input
    redeemSection: { marginBottom: 20 },
    inputRow: { flexDirection: 'row', gap: 10 },
    inputField: { flex: 1, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 15, height: 44, color: '#1E293B' },
    applyBtn: { backgroundColor: '#4F46E5', borderRadius: 10, justifyContent: 'center', paddingHorizontal: 16 },
    applyText: { color: '#FFF', fontWeight: '700', fontSize: 12 },

    redeemedBadge: { flexDirection: 'row', padding: 12, backgroundColor: '#ECFDF5', borderRadius: 10, alignItems: 'center', marginBottom: 20, justifyContent: 'center', gap: 8 },
    redeemedText: { color: '#059669', fontWeight: '600', fontSize: 13 },

    // Stats
    statsRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 16 },
    statItem: { flex: 1, alignItems: 'center' },
    statVal: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
    statLabel: { fontSize: 10, color: '#64748B', marginTop: 2 },
    statDivider: { width: 1, backgroundColor: '#F1F5F9' },

    // Spin & Giveaway
    spinCard: { marginBottom: 16, borderRadius: 16, overflow: 'hidden' },
    spinGradient: { padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    spinContent: { flexDirection: 'row', alignItems: 'center' },
    spinTitle: { color: '#FFF', fontWeight: '700', fontSize: 15 },
    spinSub: { color: '#FFF', fontSize: 11 },
    badge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    badgeText: { color: '#FFF', fontSize: 10, fontWeight: '800' },

    giveawayCard: { marginBottom: 24, borderRadius: 16, overflow: 'hidden' },
    gvGradient: { padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    gvContent: { flexDirection: 'row', alignItems: 'center' },
    gvTitle: { color: '#FFF', fontWeight: '700', fontSize: 15 },
    gvSub: { color: 'rgba(255,255,255,0.8)', fontSize: 11 },

    // History
    histHeader: { fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 12 },
    histItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    histLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    histIcon: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    histTitle: { fontSize: 12, fontWeight: '700', color: '#334155' },
    histDate: { fontSize: 10, color: '#94A3B8' },
    histAmount: { fontSize: 14, fontWeight: '700' },
    emptyText: { textAlign: 'center', color: '#94A3B8', fontSize: 13, fontStyle: 'italic', marginTop: 10 }
});
