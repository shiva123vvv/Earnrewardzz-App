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

export default function LoginScreen({ navigation }) {
    const { requestOTP } = useAuth();
    const [email, setEmail] = useState('');
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

    const handleLogin = async () => {
        if (!email.trim()) {
            return Alert.alert('Error', 'Please enter your email.');
        }

        if (timer > 0) return;

        setLoading(true);
        try {
            const success = await requestOTP(email.trim().toLowerCase(), null, false);
            if (success) {
                startTimer();
                Alert.alert('Success', "Verification code sent to your email.");
                navigation.navigate('OTP', { email: email.trim().toLowerCase(), flow: 'login' });
            }
        } catch (err) {
            Alert.alert('Login Error', err.message);
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
                    <Text style={styles.title}>Welcome Back</Text>
                    <Text style={styles.subtitle}>Log in to access your rewards.</Text>

                    <Text style={styles.label}>Registered Email</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="example@mail.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={email}
                        onChangeText={setEmail}
                    />

                    <TouchableOpacity
                        style={[styles.button, (loading || timer > 0) && styles.buttonDisabled]}
                        onPress={handleLogin}
                        disabled={loading || timer > 0}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>
                                {timer > 0 ? `Resend in ${timer}s` : 'Login with OTP'}
                            </Text>
                        )}
                    </TouchableOpacity>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>New here? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                            <Text style={styles.linkText}>Create Account</Text>
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
    subtitle: { fontSize: 15, color: '#8E8E93', marginBottom: 32, textAlign: 'center' },
    label: { fontSize: 14, fontWeight: '600', color: '#3A3A3C', marginBottom: 8, marginLeft: 4 },
    input: { backgroundColor: '#F2F2F7', padding: 16, borderRadius: 12, fontSize: 16, marginBottom: 20 },
    button: { backgroundColor: '#34C759', padding: 18, borderRadius: 14, alignItems: 'center', marginTop: 10, boxShadow: '0px 4px 8px rgba(52, 199, 89, 0.3)', elevation: 3 },
    buttonDisabled: { opacity: 0.7 },
    buttonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
    footerText: { color: '#8E8E93', fontSize: 15 },
    linkText: { color: '#34C759', fontSize: 15, fontWeight: '700' }
});
