// frontend/src/pages/Presence.js
import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Tabs,
    Tab,
    Paper,
    Container,
    Alert,
    Button,
    Grid
} from '@mui/material';
import {
    Dashboard,
    TableChart,
    Analytics,
    Refresh,
    Settings
} from '@mui/icons-material';
import { presenceService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import AttendanceDashboard from '../components/AttendanceDashboard';
import AttendanceTable from '../components/AttendanceTable';
import AttendanceAnalytics from '../components/AttendanceAnalytics';
import Layout from '../components/Layout';

const Presence = () => {
    const { user, isAdmin, isManagerRH } = useAuth();
    const [tabValue, setTabValue] = useState(0);
    const [viewMode, setViewMode] = useState('employee');
    const [systemStatus, setSystemStatus] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Determine view mode based on user role
        if (isAdmin || isManagerRH) {
            setViewMode('admin');
        } else {
            setViewMode('employee');
        }
        
        fetchSystemStatus();
    }, [user]);

    const fetchSystemStatus = async () => {
        try {
            const response = await presenceService.getSystemStatus();
            setSystemStatus(response.data.data);
        } catch (error) {
            console.error('Error fetching system status:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    return (
        <Layout>
            <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
                <Box>
                    {/* Header */}
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="h4" component="h1" gutterBottom>
                            Gestion des Présences
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            {viewMode === 'admin' 
                                ? 'Suivez et gérez les présences de tous les employés'
                                : 'Gérez votre temps de travail et vos présences'
                            }
                        </Typography>
                    </Box>

                    {/* System Status Alert */}
                    {systemStatus && (
                        <Alert severity={systemStatus.status === 'healthy' ? 'success' : 'warning'} sx={{ mb: 3 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                État du système
                            </Typography>
                            <Typography variant="body2">
                                Serveur: {systemStatus.server ? '✅ Opérationnel' : '❌ Hors service'} | 
                                Base de données: {systemStatus.database ? '✅ Connectée' : '❌ Déconnectée'} | 
                                Utilisateurs actifs: {systemStatus.activeUsers || 0}
                            </Typography>
                        </Alert>
                    )}

                    {/* Navigation Tabs */}
                    <Paper sx={{ mb: 3 }}>
                        <Tabs
                            value={tabValue}
                            onChange={handleTabChange}
                            indicatorColor="primary"
                            textColor="primary"
                            variant="fullWidth"
                        >
                            <Tab 
                                icon={<Dashboard />} 
                                label="Tableau de bord" 
                                iconPosition="start"
                            />
                            <Tab 
                                icon={<TableChart />} 
                                label="Historique" 
                                iconPosition="start"
                            />
                            {(isAdmin || isManagerRH) && (
                                <Tab 
                                    icon={<Analytics />} 
                                    label="Analytiques" 
                                    iconPosition="start"
                                />
                            )}
                        </Tabs>
                    </Paper>

                    {/* Tab Content */}
                    {tabValue === 0 && (
                        <AttendanceDashboard viewMode={viewMode} />
                    )}
                    {tabValue === 1 && (
                        <AttendanceTable viewMode={viewMode} />
                    )}
                    {tabValue === 2 && (isAdmin || isManagerRH) && (
                        <AttendanceAnalytics viewMode={viewMode} />
                    )}
                </Box>
            </Container>
        </Layout>
    );
};

export default Presence;
