import LinearGradient from 'react-native-linear-gradient';
import React from 'react';
import {
    Dimensions,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import AppLogo from '../components/AppLogo';

const { width } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }) {
    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#F8FAFC', '#F1F5F9']}
                style={styles.gradient}
            >
                <SafeAreaView style={styles.safeArea}>
                    <View style={styles.content}>
                        <View style={styles.logoContainer}>
                            <AppLogo size={120} fontSize={32} />
                        </View>

                        <View style={styles.heroSpacer} />

                        <Text style={styles.title}>Turn Your Time{"\n"}Into Earnings</Text>
                        <Text style={styles.subtitle}>
                            Watch ads, complete tasks, and withdraw real cash directly to your account.
                        </Text>

                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={styles.primaryButton}
                                onPress={() => navigation.navigate('Signup')}
                            >
                                <Text style={styles.primaryButtonText}>Get Started</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.secondaryButton}
                                onPress={() => navigation.navigate('Login')}
                            >
                                <Text style={styles.secondaryButtonText}>I already have an account</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Secure • Verified • Trusted</Text>
                    </View>
                </SafeAreaView>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    gradient: { flex: 1 },
    safeArea: { flex: 1 },
    content: { flex: 1, padding: 30, justifyContent: 'center', alignItems: 'center' },
    logoContainer: { alignItems: 'center', marginBottom: 20 },
    logoIcon: { fontSize: 60, marginBottom: 10 },
    logoText: { fontSize: 24, fontWeight: '900', color: '#fff', letterSpacing: 1 },
    heroSpacer: { height: 40 },
    title: { fontSize: 36, fontWeight: '900', color: '#0F172A', textAlign: 'center', lineHeight: 44, marginBottom: 20 },
    subtitle: { fontSize: 17, color: '#64748B', textAlign: 'center', lineHeight: 26, marginBottom: 40, paddingHorizontal: 20 },
    buttonContainer: { width: '100%', gap: 15 },
    primaryButton: { backgroundColor: '#F59E0B', padding: 20, borderRadius: 20, alignItems: 'center', shadowColor: '#D97706', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
    primaryButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    secondaryButton: { padding: 10, alignItems: 'center' },
    secondaryButtonText: { color: '#64748B', fontSize: 16, fontWeight: '600', textDecorationLine: 'underline' },
    footer: { paddingBottom: 20, alignItems: 'center' },
    footerText: { color: '#94A3B8', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 2 }
});
