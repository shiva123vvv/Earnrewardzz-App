import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import AppLogo from '../components/AppLogo';
import { useAuth } from '../context/AuthContext';

export default function SignupScreen({ navigation }) {
    const { requestOTP } = useAuth();
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [referralCode, setReferralCode] = useState(''); // Added Referral Code
    const [loading, setLoading] = useState(false);
    const [timer, setTimer] = useState(0);
    const timerRef = React.useRef(null);

    React.useEffect(() => {
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, []);

    const startTimer = () => {
        setTimer(60);
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setTimer((prev) => {
                if (prev <= 1) {
                    if (timerRef.current) clearInterval(timerRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleSignup = async () => {
        if (!email.trim() || !phoneNumber.trim()) {
            return Alert.alert('Required Fields', 'Please enter your email and phone.');
        }

        if (timer > 0) return;

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            return Alert.alert('Invalid Email', 'Please enter a valid email.');
        }

        setLoading(true);
        try {
            const success = await requestOTP(
                email.trim().toLowerCase(),
                phoneNumber.trim(),
                true
            );

            if (success) {
                startTimer();
                Alert.alert('OTP Sent', "Check your email for the 6-digit code.");
                navigation.navigate('OTP', {
                    email: email.trim().toLowerCase(),
                    phoneNumber: phoneNumber.trim(),
                    flow: 'signup',
                    referralCode: referralCode.trim() // Pass to OTP Screen
                });
            }
        } catch (err) {
            Alert.alert('Error', err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.card}>
                    <View style={{ marginBottom: 20 }}>
                        <AppLogo size={80} fontSize={24} />
                    </View>
                    <Text style={styles.title}>Create Account</Text>
                    <Text style={styles.subtitle}>Join EarnRewardzz and start earning!</Text>

                    <View style={styles.infoBox}>
                        <Text style={styles.infoText}>
                            ⚠️ Phone number will be <Text style={{ fontWeight: 'bold' }}>locked</Text> for withdrawals.
                        </Text>
                    </View>

                    <Text style={styles.label}>Email Address</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="example@mail.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={email}
                        onChangeText={setEmail}
                    />

                    <Text style={styles.label}>Phone Number</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="+91 00000 00000"
                        keyboardType="phone-pad"
                        value={phoneNumber}
                        onChangeText={setPhoneNumber}
                    />

                    <Text style={styles.label}>Referral Code (Optional)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter code (e.g. JOHN123)"
                        autoCapitalize="characters"
                        value={referralCode}
                        onChangeText={setReferralCode}
                    />

                    <TouchableOpacity
                        style={[styles.button, (loading || timer > 0) && styles.buttonDisabled]}
                        onPress={handleSignup}
                        disabled={loading || timer > 0}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>
                                {timer > 0 ? `Resend in ${timer}s` : 'Get OTP Code'}
                            </Text>
                        )}
                    </TouchableOpacity>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Have an account? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                            <Text style={styles.linkText}>Login</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F2F2F7' },
    scrollContainer: { flexGrow: 1, justifyContent: 'center', padding: 20 },
    card: { backgroundColor: '#fff', borderRadius: 20, padding: 24, boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)', elevation: 5 },
    title: { fontSize: 28, fontWeight: '800', color: '#1C1C1E', marginBottom: 8, textAlign: 'center' },
    subtitle: { fontSize: 15, color: '#8E8E93', marginBottom: 24, textAlign: 'center' },
    infoBox: { backgroundColor: '#FFF9E6', padding: 12, borderRadius: 10, marginBottom: 24, borderLeftWidth: 4, borderLeftColor: '#FFCC00' },
    infoText: { fontSize: 13, color: '#7A5E00', lineHeight: 18 },
    label: { fontSize: 14, fontWeight: '600', color: '#3A3A3C', marginBottom: 8, marginLeft: 4 },
    input: { backgroundColor: '#F2F2F7', padding: 16, borderRadius: 12, fontSize: 16, marginBottom: 20 },
    button: { backgroundColor: '#007AFF', padding: 18, borderRadius: 14, alignItems: 'center', marginTop: 10, boxShadow: '0px 4px 8px rgba(0, 122, 255, 0.3)', elevation: 3 },
    buttonDisabled: { opacity: 0.7 },
    buttonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
    footerText: { color: '#8E8E93', fontSize: 15 },
    linkText: { color: '#007AFF', fontSize: 15, fontWeight: '700' }
});
