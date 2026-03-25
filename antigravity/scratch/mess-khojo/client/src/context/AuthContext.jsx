import React, { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged, signOut as firebaseSignOut, deleteUser } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [userRole, setUserRole] = useState(null); // 'user' or 'admin' (can be null initially)
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setCurrentUser(user);
                // Check user role from Firestore
                try {
                    const userDocRef = doc(db, "users", user.uid);
                    const userDoc = await getDoc(userDocRef);

                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        // Use the 'role' field from the document
                        setUserRole(userData.role || 'user');
                    } else {
                        // Document doesn't exist yet - check if it's a partner/admin
                        const messesRef = doc(db, "messes", user.uid);
                        const messDoc = await getDoc(messesRef);

                        if (messDoc.exists()) {
                            setUserRole("admin"); // Partner who owns a mess
                        } else {
                            // New user - document might be created soon
                            // Wait a bit and check again
                            setTimeout(async () => {
                                const retryUserDoc = await getDoc(userDocRef);
                                if (retryUserDoc.exists()) {
                                    const retryUserData = retryUserDoc.data();
                                    setUserRole(retryUserData.role || 'user');
                                } else {
                                    setUserRole('user'); // Default to user if still nothing
                                }
                            }, 1000);
                        }
                    }
                } catch (error) {
                    console.error("Error fetching user role:", error);
                    setUserRole('user'); // Default to user on error
                }
            } else {
                setCurrentUser(null);
                setUserRole(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const logout = () => {
        return firebaseSignOut(auth);
    };

    const deleteAccount = async () => {
        if (currentUser) {
            return deleteUser(currentUser);
        }
        throw new Error("No user is currently logged in.");
    };

    const value = {
        currentUser,
        userRole, // Expose role so components know who is logged in
        logout,
        deleteAccount,
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f8f9fa' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: 40, height: 40, border: '4px solid #e5e7eb', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    <p style={{ color: '#6b7280', fontSize: 14 }}>Loading MessKhojo...</p>
                </div>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
