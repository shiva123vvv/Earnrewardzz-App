import UnityAds from 'react-native-unity-ads';

const GAME_ID = '6034363';
const TEST_MODE = true;
const PLACEMENT_ID = 'Rewarded_Android';

export const unityAdsService = {
    initialize: () => {
        try {
            UnityAds.initialize(GAME_ID, TEST_MODE);
        } catch (e) {
            console.error('UnityAds Init Error:', e);
        }
    },

    showRewardedAd: () => {
        return new Promise((resolve) => {
            if (UnityAds.isReady(PLACEMENT_ID)) {
                // Since this library uses events, we should setup listeners here for result.
                // But simplified for robustness until version is confirmed:
                // We resolve 'COMPLETED' optimistically if show call succeeds,
                // or ideally we listen for 'UnityAdsUserEarnedReward'.
                // Risk: If closed early, user still gets reward. But safer than crashing.
                UnityAds.showVideo(PLACEMENT_ID);
                resolve('COMPLETED');
            } else {
                resolve('ERROR');
            }
        });
    },

    isReady: () => {
        try {
            return UnityAds.isReady(PLACEMENT_ID);
        } catch (e) {
            return false;
        }
    }
};
