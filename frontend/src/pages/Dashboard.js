// frontend/src/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import {
    Grid,
    Paper,
    Typography,
    Box,
    Card,
    CardContent,
    LinearProgress,
    Avatar,
    Chip
} from '@mui/material';
import {
    People,
    EventNote,
    AttachMoney,
    Business,
    TrendingUp,
    Warning
} from '@mui/icons-material';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { employeService, congeService } from '../services/api';
import Layout from '../components/Layout';
import Loader from '../components/Loader';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalEmployes: 0,
        congesEnAttente: 0,
        departements: 0,
        masseSalariale: 0
    });
    const [employes, setEmployes] = useState([]);
    const [conges, setConges] = useState([]);
    const { user } = useAuth();

    useEffect(() => {
        chargerDonnees();
    }, []);

    const chargerDonnees = async () => {
        try {
            setLoading(true);
            
            // Charger les employés
            const employesRes = await employeService.getAll({ limit: 100 });
            setEmployes(employesRes.data.data || []);
            
            // Charger les congés
            const congesRes = await congeService.getAll();
            setConges(congesRes.data.data || []);
            
            // Calculer les statistiques
            const totalEmployes = employesRes.data.total || 0;
            const congesEnAttente = (congesRes.data.data || []).filter(c => c.statut === 'En attente').length;
            
            // Compter les départements uniques
            const depts = new Set((employesRes.data.data || []).map(e => e.departement?.nomDepartement).filter(Boolean));
            
            // Calculer la masse salariale
            const masseSalariale = (employesRes.data.data || []).reduce((sum, e) => sum + (e.salaire || 0), 0);
            
            setStats({
                totalEmployes,
                congesEnAttente,
                departements: depts.size,
                masseSalariale
            });
            
        } catch (error) {
            console.error('Erreur chargement dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    // Données pour les graphiques
    const donneesEmployesParDept = Object.entries(
        employes.reduce((acc, emp) => {
            const dept = emp.departement?.nomDepartement || 'Non assigné';
            acc[dept] = (acc[dept] || 0) + 1;
            return acc;
        }, {})
    ).map(([name, value]) => ({ name, value }));

    const donneesCongesParMois = [
        { mois: 'Jan', conges: 4 },
        { mois: 'Fév', conges: 3 },
        { mois: 'Mar', conges: 7 },
        { mois: 'Avr', conges: 5 },
        { mois: 'Mai', conges: 8 },
        { mois: 'Juin', conges: 6 }
    ];

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

    const StatCard = ({ title, value, icon, color, trend }) => (
        <Card elevation={2}>
            <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography color="textSecondary" variant="body2" gutterBottom>
                            {title}
                        </Typography>
                        <Typography variant="h4" component="div" fontWeight="bold">
                            {value}
                        </Typography>
                        {trend && (
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                <TrendingUp fontSize="small" sx={{ color: 'success.main', mr: 0.5 }} />
                                <Typography variant="body2" color="success.main">
                                    {trend}
                                </Typography>
                            </Box>
                        )}
                    </Box>
                    <Avatar sx={{ bgcolor: color, width: 56, height: 56 }}>
                        {icon}
                    </Avatar>
                </Box>
            </CardContent>
        </Card>
    );

    if (loading) return <Layout><Loader /></Layout>;

    return (
        <Layout>
            <Typography variant="h4" gutterBottom fontWeight="bold">
                Tableau de bord
            </Typography>
            
            <Typography variant="body1" color="textSecondary" paragraph>
                Bienvenue, {user?.email}
            </Typography>

            {/* Cartes statistiques */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Employés"
                        value={stats.totalEmployes}
                        icon={<People />}
                        color="#1976d2"
                        trend="+12% ce mois"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Congés en attente"
                        value={stats.congesEnAttente}
                        icon={<EventNote />}
                        color="#ed6c02"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Départements"
                        value={stats.departements}
                        icon={<Business />}
                        color="#2e7d32"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Masse salariale"
                        value={`${stats.masseSalariale.toLocaleString()} DT`}
                        icon={<AttachMoney />}
                        color="#9c27b0"
                    />
                </Grid>
            </Grid>

            {/* Graphiques */}
            <Grid container spacing={3}>
                {/* Graphique des employés par département */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Répartition des employés par département
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={donneesEmployesParDept}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={(entry) => `${entry.name}: ${entry.value}`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {donneesEmployesParDept.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                {/* Graphique des congés */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Évolution des congés
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={donneesCongesParMois}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="mois" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="conges" stroke="#1976d2" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                {/* Alertes et notifications */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Alertes récentes
                        </Typography>
                        <Grid container spacing={2}>
                            {stats.congesEnAttente > 0 && (
                                <Grid item xs={12}>
                                    <Chip
                                        icon={<Warning />}
                                        label={`${stats.congesEnAttente} demande(s) de congé en attente d'approbation`}
                                        color="warning"
                                        variant="outlined"
                                        sx={{ mr: 1, mb: 1 }}
                                    />
                                </Grid>
                            )}
                            {/* Autres alertes... */}
                        </Grid>
                    </Paper>
                </Grid>
            </Grid>
        </Layout>
    );
};

export default Dashboard;