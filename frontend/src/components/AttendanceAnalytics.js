// frontend/src/components/AttendanceAnalytics.js
import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    CircularProgress,
    Alert,
    Tabs,
    Tab,
    Paper,
    TextField
} from '@mui/material';
import {
    TrendingUp,
    AccessTime,
    Warning,
    People,
    BarChart as BarChartIcon
} from '@mui/icons-material';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart as RechartsPieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    Legend,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';
import { presenceService, employeService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

const AttendanceAnalytics = ({ viewMode = 'admin' }) => {
    const { isAdmin, isManagerRH } = useAuth();
    const [tabValue, setTabValue] = useState(0);
    const [period, setPeriod] = useState('month');
    const [dateRange, setDateRange] = useState({
        start: dayjs().subtract(30, 'day'),
        end: dayjs()
    });
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [employees, setEmployees] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState('');

    const COLORS = ['#1976d2', '#dc004e', '#ffc107', '#4caf50', '#ff9800', '#9c27b0'];

    const fetchAnalytics = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                period,
                dateDebut: dateRange.start.format('YYYY-MM-DD'),
                dateFin: dateRange.end.format('YYYY-MM-DD')
            };

            if (selectedEmployee) {
                params.employe = selectedEmployee;
            }

            const response = await presenceService.getAnalytics(params);
            setAnalytics(response.data.data);
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    }, [period, dateRange, selectedEmployee]);

    const fetchEmployees = async () => {
        try {
            const response = await employeService.getAll();
            setEmployees(response.data.data);
        } catch (error) {
            console.error('Error fetching employees:', error);
        }
    };

    useEffect(() => {
        fetchAnalytics();
        if (isAdmin || isManagerRH) {
            fetchEmployees();
        }
    }, [tabValue, fetchAnalytics, isAdmin, isManagerRH]);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const renderOverviewTab = () => (
        <Grid container spacing={3}>
            {/* KPI Cards */}
            <Grid item xs={12} sm={6} md={3}>
                <Card>
                    <CardContent>
                        <Box display="flex" alignItems="center" gap={2}>
                            <Box sx={{ p: 1, bgcolor: 'primary.main', borderRadius: 1 }}>
                                <People sx={{ color: 'white' }} />
                            </Box>
                            <Box>
                                <Typography variant="h4">
                                    {analytics?.overview?.totalEmployees || 0}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Employés actifs
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
                            <Box sx={{ p: 1, bgcolor: 'success.main', borderRadius: 1 }}>
                                <AccessTime sx={{ color: 'white' }} />
                            </Box>
                            <Box>
                                <Typography variant="h4">
                                    {analytics?.overview?.avgWorkHours?.toFixed(1) || 0}h
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Moyenne heures/jour
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
                            <Box sx={{ p: 1, bgcolor: 'warning.main', borderRadius: 1 }}>
                                <Warning sx={{ color: 'white' }} />
                            </Box>
                            <Box>
                                <Typography variant="h4">
                                    {analytics?.overview?.anomalyRate?.toFixed(1) || 0}%
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Taux d'anomalies
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
                            <Box sx={{ p: 1, bgcolor: 'info.main', borderRadius: 1 }}>
                                <TrendingUp sx={{ color: 'white' }} />
                            </Box>
                            <Box>
                                <Typography variant="h4">
                                    {analytics?.overview?.overtimeHours?.toFixed(1) || 0}h
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Heures sup. totales
                                </Typography>
                            </Box>
                        </Box>
                    </CardContent>
                </Card>
            </Grid>

            {/* Trend Chart */}
            <Grid item xs={12} md={8}>
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Tendance des présences
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={analytics?.trends || []}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <RechartsTooltip />
                                <Legend />
                                <Area
                                    type="monotone"
                                    dataKey="present"
                                    stackId="1"
                                    stroke="#4caf50"
                                    fill="#4caf50"
                                    name="Présents"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="absent"
                                    stackId="1"
                                    stroke="#dc004e"
                                    fill="#dc004e"
                                    name="Absents"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </Grid>

            {/* Distribution Pie Chart */}
            <Grid item xs={12} md={4}>
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Répartition des heures
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <RechartsPieChart>
                                <Pie
                                    data={analytics?.distribution || []}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                    label
                                >
                                    {(analytics?.distribution || []).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip />
                                <Legend />
                            </RechartsPieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    );

    const renderAnomaliesTab = () => (
        <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Types d'anomalies
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={analytics?.anomalies?.types || []}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="type" />
                                <YAxis />
                                <RechartsTooltip />
                                <Bar dataKey="count" fill="#dc004e" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </Grid>
            <Grid item xs={12} md={6}>
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Anomalies par jour
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={analytics?.anomalies?.daily || []}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <RechartsTooltip />
                                <Line type="monotone" dataKey="count" stroke="#ff9800" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </Grid>
            <Grid item xs={12}>
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Top des employés avec anomalies
                        </Typography>
                        {analytics?.anomalies?.topEmployees?.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={analytics?.anomalies?.topEmployees || []}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <RechartsTooltip />
                                    <Bar dataKey="count" fill="#ffc107" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <Alert severity="success">Aucune anomalie détectée</Alert>
                        )}
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    );

    const renderPerformanceTab = () => (
        <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Performance hebdomadaire
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={analytics?.performance?.weekly || []}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="day" />
                                <YAxis />
                                <RechartsTooltip />
                                <Legend />
                                <Line type="monotone" dataKey="planned" stroke="#1976d2" name="Prévues" />
                                <Line type="monotone" dataKey="actual" stroke="#4caf50" name="Réelles" />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </Grid>
            <Grid item xs={12} md={6}>
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Efficacité des équipes
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={analytics?.performance?.teams || []}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="team" />
                                <YAxis />
                                <RechartsTooltip />
                                <Bar dataKey="efficiency" fill="#4caf50" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </Grid>
            <Grid item xs={12}>
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Classement des employés
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={analytics?.performance?.topPerformers || []}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <RechartsTooltip />
                                <Bar dataKey="hours" fill="#1976d2" />
                                <Bar dataKey="efficiency" fill="#4caf50" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    );

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box>
                {/* Filters */}
                <Paper sx={{ p: 2, mb: 3 }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={2}>
                            <FormControl fullWidth>
                                <InputLabel>Période</InputLabel>
                                <Select
                                    value={period}
                                    onChange={(e) => setPeriod(e.target.value)}
                                >
                                    <MenuItem value="week">Semaine</MenuItem>
                                    <MenuItem value="month">Mois</MenuItem>
                                    <MenuItem value="quarter">Trimestre</MenuItem>
                                    <MenuItem value="year">Année</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <DatePicker
                                label="Date début"
                                value={dateRange.start}
                                onChange={(date) => setDateRange(prev => ({ ...prev, start: date }))}
                                renderInput={(params) => <TextField {...params} fullWidth />}
                            />
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <DatePicker
                                label="Date fin"
                                value={dateRange.end}
                                onChange={(date) => setDateRange(prev => ({ ...prev, end: date }))}
                                renderInput={(params) => <TextField {...params} fullWidth />}
                            />
                        </Grid>
                        {(isAdmin || isManagerRH) && (
                            <Grid item xs={12} md={3}>
                                <FormControl fullWidth>
                                    <InputLabel>Employé</InputLabel>
                                    <Select
                                        value={selectedEmployee}
                                        onChange={(e) => setSelectedEmployee(e.target.value)}
                                    >
                                        <MenuItem value="">Tous</MenuItem>
                                        {employees.map((emp) => (
                                            <MenuItem key={emp._id} value={emp._id}>
                                                {emp.nom} {emp.prenom}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        )}
                        <Grid item xs={12} md={3}>
                            <Button
                                variant="contained"
                                onClick={fetchAnalytics}
                                startIcon={<TrendingUp />}
                                fullWidth
                            >
                                Actualiser
                            </Button>
                        </Grid>
                    </Grid>
                </Paper>

                {/* Tabs */}
                <Paper sx={{ mb: 3 }}>
                    <Tabs
                        value={tabValue}
                        onChange={handleTabChange}
                        indicatorColor="primary"
                        textColor="primary"
                        centered
                    >
                        <Tab label="Vue d'ensemble" icon={<BarChartIcon />} />
                        <Tab label="Anomalies" icon={<Warning />} />
                        <Tab label="Performance" icon={<TrendingUp />} />
                    </Tabs>
                </Paper>

                {/* Tab Content */}
                {tabValue === 0 && renderOverviewTab()}
                {tabValue === 1 && renderAnomaliesTab()}
                {tabValue === 2 && renderPerformanceTab()}
            </Box>
        </LocalizationProvider>
    );
};

export default AttendanceAnalytics;
