import React, { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const AuthContext = createContext();

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

    const value = {
        currentUser,
        userRole, // Expose role so components know who is logged in
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
