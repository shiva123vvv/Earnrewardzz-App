const { withAppBuildGradle } = require('@expo/config-plugins');

const withUnityAdsAdapter = (config) => {
    return withAppBuildGradle(config, (config) => {
        if (config.modResults.language === 'groovy') {
            const dependencies = `
    // Unity Ads Adapter (Google-hosted mediation adapter)
    implementation 'com.google.ads.mediation:unity:4.16.5.0'
`;
            if (!config.modResults.contents.includes('com.google.ads.mediation:unity')) {
                config.modResults.contents = config.modResults.contents.replace(
                    /dependencies\s?{/,
                    `dependencies {${dependencies}`
                );
            }
        }
        return config;
    });
};

module.exports = withUnityAdsAdapter;
