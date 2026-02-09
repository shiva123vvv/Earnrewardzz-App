import { onAuthStateChanged, signInWithCustomToken, signOut } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { createContext, useContext, useEffect, useState } from "react";
import { auth, functions } from "../../config/firebase";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // --- CRITICAL FIX: FORCE CLEAR SESSION FOR TESTING UI ---
        // This ensures the user lands on the Welcome/Signup screens immediately.
        // Once the user verifies the screens, we can remove this line.
        signOut(auth);

        const unsubscribe = onAuthStateChanged(auth, async (authenticatedUser) => {
            if (authenticatedUser) {
                console.log("User detected, loading profile...");
                setUser(authenticatedUser);
                await refreshUserData();
            } else {
                console.log("No user session, showing Welcome flow.");
                setUser(null);
                setUserData(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const refreshUserData = async () => {
        try {
            const getUserDataFunc = httpsCallable(functions, 'getUserData');
            const result = await getUserDataFunc();
            if (result && result.data && result.data.success) {
                const data = result.data.userData;
                setUserData({
                    ...data,
                    phoneNumber: data.phone_number,
                    totalEarned: data.total_earned,
                });
            }
        } catch (error) {
            console.error("Error refreshing user data:", error);
        }
    };

    const loginWithOTP = async (email, otp) => {
        try {
            const verifyOTP = httpsCallable(functions, 'verifyOTP');
            const result = await verifyOTP({ email, otp });
            if (result.data.success && result.data.token) {
                await signInWithCustomToken(auth, result.data.token);
                return true;
            }
        } catch (err) {
            console.error("Login verification failed:", err);
            throw err;
        }
        return false;
    };

    const logout = async () => {
        try {
            await signOut(auth);
            setUser(null);
            setUserData(null);
        } catch (err) {
            console.error("Logout error:", err);
        }
    };

    return (
        <AuthContext.Provider value={{ user, userData, loading, loginWithOTP, logout, refreshUserData }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
