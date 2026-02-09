import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Easing,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';

import { API_BASE_URL } from '../config/api';

const API_BASE = API_BASE_URL;

const SEGMENTS = [
    { label: '50', id: '50_tokens', color: '#FFD700' }, // Gold
    { label: '100', id: '100_tokens', color: '#FF4136' }, // Red
    { label: '250', id: '250_tokens', color: '#0074D9' }, // Blue
    { label: '500', id: '500_tokens', color: '#2ECC40' }, // Green
    { label: 'Try Again', id: 'try_again', color: '#B10DC9' } // Purple
];

export default function SpinWheelScreen({ navigation }) {
    const { wallet, refreshUserData } = useAuth();
    const [loading, setLoading] = useState(true);
    const spinsAvailable = wallet?.tokens?.spins_left || 0;
    const tokenBalance = wallet?.tokens?.balance || 0;
    const [history, setHistory] = useState([]);

    // Spin Animation State
    const [spinning, setSpinning] = useState(false);
    const [spinResult, setSpinResult] = useState(null); // { reward: string, amount: number }
    const spinAnim = useRef(new Animated.Value(0)).current;

    // Countdown
    const [timeLeft, setTimeLeft] = useState('00:00:00');

    useEffect(() => {
        const updateTimer = () => {
            const now = new Date();
            const tomorrow = new Date();
            tomorrow.setHours(24, 0, 0, 0);
            const diff = tomorrow - now;

            if (diff <= 0) {
                setTimeLeft("00:00:00");
                loadData(); // Auto refresh
                return;
            }

            const h = Math.floor(diff / (1000 * 60 * 60));
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((diff % (1000 * 60)) / 1000);

            // Refresh if crossed midnight
            if (h === 0 && m === 0 && s === 0) setTimeout(loadData, 2000);

            const pad = (n) => n < 10 ? '0' + n : n;
            setTimeLeft(`${pad(h)}:${pad(m)}:${pad(s)}`);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const authHeader = { headers: { Authorization: `Bearer ${token}` } };

            await refreshUserData();

            // Fetch History and Filter for Spins
            const histRes = await axios.get(`${API_BASE}/tokens/history`, authHeader);
            if (histRes.data.success) {
                const spinHist = histRes.data.history.filter(h => h.source === 'spin');
                setHistory(spinHist);
            }

        } catch (error) {
            console.log("Load error", error);
        } finally {
            setLoading(false);
        }
    };

    const runSpinAnimation = (callback) => {
        // Reset
        spinAnim.setValue(0);

        Animated.timing(spinAnim, {
            toValue: 1,
            duration: 3000, // 3 seconds spin
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true
        }).start(() => {
            if (callback) callback();
        });
    };

    const handleSpin = async () => {
        if (spinsAvailable <= 0) {
            Alert.alert("No Spins", "You don't have any spins available.");
            return;
        }
        if (spinning) return;

        setSpinning(true);
        setSpinResult(null);
        spinAnim.setValue(0);

        try {
            const token = await AsyncStorage.getItem('userToken');
            const res = await axios.post(`${API_BASE}/tokens/spin/play`, {}, { headers: { Authorization: `Bearer ${token}` } });

            if (res.data.success) {
                const rewardType = res.data.reward;
                const index = SEGMENTS.findIndex(s => s.id === rewardType);
                const targetIndex = index !== -1 ? index : 4;
                const segmentAngle = 360 / SEGMENTS.length;
                const finalAngle = 1800 - (targetIndex * segmentAngle);

                Animated.timing(spinAnim, {
                    toValue: finalAngle,
                    duration: 4000,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true
                }).start(async () => {
                    setSpinning(false);
                    await refreshUserData();
                    setSpinResult({ type: res.data.reward, amount: res.data.winAmount });
                    setHistory(prev => [{ source: 'spin', amount: res.data.winAmount, created_at: new Date().toISOString() }, ...prev]);
                    if (res.data.winAmount > 0) Alert.alert("Won!", `+${res.data.winAmount} Tokens`);
                });
            }
        } catch (error) {
            setSpinning(false);
            Alert.alert("Error", error.response?.data?.message || "Spin failed");
        }
    };

    const spinRotate = spinAnim.interpolate({
        inputRange: [0, 360],
        outputRange: ['0deg', '360deg']
    });

    return (
        <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
            <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#1E293B" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Bonus Spins</Text>
                </View >

                <ScrollView
                    contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                >
                    <Text style={styles.subtitle}>
                        Use bonus spins to earn tokens. Tokens can be used to buy giveaway tickets.
                    </Text>

                    {/* Spin Stats */}
                    <View style={styles.statsCard}>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>AVAILABLE SPINS</Text>
                            <Text style={styles.statValue}>{spinsAvailable}</Text>
                        </View>
                    </View>
                    {/* Wheel Area */}
                    <View style={styles.wheelContainer}>
                        <Animated.View style={[styles.wheelCircle, { transform: [{ rotate: spinRotate }] }]}>
                            <View style={styles.wheelInner}>
                                {/* Slices */}
                                {SEGMENTS.map((seg, i) => {
                                    const rotate = `${i * 72}deg`;
                                    return (
                                        <View key={`slice-${i}`} style={{
                                            position: 'absolute',
                                            top: 0, left: 38, // 140 - 102
                                            width: 0, height: 0,
                                            borderLeftWidth: 102,
                                            borderRightWidth: 102,
                                            borderTopWidth: 140, // Height of wedge
                                            borderTopColor: seg.color,
                                            borderLeftColor: 'transparent',
                                            borderRightColor: 'transparent',
                                            backgroundColor: 'transparent',
                                            transform: [
                                                { translateY: 70 }, // Move pivot to tip (bottom of rect)
                                                { rotate },
                                                { translateY: -70 },
                                            ]
                                        }} />
                                    );
                                })}

                                {/* Divider Lines */}
                                {SEGMENTS.map((_, i) => {
                                    const rotate = `${i * 72 + 36}deg`;
                                    return (
                                        <View key={`line-${i}`} style={{
                                            position: 'absolute',
                                            top: 0, bottom: 0, left: 140,
                                            width: 4, marginLeft: -2,
                                            backgroundColor: '#000',
                                            transform: [{ rotate }]
                                        }} />
                                    );
                                })}

                                {/* Labels */}
                                {SEGMENTS.map((seg, i) => {
                                    const angleDeg = i * 72;
                                    const angleRad = (angleDeg - 90) * (Math.PI / 180);
                                    const radius = 95;
                                    const x = 140 + radius * Math.cos(angleRad);
                                    const y = 140 + radius * Math.sin(angleRad);
                                    return (
                                        <View key={i} style={{
                                            position: 'absolute', left: x - 60, top: y - 20, width: 120, height: 40,
                                            transform: [{ rotate: `${angleDeg + 90}deg` }],
                                            alignItems: 'center', justifyContent: 'center',
                                            zIndex: 10
                                        }}>
                                            <Text style={{
                                                fontWeight: '900',
                                                fontSize: seg.label.length > 3 ? 16 : 24,
                                                color: '#FFF',
                                                textShadowColor: '#000', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3
                                            }}>
                                                {seg.label}
                                            </Text>
                                        </View>
                                    );
                                })}

                                {/* Central Hub */}
                                <View style={{
                                    position: 'absolute', top: 110, left: 110, width: 60, height: 60,
                                    borderRadius: 30, backgroundColor: '#FFF',
                                    borderWidth: 4, borderColor: '#EF4444',
                                    alignItems: 'center', justifyContent: 'center',
                                    elevation: 5, zIndex: 20
                                }}>
                                    <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#000' }} />
                                </View>

                                {/* Pegs */}
                                {SEGMENTS.map((_, i) => {
                                    const rotate = i * 72 + 36;
                                    const rad = (rotate - 90) * (Math.PI / 180);
                                    const r = 135;
                                    const x = 140 + r * Math.cos(rad);
                                    const y = 140 + r * Math.sin(rad);
                                    return (
                                        <View key={`peg-${i}`} style={{
                                            position: 'absolute', left: x - 6, top: y - 6, width: 12, height: 12,
                                            borderRadius: 6, backgroundColor: '#EEE',
                                            borderWidth: 1, borderColor: '#999',
                                            elevation: 2, zIndex: 20
                                        }} />
                                    );
                                })}
                            </View>
                        </Animated.View>
                        <View style={styles.pointer} />
                        {spinResult && !spinning && (
                            <View style={styles.resultBadge}>
                                <Text style={styles.resultText}>{spinResult.amount > 0 ? `+${spinResult.amount} Tokens` : "Try Again"}</Text>
                            </View>
                        )}
                        {spinsAvailable === 0 && !spinning && (
                            <View style={styles.lockOverlay}>
                                <Ionicons name="gift-outline" size={50} color="#FFF" />
                                <Text style={styles.lockText}>NO SPINS</Text>
                                <Text style={styles.lockSubText}>Claim daily or refer friends!</Text>
                            </View>
                        )}

                    </View>

                    {/* Spin Button */}
                    <TouchableOpacity
                        style={[styles.spinBtn, (spinning || spinsAvailable === 0) && styles.disabledBtn]}
                        onPress={handleSpin}
                        disabled={spinning || spinsAvailable === 0}
                    >
                        <Text style={styles.spinBtnText}>
                            {spinning ? "SPINNING..." : spinsAvailable === 0 ? "GET MORE SPINS" : "SPIN NOW"}
                        </Text>

                    </TouchableOpacity>

                    {/* History */}
                    <Text style={styles.historyHeader}>Spin History</Text>
                    <View style={styles.historyList}>
                        {history.length === 0 ? (
                            <Text style={styles.emptyText}>No spins used yet.</Text>
                        ) : (
                            history.map((item, index) => (
                                <View key={index} style={styles.historyItem}>
                                    <View>
                                        <Text style={styles.histTitle}>
                                            {item.amount > 0 ? 'Prize Won' : 'No Reward'}
                                        </Text>
                                        <Text style={styles.histDate}>
                                            {new Date(item.created_at).toLocaleDateString()}
                                        </Text>
                                    </View>
                                    <Text style={[
                                        styles.histAmount,
                                        { color: item.amount > 0 ? '#10B981' : '#94A3B8' }
                                    ]}>
                                        {item.amount > 0 ? `+${item.amount}` : '-'}
                                    </Text>
                                </View>
                            ))
                        )}
                    </View>

                </ScrollView>
            </SafeAreaView >
        </View >
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', backgroundColor: '#FFF' },
    backBtn: { marginRight: 16 },
    headerTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
    subtitle: { fontSize: 13, color: '#64748B', textAlign: 'center', marginBottom: 24, paddingHorizontal: 20 },

    statsCard: { flexDirection: 'row', justifyContent: 'center', marginBottom: 30 },
    statItem: { alignItems: 'center', backgroundColor: '#FFF', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
    statLabel: { fontSize: 10, fontWeight: '700', color: '#94A3B8', letterSpacing: 1, marginBottom: 4 },
    statValue: { fontSize: 24, fontWeight: '800', color: '#4F46E5' },

    wheelContainer: { alignItems: 'center', justifyContent: 'center', marginBottom: 30, height: 320 },
    wheelCircle: { width: 280, height: 280, borderRadius: 140, overflow: 'hidden', elevation: 10, shadowColor: '#4F46E5', shadowOpacity: 0.3, shadowRadius: 15 },
    wheelGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    wheelInner: { width: '100%', height: '100%', position: 'relative' },
    pointer: { position: 'absolute', top: 10, width: 0, height: 0, borderLeftWidth: 10, borderRightWidth: 10, borderTopWidth: 20, borderStyle: 'solid', backgroundColor: 'transparent', borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: '#0F172A' },

    resultBadge: { position: 'absolute', bottom: -10, backgroundColor: '#10B981', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
    resultText: { color: '#FFF', fontWeight: '800', fontSize: 14 },

    spinBtn: { backgroundColor: '#0F172A', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginHorizontal: 40, marginBottom: 40 },
    disabledBtn: { backgroundColor: '#94A3B8' },
    spinBtnText: { color: '#FFF', fontWeight: '800', fontSize: 16, letterSpacing: 1 },

    historyHeader: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 12 },
    historyList: { backgroundColor: '#FFF', borderRadius: 16, padding: 8 },
    historyItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    histTitle: { fontSize: 14, fontWeight: '600', color: '#334155' },
    histDate: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
    histAmount: { fontSize: 16, fontWeight: '800' },
    emptyText: { textAlign: 'center', padding: 20, color: '#94A3B8', fontStyle: 'italic' },

    lockOverlay: {
        position: 'absolute', top: 20, left: '50%', marginLeft: -140, // Center over wheel
        width: 280, height: 280, borderRadius: 140,
        backgroundColor: 'rgba(15, 23, 42, 0.8)', // Dark overlay
        alignItems: 'center', justifyContent: 'center',
        zIndex: 50, elevation: 20
    },
    lockText: { color: '#FFF', fontSize: 24, fontWeight: '900', letterSpacing: 2, marginTop: 10 },
    lockSubText: { color: '#CBD5E1', fontSize: 14, fontWeight: '600', marginTop: 5 }
});
