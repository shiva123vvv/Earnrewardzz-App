import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import React from 'react';
import {
    Alert,
    Dimensions,
    Linking,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

export default function ProfileScreen({ navigation }) {
    const { user, wallet, logout } = useAuth();

    const handleLogout = () => {
        Alert.alert("Confirm Logout", "Are you sure you want to end your session?", [
            { text: "Cancel", style: "cancel" },
            { text: "Sign Out", style: "destructive", onPress: logout }
        ]);
    };

    const openLink = (url) => {
        Linking.canOpenURL(url).then(supported => {
            if (supported) {
                Linking.openURL(url);
            } else {
                Alert.alert("Error", "Cannot open this link: " + url);
            }
        });
    };

    const SocialItem = ({ icon, color, label, subtitle, url, badge }) => (
        <TouchableOpacity style={styles.settingsItem} onPress={() => openLink(url)}>
            <View style={[styles.itemIconBox, { backgroundColor: color + '15' }]}>
                <Ionicons name={icon} size={22} color={color} />
            </View>
            <View style={styles.itemTextContent}>
                <Text style={styles.itemLabel}>{label}</Text>
                {subtitle && <Text style={styles.itemSubtitle}>{subtitle}</Text>}
            </View>
            {badge && (
                <View style={[styles.badge, { backgroundColor: color }]}>
                    <Text style={styles.badgeText}>{badge}</Text>
                </View>
            )}
            <Ionicons name="chevron-forward" size={20} color="#CBD5E1" style={{ marginLeft: 10 }} />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Profile</Text>
            </View>
            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                {/* Visual Header / Avatar Backdrop */}
                <View style={styles.bannerBox}>
                    <LinearGradient colors={['#6366F1', '#818CF8']} style={styles.bannerGradient} />
                    <View style={styles.avatarWrapper}>
                        <View style={styles.avatarImgBox}>
                            <Text style={styles.avatarEmoji}>👤</Text>
                        </View>
                        <View style={styles.onlineBadge} />
                    </View>
                </View>

                {/* Account Summary */}
                <View style={styles.accountCard}>
                    <Text style={styles.userEmail}>{user?.email}</Text>
                    <View style={styles.badgeRow}>
                        <LinearGradient colors={['#F0FDF4', '#DCFCE7']} style={styles.memberBadge}>
                            <Text style={styles.memberText}>VERIFIED USER</Text>
                        </LinearGradient>
                        <LinearGradient colors={['#FFF7ED', '#FFEDD5']} style={styles.pointBadge}>
                            <Text style={styles.pointText}>${((wallet?.coins?.balance || 0) / 500).toFixed(2)} ({wallet?.coins?.balance || 0} COINS)</Text>
                        </LinearGradient>
                        <LinearGradient colors={['#F0F9FF', '#E0F2FE']} style={styles.pointBadge}>
                            <Text style={styles.pointText}>{wallet?.tokens?.balance || 0} TOKENS</Text>
                        </LinearGradient>
                    </View>
                </View>

                {/* Community & Rewards Group */}
                <Text style={styles.groupHeader}>COMMUNITY & REWARDS</Text>
                <View style={styles.settingsGroup}>

                    {/* Reward Hub (Consolidated) */}
                    <TouchableOpacity style={styles.settingsItem} onPress={() => navigation.navigate('RewardsHub')}>
                        <View style={[styles.itemIconBox, { backgroundColor: '#FFF7ED' }]}>
                            <Ionicons name="gift" size={22} color="#F59E0B" />
                        </View>
                        <View style={styles.itemTextContent}>
                            <Text style={styles.itemLabel}>Rewards Hub</Text>
                            <Text style={styles.itemSubtitle}>Bonuses, Referrals & Giveaways</Text>
                        </View>
                        <View style={[styles.badge, { backgroundColor: '#F59E0B' }]}>
                            <Text style={styles.badgeText}>HOT</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
                    </TouchableOpacity>

                    <View style={styles.settingsDivider} />

                    {/* Telegram Chat */}
                    <SocialItem
                        icon="paper-plane"
                        color="#0088CC"
                        label="Telegram Chat"
                        subtitle="Join the discussion"
                        url="https://t.me/+OXRe5G5MM4xkZmI1"
                    />

                    <View style={styles.settingsDivider} />

                    {/* Telegram Group */}
                    <SocialItem
                        icon="people"
                        color="#229ED9"
                        label="Telegram Channel"
                        subtitle="Official updates & news"
                        url="https://t.me/earnrewardz1"
                    />

                    <View style={styles.settingsDivider} />

                    {/* WhatsApp Channel */}
                    <SocialItem
                        icon="logo-whatsapp"
                        color="#25D366"
                        label="WhatsApp Channel"
                        subtitle="Get alerts on WhatsApp"
                        url="https://whatsapp.com/channel/0029Vb713PADDmFdnUfJsH17"
                    />

                </View>

                {/* Business & Partnerships Group */}
                <Text style={styles.groupHeader}>PARTNERSHIPS</Text>
                <View style={styles.settingsGroup}>
                    <TouchableOpacity style={styles.settingsItem} onPress={() => navigation.navigate('BusinessPartnerships')}>
                        <View style={[styles.itemIconBox, { backgroundColor: '#F0F9FF' }]}>
                            <Ionicons name="briefcase" size={22} color="#0EA5E9" />
                        </View>
                        <View style={styles.itemTextContent}>
                            <Text style={styles.itemLabel}>🤝 Business & Partnerships</Text>
                            <Text style={styles.itemSubtitle}>Advertising, Ad Networks & Survey Providers</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
                    </TouchableOpacity>
                </View>

                {/* Support & Legal */}
                <Text style={styles.groupHeader}>APP & SUPPORT</Text>
                <View style={styles.settingsGroup}>
                    <SocialItem
                        icon="mail-outline"
                        color="#6366F1"
                        label="Contact Support"
                        subtitle="support@earnrewardzz.com"
                        url="mailto:earnrewardzz@gmail.com?subject=Support Request"
                    />
                    <View style={styles.settingsDivider} />
                    <SocialItem
                        icon="paper-plane-outline"
                        color="#22D3EE"
                        label="Telegram Contact"
                        subtitle="@earnrewardzz"
                        url="https://t.me/earnrewardzz"
                    />
                </View>

                {/* Transparency & Legal */}
                <Text style={styles.groupHeader}>LEGAL & TRANSPARENCY</Text>
                <View style={styles.settingsGroup}>
                    <TouchableOpacity style={styles.settingsItem} onPress={() => navigation.navigate('PrivacyPolicy')}>
                        <View style={[styles.itemIconBox, { backgroundColor: '#F1F5F9' }]}>
                            <Ionicons name="shield-checkmark-outline" size={22} color="#64748B" />
                        </View>
                        <View style={styles.itemTextContent}>
                            <Text style={styles.itemLabel}>Privacy Policy</Text>
                            <Text style={styles.itemSubtitle}>How we handle your data</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
                    </TouchableOpacity>
                </View>

                {/* Logout Button */}
                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <LinearGradient colors={['#FFF1F2', '#FFE4E6']} style={styles.logoutGradient}>
                        <Text style={styles.logoutText}>Log Out Account</Text>
                    </LinearGradient>
                </TouchableOpacity>

                <View style={styles.footer}>
                    <Text style={styles.version}>EarnRewardzz Pro • v1.4.0</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
    container: { paddingBottom: 120 },

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

    bannerBox: { height: 160, width: '100%', position: 'relative', marginBottom: 50 },
    bannerGradient: { height: 120, width: '100%', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    avatarWrapper: { position: 'absolute', bottom: 0, alignSelf: 'center' },
    avatarImgBox: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#FFFFFF', borderWidth: 4, borderColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 15, elevation: 10 },
    avatarEmoji: { fontSize: 45 },
    onlineBadge: { position: 'absolute', bottom: 5, right: 5, width: 22, height: 22, borderRadius: 11, backgroundColor: '#10B981', borderWidth: 4, borderColor: '#FFFFFF' },

    accountCard: { alignItems: 'center', marginBottom: 20, paddingHorizontal: 20 },
    userEmail: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
    badgeRow: { flexDirection: 'row', marginTop: 12, gap: 10 },
    memberBadge: { paddingHorizontal: 15, paddingVertical: 6, borderRadius: 20 },
    memberText: { color: '#15803D', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
    pointBadge: { paddingHorizontal: 15, paddingVertical: 6, borderRadius: 20 },
    pointText: { color: '#9A3412', fontSize: 10, fontWeight: '800', letterSpacing: 1 },

    groupHeader: { fontSize: 13, fontWeight: '800', color: '#64748B', letterSpacing: 1, marginTop: 20, marginBottom: 10, marginLeft: 25 },
    settingsGroup: { backgroundColor: '#FFFFFF', marginHorizontal: 20, borderRadius: 24, paddingVertical: 5 },

    settingsItem: { flexDirection: 'row', alignItems: 'center', padding: 16 },
    itemIconBox: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    itemTextContent: { flex: 1 },
    itemLabel: { fontSize: 15, color: '#1E293B', fontWeight: '600' },
    itemSubtitle: { fontSize: 12, color: '#94A3B8', marginTop: 2 },

    settingsDivider: { height: 1, backgroundColor: '#F1F5F9', marginLeft: 75, marginRight: 20 },

    badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginRight: 5 },
    badgeText: { color: '#FFF', fontSize: 10, fontWeight: '800' },

    logoutBtn: { marginHorizontal: 25, marginTop: 40, borderRadius: 16, overflow: 'hidden' },
    logoutGradient: { paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: '#FECDD3' },
    logoutText: { color: '#E11D48', fontWeight: '700', fontSize: 15 },

    footer: { marginTop: 30, alignItems: 'center' },
    version: { fontSize: 12, fontWeight: '600', color: '#CBD5E1' },
});
