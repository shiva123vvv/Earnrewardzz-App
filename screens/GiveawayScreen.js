import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Image,
    RefreshControl,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { giveawayService } from '../services/giveawayService';

const { width } = Dimensions.get('window');

// --- COMPONENTS ---

const TabButton = ({ title, active, onPress }) => (
    <TouchableOpacity
        style={[styles.tabBtn, active && styles.tabBtnActive]}
        onPress={onPress}
    >
        <Text style={[styles.tabText, active && styles.tabTextActive]}>{title}</Text>
    </TouchableOpacity>
);

const GiveawayCard = ({ item, onBuy, processing, wallet }) => {
    // Calc progress or remaining
    const isEnded = item.status !== 'active';
    const canAfford = Number(wallet?.tokens?.balance || 0) >= Number(item.ticket_token_cost);

    return (
        <View style={styles.card}>
            {/* Image Banner */}
            <View style={styles.imageBox}>
                {item.prize_image ? (
                    <Image source={{ uri: item.prize_image }} style={styles.prizeImage} />
                ) : (
                    <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.prizePlaceholder}>
                        <Ionicons name="gift" size={50} color="#FFF" />
                    </LinearGradient>
                )}
                <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>
                        {isEnded ? 'ENDED' : 'LIVE'}
                    </Text>
                </View>
            </View>

            <View style={styles.cardContent}>
                <Text style={styles.gTitle}>{item.title}</Text>
                <Text style={styles.gDesc}>{item.description || 'Win this amazing prize!'}</Text>

                <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                        <Ionicons name="ticket" size={16} color="#6366F1" />
                        <Text style={styles.metaText}>{item.ticket_token_cost} Tokens/Ticket</Text>
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.actionRow}>
                    <View>
                        <Text style={styles.ownedLabel}>You Own</Text>
                        <Text style={styles.ownedValue}>{item.user_tickets || 0}</Text>
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.buyBtn,
                            (isEnded || processing || !canAfford) && styles.disabledBtn
                        ]}
                        onPress={() => onBuy(item)}
                        disabled={isEnded || processing || !canAfford}
                    >
                        {processing ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <Text style={styles.buyBtnText}>
                                {isEnded ? 'Closed' : !canAfford ? 'No Tokens' : 'Buy Ticket'}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View >
        </View >
    );
};

const TicketItem = ({ item }) => (
    <View style={styles.ticketCard}>
        <View style={styles.ticketLeft}>
            <View style={styles.ticketIcon}>
                <Ionicons name="ticket-outline" size={24} color="#6366F1" />
            </View>
            <View>
                <Text style={styles.ticketTitle}>{item.title}</Text>
                <Text style={styles.ticketDate}>Purchased: {new Date(item.created_at || item.purchase_date).toLocaleDateString()}</Text>
            </View>
        </View>
        <View style={styles.ticketRight}>
            <Text style={styles.ticketCount}>x{item.tickets_purchased}</Text>
            <View style={[styles.statusTag, item.status === 'active' ? styles.bgActive : styles.bgEnded]}>
                <Text style={[styles.statusTagText, item.status === 'active' ? styles.txtActive : styles.txtEnded]}>
                    {item.status ? item.status.toUpperCase() : 'ACTIVE'}
                </Text>
            </View>
        </View>
    </View>
);

const WinnerItem = ({ item }) => (
    <View style={styles.winnerCard}>
        <View style={styles.winnerHeader}>
            <Text style={styles.wTitle}>{item.title}</Text>
            <Text style={styles.wDate}>{new Date(item.announced_at).toLocaleDateString()}</Text>
        </View>
        <View style={styles.winnerBody}>
            <View style={styles.winnerBadge}>
                <Ionicons name="trophy" size={20} color="#F59E0B" />
                <Text style={styles.wUser}>{item.winner_id}</Text>
            </View>
            <Text style={styles.wText}>{item.announcement_text || "Congratulations!"}</Text>
        </View>
    </View>
);

