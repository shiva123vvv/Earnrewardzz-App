import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

import { API_BASE_URL } from '../config/api';

// Force fallback to localhost:5000 if API_BASE_URL is missing to prevent 404s on relative paths
const API_URL = API_BASE_URL || 'https://earnrewardzz-server-1.onrender.com/api';

console.log('🎁 [GiveawayService] Initialized with API_URL:', API_URL);

const getAuthHeader = async () => {
    const token = await AsyncStorage.getItem('userToken');
    return {
        headers: { Authorization: `Bearer ${token}` }
    };
};

export const giveawayService = {
    // 1. Get Giveaways (Combined Active & User Tickets)
    // Updated to user requested strict route: GET /api/giveaway/active
    getGiveaways: async () => {
        try {
            console.log(`📡 GET ${API_URL}/giveaway/active`);
            const config = await getAuthHeader();
            const response = await axios.get(`${API_URL}/giveaway/active`, config);
            return response.data;
        } catch (err) {
            console.error("❌ getGiveaways Error:", err.message);
            throw err;
        }
    },

    // 2. Buy Ticket
    // Updated to user requested strict route: POST /api/giveaway/buy-ticket
    buyTicket: async (giveawayId, ticketCount) => {
        try {
            console.log(`📡 POST ${API_URL}/giveaway/buy-ticket`, { giveawayId, ticketCount });
            const config = await getAuthHeader();
            const response = await axios.post(`${API_URL}/giveaway/buy-ticket`, { giveawayId, ticketCount }, config);
            return response.data;
        } catch (err) {
            console.error("❌ buyTicket Error:", err.message);
            if (err.response) {
                console.error("Server Response:", err.response.status, err.response.data);
            }
            throw err;
        }
    },

    // 3. Get My Tickets History
    // Using singular base route /giveaway (aliased in backend) for consistency
    getMyTickets: async () => {
        try {
            console.log(`📡 GET ${API_URL}/giveaway/my-tickets`);
            const config = await getAuthHeader();
            const response = await axios.get(`${API_URL}/giveaway/my-tickets`, config);
            return response.data;
        } catch (err) {
            console.error("❌ getMyTickets Error:", err.message);
            throw err;
        }
    },

    // 4. Get Winners
    getWinners: async () => {
        try {
            console.log(`📡 GET ${API_URL}/giveaway/winners`);
            const config = await getAuthHeader();
            const response = await axios.get(`${API_URL}/giveaway/winners`, config);
            return response.data;
        } catch (err) {
            console.error("❌ getWinners Error:", err.message);
            throw err;
        }
    }
};
