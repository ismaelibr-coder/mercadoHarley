import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRoute = ({ children }) => {
    const { currentUser, isAdmin } = useAuth();

    if (!currentUser) {
        // Not logged in, redirect to login
        return <Navigate to="/login" replace />;
    }

    if (!isAdmin) {
        // Logged in but not admin, redirect to home
        return <Navigate to="/" replace />;
    }

    // User is admin, allow access
    return children;
};

export default AdminRoute;
