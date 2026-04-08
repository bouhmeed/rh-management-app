// frontend/src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth doit être utilisé dans AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        
        if (token && storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (email, motDePasse) => {
        setError(null); // Clear error state at the start of each login attempt
        try {
            const response = await authService.login(email, motDePasse);
            const { token, utilisateur } = response.data;
            
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(utilisateur));
            setUser(utilisateur);
            
            return { success: true };
        } catch (error) {
            setError(error.response?.data?.message || 'Erreur de connexion');
            return { success: false, error: error.response?.data?.message };
        }
    };

    const logout = async () => {
        try {
            await authService.logout();
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
        }
    };

    const value = {
        user,
        loading,
        error,
        login,
        logout,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'Admin',
        isManagerRH: user?.role === 'Manager RH',
        isManager: user?.role === 'Manager'
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};