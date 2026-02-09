import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import LinearGradient from 'react-native-linear-gradient';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppLogo from '../components/AppLogo';
import { API_BASE_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

// Color constants for distinct cards
const COLORS = {
    today: ['#F59E0B', '#D97706'],     // Amber
    wallet: ['#10B981', '#059669'],    // Emerald
    tokens: ['#3B82F6', '#2563EB'],    // Blue (Used for Tokens)
    approved: ['#64748B', '#475569'],  // Slate (Used for Withdrawals)
    lifetime: ['#8B5CF6', '#7C3AED'],  // Violet
};

export default function DashboardScreen() {
    const { wallet, refreshUserData } = useAuth(); // Use Wallet from Context
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [history, setHistory] = useState({ tokens: [], coins: [] });
    const [activeTab, setActiveTab] = useState('coins');

    useFocusEffect(
        useCallback(() => {
            loadHistory();
            refreshUserData(); // Sync Wallet
        }, [])
    );

    const loadHistory = async () => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            const headers = { Authorization: `Bearer ${token}` };

            const [coinRes, tokenRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/coins/history`, { headers }).catch(e => ({ data: { history: [] } })),
                axios.get(`${API_BASE_URL}/tokens/history`, { headers }).catch(e => ({ data: { history: [] } }))
            ]);

            setHistory({
                coins: coinRes.data.history || [],
                tokens: tokenRes.data.history || []
            });

        } catch (e) {
            console.log("History Load Error:", e.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        refreshUserData();
        loadHistory();
    };

    const formatDollars = (coins) => {
        if (!coins || coins <= 0) return '$0.00';
        const val = coins / 500;
        return `$${val.toFixed(2)}`;
    };

    const StatCard = ({ title, value, subtitle, icon, colors }) => (
        <LinearGradient
            colors={colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.card}
        >
            <View style={styles.cardHeader}>
                <View style={styles.iconBox}>
                    <Ionicons name={icon} size={20} color="#FFF" />
                </View>
                <Text style={styles.cardTitle}>{title}</Text>
            </View>

            <Text style={styles.cardValue}>{value}</Text>
            {subtitle && <Text style={styles.cardSubtitle}>{subtitle}</Text>}
        </LinearGradient>
    );

    // Helper for Coin Today calculation (Frontend approximation or add endpoint)
    // For now using 0 as placeholder or calculating from history if needed.
    // Ideally backend gives 'today' in wallet response. 
    // coin_wallets table doesn't track 'today' easily without query. 
    // For speed, I'll calculate from history.
    const getTodayEarnings = (list) => {
        const today = new Date().toDateString();
        return list
            .filter(item => new Date(item.created_at).toDateString() === today && item.amount > 0)
            .reduce((acc, item) => acc + item.amount, 0);
    };

    const todayCoins = getTodayEarnings(history.coins);
    const todayTokens = getTodayEarnings(history.tokens);

    const TransactionItem = ({ item }) => {
        const isCoins = activeTab === 'coins';

        // Normalize fields based on different table structures if needed
        const amount = item.amount || 0;
        const widthdrawStatus = item.status; // For coins
        const type = item.type || (item.source ? 'earning' : 'withdrawal');

        let displayAmount;
        let iconName = amount > 0 ? 'arrow-down-circle' : 'arrow-up-circle';
        let iconColor = amount > 0 ? '#10B981' : '#E11D48';
        let amountColor = amount > 0 ? '#10B981' : '#E11D48';

        if (isCoins) {
            if (item.type === 'withdrawal' && parseFloat(item.amount_usd) > 0) {
                // Real Cashout
                displayAmount = `$${parseFloat(item.amount_usd || 0).toFixed(2)}`;
                iconName = 'cash-outline';
                iconColor = '#F97316';
            } else {
                // All Earnings (Ads, Gifts, etc)
                displayAmount = `${Math.abs(amount)} Coins`;
                iconName = amount > 0 ? 'arrow-down-circle' : 'arrow-up-circle';
                iconColor = amount > 0 ? '#10B981' : '#E11D48';

                // Specific icon for ads
                if (item.source && item.source.toLowerCase().includes('ad')) {
                    iconName = 'play-circle';
                }
            }
        } else {
            // Tokens
            displayAmount = `${Math.abs(amount)} Tokens`;
            iconName = 'diamond';
            iconColor = '#8B5CF6';
            amountColor = '#8B5CF6';
        }

        // Clean up title (remove Unity, etc)
        let title = item.source ? item.source.toUpperCase().replace('_', ' ') : (item.type || 'Transaction').toUpperCase();
        if (title.includes('UNITY')) {
            title = title.replace('UNITY', '').trim() || 'AD REWARD';
        }

        return (
            <View style={styles.txItem}>
                <View style={[styles.txIconBox, { backgroundColor: isCoins ? '#E0F2FE' : '#F3E8FF' }]}>
                    <Ionicons name={iconName} size={24} color={iconColor} />
                </View>
                <View style={styles.txTextContent}>
                    <Text style={styles.txTitle}>{title}</Text>
                    <Text style={styles.txDate}>
                        {new Date(item.created_at).toLocaleDateString()} • {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
                <View style={styles.txRight}>
                    <Text style={[styles.txAmount, { color: amountColor }]}>
                        {amount > 0 ? '+' : ''}{displayAmount}
                    </Text>
                    {widthdrawStatus && (
                        <Text style={[styles.txStatus, widthdrawStatus === 'paid' ? { color: '#10B981' } : { color: '#F59E0B' }]}>
                            {widthdrawStatus.toUpperCase()}
                        </Text>
                    )}
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <AppLogo size={32} showText={false} />
                    <Text style={styles.headerTitle}>My Wallet</Text>
                </View>
            </View>

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                }
            >
                {/* Today's Earnings Section */}
                <Text style={styles.sectionLabel}>Today's Earnings</Text>
                <View style={styles.grid}>
                    {/* Today's Coins */}
                    <StatCard
                        title="Coins Earned Today"
                        value={formatDollars(todayCoins)}
                        subtitle={`${todayCoins} Coins`}
                        icon="trending-up"
                        colors={COLORS.today}
                    />
                    {/* Today's Tokens */}
                    <StatCard
                        title="Tokens Earned Today"
                        value={todayTokens}
                        subtitle="Tokens Today"
                        icon="sparkles"
                        colors={COLORS.tokens}
                    />
                </View>

                <Text style={styles.sectionLabel}>Withdrawable Coins</Text>
                <View style={styles.grid}>
                    {/* Coin Balance */}
                    <StatCard
                        title="Available Balance"
                        value={formatDollars(wallet.coins.balance)}
                        subtitle={`${wallet.coins.balance} Coins`}
                        icon="wallet"
                        colors={COLORS.wallet}
                    />
                    {/* Pending Coins */}
                    <StatCard
                        title="Pending"
                        value={formatDollars(wallet.coins.pending)}
                        subtitle={`${wallet.coins.pending} Coins`}
                        icon="time"
                        colors={COLORS.approved}
                    />
                    {/* Lifetime Coins */}
                    <StatCard
                        title="Lifetime Earned"
                        value={formatDollars(wallet.coins.lifetime)}
                        subtitle={`${wallet.coins.lifetime} Coins Total`}
                        icon="briefcase"
                        colors={COLORS.today}
                    />
                </View>

                <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Giveaway Tokens</Text>
                <View style={styles.grid}>
                    {/* Token Balance */}
                    <StatCard
                        title="Token Balance"
                        value={wallet.tokens.balance}
                        subtitle="Used for Giveaways ONLY"
                        icon="diamond"
                        colors={COLORS.tokens}
                    />
                    {/* Lifetime Tokens */}
                    <StatCard
                        title="Lifetime Tokens"
                        value={wallet.tokens.lifetime}
                        subtitle="Total Tokens Earned"
                        icon="star"
                        colors={COLORS.lifetime}
                    />
                </View>

                {/* History Section */}
                <View style={styles.infoSection}>
                    <View style={styles.tabContainer}>
                        <TouchableOpacity
                            style={[styles.tabBtn, activeTab === 'coins' && styles.activeTabBtn]}
                            onPress={() => setActiveTab('coins')}
                        >
                            <Text style={[styles.tabText, activeTab === 'coins' && styles.activeTabText]}>Coin History</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tabBtn, activeTab === 'tokens' && styles.activeTabBtn]}
                            onPress={() => setActiveTab('tokens')}
                        >
                            <Text style={[styles.tabText, activeTab === 'tokens' && styles.activeTabText]}>Token History</Text>
                        </TouchableOpacity>
                    </View>

                    {loading ? (
                        <ActivityIndicator color="#6366F1" style={{ marginTop: 20 }} />
                    ) : (history[activeTab] || []).length > 0 ? (
                        <View style={styles.txList}>
                            {history[activeTab].map((tx, idx) => (
                                <View key={idx}>
                                    <TransactionItem item={tx} />
                                    {idx < history[activeTab].length - 1 && <View style={styles.txDivider} />}
                                </View>
                            ))}
                        </View>
                    ) : (
                        <View style={styles.emptyState}>
                            <Ionicons name="documents-outline" size={40} color="#CBD5E1" />
                            <Text style={styles.emptyText}>No {activeTab} history yet.</Text>
                        </View>
                    )}
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 15,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 5,
        zIndex: 10,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#111827',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    sectionLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: '#64748B',
        marginBottom: 15,
        marginLeft: 4,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 15,
    },
    card: {
        width: (Dimensions.get('window').width - 55) / 2, // 2 column layout accounting for padding
        borderRadius: 20,
        padding: 16,
        minHeight: 140,
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        marginBottom: 0, // Using gap in grid
    },
    // ... (Keep simpler styles or reuse generic Card styles)
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    iconBox: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.9)',
        flex: 1,
    },
    cardValue: {
        fontSize: 28,
        fontWeight: '800',
        color: '#FFF',
        marginVertical: 10,
    },
    cardSubtitle: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '500',
    },
    infoSection: {
        marginTop: 20,
    },
    emptyState: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 30,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F1F5F9',
        borderStyle: 'dashed',
    },
    emptyText: {
        color: '#94A3B8',
        fontSize: 14,
        marginTop: 10,
        fontWeight: '500',
    },
    txList: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        paddingVertical: 5,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    txItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
    },
    txIconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    txTextContent: {
        flex: 1,
    },
    txTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1E293B',
    },
    txDate: {
        fontSize: 11,
        color: '#94A3B8',
        marginTop: 2,
    },
    txRight: {
        alignItems: 'flex-end',
    },
    txAmount: {
        fontSize: 15,
        fontWeight: '800',
    },
    txStatus: {
        fontSize: 10,
        fontWeight: '700',
        color: '#64748B',
        textTransform: 'uppercase',
        marginTop: 2,
    },
    txDivider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginLeft: 75,
        marginRight: 15,
    },
    tabContainer: {
        flexDirection: 'row',
        marginBottom: 15,
        backgroundColor: '#E2E8F0',
        borderRadius: 12,
        padding: 4,
    },
    tabBtn: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 10,
    },
    activeTabBtn: {
        backgroundColor: '#FFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    tabText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748B',
    },
    activeTabText: {
        color: '#6366F1',
        fontWeight: '700',
    },
});
