import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function OTPScreen({ route, navigation }) {
    const { email, flow, phoneNumber, referralCode } = route.params;
    const { loginWithOTP, requestOTP } = useAuth();
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [timer, setTimer] = useState(60);
    const [resending, setResending] = useState(false);

    useEffect(() => {
        let interval;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const handleVerify = async () => {
        if (otp.length !== 6) {
            return Alert.alert('Error', 'Please enter the 6-digit code sent to your email.');
        }

        setLoading(true);
        try {
            // Pass referralCode to login (if exists)
            const success = await loginWithOTP(email, otp, referralCode);
            if (!success) {
                Alert.alert('Verification Failed', 'The code you entered is invalid or has expired.');
            }
        } catch (err) {
            console.error(err);
            Alert.alert('Verification Failed', err.message || 'There was an error verifying your code.');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (timer > 0) return;

        setResending(true);
        try {
            const success = await requestOTP(email, phoneNumber || null, flow === 'signup');
            if (success) {
                Alert.alert('OTP Resent', 'A new verification code has been sent to your email.');
                setTimer(60);
            }
        } catch (err) {
            Alert.alert('Error', err.message || 'Failed to resend OTP.');
        } finally {
            setResending(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
        >
            <View style={styles.card}>
                <View style={styles.iconContainer}>
                    <Text style={styles.icon}>✉️</Text>
                </View>
                <Text style={styles.title}>Confirm Email</Text>
                <Text style={styles.subtitle}>
                    Enter the 6-digit code we sent to:{"\n"}
                    <Text style={styles.emailText}>{email}</Text>
                </Text>

                <TextInput
                    style={styles.input}
                    placeholder="000000"
                    keyboardType="number-pad"
                    maxLength={6}
                    value={otp}
                    onChangeText={setOtp}
                />

                <TouchableOpacity
                    style={[styles.button, (loading || resending) && styles.buttonDisabled]}
                    onPress={handleVerify}
                    disabled={loading || resending}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>
                            {flow === 'signup' ? 'Complete Registration' : 'Verify & Login'}
                        </Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.resendButton, timer > 0 && styles.resendDisabled]}
                    onPress={handleResend}
                    disabled={timer > 0 || resending}
                >
                    {resending ? (
                        <ActivityIndicator size="small" color="#5856D6" />
                    ) : (
                        <Text style={[styles.resendText, timer > 0 && styles.resendTextDisabled]}>
                            {timer > 0 ? `Resend Code in ${timer}s` : "Didn't get a code? Resend"}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F2F2F7', justifyContent: 'center', padding: 20 },
    card: { backgroundColor: '#fff', borderRadius: 24, padding: 32, alignItems: 'center', boxShadow: '0px 10px 20px rgba(0,0,0,0.1)', elevation: 10 },
    iconContainer: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#F2F2F7', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    icon: { fontSize: 32 },
    title: { fontSize: 24, fontWeight: '800', color: '#1C1C1E', marginBottom: 12 },
    subtitle: { fontSize: 15, color: '#8E8E93', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
    emailText: { color: '#1C1C1E', fontWeight: '700' },
    input: { backgroundColor: '#F2F2F7', width: '100%', paddingVertical: 18, borderRadius: 16, fontSize: 32, fontWeight: 'bold', textAlign: 'center', marginBottom: 32, letterSpacing: 8, color: '#007AFF' },
    button: { backgroundColor: '#5856D6', width: '100%', padding: 20, borderRadius: 18, alignItems: 'center', boxShadow: '0px 4px 8px rgba(88, 86, 214, 0.3)', elevation: 3 },
    buttonDisabled: { opacity: 0.7 },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
    resendButton: { marginTop: 24, padding: 10 },
    resendDisabled: { opacity: 0.5 },
    resendText: { color: '#5856D6', fontSize: 15, fontWeight: '600' },
    resendTextDisabled: { color: '#8E8E93' }
});
