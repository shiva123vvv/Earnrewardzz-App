
const PROD_URL = "https://earnrewardzz-server-1.onrender.com";

const getHost = () => {
    // 0. Use Environment Variable if available (Best for CI/CD & Local configuration)
    if (process.env.EXPO_PUBLIC_API_URL) {
        return process.env.EXPO_PUBLIC_API_URL;
    }

    // Always use Production URL as per request
    return PROD_URL;
};

export const API_ROOT_URL = getHost();
export const API_BASE_URL = `${API_ROOT_URL}/api`;

console.log('🌐 API Configured:', API_ROOT_URL);
