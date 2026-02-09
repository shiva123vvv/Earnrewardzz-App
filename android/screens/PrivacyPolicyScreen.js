import Ionicons from 'react-native-vector-icons/Ionicons';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const PrivacyPolicyScreen = ({ navigation }) => {

    const PolicySection = ({ title, content }) => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <Text style={styles.sectionContent}>{content}</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Privacy Policy</Text>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.introSection}>
                    <Text style={styles.lastUpdated}>Last Updated: February 6, 2026</Text>
                    <Text style={styles.introText}>
                        At EarnRewardzz, we take your privacy seriously. This Privacy Policy explains how we collect, use, and protect your information when you use our mobile application.
                    </Text>
                </View>

                <PolicySection
                    title="1. Information We Collect"
                    content="We collect minimal information required to provide our reward services, including:
• Email Address: For authentication and account recovery.
• Device Information: Device ID and IP address for fraud prevention.
• Participation Data: Recorded ad views, completed surveys, and reward history."
                />

                <PolicySection
                    title="2. How We Use Your Information"
                    content="Your data is used solely for:
• Processing reward claims and withdrawals.
• Authenticating your identity via OTP.
• Monitoring for fraudulent activity to ensure fair use.
• Improving app performance and user experience."
                />

                <PolicySection
                    title="3. Third-Party Services"
                    content="We integrate third-party partners to provide ads and rewards:
• Ad Networks (Unity Ads, Google AdMob): They may collect device identifiers to serve relevant advertisements.
• Survey Providers: If you choose to participate, they may collect demographic data as per their individual privacy policies.
• We do not sell your personal data to third parties."
                />

                <PolicySection
                    title="4. Data Security"
                    content="We implement industry-standard security measures, including:
• Encrypted data transmission (SSL/TLS).
• Secure hashed storage for authentication tokens.
• Restricted admin access to user financial data."
                />

                <PolicySection
                    title="5. User Rights"
                    content="You have the right to:
• Request a copy of your personal data.
• Request account deletion (note: this will result in loss of unclaimed rewards).
• Opt-out of non-essential data collection."
                />

                <PolicySection
                    title="6. Contact Us"
                    content="For any privacy-related inquiries or data requests, please contact our Data Protection Officer at:
Email: earnrewardzz@gmail.com
Telegram: @earnrewardzz"
                />

                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        By using the EarnRewardzz app, you agree to the terms outlined in this Privacy Policy.
                    </Text>
                </View>

                <View style={styles.bottomSpacer} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    backBtn: {
        padding: 5,
        marginRight: 15,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
    },
    scrollContent: {
        padding: 24,
    },
    introSection: {
        marginBottom: 30,
    },
    lastUpdated: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '600',
        marginBottom: 10,
    },
    introText: {
        fontSize: 15,
        color: '#475569',
        lineHeight: 24,
    },
    section: {
        marginBottom: 28,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 10,
    },
    sectionContent: {
        fontSize: 14,
        color: '#475569',
        lineHeight: 22,
    },
    footer: {
        marginTop: 20,
        padding: 20,
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
    },
    footerText: {
        fontSize: 13,
        color: '#64748B',
        textAlign: 'center',
        fontStyle: 'italic',
        lineHeight: 20,
    },
    bottomSpacer: {
        height: 60,
    }
});

export default PrivacyPolicyScreen;
