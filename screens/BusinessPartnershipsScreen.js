import Ionicons from 'react-native-vector-icons/Ionicons';
import {
    Linking,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const BusinessPartnershipsScreen = ({ navigation }) => {

    const openLink = (url) => {
        Linking.openURL(url).catch(err => console.error('An error occurred', err));
    };

    const ContactCard = ({ title, description, email, telegram, emailSubject }) => (
        <View style={styles.card}>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardDescription}>{description}</Text>

            <View style={styles.contactActions}>
                {email && (
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => openLink(`mailto:${email}?subject=${encodeURIComponent(emailSubject || 'Business Partnership')}`)}
                    >
                        <View style={[styles.iconBox, { backgroundColor: '#EEF2FF' }]}>
                            <Ionicons name="mail" size={20} color="#6366F1" />
                        </View>
                        <View style={styles.actionTextContent}>
                            <Text style={styles.actionLabel}>Email Inquiry</Text>
                            <Text style={styles.actionValue}>{email}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
                    </TouchableOpacity>
                )}

                {telegram && (
                    <TouchableOpacity
                        style={[styles.actionButton, { marginTop: 12 }]}
                        onPress={() => openLink(telegram)}
                    >
                        <View style={[styles.iconBox, { backgroundColor: '#F0F9FF' }]}>
                            <Ionicons name="paper-plane" size={20} color="#0EA5E9" />
                        </View>
                        <View style={styles.actionTextContent}>
                            <Text style={styles.actionLabel}>Contact on Telegram</Text>
                            <Text style={styles.actionValue}>@earnrewardzz</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Business & Partnerships</Text>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.introSection}>
                    <Text style={styles.pageTitle}>Partnership Portal</Text>
                    <Text style={styles.pageSubtitle}>
                        For advertising, partnerships, survey providers, and offerwall inquiries.
                    </Text>
                </View>

                {/* Section 1: Ad Networks */}
                <ContactCard
                    title="Advertising & Ad Network Inquiries"
                    description="For ad networks and advertising partners interested in working with us."
                    email="earnrewardzz@gmail.com"
                    emailSubject="Ad Network Partnership Inquiry"
                />

                {/* Section 2: Survey & Offerwalls */}
                <ContactCard
                    title="Survey & Offerwall Providers"
                    description="For survey platforms and offerwall providers looking for integration."
                    email="earnrewardzz@gmail.com"
                    telegram="https://t.me/earnrewardzz"
                    emailSubject="Survey Provider Inquiry"
                />

                {/* Section 3: Strategic Partnerships */}
                <ContactCard
                    title="Business & Strategic Partnerships"
                    description="For business collaborations, partnerships, and official inquiries."
                    email="earnrewardzz@gmail.com"
                    telegram="https://t.me/earnrewardzz"
                    emailSubject="Business Strategic Partnership"
                />

                {/* Compliance Footer */}
                <View style={styles.footerInfo}>
                    <Ionicons name="shield-checkmark" size={20} color="#94A3B8" />
                    <Text style={styles.footerText}>
                        Business & Compliance Transparency: All inquiries are reviewed by our legal team within 48-72 hours.
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
        backgroundColor: '#F8FAFC',
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
        padding: 20,
    },
    introSection: {
        marginBottom: 30,
    },
    pageTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 8,
    },
    pageSubtitle: {
        fontSize: 14,
        color: '#64748B',
        lineHeight: 22,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 2,
    },
    cardTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 8,
    },
    cardDescription: {
        fontSize: 13,
        color: '#64748B',
        lineHeight: 20,
        marginBottom: 20,
    },
    contactActions: {
        marginTop: 5,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    actionTextContent: {
        flex: 1,
    },
    actionLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#94A3B8',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    actionValue: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1E293B',
        marginTop: 2,
    },
    footerInfo: {
        flexDirection: 'row',
        backgroundColor: '#F1F5F9',
        padding: 15,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 10,
        gap: 12,
    },
    footerText: {
        flex: 1,
        fontSize: 12,
        color: '#64748B',
        lineHeight: 18,
    },
    bottomSpacer: {
        height: 40,
    }
});

export default BusinessPartnershipsScreen;