// --- MAIN SCREEN ---

export default function GiveawayScreen({ navigation }) {
    const { wallet, refreshUserData } = useAuth();
    const [activeTab, setActiveTab] = useState('active'); // active, tickets, winners
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const [giveaways, setGiveaways] = useState([]);
    const [myTickets, setMyTickets] = useState([]);
    const [winners, setWinners] = useState([]);

    const [processingId, setProcessingId] = useState(null);

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'active') {
                const res = await giveawayService.getGiveaways();
                if (res.success) {
                    setGiveaways(res.giveaways);
                }
            } else if (activeTab === 'tickets') {
                const res = await giveawayService.getMyTickets();
                if (res.success) setMyTickets(res.tickets);
            } else if (activeTab === 'winners') {
                const res = await giveawayService.getWinners();
                if (res.success) setWinners(res.winners);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleBuy = async (item) => {
        if ((wallet?.tokens?.balance || 0) < item.ticket_token_cost) {
            Alert.alert(
                "Insufficient Tokens",
                `You need ${item.ticket_token_cost} tokens to buy a ticket.\n\nYou currently have ${wallet?.tokens?.balance || 0} tokens.\n\nEarn more tokens by spinning the wheel or claiming your daily bonus!`,
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Earn Tokens", onPress: () => navigation.navigate('RewardsHub') }
                ]
            );
            return;
        }

        Alert.alert(
            "Confirm Purchase",
            `Buy 1 ticket for ${item.ticket_token_cost} tokens?`,
            [
                { text: "Cancel", style: 'cancel' },
                {
                    text: "Buy Now",
                    onPress: async () => {
                        setProcessingId(item.id);
                        try {
                            const res = await giveawayService.buyTicket(item.id, 1);
                            if (res.success) {
                                Alert.alert("Success", "Ticket purchased! Good luck!");
                                loadData(); // Reload list to update counts
                                await refreshUserData(); // Sync global state
                            } else {
                                Alert.alert("Failed", res.message);
                            }
                        } catch (err) {
                            console.error("Purchase Error:", err);
                            const msg = err.response?.data?.message || err.message || "Purchase failed";
                            Alert.alert("Purchase Failed", msg);
                        } finally {
                            setProcessingId(null);
                        }
                    }
                }
            ]
        );
    };

    const renderContent = () => {
        if (loading && !refreshing) {
            return <ActivityIndicator size="large" color="#6366F1" style={{ marginTop: 50 }} />;
        }

        if (activeTab === 'active') {
            return (
                <FlatList
                    data={giveaways}
                    keyExtractor={item => item.id.toString()}
                    renderItem={({ item }) => (
                        <GiveawayCard
                            item={item}
                            wallet={wallet}
                            onBuy={handleBuy}
                            processing={processingId === item.id}
                        />
                    )}
                    contentContainerStyle={styles.list}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} />}
                    ListEmptyComponent={<Text style={styles.emptyText}>No active giveaways. Check back soon!</Text>}
                />
            );
        }

        if (activeTab === 'tickets') {
            return (
                <FlatList
                    data={myTickets}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item }) => <TicketItem item={item} />}
                    contentContainerStyle={styles.list}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} />}
                    ListEmptyComponent={<Text style={styles.emptyText}>You haven't purchased any tickets yet.</Text>}
                />
            );
        }


    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Reward Hub</Text>

                {/* Token Balance Display */}
                <View style={styles.tokenBadge}>
                    <Ionicons name="diamond" size={14} color="#FFF" />
                    <Text style={styles.tokenText}>{wallet?.tokens?.balance || 0}</Text>
                </View>

                <TouchableOpacity onPress={() => Alert.alert("Info", "Tickets are non-refundable. Terms Apply.")}>
                    <Ionicons name="information-circle-outline" size={24} color="#1E293B" />
                </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={styles.tabContainer}>
                <TabButton title="Active" active={activeTab === 'active'} onPress={() => setActiveTab('active')} />
                <TabButton title="My Tickets" active={activeTab === 'tickets'} onPress={() => setActiveTab('tickets')} />
            </View>

            {/* Disclaimer */}
            <View style={styles.infoBanner}>
                <Ionicons name="shield-checkmark" size={14} color="#15803D" />
                <Text style={styles.infoText}>
                    We will contact the winners directly using their phone or email.
                </Text>
            </View>

            {/* Content */}
            {renderContent()}

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },

    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#FFF' },
    headerTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B' },
    tokenBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#6366F1', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 5 },
    tokenText: { color: '#FFF', fontWeight: '800', fontSize: 12 },
    backBtn: { padding: 5 },

    tabContainer: { flexDirection: 'row', padding: 15, paddingBottom: 0, gap: 10 },
    tabBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#E2E8F0' },
    tabBtnActive: { backgroundColor: '#6366F1' },
    tabText: { fontWeight: '600', color: '#64748B' },
    tabTextActive: { color: '#FFF' },

    infoBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#DCFCE7', margin: 15, padding: 10, borderRadius: 10, gap: 8 },
    infoText: { fontSize: 11, color: '#15803D', flex: 1, fontWeight: '600' },

    list: { padding: 15, paddingBottom: 40 },
    emptyText: { textAlign: 'center', marginTop: 50, color: '#94A3B8' },

    // Card Styles
    card: { backgroundColor: '#FFF', borderRadius: 20, marginBottom: 20, overflow: 'hidden', elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { height: 4, width: 0 } },
    imageBox: { height: 180, width: '100%', position: 'relative' },
    prizeImage: { width: '100%', height: '100%' },
    prizePlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
    statusBadge: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    statusText: { color: '#FFF', fontSize: 10, fontWeight: '800' },

    cardContent: { padding: 16 },
    gTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B', marginBottom: 4 },
    gDesc: { fontSize: 13, color: '#64748B', marginBottom: 15 },

    metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, backgroundColor: '#F8FAFC', padding: 10, borderRadius: 10 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    metaText: { fontSize: 12, fontWeight: '600', color: '#475569' },

    divider: { height: 1, backgroundColor: '#E2E8F0', marginBottom: 15 },

    actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    ownedLabel: { fontSize: 10, color: '#94A3B8', textTransform: 'uppercase' },
    ownedValue: { fontSize: 18, fontWeight: '800', color: '#6366F1' },

    buyBtn: { backgroundColor: '#6366F1', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 14, minWidth: 120, alignItems: 'center' },
    disabledBtn: { backgroundColor: '#CBD5E1' },
    buyBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },

    // Ticket Item
    ticketCard: { flexDirection: 'row', backgroundColor: '#FFF', padding: 15, borderRadius: 16, marginBottom: 12, alignItems: 'center', justifyContent: 'space-between' },
    ticketLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    ticketIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center' },
    ticketTitle: { fontWeight: '700', color: '#1E293B', fontSize: 14 },
    ticketDate: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
    ticketRight: { alignItems: 'flex-end' },
    ticketCount: { fontWeight: '800', fontSize: 16, color: '#6366F1' },
    statusTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 4 },
    bgActive: { backgroundColor: '#DCFCE7' },
    bgEnded: { backgroundColor: '#F1F5F9' },
    txtActive: { fontSize: 10, fontWeight: '700', color: '#15803D' },
    txtEnded: { fontSize: 10, fontWeight: '700', color: '#64748B' },

    // Winner Item
    winnerCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#F1F5F9' },
    winnerHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    wTitle: { fontWeight: '700', color: '#1E293B' },
    wDate: { fontSize: 11, color: '#94A3B8' },
    winnerBody: { backgroundColor: '#FFFBEB', padding: 12, borderRadius: 10 },
    winnerBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
    wUser: { fontWeight: '800', color: '#B45309' },
    wText: { fontSize: 12, color: '#B45309', fontStyle: 'italic' },
});
