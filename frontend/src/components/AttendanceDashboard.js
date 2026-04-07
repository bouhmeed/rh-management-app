// frontend/src/components/AttendanceDashboard.js
import React, { useState, useEffect } from 'react';
import {
    Box,
    Grid,
    Card,
    CardContent,
    Typography,
    Button,
    Chip,
    LinearProgress,
    Avatar,
    IconButton,
    Tooltip,
    Alert,
    CircularProgress,
    Paper,
    Divider
} from '@mui/material';
import {
    PlayArrow,
    Pause,
    Stop,
    Refresh,
    AccessTime,
    CheckCircle,
    Warning,
    Error,
    Timeline,
    TrendingUp,
    Today
} from '@mui/icons-material';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { presenceService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const AttendanceDashboard = ({ viewMode = 'employee' }) => {
    const { user, isAdmin, isManagerRH } = useAuth();
    const [currentSession, setCurrentSession] = useState(null);
    const [todayStats, setTodayStats] = useState(null);
    const [weekStats, setWeekStats] = useState([]);
    const [monthlyData, setMonthlyData] = useState([]);
    const [anomalies, setAnomalies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Colors for charts
    const COLORS = ['#1976d2', '#dc004e', '#ffc107', '#4caf50', '#ff9800'];

    useEffect(() => {
        if (viewMode === 'employee' && user?.employe) {
            fetchEmployeeData();
        } else if (isAdmin || isManagerRH) {
            fetchAdminData();
        }
    }, [viewMode, user]);

    const fetchEmployeeData = async () => {
        try {
            setLoading(true);
            const [sessionRes, todayRes, weekRes, monthRes] = await Promise.all([
                presenceService.getCurrentSession(user.employe),
                presenceService.getTodayStats(user.employe),
                presenceService.getWeekStats(user.employe),
                presenceService.getMonthStats(user.employe)
            ]);

            setCurrentSession(sessionRes.data.data);
            setTodayStats(todayRes.data.data);
            setWeekStats(weekRes.data.data);
            setMonthlyData(monthRes.data.data);
        } catch (error) {
            console.error('Error fetching employee data:', error);
            toast.error('Erreur lors du chargement des données');
        } finally {
            setLoading(false);
        }
    };

    const fetchAdminData = async () => {
        try {
            setLoading(true);
            const [statsRes, anomaliesRes] = await Promise.all([
                presenceService.getAdminStats(),
                presenceService.getAnomalies()
            ]);

            setTodayStats(statsRes.data.data.today);
            setWeekStats(statsRes.data.data.week);
            setMonthlyData(statsRes.data.data.month);
            setAnomalies(anomaliesRes.data.data);
        } catch (error) {
            console.error('Error fetching admin data:', error);
            toast.error('Erreur lors du chargement des données');
        } finally {
            setLoading(false);
        }
    };

    const handleSessionAction = async (action) => {
        setActionLoading(true);
        try {
            let response;
            const employeId = user.employe;

            switch (action) {
                case 'start':
                    response = await presenceService.startWork(employeId);
                    toast.success('Session démarrée avec succès');
                    break;
                case 'pause':
                    response = await presenceService.pauseWork(employeId);
                    toast.success('Pause enregistrée');
                    break;
                case 'resume':
                    response = await presenceService.resumeWork(employeId);
                    toast.success('Reprise du travail');
                    break;
                case 'end':
                    response = await presenceService.endWork(employeId);
                    toast.success('Journée terminée');
                    break;
            }

            // Refresh current session
            const sessionRes = await presenceService.getCurrentSession(employeId);
            setCurrentSession(sessionRes.data.data);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Erreur lors de l\'action');
        } finally {
            setActionLoading(false);
        }
    };

    const getSessionStatus = () => {
        if (!currentSession) return 'not_started';
        return currentSession.sessionStatus;
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'success';
            case 'paused': return 'warning';
            case 'ended': return 'default';
            default: return 'info';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'active': return 'En cours';
            case 'paused': return 'En pause';
            case 'ended': return 'Terminé';
            default: return 'Non démarré';
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            {/* Current Session Card */}
            {viewMode === 'employee' && (
                <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)', color: 'white' }}>
                    <CardContent>
                        <Grid container alignItems="center" spacing={3}>
                            <Grid item xs={12} md={8}>
                                <Typography variant="h5" gutterBottom>
                                    Session du Jour
                                </Typography>
                                <Box display="flex" alignItems="center" gap={2} mb={2}>
                                    <Chip 
                                        label={getStatusText(getSessionStatus())}
                                        color={getStatusColor(getSessionStatus())}
                                        variant="outlined"
                                        sx={{ color: 'white', borderColor: 'white' }}
                                    />
                                    {currentSession?.startTime && (
                                        <Typography variant="body2">
                                            Démarrée: {new Date(currentSession.startTime).toLocaleTimeString()}
                                        </Typography>
                                    )}
                                </Box>
                                {currentSession?.actualWorkHours && (
                                    <Typography variant="h6">
                                        Heures travaillées: {currentSession.actualWorkHours.toFixed(1)}h
                                    </Typography>
                                )}
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Box display="flex" gap={1} justifyContent="flex-end">
                                    {getSessionStatus() === 'not_started' && (
                                        <Button
                                            variant="contained"
                                            color="secondary"
                                            startIcon={<PlayArrow />}
                                            onClick={() => handleSessionAction('start')}
                                            disabled={actionLoading}
                                            fullWidth
                                        >
                                            Démarrer
                                        </Button>
                                    )}
                                    {getSessionStatus() === 'active' && (
                                        <>
                                            <Button
                                                variant="outlined"
                                                startIcon={<Pause />}
                                                onClick={() => handleSessionAction('pause')}
                                                disabled={actionLoading}
                                                sx={{ color: 'white', borderColor: 'white' }}
                                            >
                                                Pause
                                            </Button>
                                            <Button
                                                variant="contained"
                                                color="secondary"
                                                startIcon={<Stop />}
                                                onClick={() => handleSessionAction('end')}
                                                disabled={actionLoading}
                                            >
                                                Terminer
                                            </Button>
                                        </>
                                    )}
                                    {getSessionStatus() === 'paused' && (
                                        <Button
                                            variant="contained"
                                            color="secondary"
                                            startIcon={<PlayArrow />}
                                            onClick={() => handleSessionAction('resume')}
                                            disabled={actionLoading}
                                            fullWidth
                                        >
                                            Reprendre
                                        </Button>
                                    )}
                                </Box>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            )}

            {/* Stats Overview */}
            <Grid container spacing={3} mb={3}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" gap={2}>
                                <Avatar sx={{ bgcolor: 'primary.main' }}>
                                    <Today />
                                </Avatar>
                                <Box>
                                    <Typography variant="h4">
                                        {todayStats?.totalHours || 0}h
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Aujourd'hui
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" gap={2}>
                                <Avatar sx={{ bgcolor: 'success.main' }}>
                                    <TrendingUp />
                                </Avatar>
                                <Box>
                                    <Typography variant="h4">
                                        {todayStats?.weekAverage || 0}h
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Moyenne semaine
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" gap={2}>
                                <Avatar sx={{ bgcolor: 'warning.main' }}>
                                    <Warning />
                                </Avatar>
                                <Box>
                                    <Typography variant="h4">
                                        {todayStats?.anomalies || 0}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Anomalies
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" gap={2}>
                                <Avatar sx={{ bgcolor: 'info.main' }}>
                                    <AccessTime />
                                </Avatar>
                                <Box>
                                    <Typography variant="h4">
                                        {todayStats?.overtime || 0}h
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Heures sup.
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Charts */}
            <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Évolution Hebdomadaire
                            </Typography>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={weekStats}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="day" />
                                    <YAxis />
                                    <RechartsTooltip />
                                    <Line type="monotone" dataKey="hours" stroke="#1976d2" strokeWidth={2} />
                                    <Line type="monotone" dataKey="overtime" stroke="#dc004e" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Répartition Mensuelle
                            </Typography>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={[
                                            { name: 'Normal', value: todayStats?.normalHours || 0 },
                                            { name: 'Sup.', value: todayStats?.overtime || 0 },
                                            { name: 'Absences', value: todayStats?.absences || 0 }
                                        ]}
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {[
                                            { name: 'Normal', value: todayStats?.normalHours || 0 },
                                            { name: 'Sup.', value: todayStats?.overtime || 0 },
                                            { name: 'Absences', value: todayStats?.absences || 0 }
                                        ].map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Anomalies Alert */}
            {anomalies.length > 0 && (
                <Alert severity="warning" sx={{ mt: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Anomalies détectées
                    </Typography>
                    {anomalies.slice(0, 3).map((anomaly, index) => (
                        <Typography key={index} variant="body2">
                            • {anomaly.type}: {anomaly.description}
                        </Typography>
                    ))}
                    {anomalies.length > 3 && (
                        <Typography variant="body2">
                            ... et {anomalies.length - 3} autres
                        </Typography>
                    )}
                </Alert>
            )}
        </Box>
    );
};

export default AttendanceDashboard;
