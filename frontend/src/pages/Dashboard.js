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
    Chip,
    Button,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Divider,
    CircularProgress
} from '@mui/material';
import {
    People,
    EventNote,
    AttachMoney,
    Business,
    TrendingUp,
    Warning,
    Today,
    AccessTime,
    CheckCircle,
    Pending,
    CalendarMonth,
    AccountCircle,
    Work,
    Notifications
} from '@mui/icons-material';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { employeService, congeService, presenceService } from '../services/api';
import Layout from '../components/Layout';
import Loader from '../components/Loader';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

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
    const [employeeStats, setEmployeeStats] = useState({
        mesConges: 0,
        congesEnAttente: 0,
        presencesMois: 0,
        soldeConges: 20
    });
    const [mesConges, setMesConges] = useState([]);
    const { user, isAdmin, isManagerRH } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        chargerDonnees();
    }, []);

    const chargerDonnees = async () => {
        try {
            setLoading(true);
            
            if (isAdmin || isManagerRH) {
                // Vue Admin/Manager - charger toutes les données
                const employesRes = await employeService.getAll({ limit: 100 });
                setEmployes(employesRes.data.data || []);
                
                const congesRes = await congeService.getAll();
                setConges(congesRes.data.data || []);
                
                // Calculer les statistiques admin
                const totalEmployes = employesRes.data.total || 0;
                const congesEnAttente = (congesRes.data.data || []).filter(c => c.statut === 'En attente').length;
                const depts = new Set((employesRes.data.data || []).map(e => e.departement?.nomDepartement).filter(Boolean));
                const masseSalariale = (employesRes.data.data || []).reduce((sum, e) => sum + (e.salaire || 0), 0);
                
                setStats({
                    totalEmployes,
                    congesEnAttente,
                    departements: depts.size,
                    masseSalariale
                });
            } else {
                // Vue Employé - charger uniquement les données personnelles
                try {
                    const congesRes = await congeService.getMyConges();
                    const mesCongesData = congesRes.data.data || [];
                    setMesConges(mesCongesData);
                    
                    const congesEnAttenteCount = mesCongesData.filter(c => c.statut === 'En attente').length;
                    const congesApprouvesCount = mesCongesData.filter(c => c.statut === 'Approuvé').length;
                    
                    setEmployeeStats({
                        mesConges: mesCongesData.length,
                        congesEnAttente: congesEnAttenteCount,
                        presencesMois: 22, // Simulé - à remplacer avec API réelle
                        soldeConges: 20 - congesApprouvesCount // Simulé - à remplacer avec API réelle
                    });
                } catch (error) {
                    console.error('Erreur chargement données employé:', error);
                    // Données par défaut si erreur
                    setEmployeeStats({
                        mesConges: 0,
                        congesEnAttente: 0,
                        presencesMois: 0,
                        soldeConges: 20
                    });
                }
            }
            
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

    // Calculate real congé data by month
    const donneesCongesParMois = (() => {
        const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
        const today = new Date();
        const last6Months = [];
        
        // Get last 6 months
        for (let i = 5; i >= 0; i--) {
            const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
            last6Months.push({
                year: date.getFullYear(),
                month: date.getMonth(),
                name: monthNames[date.getMonth()]
            });
        }
        
        // Group conges by month
        const congesByMonth = last6Months.map(monthInfo => {
            const monthConges = conges.filter(conge => {
                const congeDate = new Date(conge.dateDebut);
                return congeDate.getFullYear() === monthInfo.year && 
                       congeDate.getMonth() === monthInfo.month;
            });
            
            return {
                mois: monthInfo.name,
                conges: monthConges.length
            };
        });
        
        return congesByMonth;
    })();

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

    // Vue EMPLOYÉ
    if (!isAdmin && !isManagerRH) {
        return (
            <Layout>
                <Typography variant="h4" gutterBottom fontWeight="bold">
                    Mon Espace Personnel
                </Typography>
                
                <Typography variant="body1" color="textSecondary" paragraph>
                    Bienvenue, {user?.email}
                </Typography>

                {/* SECTION 1: STATISTIQUES PRINCIPALES - 4 cartes importantes */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard
                            title="Mes congés"
                            value={employeeStats.mesConges}
                            icon={<EventNote />}
                            color="#1976d2"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard
                            title="En attente"
                            value={employeeStats.congesEnAttente}
                            icon={<Pending />}
                            color="#ed6c02"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard
                            title="Présences ce mois"
                            value={employeeStats.presencesMois}
                            icon={<Today />}
                            color="#2e7d32"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard
                            title="Solde congés"
                            value={`${employeeStats.soldeConges} jours`}
                            icon={<CalendarMonth />}
                            color="#9c27b0"
                        />
                    </Grid>
                </Grid>

                {/* SECTION 2: INFORMATIONS IMPORTANTES - Alertes */}
                {mesConges.filter(c => c.statut === 'En attente').length > 0 && (
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        <Grid item xs={12}>
                            <Card elevation={3} sx={{ bgcolor: 'warning.50', border: '2px solid', borderColor: 'warning.main' }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                        <Box sx={{ flex: 1 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                <Notifications sx={{ mr: 1, color: 'warning.main', fontSize: 20 }} />
                                                <Typography variant="h6" component="div" fontWeight="bold" color="warning.dark">
                                                    Alertes congés urgentes
                                                </Typography>
                                            </Box>
                                            <Typography variant="body1" color="warning.dark" sx={{ mb: 1 }}>
                                                {mesConges.filter(c => c.statut === 'En attente').length} demande(s)
                                            </Typography>
                                            <Typography variant="body2" color="textSecondary">
                                                En attente de validation
                                            </Typography>
                                        </Box>
                                        <Avatar sx={{ bgcolor: 'warning.main', width: 48, height: 48 }}>
                                            <Warning />
                                        </Avatar>
                                    </Box>
                                    
                                    <Box sx={{ mt: 2, mb: 2 }}>
                                        {mesConges
                                            .filter(c => c.statut === 'En attente')
                                            .slice(0, 2)
                                            .map((conge, index) => (
                                                <Box key={conge._id} sx={{ mb: 1, pb: 1, borderBottom: index === 0 ? '1px solid' : 'none', borderColor: 'divider' }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                                        <EventNote sx={{ mr: 1, color: 'warning.main', fontSize: 16 }} />
                                                        <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '0.8rem' }}>
                                                            {conge.type}
                                                        </Typography>
                                                    </Box>
                                                    <Typography variant="caption" color="textSecondary" sx={{ ml: 3, fontSize: '0.7rem' }}>
                                                        {new Date(conge.dateDebut).toLocaleDateString()} - {new Date(conge.dateFin).toLocaleDateString()}
                                                    </Typography>
                                                </Box>
                                            ))}
                                    </Box>
                                    
                                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                        <Button
                                            variant="contained"
                                            color="warning"
                                            size="small"
                                            onClick={() => navigate('/conges')}
                                            startIcon={<EventNote />}
                                            sx={{ minWidth: 200 }}
                                        >
                                            Voir mes demandes
                                        </Button>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                )}

                {/* SECTION 3: INFORMATIONS PRATIQUES - Tous sur la même ligne */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    {/* Horaires de travail */}
                    <Grid item xs={12} md={4}>
                        <Card elevation={2} sx={{ bgcolor: 'secondary.50', border: '1px solid', borderColor: 'secondary.200', height: '100%' }}>
                            <CardContent sx={{ p: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <Avatar sx={{ bgcolor: 'secondary.main', width: 40, height: 40, mr: 2 }}>
                                        <AccessTime />
                                    </Avatar>
                                    <Typography variant="h6" fontWeight="bold" color="secondary.dark">
                                        Horaires de travail
                                    </Typography>
                                </Box>
                                
                                <Grid container spacing={2} sx={{ mb: 2 }}>
                                    <Grid item xs={6}>
                                        <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'white', borderRadius: 1, border: '1px solid', borderColor: 'success.main' }}>
                                            <Typography variant="caption" color="textSecondary">
                                                Entrée
                                            </Typography>
                                            <Typography variant="h5" color="success.main" fontWeight="bold">
                                                08:30
                                            </Typography>
                                            <Typography variant="caption" color="success.main">
                                                Matin
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'white', borderRadius: 1, border: '1px solid', borderColor: 'warning.main' }}>
                                            <Typography variant="caption" color="textSecondary">
                                                Sortie
                                            </Typography>
                                            <Typography variant="h5" color="warning.main" fontWeight="bold">
                                                17:30
                                            </Typography>
                                            <Typography variant="caption" color="warning.main">
                                                Soir
                                            </Typography>
                                        </Box>
                                    </Grid>
                                </Grid>
                                
                                <Box sx={{ p: 1.5, bgcolor: 'white', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                                    <Typography variant="body2" gutterBottom fontWeight="bold">
                                        Résumé quotidien
                                    </Typography>
                                    <Grid container spacing={1}>
                                        <Grid item xs={6}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Typography variant="caption" color="textSecondary">
                                                    Temps travail
                                                </Typography>
                                                <Typography variant="body2" fontWeight="bold" color="secondary.main">
                                                    8h00
                                                </Typography>
                                            </Box>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Typography variant="caption" color="textSecondary">
                                                    Pause
                                                </Typography>
                                                <Typography variant="body2" fontWeight="bold" color="info.main">
                                                    1h00
                                                </Typography>
                                            </Box>
                                        </Grid>
                                    </Grid>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                                        <Typography variant="caption" color="textSecondary">
                                            Temps au bureau
                                        </Typography>
                                        <Typography variant="body2" fontWeight="bold" color="success.main">
                                            9h00
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Prochain jour férié */}
                    <Grid item xs={12} md={4}>
                        {(() => {
                            const joursFeries = [
                                { nom: "Jour de l'An", date: new Date(2026, 0, 1) },
                                { nom: "Lundi de Pâques", date: new Date(2026, 3, 6) },
                                { nom: "Fête du Travail", date: new Date(2026, 4, 1) },
                                { nom: "Victoire en Europe", date: new Date(2026, 4, 8) },
                                { nom: "Ascension", date: new Date(2026, 4, 29) },
                                { nom: "Lundi de Pentecôte", date: new Date(2026, 5, 19) },
                                { nom: "Fête Nationale", date: new Date(2026, 6, 14) },
                                { nom: "Assomption", date: new Date(2026, 7, 15) },
                                { nom: "Toussaint", date: new Date(2026, 10, 1) },
                                { nom: "Armistice", date: new Date(2026, 10, 11) },
                                { nom: "Noël", date: new Date(2026, 11, 25) }
                            ];

                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            
                            const prochainFerie = joursFeries.find(ferie => {
                                const dateFerie = new Date(ferie.date);
                                dateFerie.setHours(0, 0, 0, 0);
                                return dateFerie > today;
                            });

                            const joursJusquaFerie = prochainFerie ? 
                                Math.ceil((prochainFerie.date - today) / (1000 * 60 * 60 * 24)) : null;

                            return (
                                <Card elevation={2} sx={{ bgcolor: 'info.50', border: '1px solid', borderColor: 'info.200', height: '100%' }}>
                                    <CardContent sx={{ p: 2 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                            <Avatar sx={{ bgcolor: 'info.main', width: 40, height: 40, mr: 2 }}>
                                                <CalendarMonth />
                                            </Avatar>
                                            <Typography variant="h6" fontWeight="bold" color="info.dark">
                                                Prochain jour férié
                                            </Typography>
                                        </Box>
                                        
                                        {prochainFerie ? (
                                            <Box>
                                                <Typography variant="h5" color="info.main" fontWeight="bold" gutterBottom sx={{ fontSize: '1.2rem' }}>
                                                    {prochainFerie.nom}
                                                </Typography>
                                                <Typography variant="body2" color="textSecondary" sx={{ mb: 2, fontSize: '0.8rem' }}>
                                                    {prochainFerie.date.toLocaleDateString('fr-FR', { 
                                                        weekday: 'short', 
                                                        month: 'short', 
                                                        day: 'numeric' 
                                                    })}
                                                </Typography>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                                    <Chip 
                                                        label={`J-${joursJusquaFerie}`} 
                                                        size="small" 
                                                        color="info" 
                                                        variant="filled"
                                                    />
                                                    <Typography variant="caption" color="textSecondary">
                                                        {joursJusquaFerie} jour{joursJusquaFerie > 1 ? 's' : ''}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ textAlign: 'center', mt: 2 }}>
                                                    <Typography variant="h4" color="info.main" fontWeight="bold">
                                                        {joursJusquaFerie}
                                                    </Typography>
                                                    <Typography variant="caption" color="textSecondary">
                                                        jours restants
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        ) : (
                                            <Box sx={{ textAlign: 'center', py: 2 }}>
                                                <CalendarMonth sx={{ fontSize: 48, color: 'info.light', mb: 1 }} />
                                                <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic' }}>
                                                    Aucun jour férié à venir
                                                </Typography>
                                            </Box>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })()}
                    </Grid>

                    {/* Résumé hebdomadaire */}
                    <Grid item xs={12} md={4}>
                        <Paper elevation={2} sx={{ p: 1.5, height: '100%' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Avatar sx={{ bgcolor: 'secondary.main', width: 28, height: 28, mr: 1 }}>
                                        <TrendingUp sx={{ fontSize: 16 }} />
                                    </Avatar>
                                    <Typography variant="subtitle1" fontWeight="bold" color="secondary.dark" sx={{ fontSize: '0.95rem' }}>
                                        Résumé hebdomadaire
                                    </Typography>
                                </Box>
                                <Chip label="Cette semaine" size="small" color="secondary" variant="outlined" sx={{ fontSize: '0.7rem', height: 20 }} />
                            </Box>
                            
                            {/* Calculer les statistiques réelles */}
                            {(() => {
                                const today = new Date();
                                const startOfWeek = new Date(today);
                                startOfWeek.setDate(today.getDate() - today.getDay() + 1);
                                const endOfWeek = new Date(startOfWeek);
                                endOfWeek.setDate(startOfWeek.getDate() + 6);
                
                                const congesSemaine = mesConges.filter(conge => {
                                    const dateDebut = new Date(conge.dateDebut);
                                    const dateFin = new Date(conge.dateFin);
                                    return (dateDebut <= endOfWeek && dateFin >= startOfWeek) && 
                                           (conge.statut === 'Approuvé' || conge.statut === 'En attente');
                                });
                                
                                let joursCongeSemaine = 0;
                                congesSemaine.forEach(conge => {
                                    const dateDebut = new Date(conge.dateDebut);
                                    const dateFin = new Date(conge.dateFin);
                                    const debutSemaine = new Date(Math.max(dateDebut, startOfWeek));
                                    const finSemaine = new Date(Math.min(dateFin, endOfWeek));
                                    const jours = Math.ceil((finSemaine - debutSemaine) / (1000 * 60 * 60 * 24)) + 1;
                                    joursCongeSemaine += Math.max(0, jours);
                                });
                                
                                const joursTravailles = 5 - joursCongeSemaine;
                                const tauxPresence = ((joursTravailles / 5) * 100).toFixed(0);
                                
                                return (
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                        {/* Cartes statistiques ultra-compactes - 2x2 grid */}
                                        <Grid container spacing={1.5}>
                                            <Grid item xs={6}>
                                                <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'primary.50', borderRadius: 1.5, border: '1px solid', borderColor: 'primary.200', mb: 1.5 }}>
                                                    <Work sx={{ fontSize: 18, color: 'primary.main', mb: 0.75 }} />
                                                    <Typography variant="h5" color="primary.main" fontWeight="bold" sx={{ fontSize: '1.3rem', lineHeight: 1.2 }}>
                                                        {joursTravailles.toFixed(1)}
                                                    </Typography>
                                                    <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.8rem', lineHeight: 1.2 }}>
                                                        Jours travail
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'success.50', borderRadius: 1.5, border: '1px solid', borderColor: 'success.200' }}>
                                                    <Typography variant="h5" color="success.main" fontWeight="bold" sx={{ fontSize: '1.3rem', lineHeight: 1.2 }}>
                                                        {(joursTravailles * 8).toFixed(0)}h
                                                    </Typography>
                                                    <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.8rem', lineHeight: 1.2 }}>
                                                        Heures sem.
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'warning.50', borderRadius: 1.5, border: '1px solid', borderColor: 'warning.200', mb: 1.5 }}>
                                                    <EventNote sx={{ fontSize: 18, color: 'warning.main', mb: 0.75 }} />
                                                    <Typography variant="h5" color="warning.main" fontWeight="bold" sx={{ fontSize: '1.3rem', lineHeight: 1.2 }}>
                                                        {joursCongeSemaine.toFixed(1)}
                                                    </Typography>
                                                    <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.8rem', lineHeight: 1.2 }}>
                                                        Jours congé
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'info.50', borderRadius: 1.5, border: '1px solid', borderColor: 'info.200' }}>
                                                    <Typography variant="h5" color="info.main" fontWeight="bold" sx={{ fontSize: '1.3rem', lineHeight: 1.2 }}>
                                                        2
                                                    </Typography>
                                                    <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.8rem', lineHeight: 1.2 }}>
                                                        Weekend
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                        </Grid>

                                        {/* Taux de présence compact */}
                                        <Box sx={{ p: 1, bgcolor: 'background.default', borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}>
                                            <Typography variant="caption" gutterBottom fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', fontSize: '0.8rem', mb: 0.5 }}>
                                                <TrendingUp sx={{ mr: 0.5, fontSize: 14 }} />
                                                Taux présence
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                                <Box sx={{ flex: 1 }}>
                                                    <LinearProgress 
                                                        variant="determinate" 
                                                        value={tauxPresence} 
                                                        sx={{ 
                                                            height: 6, 
                                                            borderRadius: 3,
                                                            bgcolor: 'grey.200',
                                                            '& .MuiLinearProgress-bar': {
                                                                bgcolor: tauxPresence >= 80 ? 'success.main' : tauxPresence >= 60 ? 'warning.main' : 'error.main',
                                                                borderRadius: 3
                                                            }
                                                        }} 
                                                    />
                                                </Box>
                                                <Typography variant="caption" fontWeight="bold" 
                                                          color={tauxPresence >= 80 ? 'success.main' : tauxPresence >= 60 ? 'warning.main' : 'error.main'}
                                                          sx={{ fontSize: '0.8rem' }}>
                                                    {tauxPresence}%
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Box>
                                );

                            })()}
                        </Paper>
                    </Grid>
                </Grid>

                </Layout>
        );
    }

    // Vue ADMIN/MANAGER (existante)
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