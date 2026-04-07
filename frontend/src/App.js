// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Employes from './pages/Employes';
import Conges from './pages/Conges';
import Departements from './pages/Departements';
import Presence from './pages/Presence';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Profil from './pages/Profil';
import Layout from './components/Layout';

// Création du thème personnalisé
const theme = createTheme({
    palette: {
        primary: {
            main: '#1976d2',
            light: '#42a5f5',
            dark: '#1565c0'
        },
        secondary: {
            main: '#9c27b0',
            light: '#ba68c8',
            dark: '#7b1fa2'
        }
    },
    typography: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        h4: {
            fontWeight: 600
        }
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    borderRadius: 8
                }
            }
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 12
                }
            }
        }
    }
});

// Route protégée
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();
    
    if (loading) {
        return <div>Chargement...</div>;
    }
    
    return isAuthenticated ? children : <Navigate to="/login" />;
};

function AppContent() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                }
            />
            <Route path="/" element={<Navigate to="/dashboard" />} />

            <Route
    path="/employes"
    element={
        <ProtectedRoute>
            <Employes />
        </ProtectedRoute>
    }
/>
<Route
    path="/conges"
    element={
        <ProtectedRoute>
            <Conges />
        </ProtectedRoute>
    }
/>
<Route
    path="/departements"
    element={
        <ProtectedRoute>
            <Departements />
        </ProtectedRoute>
    }
/>
<Route
    path="/presences"
    element={
        <ProtectedRoute>
            <Presence />
        </ProtectedRoute>
    }
/>
<Route
    path="/profil"
    element={
        <ProtectedRoute>
            <Profil />
        </ProtectedRoute>
    }
/>
<Route
    path="/contrats"
    element={
        <ProtectedRoute>
            <Layout><div>Contrats page - Coming soon</div></Layout>
        </ProtectedRoute>
    }
/>
<Route
    path="/paie"
    element={
        <ProtectedRoute>
            <Layout><div>Paie page - Coming soon</div></Layout>
        </ProtectedRoute>
    }
/>
<Route
    path="/rapports"
    element={
        <ProtectedRoute>
            <Layout><div>Rapports page - Coming soon</div></Layout>
        </ProtectedRoute>
    }
/>
<Route
    path="/parametres"
    element={
        <ProtectedRoute>
            <Layout><div>Paramètres page - Coming soon</div></Layout>
        </ProtectedRoute>
    }
/>
        </Routes>
    );
}

function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <AuthProvider>
                <Router>
                    <AppContent />
                </Router>
                <ToastContainer
                    position="top-right"
                    autoClose={5000}
                    hideProgressBar={false}
                    newestOnTop
                    closeOnClick
                    rtl={false}
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                />
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;