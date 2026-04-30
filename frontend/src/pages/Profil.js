// frontend/src/pages/Profil.js
import React, { useState, useEffect } from 'react';
import {
    Container,
    Paper,
    Typography,
    Box,
    Avatar,
    Divider,
    CircularProgress
} from '@mui/material';
import { Person, Email } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';
import Layout from '../components/Layout';
import ModernHeader from '../components/ModernHeader';
import ModernCard from '../components/ModernCard';

const Profil = () => {
    const { user } = useAuth();
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
                <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
                    <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                        <CircularProgress />
                    </Box>
                </Container>
            </Layout>
        );
    }

    if (!user) {
        return <Layout><div>Utilisateur non connecté</div></Layout>;
    }

    // Récupérer le nom depuis l'employé associé ou utiliser l'email comme fallback
    const displayName = fullUserData?.employe?.nom 
        ? `${fullUserData.employe.prenom || ''} ${fullUserData.employe.nom}`.trim()
        : user.email;

    return (
        <Layout>
            <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
                <Paper elevation={3} sx={{
                    p: 4,
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'grey.200',
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
                }}>
                    <Box display="flex" flexDirection="column" alignItems="center">
                        <Avatar 
                            sx={{ 
                                width: 80, 
                                height: 80, 
                                bgcolor: 'primary.main',
                                mb: 2
                            }}
                        >
                            <Person sx={{ fontSize: 40 }} />
                        </Avatar>

                        <ModernHeader
                            title="Mon Profil"
                            subtitle="Gérez vos informations personnelles"
                            icon={<Person />}
                        />

                        <Divider sx={{ width: '100%', mb: 3 }} />
                        
                        <Box sx={{ width: '100%', textAlign: 'center' }}>
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                                Nom complet
                            </Typography>
                            <Typography variant="body1" sx={{ fontSize: '1.2rem', fontWeight: 'medium', mb: 2 }}>
                                {displayName}
                            </Typography>
                            
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                                Email
                            </Typography>
                            <Typography variant="body1" sx={{ fontSize: '1.1rem', mb: 2 }}>
                                {user.email}
                            </Typography>
                            
                            {fullUserData?.role?.nomRole && (
                                <>
                                    <Typography variant="h6" color="text.secondary" gutterBottom>
                                        Rôle
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontSize: '1.1rem', mb: 2 }}>
                                        {fullUserData.role.nomRole}
                                    </Typography>
                                </>
                            )}
                        </Box>
                    </Box>
                </Paper>
            </Container>
        </Layout>
    );
};

export default Profil;
