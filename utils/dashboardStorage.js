import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
    TODAY_EARNED: 'DASH_TODAY_EARNED',
    WALLET_BALANCE: 'DASH_WALLET_BALANCE',
    APPROVED_AMOUNT: 'DASH_APPROVED_AMOUNT',
    LIFETIME_EARNED: 'DASH_LIFETIME_EARNED',
    LAST_RESET_DATE: 'DASH_LAST_RESET_DATE',

    // Legacy mapping (to migrate old data if needed, optional)
    OLD_CURRENT_BALANCE: 'EARN_CURRENT_BALANCE'
};

const MAX_ADS_PER_DAY = 20; // Kept for reference/usage in Earn page if needed

export const dashboardStorage = {
    /**
     * Retrieves all dashboard metrics.
     * Handles the daily reset logic for 'TODAY_EARNED' automatically.
     */
    async getDashboardData() {
        try {
            const now = new Date();
            const todayStr = now.toDateString(); // "Mon Jan 01 2024"

            const [
                todayEarnedStr,
                walletBalStr,
                approvedAmtStr,
                lifetimeEarnedStr,
                lastDateStr
            ] = await Promise.all([
                AsyncStorage.getItem(KEYS.TODAY_EARNED),
                AsyncStorage.getItem(KEYS.WALLET_BALANCE),
                AsyncStorage.getItem(KEYS.APPROVED_AMOUNT),
                AsyncStorage.getItem(KEYS.LIFETIME_EARNED),
                AsyncStorage.getItem(KEYS.LAST_RESET_DATE),
            ]);

            let todayEarned = parseInt(todayEarnedStr || '0', 10);
            let walletBalance = parseInt(walletBalStr || '0', 10);
            let approvedAmount = parseInt(approvedAmtStr || '0', 10);
            let lifetimeEarned = parseInt(lifetimeEarnedStr || '0', 10);
            let lastResetDate = lastDateStr;

            // --- DAILY RESET CHECK ---
            if (lastResetDate !== todayStr) {
                console.log('Daily Reset Triggered');
                todayEarned = 0;
                // Note: Wallet, Approved, Lifetime DO NOT RESET.

                await AsyncStorage.multiSet([
                    [KEYS.LAST_RESET_DATE, todayStr],
                    [KEYS.TODAY_EARNED, '0']
                ]);
            }

            return {
                todayEarned,
                walletBalance,
                approvedAmount,
                lifetimeEarned,
                lastResetDate: todayStr
            };
        } catch (error) {
            console.error('Error getting dashboard data:', error);
            // Default safe return
            return {
                todayEarned: 0,
                walletBalance: 0,
                approvedAmount: 0,
                lifetimeEarned: 0,
                lastResetDate: new Date().toDateString()
            };
        }
    },

    /**
     * Add coins from a reward (e.g. Ad Watch).
     * Updates: Today, Wallet, Lifetime.
     * Does NOT Update: Approved Amount.
     */
    async addReward(amount = 1) {
        try {
            const current = await this.getDashboardData(); // Ensures we have fresh, reset-checked values

            const newToday = current.todayEarned + amount;
            const newWallet = current.walletBalance + amount;
            const newLifetime = current.lifetimeEarned + amount;

            await AsyncStorage.multiSet([
                [KEYS.TODAY_EARNED, newToday.toString()],
                [KEYS.WALLET_BALANCE, newWallet.toString()],
                [KEYS.LIFETIME_EARNED, newLifetime.toString()]
            ]);

            return {
                success: true,
                newState: {
                    todayEarned: newToday,
                    walletBalance: newWallet,
                    approvedAmount: current.approvedAmount,
                    lifetimeEarned: newLifetime
                }
            };
        } catch (error) {
            console.error('Error adding reward:', error);
            return { success: false, error: 'Storage Error' };
        }
    },

    /**
     * Deduct coins from Wallet (e.g. Withdrawal).
     * Updates: Wallet ONLY.
     */
    async deductBalance(amount) {
        try {
            const current = await this.getDashboardData();

            if (current.walletBalance < amount) {
                return { success: false, error: 'Insufficient Funds' };
            }

            const newWallet = current.walletBalance - amount;
            await AsyncStorage.setItem(KEYS.WALLET_BALANCE, newWallet.toString());

            return {
                success: true,
                newBalance: newWallet
            };
        } catch (error) {
            console.error('Error deducting balance:', error);
            return { success: false, error: 'Storage Error' };
        }
    },

    // --- ADMIN / BACKEND SIMULATION ---

    /**
     * Approve an amount (Move to Approved).
     * This logic would typically happen via sync, but strictly defined here for local rules.
     */
    async approveAmount(amount) {
        try {
            const current = await this.getDashboardData();
            const newApproved = current.approvedAmount + amount;
            await AsyncStorage.setItem(KEYS.APPROVED_AMOUNT, newApproved.toString());
            return { success: true, newApproved: newApproved };
        } catch (e) {
            return { success: false };
        }
    }
};
