import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import LinearGradient from 'react-native-linear-gradient';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Clipboard,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { API_BASE_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';

const COINS_PER_USD = 500;

export default function WithdrawalScreen() {
    const { wallet, requestWithdrawal, refreshUserData } = useAuth();
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState([]);

    // Withdrawal Form State
    const [amountUSD, setAmountUSD] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('paypal'); // 'paypal' or 'upi'
    const [paymentAddress, setPaymentAddress] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);
    const [secretCode, setSecretCode] = useState('');

    const loadHistory = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const res = await axios.get(`${API_BASE_URL}/coins/history`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                // Filter to show ONLY real cash withdrawals (exclude gifts and earnings)
                const onlyWithdrawals = (res.data.history || []).filter(item =>
                    item.type === 'withdrawal' &&
                    parseFloat(item.amount_usd) >= 1.00 &&
                    item.payment_method !== 'gift_sent' &&
                    item.status === 'paid'
                );
                setHistory(onlyWithdrawals);
            }
        } catch (e) {
            console.log("History Load Error", e);
        }
    };

    useFocusEffect(
        useCallback(() => {
            refreshUserData();
            loadHistory();
        }, [])
    );

    const balanceCoins = wallet?.coins?.balance || 0;

    // Derived State
    const maxUSD = balanceCoins / COINS_PER_USD;

    const handleWithdraw = async () => {
        // GIFT LOGIC
        if (paymentMethod === 'gift') {
            const coinsToGift = parseInt(amountUSD);

            if (!coinsToGift || isNaN(coinsToGift) || coinsToGift <= 0) {
                Alert.alert("Invalid Amount", "Please enter a valid coin amount.");
                return;
            }

            if (coinsToGift > balanceCoins) {
                Alert.alert("Insufficient Funds", `You only have ${balanceCoins} coins.`);
                return;
            }

            if (!paymentAddress.includes('@')) {
                Alert.alert("Invalid Email", "Please enter a valid email address.");
                return;
            }

            Alert.alert(
                "Confirm Gift",
                `Send ${coinsToGift} Coins to ${paymentAddress}?`,
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Send", onPress: () => processGift(coinsToGift) }
                ]
            );
            return;
        }

        // WITHDRAWAL LOGIC
        const reqUSD = parseFloat(amountUSD);

        if (!reqUSD || isNaN(reqUSD)) {
            Alert.alert("Invalid Amount", "Please enter a valid dollar amount.");
            return;
        }

        if (reqUSD < 1.00) {
            Alert.alert("Minimum Amount", "Minimum withdrawal is $1.00.");
            return;
        }

        const reqCoins = Math.ceil(reqUSD * COINS_PER_USD);

        if (reqCoins > balanceCoins) {
            Alert.alert("Insufficient Funds", `You need ${reqCoins} coins ($${reqUSD.toFixed(2)}) but only have ${balanceCoins}.`);
            return;
        }

        if (!paymentAddress.trim()) {
            Alert.alert("Missing Details", "Please enter your payment details.");
            return;
        }

        if (paymentMethod === 'paypal' && !paymentAddress.includes('@')) {
            Alert.alert("Invalid Email", "Please enter a valid PayPal email address.");
            return;
        }
        if (paymentMethod === 'upi' && !paymentAddress.includes('@')) {
            Alert.alert("Invalid UPI ID", "Please enter a valid UPI ID (e.g. user@bank).");
            return;
        }

        // Confirm
        Alert.alert(
            "Confirm Cashout",
            `Withdraw $${reqUSD.toFixed(2)} to ${paymentMethod.toUpperCase()}?\n\nAddress: ${paymentAddress}\nCost: ${reqCoins} Coins`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Confirm",
                    onPress: () => processWithdrawal(reqUSD)
                }
            ]
        );
    };

    const processGift = async (coins) => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            const res = await axios.post(`${API_BASE_URL}/coins/gift`, {
                recipientEmail: paymentAddress,
                amountCoins: coins
            }, { headers: { Authorization: `Bearer ${token}` } });

            if (res.data.success) {
                Alert.alert("Success", "Gift sent successfully!");
                setAmountUSD('');
                setPaymentAddress('');
                refreshUserData();
                loadHistory();
            }
        } catch (error) {
            Alert.alert("Error", error.response?.data?.message || "Gift failed.");
        } finally {
            setLoading(false);
        }
    };

    const processWithdrawal = async (dollarAmount) => {
        setLoading(true);
        const result = await requestWithdrawal(dollarAmount, paymentAddress, paymentMethod);
        setLoading(false);

        if (result.success) {
            setSecretCode(result.secretCode);
            setShowSuccess(true);
            setAmountUSD('');
            setPaymentAddress('');
            loadHistory(); // Refresh history
        } else {
            Alert.alert("Error", result.message || "Withdrawal failed.");
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Withdraw Funds</Text>
            </View>

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >

                {/* Balance Card (USD Emphasis) */}
                <LinearGradient colors={['#003087', '#0070BA']} style={styles.balanceCard}>
                    <Text style={styles.balanceLabel}>Available Balance</Text>
                    <Text style={styles.balanceValue}>${maxUSD.toFixed(2)}</Text>
                    <View style={styles.approxRow}>
                        <Text style={styles.approxText}>{balanceCoins} Coins</Text>
                    </View>
                </LinearGradient>

                <View style={styles.helperRow}>
                    <View style={styles.rateBadge}>
                        <Ionicons name="swap-horizontal" size={20} color="#059669" />
                        <Text style={styles.rateText}>500 Coins = $1 USD</Text>
                    </View>
                </View>

                {/* Method Selector */}
                <View style={styles.selectorContainer}>
                    <TouchableOpacity
                        style={[styles.selectorBtn, paymentMethod === 'paypal' && styles.activeBtn]}
                        onPress={() => setPaymentMethod('paypal')}
                    >
                        <Ionicons name="logo-paypal" size={20} color={paymentMethod === 'paypal' ? '#FFF' : '#003087'} />
                        <Text style={[styles.selectorText, paymentMethod === 'paypal' && styles.activeText]}>PayPal</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.selectorBtn, paymentMethod === 'upi' && styles.activeBtn]}
                        onPress={() => setPaymentMethod('upi')}
                    >
                        <Ionicons name="at-circle" size={20} color={paymentMethod === 'upi' ? '#FFF' : '#003087'} />
                        <Text style={[styles.selectorText, paymentMethod === 'upi' && styles.activeText]}>UPI</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.selectorBtn, paymentMethod === 'gift' && styles.activeBtn]}
                        onPress={() => { setPaymentMethod('gift'); setAmountUSD(''); }}
                    >
                        <Ionicons name="gift" size={20} color={paymentMethod === 'gift' ? '#FFF' : '#003087'} />
                        <Text style={[styles.selectorText, paymentMethod === 'gift' && styles.activeText]}>Gift</Text>
                    </TouchableOpacity>
                </View>

                {/* Form */}
                <View style={styles.formContainer}>
                    <Text style={styles.sectionTitle}>
                        {paymentMethod === 'paypal' ? 'PayPal Details' :
                            paymentMethod === 'upi' ? 'UPI Details' : 'Gift to Friend'}
                    </Text>

                    <View style={styles.inputBox}>
                        <Text style={styles.inputLabel}>
                            {paymentMethod === 'paypal' ? 'PayPal Email Address' :
                                paymentMethod === 'upi' ? 'UPI ID (e.g. user@bank)' : "Friend's Email Address"}
                        </Text>
                        <TextInput
                            style={styles.input}
                            placeholder={paymentMethod === 'paypal' ? "your-email@example.com" : "friend@example.com"}
                            value={paymentAddress}
                            onChangeText={setPaymentAddress}
                            autoCapitalize="none"
                            keyboardType={paymentMethod === 'upi' ? "default" : "email-address"}
                        />
                    </View>

                    <View style={styles.inputBox}>
                        <Text style={styles.inputLabel}>
                            {paymentMethod === 'gift' ? 'Amount (Coins)' : 'Withdraw Amount (USD)'}
                        </Text>
                        <View style={styles.amountInputRow}>
                            {paymentMethod !== 'gift' && <Text style={styles.currencySymbol}>$</Text>}
                            <TextInput
                                style={[styles.input, { flex: 1, paddingLeft: 5 }]}
                                placeholder={paymentMethod === 'gift' ? "100" : "1.00"}
                                keyboardType="numeric"
                                value={amountUSD}
                                onChangeText={setAmountUSD}
                            />
                            <TouchableOpacity onPress={() => setAmountUSD(paymentMethod === 'gift' ? balanceCoins.toString() : Math.floor(maxUSD).toString())}>
                                <Text style={styles.maxLink}>MAX</Text>
                            </TouchableOpacity>
                        </View>
                        {paymentMethod !== 'gift' && (
                            <Text style={styles.conversionHint}>
                                Min: $1.00 • Cost: {amountUSD ? Math.ceil(parseFloat(amountUSD || 0) * COINS_PER_USD) : 0} Coins
                            </Text>
                        )}
                    </View>

                    <TouchableOpacity
                        style={styles.withdrawBtn}
                        onPress={handleWithdraw}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <Text style={styles.withdrawBtnText}>
                                {paymentMethod === 'gift' ? 'Send Gift' : `Withdraw $${amountUSD || '0.00'}`}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Info Footer */}
                <View style={styles.infoBox}>
                    <Ionicons name="shield-checkmark" size={20} color="#64748B" />
                    <Text style={styles.infoText}>
                        Payments are processed within 24-48 hours. Ensure your PayPal/UPI details are correct.
                    </Text>
                </View>

                {/* History Section */}
                <View style={styles.historySection}>
                    <Text style={[styles.sectionTitle, { marginBottom: 15 }]}>Recent Withdrawals</Text>

                    {history.length > 0 ? (
                        <View style={styles.historyList}>
                            {history.map((tx, idx) => (
                                <View key={idx} style={styles.historyItem}>
                                    <View style={styles.histIconBox}>
                                        <Ionicons
                                            name={tx.payment_method === 'paypal' ? "logo-paypal" : "at-circle"}
                                            size={20}
                                            color="#003087"
                                        />
                                    </View>
                                    <View style={styles.histContent}>
                                        <Text style={styles.histTitle}>
                                            {(tx.payment_method || 'Withdrawal').toUpperCase()}
                                        </Text>
                                        <Text style={styles.histDate}>{new Date(tx.created_at).toLocaleDateString()}</Text>
                                    </View>
                                    <View style={styles.histRight}>
                                        <Text style={styles.histAmount}>
                                            ${parseFloat(tx.amount_usd || 0).toFixed(2)}
                                        </Text>
                                        <Text style={[styles.statusTag, tx.status === 'paid' ? styles.statusPaid : styles.statusPending]}>
                                            {tx.status.toUpperCase()}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    ) : (
                        <View style={styles.emptyActivity}>
                            <Ionicons name="receipt-outline" size={40} color="#CBD5E1" />
                            <Text style={styles.emptyText}>No withdrawals yet.</Text>
                        </View>
                    )}
                </View>

            </ScrollView>

            {/* Success Modal */}
            <Modal
                visible={showSuccess}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowSuccess(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.successModal}>
                        <LinearGradient colors={['#10B981', '#059669']} style={styles.modalHeader}>
                            <Ionicons name="checkmark-circle" size={80} color="#FFF" />
                        </LinearGradient>

                        <View style={styles.modalBody}>
                            <Text style={styles.successTitle}>Request Submitted!</Text>
                            <Text style={styles.successDesc}>
                                Admin will contact you on the WhatsApp number provided during login.
                            </Text>

                            <View style={styles.codeContainer}>
                                <Text style={styles.codeLabel}>YOUR SECRET CODE</Text>
                                <View style={styles.codeBox}>
                                    <Text style={styles.codeText}>{secretCode}</Text>
                                    <TouchableOpacity
                                        onPress={() => {
                                            Clipboard.setString(secretCode);
                                            Alert.alert("Copied", "Code copied to clipboard!");
                                        }}
                                        style={styles.copyBtn}
                                    >
                                        <Ionicons name="copy-outline" size={20} color="#003087" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <Text style={styles.instructionText}>
                                Share this secret code with the admin to get approval and receive your payment.
                            </Text>

                            <TouchableOpacity
                                style={styles.closeBtn}
                                onPress={() => setShowSuccess(false)}
                            >
                                <Text style={styles.closeBtnText}>Done</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
    },
    balanceCard: {
        borderRadius: 20,
        padding: 25,
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#003087',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 10,
    },
    balanceLabel: {
        color: '#E0E7FF',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 5,
    },
    balanceValue: {
        color: '#FFF',
        fontSize: 42,
        fontWeight: '800',
    },
    approxRow: {
        marginTop: 10,
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    approxText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 14,
    },
    selectorContainer: {
        flexDirection: 'row',
        marginBottom: 20,
        backgroundColor: '#FFF',
        padding: 5,
        borderRadius: 16,
        gap: 10,
    },
    selectorBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    activeBtn: {
        backgroundColor: '#003087',
    },
    selectorText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#64748B',
    },
    activeText: {
        color: '#FFF',
    },
    helperRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 25,
    },
    rateBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#DCFCE7',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
        gap: 8,
    },
    rateText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#059669',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#334155',
        marginBottom: 15,
    },
    formContainer: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    inputBox: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748B',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        padding: 15,
        fontSize: 18,
        color: '#1E293B',
        fontWeight: '600',
    },
    amountInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        paddingHorizontal: 15,
    },
    currencySymbol: {
        fontSize: 18,
        color: '#1E293B',
        fontWeight: '700',
        marginRight: 5,
    },
    maxLink: {
        color: '#0070BA',
        fontWeight: '800',
        paddingHorizontal: 15,
    },
    conversionHint: {
        fontSize: 12,
        color: '#94A3B8',
        marginTop: 5,
        textAlign: 'right',
    },
    withdrawBtn: {
        backgroundColor: '#003087',
        borderRadius: 16,
        paddingVertical: 18,
        alignItems: 'center',
        marginTop: 10,
    },
    withdrawBtnText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 16,
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        padding: 15,
        marginTop: 20,
        alignItems: 'flex-start',
        gap: 10,
    },
    infoText: {
        flex: 1,
        fontSize: 12,
        color: '#64748B',
        lineHeight: 18,
    },
    // Gift Card Styles
    giftCard: {
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 20,
        marginTop: 20,
        borderWidth: 1,
        borderColor: '#FCE7F3',
        shadowColor: '#EC4899',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    giftHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    giftTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1E293B',
    },
    giftSub: {
        fontSize: 12,
        color: '#64748B',
    },
    giftForm: {
        width: '100%',
    },
    giftInput: {
        backgroundColor: '#FDF2F8',
        borderRadius: 12,
        padding: 12,
        fontSize: 14,
        color: '#1E293B',
        fontWeight: '600',
        borderWidth: 1,
        borderColor: '#FBCFE8',
    },
    giftBtn: {
        backgroundColor: '#EC4899',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 15,
    },
    giftBtnText: {
        color: '#FFF',
        fontWeight: '800',
        fontSize: 14,
        letterSpacing: 1,
    },
    giftBalanceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FDF2F8',
        padding: 12,
        borderRadius: 12,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#FBCFE8',
    },
    giftBalanceLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#DB2777',
    },
    giftBalanceValue: {
        fontSize: 15,
        fontWeight: '800',
        color: '#BE185D',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    successModal: {
        width: '100%',
        backgroundColor: '#FFF',
        borderRadius: 24,
        overflow: 'hidden',
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
    },
    modalHeader: {
        height: 150,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalBody: {
        padding: 25,
        alignItems: 'center',
    },
    successTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1E293B',
        marginBottom: 10,
    },
    successDesc: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 20,
    },
    codeContainer: {
        width: '100%',
        backgroundColor: '#F8FAFC',
        padding: 15,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 20,
    },
    codeLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#94A3B8',
        textAlign: 'center',
        marginBottom: 8,
        letterSpacing: 1,
    },
    codeBox: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
    },
    codeText: {
        fontSize: 28,
        fontWeight: '900',
        color: '#003087',
        letterSpacing: 2,
    },
    copyBtn: {
        padding: 5,
    },
    instructionText: {
        fontSize: 13,
        color: '#003087',
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 25,
    },
    closeBtn: {
        width: '100%',
        backgroundColor: '#003087',
        paddingVertical: 15,
        borderRadius: 14,
        alignItems: 'center',
    },
    closeBtnText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 16,
    },
    // History Section
    historySection: {
        marginTop: 30,
        paddingBottom: 40,
    },
    historyToggleRow: {
        flexDirection: 'row',
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        padding: 4,
        marginBottom: 15,
    },
    toggleBtn: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 10,
    },
    toggleActive: {
        backgroundColor: '#FFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    toggleText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#64748B',
    },
    toggleActiveText: {
        color: '#1E293B',
    },
    historyList: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 5,
        marginTop: 10,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    histIconBox: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    histContent: {
        flex: 1,
    },
    histTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1E293B',
    },
    histDate: {
        fontSize: 11,
        color: '#94A3B8',
        marginTop: 2,
    },
    histRight: {
        alignItems: 'flex-end',
    },
    histAmount: {
        fontSize: 14,
        fontWeight: '800',
        color: '#1E293B',
    },
    statusTag: {
        fontSize: 9,
        fontWeight: '800',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginTop: 4,
        overflow: 'hidden',
    },
    statusPending: {
        backgroundColor: '#FEF3C7',
        color: '#D97706',
    },
    statusPaid: {
        backgroundColor: '#DCFCE7',
        color: '#059669',
    },
    emptyActivity: {
        backgroundColor: '#FFF',
        padding: 30,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 10,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: '#CBD5E1',
    },
});
