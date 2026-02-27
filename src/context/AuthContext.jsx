import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [userType, setUserType] = useState('customer');
    const [loading, setLoading] = useState(true);

    // Check for stored auth token on mount
    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('auth_token');
            const userData = localStorage.getItem('user_data');
            
            if (token && userData) {
                try {
                    const user = JSON.parse(userData);
                    // Simulate Firebase user object for compatibility
                    const firebaseUser = {
                        uid: user.uid,
                        email: user.email,
                        displayName: user.name,
                        getIdToken: async () => token,
                        userType: user.userType || 'customer'
                    };
                    setCurrentUser(firebaseUser);
                    setIsAdmin(user.isAdmin || false);
                    setUserType(user.userType || 'customer');
                } catch (error) {
                    console.error('Error loading stored auth:', error);
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('user_data');
                }
            }
            setLoading(false);
        };

        checkAuth();
    }, []);

    const login = async (email, password) => {
        try {
            const response = await axios.post(`${API_URL}/api/auth/login`, {
                email,
                password
            });

            const { token, user } = response.data;
            
            // Store token and user data
            localStorage.setItem('auth_token', token);
            localStorage.setItem('user_data', JSON.stringify(user));

            // Simulate Firebase user object for compatibility
            const firebaseUser = {
                uid: user.uid,
                email: user.email,
                displayName: user.name,
                getIdToken: async () => token,
                userType: user.userType || 'customer'
            };

            setCurrentUser(firebaseUser);
            setIsAdmin(user.isAdmin || false);
            setUserType(user.userType || 'customer');

            console.log('✅ Login successful:', user.email);
            return firebaseUser;
        } catch (error) {
            console.error('❌ Login error:', error.response?.data || error.message);
            throw new Error(error.response?.data?.error || 'Falha ao fazer login. Verifique suas credenciais.');
        }
    };

    const register = async (name, email, password, additionalData = {}) => {
        try {
            const response = await axios.post(`${API_URL}/api/auth/register`, {
                name,
                email,
                password,
                phone: additionalData.phone || '',
                cpf: additionalData.cpf || '',
                address: additionalData.address || {}
            });

            const { token, user } = response.data;
            
            // Store token and user data
            localStorage.setItem('auth_token', token);
            localStorage.setItem('user_data', JSON.stringify(user));

            // Simulate Firebase user object for compatibility
            const firebaseUser = {
                uid: user.uid,
                email: user.email,
                displayName: user.name,
                getIdToken: async () => token
            };

            setCurrentUser(firebaseUser);
            setIsAdmin(user.isAdmin || false);

            return firebaseUser;
        } catch (error) {
            console.error('Registration error:', error);
            throw new Error(error.response?.data?.error || 'Falha ao registrar usuário.');
        }
    };

    const logout = async () => {
        try {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_data');
            setCurrentUser(null);
            setIsAdmin(false);
            console.log('✅ Logout successful');
        } catch (error) {
            console.error('Logout error:', error);
            throw error;
        }
    };

    const resetPassword = async (email) => {
        try {
            const response = await axios.post(`${API_URL}/api/auth/forgot-password`, {
                email
            });
            return response.data;
        } catch (error) {
            console.error('Password reset error:', error);
            throw new Error(error.response?.data?.error || 'Falha ao enviar email de recuperação.');
        }
    };

    const requestPasswordReset = async (email) => {
        return resetPassword(email);
    };

    const getUserProfile = async (uid) => {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) return null;

            const response = await axios.get(`${API_URL}/api/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            return response.data?.user || null;
        } catch (error) {
            console.error('Error fetching user profile:', error);
            return null;
        }
    };

    const value = {
        currentUser,
        user: currentUser, // Add alias for consistency
        isAdmin,
        userType,
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
