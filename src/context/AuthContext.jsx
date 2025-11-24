import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../services/firebase';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    updateProfile,
    sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    // Real Firebase auth state listener
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            console.log('🔐 AUTH STATE CHANGED:', user ? user.email : 'No user');
            setCurrentUser(user);

            if (user) {
                // Check if user has admin role in Firestore
                try {
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    if (userDoc.exists()) {
                        setIsAdmin(userDoc.data().isAdmin === true);
                    } else {
                        // Create user document if it doesn't exist
                        await setDoc(doc(db, 'users', user.uid), {
                            email: user.email,
                            displayName: user.displayName,
                            isAdmin: false,
                            createdAt: new Date()
                        });
                        setIsAdmin(false);
                    }
                } catch (error) {
                    console.error('Error fetching user role:', error);
                    setIsAdmin(false);
                }
            } else {
                setIsAdmin(false);
            }

            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const login = async (email, password) => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            return userCredential.user;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    };

    const register = async (name, email, password, additionalData = {}) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);

            // Update user profile with display name
            await updateProfile(userCredential.user, {
                displayName: name
            });

            // Create user document in Firestore with all data
            await setDoc(doc(db, 'users', userCredential.user.uid), {
                email: email,
                displayName: name,
                phone: additionalData.phone || '',
                cpf: additionalData.cpf || '',
                address: additionalData.address || {},
                isAdmin: false,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            // Refresh the user to get updated profile
            await userCredential.user.reload();
            setCurrentUser(auth.currentUser);

            // Send welcome email via backend
            try {
                await fetch(`${import.meta.env.VITE_API_URL}/api/auth/welcome`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: email,
                        displayName: name
                    })
                });
            } catch (emailError) {
                console.error('Failed to trigger welcome email:', emailError);
                // Don't fail registration
            }

            return userCredential.user;
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Logout error:', error);
            throw error;
        }
    };

    const resetPassword = async (email) => {
        try {
            await sendPasswordResetEmail(auth, email);
        } catch (error) {
            console.error('Password reset error:', error);
            throw error;
        }
    };

    const requestPasswordReset = async (email) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to send reset email');
            }

            return await response.json();
        } catch (error) {
            console.error('Request password reset error:', error);
            throw error;
        }
    };

    const getUserProfile = async (uid) => {
        try {
            const userDoc = await getDoc(doc(db, 'users', uid || currentUser?.uid));
            if (userDoc.exists()) {
                return userDoc.data();
            }
            return null;
        } catch (error) {
            console.error('Error fetching user profile:', error);
            return null;
        }
    };

    const value = {
        currentUser,
        user: currentUser, // Add alias for consistency
        isAdmin,
        loading,
        login,
        register,
        logout,
        resetPassword,
        requestPasswordReset,
        getUserProfile
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
