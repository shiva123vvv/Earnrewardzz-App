import Ionicons from 'react-native-vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../context/AuthContext';

const EarnScreen = () => {
    const { wallet, earnCoin, refreshUserData } = useAuth();
    // --- STATE ---
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // REAL DATA FROM BACKEND
    const todayEarned = wallet?.coins?.todayEarnedCoins || 0;
    const lifetimeEarned = wallet?.coins?.lifetime || 0;

    // Ad State
    const [isAdShowing, setIsAdShowing] = useState(false);
    const [maxAds, setMaxAds] = useState(20);
    const adsWatched = wallet?.coins?.adsWatchedToday || 0;
    const limitReached = adsWatched >= maxAds;

    // --- INITIALIZATION ---
    useEffect(() => {
        unityAdsService.initialize();
        loadData();
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const loadData = async () => {
        setLoading(true);
        try {
            await refreshUserData();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    // --- WATCH AD LOGIC ---
    const handleWatchAd = async () => {
        if (limitReached) {
            Alert.alert("Limit Reached", "You have reached the daily earning limit. Please come back tomorrow.");
            return;
        }

        if (isAdShowing) return;

        setIsAdShowing(true);

        try {
            // 1. Ready Check
            const isReady = unityAdsService.isReady();
            if (!isReady) {
                Alert.alert(
                    "Ad Not Ready",
                    "The ad is still loading. Please try again in a few seconds."
                );
                setIsAdShowing(false);
                return;
            }

            // 2. Show Ad & Wait for STRICT Result
            const result = await unityAdsService.showRewardedAd();

            // 3. Strict Reward Check
            if (result === 'COMPLETED') {
                await handleAdSuccess();
            } else if (result === 'SKIPPED') {
                Alert.alert("Ad Skipped", "You must watch the entire video to earn coins.");
            } else {
                Alert.alert("Ad Failed", "Video failed to play or closed unexpectedly. No reward.");
            }

        } catch (error) {
            console.error("Ad Watch Error:", error);
            Alert.alert("Error", "Something went wrong providing the ad.");
        } finally {
            setIsAdShowing(false);
        }
    };

    const handleAdSuccess = async () => {
        // Updated to use earnCoin from AuthContext (Separated Economy)
        const success = await earnCoin('Ad Reward');

        if (success) {
            Alert.alert("Success!", "You earned 1 Coin!");
            await refreshUserData();
        } else {
            Alert.alert("Notice", "Could not claim reward on server.");
        }
    };

    // --- RENDERERS ---

    const renderHeader = () => (
        <View style={styles.headerContainer}>
            <Text style={styles.headerTitle}>Earn Coins</Text>

            <View style={styles.statsContainer}>
                {/* Today Won Card */}
                <View style={[styles.statCard, styles.statCardLeft]}>
                    <View style={styles.iconCircleToday}>
                        <Ionicons name="sunny" size={20} color="#F59E0B" />
                    </View>
                    <Text style={styles.statLabel}>Today Earned</Text>
                    <Text style={styles.statValue}>${(todayEarned / 500).toFixed(2) || '0.00'}</Text>
                    <Text style={styles.statSubValue}>({todayEarned} Coins)</Text>
                </View>

                {/* Ads Count Card */}
                <View style={[styles.statCard, styles.statCardRight]}>
                    <View style={styles.iconCircleLife}>
                        <Ionicons name="play-circle" size={20} color="#8B5CF6" />
                    </View>
                    <Text style={styles.statLabel}>Daily Videos</Text>
                    <Text style={styles.statValue}>{adsWatched}/{maxAds}</Text>
                    <Text style={styles.statSubValue}>Limit 20 Ads</Text>
                </View>
            </View>
        </View>
    );

    const renderTaskCard = () => (
        <View style={styles.taskCard}>
            <LinearGradient
                colors={['#4F46E5', '#6366F1']}
                style={styles.taskIcon}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <Ionicons name="play" size={24} color="#FFF" />
            </LinearGradient>

            <View style={styles.taskInfo}>
                <Text style={styles.taskTitle}>Watch Video Ad</Text>
                <Text style={styles.taskDesc}>
                    Get 1 Coin per video • <Text style={styles.limitTextSmall}>{adsWatched}/{maxAds}</Text>
                </Text>
            </View>

            <TouchableOpacity
                style={[
                    styles.actionButton,
                    (limitReached || isAdShowing) && styles.actionButtonDisabled
                ]}
                onPress={handleWatchAd}
                disabled={limitReached || isAdShowing}
                activeOpacity={0.8}
            >
                {isAdShowing ? (
                    <ActivityIndicator color="#FFF" size="small" />
                ) : (
                    <Text style={styles.actionButtonText}>
                        {limitReached ? 'Limit Reached' : 'Watch Ad'}
                    </Text>
                )}
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* 1. Fixed Top Section */}
            {renderHeader()}

            {/* 2. Scrollable Tasks Section */}
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#6366F1" />
                }
            >
                <Text style={styles.sectionTitle}>Available Tasks</Text>

                {renderTaskCard()}

                {/* Limit Message */}
                {limitReached && (
                    <View style={styles.limitBox}>
                        <Ionicons name="information-circle" size={20} color="#EF4444" />
                        <Text style={styles.limitText}>
                            Daily earning limit reached. Come back tomorrow.
                        </Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    headerContainer: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
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
        textAlign: 'center',
        marginBottom: 20,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 15,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 3,
        elevation: 2,
    },
    statCardLeft: {
        backgroundColor: '#FFFBEB',
        borderColor: '#FDE68A',
    },
    statCardRight: {
        backgroundColor: '#F5F3FF',
        borderColor: '#DDD6FE',
    },
    iconCircleToday: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FEF3C7',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    iconCircleLife: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#EDE9FE',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B7280',
        marginBottom: 4,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '900',
        color: '#111827',
    },
    statSubValue: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B7280',
        marginTop: 2,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 80,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#374151',
        marginBottom: 15,
        marginLeft: 4,
    },
    taskCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    taskIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    taskInfo: {
        flex: 1,
        marginRight: 10,
    },
    taskTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 4,
    },
    taskDesc: {
        fontSize: 13,
        color: '#6B7280',
    },
    actionButton: {
        backgroundColor: '#4F46E5',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
        minWidth: 90,
        alignItems: 'center',
    },
    actionButtonDisabled: {
        backgroundColor: '#9CA3AF',
    },
    actionButtonText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700',
    },
    limitBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FECACA',
        borderRadius: 12,
        padding: 16,
        marginTop: 20,
    },
    limitText: {
        flex: 1,
        color: '#B91C1C',
        fontSize: 14,
        marginLeft: 10,
        fontWeight: '500',
    },
    limitTextSmall: {
        color: '#6366F1',
        fontWeight: '700',
    },
});

export default EarnScreen;
