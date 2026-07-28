import React, { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged, signOut as firebaseSignOut, deleteUser } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { identifyUser } from "../analytics";

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
                let resolvedRole = 'user';
                let resolvedName = user.displayName || 'User';

                // Check user role from Firestore
                try {
                    const userDocRef = doc(db, "users", user.uid);
                    const userDoc = await getDoc(userDocRef);

                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        resolvedRole = userData.role || 'user';
                        resolvedName = userData.name || resolvedName;
                        setUserRole(resolvedRole);
                        identifyUser(user.uid, {
                            role: resolvedRole,
                            email: user.email,
                            name: resolvedName
                        });
                    } else {
                        // Document doesn't exist yet - check if it's a partner/admin
                        const messesRef = doc(db, "messes", user.uid);
                        const messDoc = await getDoc(messesRef);

                        if (messDoc.exists()) {
                            resolvedRole = "admin";
                            setUserRole(resolvedRole);
                            identifyUser(user.uid, {
                                role: resolvedRole,
                                email: user.email,
                                name: resolvedName
                            });
                        } else {
                            // New user - document might be created soon
                            // Watch the document for creation
                            const unsubUser = onSnapshot(userDocRef, (snap) => {
                                if (snap.exists()) {
                                    const retryUserData = snap.data();
                                    resolvedRole = retryUserData.role || 'user';
                                    resolvedName = retryUserData.name || resolvedName;
                                    setUserRole(resolvedRole);
                                    identifyUser(user.uid, {
                                        role: resolvedRole,
                                        email: user.email,
                                        name: resolvedName
                                    });
                                    unsubUser(); // stop watching once we have the data
                                }
                            });
                        }
                    }
                } catch (error) {
                    console.error("Error fetching user role:", error);
                    setUserRole('user'); // Default to user on error
                    identifyUser(user.uid, {
                        role: 'user',
                        email: user.email,
                        name: resolvedName
                    });
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
        loading, // Expose loading state so protected routes can show their own loaders
        logout,
        deleteAccount,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
