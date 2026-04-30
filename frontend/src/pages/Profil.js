// frontend/src/pages/Profil.js
import React, { useState, useEffect } from 'react';
import {
    Grid,
    Paper,
    Typography,
    Box,
    Avatar,
    CircularProgress,
    Chip
} from '@mui/material';
import { 
    Person, 
    Email, 
    Work, 
    Business, 
    CalendarToday,
    AccountCircle
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';
import Layout from '../components/Layout';
import ModernHeader from '../components/ModernHeader';
import ModernCard from '../components/ModernCard';

const Profil = () => {
    const { user, isAdmin, isManagerRH } = useAuth();
    const [fullUserData, setFullUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFullUserData = async () => {
            try {
                const response = await authService.getMe();
                setFullUserData(response.data.data);
            } catch (error) {
                console.error('Erreur lors de la récupération des données utilisateur:', error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchFullUserData();
        } else {
            setLoading(false);
        }
    }, [user]);

    if (loading) {
        return (
            <Layout>
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                    <CircularProgress />
                </Box>
            </Layout>
        );
    }

    if (!user) {
        return <Layout><div>Utilisateur non connecté</div></Layout>;
    }

    const isAdministrator = isAdmin || isManagerRH;
    const displayName = fullUserData?.employe?.nom 
        ? `${fullUserData.employe.prenom || ''} ${fullUserData.employe.nom}`.trim()
        : user.email;

    const employeData = fullUserData?.employe;

    return (
        <Layout>
            <ModernHeader
                title="Mon Profil"
                subtitle="Informations professionnelles"
                icon={<AccountCircle />}
            />

            {/* Carte principale du profil */}
            <Paper elevation={3} sx={{
                p: 4,
                mb: 4,
                borderRadius: 3,
                background: isAdministrator 
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                color: isAdministrator ? 'white' : 'inherit',
                border: '1px solid',
                borderColor: isAdministrator ? 'transparent' : 'grey.200'
            }}>
                <Grid container spacing={4} alignItems="center">
                    {/* Avatar et informations principales */}
                    <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
                        <Avatar 
                            sx={{ 
                                width: 100, 
                                height: 100, 
                                bgcolor: isAdministrator ? 'rgba(255, 255, 255, 0.2)' : 'primary.main',
                                fontSize: '2.5rem',
                                fontWeight: 'bold',
                                mb: 2,
                                mx: 'auto',
                                border: isAdministrator ? '2px solid rgba(255, 255, 255, 0.3)' : 'none'
                            }}
                        >
                            {displayName.charAt(0).toUpperCase()}
                        </Avatar>
                        
                        <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>
                            {displayName}
                        </Typography>
                        
                        <Chip
                            label={fullUserData?.role?.nomRole || (isAdministrator ? 'Administrateur' : 'Utilisateur')}
                            color={isAdministrator ? 'default' : 'primary'}
                            variant="outlined"
                            size="small"
                            sx={{ 
                                mb: 2,
                                bgcolor: isAdministrator ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                                color: isAdministrator ? 'white' : 'inherit',
                                borderColor: isAdministrator ? 'rgba(255, 255, 255, 0.5)' : 'inherit'
                            }}
                        />
                        
                        <Typography variant="body2" sx={{ opacity: isAdministrator ? 0.9 : 0.7 }}>
                            {employeData?.poste || (isAdministrator ? 'Administrateur Système' : 'Professionnel')}
                        </Typography>
                        {employeData?.departement && (
                            <Typography variant="body2" sx={{ opacity: isAdministrator ? 0.9 : 0.7 }}>
                                {employeData.departement.nomDepartement}
                            </Typography>
                        )}
                    </Grid>
                    
                    {/* Informations détaillées */}
                    <Grid item xs={12} md={8}>
                        <Grid container spacing={3}>
                            <Grid item xs={12} sm={6}>
                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="caption" sx={{ 
                                        textTransform: 'uppercase', 
                                        letterSpacing: 1, 
                                        mb: 1, 
                                        display: 'block',
                                        opacity: isAdministrator ? 0.8 : 0.6
                                    }}>
                                        Contact
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                        <Email sx={{ mr: 1, fontSize: 18 }} />
                                        <Typography variant="body2">
                                            {user.email}
                                        </Typography>
                                    </Box>
                                    {employeData?.telephone && (
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Person sx={{ mr: 1, fontSize: 18 }} />
                                            <Typography variant="body2">
                                                {employeData.telephone}
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>
                            </Grid>
                            
                            <Grid item xs={12} sm={6}>
                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="caption" sx={{ 
                                        textTransform: 'uppercase', 
                                        letterSpacing: 1, 
                                        mb: 1, 
                                        display: 'block',
                                        opacity: isAdministrator ? 0.8 : 0.6
                                    }}>
                                        Professionnel
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                        <Work sx={{ mr: 1, fontSize: 18 }} />
                                        <Typography variant="body2">
                                            {employeData?.poste || (isAdministrator ? 'Administrateur Système' : 'Non spécifié')}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Business sx={{ mr: 1, fontSize: 18 }} />
                                        <Typography variant="body2">
                                            {employeData?.departement?.nomDepartement || (isAdministrator ? 'Direction Générale' : 'Non assigné')}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Grid>
                            
                            <Grid item xs={12} sm={6}>
                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="caption" sx={{ 
                                        textTransform: 'uppercase', 
                                        letterSpacing: 1, 
                                        mb: 1, 
                                        display: 'block',
                                        opacity: isAdministrator ? 0.8 : 0.6
                                    }}>
                                        Système
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                        <Person sx={{ mr: 1, fontSize: 18 }} />
                                        <Typography variant="body2">
                                            {employeData?.matricule || 'N/A'}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <CalendarToday sx={{ mr: 1, fontSize: 18 }} />
                                        <Typography variant="body2">
                                            {employeData?.statut || 'Actif'}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Grid>
                            
                            <Grid item xs={12} sm={6}>
                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="caption" sx={{ 
                                        textTransform: 'uppercase', 
                                        letterSpacing: 1, 
                                        mb: 1, 
                                        display: 'block',
                                        opacity: isAdministrator ? 0.8 : 0.6
                                    }}>
                                        Adresse
                                    </Typography>
                                    {employeData?.adresse ? (
                                        <Typography variant="body2">
                                            {typeof employeData.adresse === 'string' 
                                                ? employeData.adresse 
                                                : `${employeData.adresse.rue || ''}, ${employeData.adresse.ville || ''} ${employeData.adresse.codePostal || ''}`
                                            }
                                        </Typography>
                                    ) : (
                                        <Typography variant="body2" sx={{ opacity: 0.6 }}>
                                            Non spécifiée
                                        </Typography>
                                    )}
                                </Box>
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
            </Paper>

            {/* Cartes de statistiques réelles */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={3}>
                    <ModernCard
                        title="Matricule"
                        value={employeData?.matricule || 'N/A'}
                        icon={<Person />}
                        color="#1976d2"
                    />
                </Grid>
                <Grid item xs={12} md={3}>
                    <ModernCard
                        title="Département"
                        value={employeData?.departement?.nomDepartement || 'Non assigné'}
                        icon={<Business />}
                        color="#2e7d32"
                    />
                </Grid>
                <Grid item xs={12} md={3}>
                    <ModernCard
                        title="Poste"
                        value={employeData?.poste || 'Non spécifié'}
                        icon={<Work />}
                        color="#9c27b0"
                    />
                </Grid>
                <Grid item xs={12} md={3}>
                    <ModernCard
                        title="Statut"
                        value={employeData?.statut || 'Actif'}
                        icon={<CalendarToday />}
                        color="#ed6c02"
                    />
                </Grid>
            </Grid>

            {/* Informations additionnelles (uniquement si disponibles) */}
            {(employeData?.salaire || employeData?.dateEmbauche) && (
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    {employeData?.salaire && (
                        <Grid item xs={12} md={6}>
                            <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
                                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                                    Informations financières
                                </Typography>
                                <Typography variant="body1">
                                    Salaire: {employeData.salaire.toLocaleString()} DT
                                </Typography>
                            </Paper>
                        </Grid>
                    )}
                    {employeData?.dateEmbauche && (
                        <Grid item xs={12} md={6}>
                            <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
                                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                                    Informations d'embauche
                                </Typography>
                                <Typography variant="body1">
                                    Date: {new Date(employeData.dateEmbauche).toLocaleDateString('fr-FR')}
                                </Typography>
                            </Paper>
                        </Grid>
                    )}
                </Grid>
            )}
        </Layout>
    );
};

export default Profil;
