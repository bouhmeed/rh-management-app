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

                {/* ZONE 1: ALERTES ET INFORMATIONS - 3 cartes sur même ligne */}
                <Grid container spacing={3} sx={{ mb: 3 }}>
                    {/* Alertes congés urgentes */}
                    {mesConges.filter(c => c.statut === 'En attente').length > 0 && (
                        <Grid item xs={12} md={4}>
                            <Card elevation={3} sx={{ bgcolor: 'warning.50', border: '2px solid', borderColor: 'warning.main', height: '100%' }}>
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
                                            fullWidth
                                        >
                                            Traiter les demandes
                                        </Button>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    )}

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
                </Grid>

                {/* ZONE 2: STATISTIQUES PERSONNELLES */}
                <Grid container spacing={3} sx={{ mb: 3 }}>
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

                {/* ZONE 3: ACTIONS RAPIDES */}
                <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item xs={12}>
                        <Paper elevation={2} sx={{ p: 3, bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.200' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40, mr: 2 }}>
                                        <Work />
                                    </Avatar>
                                    <Typography variant="h6" fontWeight="bold" color="primary.dark">
                                        Actions rapides
                                    </Typography>
                                </Box>
                                <Chip label="Accès rapide" size="small" color="primary" variant="outlined" />
                            </Box>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Button
                                        variant="contained"
                                        fullWidth
                                        startIcon={<EventNote />}
                                        onClick={() => navigate('/conges')}
                                        sx={{ p: 2, bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }}
                                    >
                                        Demander un congé
                                    </Button>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Button
                                        variant="outlined"
                                        fullWidth
                                        startIcon={<Today />}
                                        onClick={() => navigate('/presences')}
                                        sx={{ p: 2 }}
                                    >
                                        Voir mes présences
                                    </Button>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Button
                                        variant="outlined"
                                        fullWidth
                                        startIcon={<AccountCircle />}
                                        onClick={() => navigate('/profil')}
                                        sx={{ p: 2 }}
                                    >
                                        Mon profil
                                    </Button>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Button
                                        variant="outlined"
                                        fullWidth
                                        startIcon={<Work />}
                                        onClick={() => navigate('/contrats')}
                                        sx={{ p: 2 }}
                                    >
                                        Mon contrat
                                    </Button>
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>
                </Grid>

                {/* ZONE 4: PRINCIPALE - Planning et Résumé équilibrés */}
                <Grid container spacing={3}>
                    {/* Planning de la semaine - Espace équilibré */}
                    <Grid item xs={12} md={6}>
                        <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Avatar sx={{ bgcolor: 'info.main', width: 36, height: 36, mr: 2 }}>
                                        <CalendarMonth />
                                    </Avatar>
                                    <Typography variant="h6" fontWeight="bold" color="info.dark">
                                        Mon planning de la semaine
                                    </Typography>
                                </Box>
                                <Chip 
                                    label={`Semaine ${Math.ceil((new Date().getDate() + new Date().getDay()) / 7)}`} 
                                    size="small" 
                                    color="info" 
                                    variant="outlined"
                                />
                            </Box>
                            
                            <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                                {/* En-tête des jours */}
                                <Grid container spacing={0.5} sx={{ mb: 1 }}>
                                    {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((jour, index) => {
                                        const date = new Date();
                                        date.setDate(date.getDate() - date.getDay() + index + 1);
                                        const estAujourdhui = date.toDateString() === new Date().toDateString();
                                        const estWeekend = index >= 5;
                                        
                                        return (
                                            <Grid item xs key={jour} sx={{ textAlign: 'center' }}>
                                                <Box sx={{ 
                                                    bgcolor: estAujourdhui ? 'info.main' : estWeekend ? 'grey.200' : 'transparent',
                                                    color: estAujourdhui ? 'info.contrastText' : estWeekend ? 'text.secondary' : 'text.primary',
                                                    p: 1,
                                                    borderRadius: 1,
                                                    border: estAujourdhui ? '2px solid' : '1px solid',
                                                    borderColor: estAujourdhui ? 'info.dark' : 'divider'
                                                }}>
                                                    <Typography variant="caption" fontWeight={estAujourdhui ? 'bold' : 'normal'} sx={{ fontSize: '0.7rem' }}>
                                                        {jour}
                                                    </Typography>
                                                    <Typography variant="h6" sx={{ fontSize: '0.9rem', fontWeight: 'bold', my: 0.5 }}>
                                                        {date.getDate()}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ fontSize: '0.5rem' }}>
                                                        {date.toLocaleDateString('fr', { month: 'short' })}
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                        );
                                    })}
                                </Grid>
                                
                                {/* Statut des jours basés sur les données réelles */}
                                <Grid container spacing={0.5}>
                                    {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((jour, index) => {
                                        const date = new Date();
                                        date.setDate(date.getDate() - date.getDay() + index + 1);
                                        const estWeekend = index >= 5;
                                        const estAujourdhui = date.toDateString() === new Date().toDateString();
                                        
                                        // Vérifier si l'employé a un congé ce jour
                                        const aUnConge = mesConges.some(conge => {
                                            const dateDebut = new Date(conge.dateDebut);
                                            const dateFin = new Date(conge.dateFin);
                                            dateDebut.setHours(0, 0, 0, 0);
                                            dateFin.setHours(23, 59, 59, 999);
                                            const dateCourante = new Date(date);
                                            dateCourante.setHours(12, 0, 0, 0);
                                            return dateCourante >= dateDebut && dateCourante <= dateFin && 
                                                   (conge.statut === 'Approuvé' || conge.statut === 'En attente');
                                        });
                                        
                                        const congeDuJour = mesConges.find(conge => {
                                            const dateDebut = new Date(conge.dateDebut);
                                            const dateFin = new Date(conge.dateFin);
                                            dateDebut.setHours(0, 0, 0, 0);
                                            dateFin.setHours(23, 59, 59, 999);
                                            const dateCourante = new Date(date);
                                            dateCourante.setHours(12, 0, 0, 0);
                                            return dateCourante >= dateDebut && dateCourante <= dateFin && 
                                                   (conge.statut === 'Approuvé' || conge.statut === 'En attente');
                                        });
                                        
                                        return (
                                            <Grid item xs key={jour}>
                                                <Box 
                                                    sx={{ 
                                                        height: 45, 
                                                        bgcolor: estWeekend ? 'grey.100' : 
                                                                aUnConge ? (congeDuJour?.statut === 'Approuvé' ? 'warning.light' : 'warning.main') : 
                                                                estAujourdhui ? 'info.light' : 'success.light',
                                                        borderRadius: 1,
                                                        border: estAujourdhui ? '2px solid' : aUnConge ? '2px solid' : '1px solid',
                                                        borderColor: estAujourdhui ? 'info.main' : aUnConge ? 'warning.main' : 'divider',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s',
                                                        '&:hover': {
                                                            transform: 'translateY(-1px)',
                                                            boxShadow: 1
                                                        }
                                                    }}
                                                >
                                                    {estWeekend ? (
                                                        <Typography variant="caption" sx={{ fontSize: '0.6rem', fontWeight: 'bold' }}>Weekend</Typography>
                                                    ) : aUnConge ? (
                                                        <EventNote sx={{ fontSize: 14, color: congeDuJour?.statut === 'Approuvé' ? 'warning.main' : 'warning.dark' }} />
                                                    ) : estAujourdhui ? (
                                                        <AccessTime sx={{ fontSize: 14 }} />
                                                    ) : (
                                                        <CheckCircle sx={{ fontSize: 14 }} />
                                                    )}
                                                </Box>
                                            </Grid>
                                        );
                                    })}
                                </Grid>
                            </Box>
                            
                            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<Today />}
                                    onClick={() => navigate('/presences')}
                                    sx={{ color: 'info.main', borderColor: 'info.main' }}
                                >
                                    Voir le planning complet
                                </Button>
                            </Box>
                        </Paper>
                    </Grid>

                    {/* Résumé hebdomadaire - Espace équilibré */}
                    <Grid item xs={12} md={6}>
                        <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Avatar sx={{ bgcolor: 'secondary.main', width: 36, height: 36, mr: 2 }}>
                                        <TrendingUp />
                                    </Avatar>
                                    <Typography variant="h6" fontWeight="bold" color="secondary.dark">
                                        Résumé hebdomadaire
                                    </Typography>
                                </Box>
                                <Chip label="Cette semaine" size="small" color="secondary" variant="outlined" />
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
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        {/* Cartes statistiques compactes */}
                                        <Grid container spacing={2}>
                                            <Grid item xs={6}>
                                                <Card elevation={1} sx={{ bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.200' }}>
                                                    <CardContent sx={{ p: 1.5, textAlign: 'center' }}>
                                                        <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32, mx: 'auto', mb: 1 }}>
                                                            <Work sx={{ fontSize: 18 }} />
                                                        </Avatar>
                                                        <Typography variant="h5" color="primary.main" fontWeight="bold">
                                                            {joursTravailles.toFixed(1)}
                                                        </Typography>
                                                        <Typography variant="caption" color="textSecondary">
                                                            Jours travaillés
                                                        </Typography>
                                                    </CardContent>
                                                </Card>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Card elevation={1} sx={{ bgcolor: 'warning.50', border: '1px solid', borderColor: 'warning.200' }}>
                                                    <CardContent sx={{ p: 1.5, textAlign: 'center' }}>
                                                        <Avatar sx={{ bgcolor: 'warning.main', width: 32, height: 32, mx: 'auto', mb: 1 }}>
                                                            <EventNote sx={{ fontSize: 18 }} />
                                                        </Avatar>
                                                        <Typography variant="h5" color="warning.main" fontWeight="bold">
                                                            {joursCongeSemaine.toFixed(1)}
                                                        </Typography>
                                                        <Typography variant="caption" color="textSecondary">
                                                            Jours congé
                                                        </Typography>
                                                    </CardContent>
                                                </Card>
                                            </Grid>
                                        </Grid>

                                        {/* Taux de présence */}
                                        <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                                            <Typography variant="body2" gutterBottom fontWeight="bold" sx={{ display: 'flex', alignItems: 'center' }}>
                                                <TrendingUp sx={{ mr: 1, fontSize: 16 }} />
                                                Taux de présence
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Box sx={{ flex: 1 }}>
                                                    <LinearProgress 
                                                        variant="determinate" 
                                                        value={tauxPresence} 
                                                        sx={{ 
                                                            height: 10, 
                                                            borderRadius: 5,
                                                            bgcolor: 'grey.200',
                                                            '& .MuiLinearProgress-bar': {
                                                                bgcolor: tauxPresence >= 80 ? 'success.main' : tauxPresence >= 60 ? 'warning.main' : 'error.main',
                                                                borderRadius: 5
                                                            }
                                                        }} 
                                                    />
                                                </Box>
                                                <Typography variant="h6" fontWeight="bold" 
                                                          color={tauxPresence >= 80 ? 'success.main' : tauxPresence >= 60 ? 'warning.main' : 'error.main'}>
                                                    {tauxPresence}%
                                                </Typography>
                                            </Box>
                                        </Box>

                                        {/* Informations additionnelles */}
                                        <Grid container spacing={2}>
                                            <Grid item xs={6}>
                                                <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'success.50', borderRadius: 1 }}>
                                                    <Typography variant="h6" color="success.main" fontWeight="bold">
                                                        {(joursTravailles * 8).toFixed(0)}h
                                                    </Typography>
                                                    <Typography variant="caption" color="textSecondary">
                                                        Heures cette semaine
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'info.50', borderRadius: 1 }}>
                                                    <Typography variant="h6" color="info.main" fontWeight="bold">
                                                        2
                                                    </Typography>
                                                    <Typography variant="caption" color="textSecondary">
                                                        Jours weekend
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                        </Grid>
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