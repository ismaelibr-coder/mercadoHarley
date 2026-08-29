import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config/api.js';

const AuthContext = createContext();

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
                    const response = await axios.get(`${API_URL}/api/auth/me`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    const user = response.data?.user || JSON.parse(userData);

                    // Simulate auth user object for compatibility
                    const authUser = {
                        uid: user.uid,
                        email: user.email,
                        displayName: user.name,
                        getIdToken: async () => token,
                        userType: user.userType || 'customer'
                    };
                    setCurrentUser(authUser);
                    setIsAdmin(user.isAdmin || false);
                    setUserType(user.userType || 'customer');

                    localStorage.setItem('user_data', JSON.stringify(user));
                } catch (error) {
                    try {
                        const user = JSON.parse(userData);
                        const authUser = {
                            uid: user.uid,
                            email: user.email,
                            displayName: user.name,
                            getIdToken: async () => token,
                            userType: user.userType || 'customer'
                        };

                        setCurrentUser(authUser);
                        setIsAdmin(user.isAdmin || false);
                        setUserType(user.userType || 'customer');
                    } catch (fallbackError) {
                        console.error('Error loading stored auth:', fallbackError);
                        localStorage.removeItem('auth_token');
                        localStorage.removeItem('user_data');
                    }
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

            // Simulate auth user object for compatibility
            const authUser = {
                uid: user.uid,
                email: user.email,
                displayName: user.name,
                getIdToken: async () => token,
                userType: user.userType || 'customer'
            };

            setCurrentUser(authUser);
            setIsAdmin(user.isAdmin || false);
            setUserType(user.userType || 'customer');

            console.log('✅ Login successful:', user.email);
            return authUser;
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

            // Simulate auth user object for compatibility
            const authUser = {
                uid: user.uid,
                email: user.email,
                displayName: user.name,
                getIdToken: async () => token
            };

            setCurrentUser(authUser);
            setIsAdmin(user.isAdmin || false);

            return authUser;
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

    const resetPasswordWithToken = async (email, token, newPassword) => {
        try {
            const response = await axios.post(`${API_URL}/api/auth/reset-password`, {
                email,
                token,
                newPassword
            });
            return response.data;
        } catch (error) {
            console.error('Reset password error:', error);
            throw new Error(error.response?.data?.error || 'Falha ao redefinir a senha.');
        }
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
        resetPasswordWithToken,
        getUserProfile
    };

    return (
        <AuthContext.Provider value={value}>
            {loading ? (
                // A blank screen while auth resolves looks like a broken app, even to
                // anonymous visitors who don't have a token to check in the first place.
                <div className="min-h-screen bg-black flex items-center justify-center" role="status" aria-live="polite">
                    <div className="w-10 h-10 border-2 border-harley-orange border-t-transparent rounded-full animate-spin" aria-hidden="true"></div>
                    <span className="sr-only">Carregando...</span>
                </div>
            ) : children}
        </AuthContext.Provider>
    );
};
