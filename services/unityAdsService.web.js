export const unityAdsService = {
    initialize: () => {
        console.log('[UnityAds] Web: Initialize (No-Op)');
    },
    showRewardedAd: () => {
        console.log('[UnityAds] Web: Show (Skipped)');
        return Promise.resolve('SKIPPED');
    },
    isReady: () => {
        return false;
    }
};
