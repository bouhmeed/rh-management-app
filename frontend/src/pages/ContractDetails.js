// frontend/src/pages/ContractDetails.js
import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Chip,
    Grid,
    Paper,
    Divider,
    CircularProgress,
    Alert,
    IconButton,
    Tooltip
} from '@mui/material';
import {
    ArrowBack,
    Edit,
    Business,
    Person,
    Event,
    AttachMoney,
    Work,
    Star,
    Description,
    Timeline,
    CheckCircle,
    Cancel,
    Info
} from '@mui/icons-material';
import { contratService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';

const ContractDetails = () => {
    const { user, isAdmin, isManagerRH, isManager } = useAuth();
    const navigate = useNavigate();
    const { id } = useParams();
    
    const [contrat, setContrat] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Check if user can manage contracts
    const canManageContracts = isAdmin || isManagerRH || isManager;

    const fetchContract = async () => {
        try {
            setLoading(true);
            setError('');
            
            const response = await contratService.getOne(id);
            
            if (response.data.success === false) {
                setError(response.data.message);
            } else {
                setContrat(response.data.data);
            }
        } catch (err) {
            setError('Erreur lors du chargement du contrat');
            console.error('Error fetching contract:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchContract();
        }
    }, [id]);

    const getStatusColor = (statut) => {
        switch (statut) {
            case 'Actif': return 'success';
            case 'Expiré': return 'error';
            case 'Résilié': return 'default';
            default: return 'default';
        }
    };

    const getStatusIcon = (statut) => {
        switch (statut) {
            case 'Actif': return <CheckCircle />;
            case 'Expiré': return <Cancel />;
            case 'Résilié': return <Info />;
            default: return <Info />;
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Non définie';
        return new Date(dateString).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatSalary = (salary) => {
        return new Intl.NumberFormat('fr-TN', {
            style: 'currency',
            currency: 'TND'
        }).format(salary);
    };

    const getContractTypeColor = (type) => {
        switch (type) {
            case 'CDI': return 'primary';
            case 'CDD': return 'secondary';
            case 'Stage': return 'info';
            case 'Freelance': return 'warning';
            case 'Intérim': return 'error';
            default: return 'default';
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
                <Button
                    variant="contained"
                    startIcon={<ArrowBack />}
                    onClick={() => navigate('/contrats')}
                >
                    Retour à la liste
                </Button>
            </Box>
        );
    }

    if (!contrat) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h6" color="textSecondary" sx={{ mb: 2 }}>
                    Contrat non trouvé
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<ArrowBack />}
                    onClick={() => navigate('/contrats')}
                >
                    Retour à la liste
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            {/* Header moderne */}
            <Paper sx={{
                mb: 3,
                p: 3,
                borderRadius: 3,
                background: 'linear-gradient(135deg, #4f58a5 0%, #49a2da 100%)',
                color: 'white',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <IconButton 
                        onClick={() => navigate('/contrats')} 
                        sx={{ 
                            mr: 2,
                            color: 'white',
                            bgcolor: 'rgba(255, 255, 255, 0.1)',
                            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)' }
                        }}
                    >
                        <ArrowBack />
                    </IconButton>
                    <Box>
                        <Typography variant="h4" fontWeight="bold">
                            Détails du Contrat
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                            Consultez toutes les informations du contrat
                        </Typography>
                    </Box>
                </Box>
                {canManageContracts && (
                    <Button
                        variant="outlined"
                        startIcon={<Edit />}
                        onClick={() => navigate(`/contrats/${id}/edit`)}
                        sx={{
                            borderRadius: 3,
                            minWidth: 120,
                            px: 3,
                            py: 1,
                            color: 'white',
                            borderColor: 'white',
                            borderWidth: 1.5,
                            fontWeight: 500,
                            '&:hover': {
                                borderColor: 'white',
                                borderWidth: 2,
                                bgcolor: 'rgba(255, 255, 255, 0.1)',
                            }
                        }}
                    >
                        Modifier
                    </Button>
                )}
            </Paper>

            {/* Grid avec tailles standardisées */}
            <Grid container spacing={3}>
                {/* Employee Information */}
                <Grid item xs={12} md={6}>
                    <Paper 
                        elevation={2} 
                        sx={{ 
                            height: '100%',
                            borderRadius: 3,
                            border: '1px solid',
                            borderColor: 'grey.200',
                            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
                        }}
                    >
                        <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                <Person sx={{ mr: 1, color: 'primary.main', fontSize: 32 }} />
                                <Typography variant="h6" fontWeight="bold">
                                    Informations Employé
                                </Typography>
                            </Box>
                            <Divider sx={{ mb: 3 }} />
                            
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, flex: 1 }}>
                                <Box>
                                    <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                                        Nom complet
                                    </Typography>
                                    <Typography variant="body1" fontWeight="bold">
                                        {contrat.employe ? `${contrat.employe.prenom} ${contrat.employe.nom}` : 'N/A'}
                                    </Typography>
                                </Box>
                                
                                <Box>
                                    <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                                        Matricule
                                    </Typography>
                                    <Typography variant="body1" fontWeight="bold">
                                        {contrat.employe?.matricule || 'N/A'}
                                    </Typography>
                                </Box>
                                
                                <Box>
                                    <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                                        Email
                                    </Typography>
                                    <Typography variant="body1" fontWeight="bold">
                                        {contrat.employe?.email || 'N/A'}
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Paper>
                </Grid>

                {/* Contract Information */}
                <Grid item xs={12} md={6}>
                    <Paper 
                        elevation={2} 
                        sx={{ 
                            height: '100%',
                            borderRadius: 3,
                            border: '1px solid',
                            borderColor: 'grey.200',
                            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
                        }}
                    >
                        <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                <Description sx={{ mr: 1, color: 'primary.main', fontSize: 32 }} />
                                <Typography variant="h6" fontWeight="bold">
                                    Informations Contrat
                                </Typography>
                            </Box>
                            <Divider sx={{ mb: 3 }} />
                            
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, flex: 1 }}>
                                <Box>
                                    <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                                        Type de contrat
                                    </Typography>
                                    <Chip 
                                        label={contrat.typeContrat} 
                                        color={getContractTypeColor(contrat.typeContrat)}
                                        variant="outlined"
                                        sx={{ borderRadius: 2 }}
                                    />
                                </Box>
                                
                                <Box>
                                    <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                                        Statut
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        {getStatusIcon(contrat.statut)}
                                        <Chip 
                                            label={contrat.statut} 
                                            color={getStatusColor(contrat.statut)}
                                            sx={{ ml: 1, borderRadius: 2 }}
                                        />
                                    </Box>
                                </Box>
                                
                                <Box>
                                    <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                                        Salaire de base
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <AttachMoney sx={{ mr: 1, color: 'success.main', fontSize: 24 }} />
                                        <Typography variant="h5" fontWeight="bold" color="success.main">
                                            {formatSalary(contrat.salaireBase)}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </CardContent>
                    </Paper>
                </Grid>

                {/* Dates */}
                <Grid item xs={12} md={6}>
                    <Paper 
                        elevation={2} 
                        sx={{ 
                            height: '100%',
                            borderRadius: 3,
                            border: '1px solid',
                            borderColor: 'grey.200',
                            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
                        }}
                    >
                        <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                <Event sx={{ mr: 1, color: 'primary.main', fontSize: 32 }} />
                                <Typography variant="h6" fontWeight="bold">
                                    Période du Contrat
                                </Typography>
                            </Box>
                            <Divider sx={{ mb: 3 }} />
                            
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, flex: 1 }}>
                                <Box>
                                    <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                                        Date de début
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Timeline sx={{ mr: 1, color: 'info.main', fontSize: 24 }} />
                                        <Typography variant="body1" fontWeight="bold">
                                            {formatDate(contrat.dateDebut)}
                                        </Typography>
                                    </Box>
                                </Box>
                                
                                <Box>
                                    <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                                        Date de fin
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Timeline sx={{ mr: 1, color: 'warning.main', fontSize: 24 }} />
                                        <Typography variant="body1" fontWeight="bold">
                                            {formatDate(contrat.dateFin)}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </CardContent>
                    </Paper>
                </Grid>

                {/* Trial Period */}
                <Grid item xs={12} md={6}>
                    <Paper 
                        elevation={2} 
                        sx={{ 
                            height: '100%',
                            borderRadius: 3,
                            border: '1px solid',
                            borderColor: 'grey.200',
                            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
                        }}
                    >
                        <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                <Work sx={{ mr: 1, color: 'primary.main', fontSize: 32 }} />
                                <Typography variant="h6" fontWeight="bold">
                                    Période d'Essai
                                </Typography>
                            </Box>
                            <Divider sx={{ mb: 3 }} />
                            
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, flex: 1 }}>
                                {contrat.periodeEssai ? (
                                    <>
                                        <Box>
                                            <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                                                Durée
                                            </Typography>
                                            <Typography variant="body1" fontWeight="bold">
                                                {contrat.periodeEssai.duree ? `${contrat.periodeEssai.duree} jours` : 'Non définie'}
                                            </Typography>
                                        </Box>
                                        
                                        <Box>
                                            <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                                                Fin de période d'essai
                                            </Typography>
                                            <Typography variant="body1" fontWeight="bold">
                                                {contrat.periodeEssai.finPeriodeEssai 
                                                    ? formatDate(contrat.periodeEssai.finPeriodeEssai) 
                                                    : 'Non définie'}
                                            </Typography>
                                        </Box>
                                    </>
                                ) : (
                                    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Typography variant="body2" color="textSecondary">
                                            Aucune période d'essai définie
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        </CardContent>
                    </Paper>
                </Grid>

                {/* Benefits */}
                <Grid item xs={12}>
                    <Paper 
                        elevation={2} 
                        sx={{ 
                            borderRadius: 3,
                            border: '1px solid',
                            borderColor: 'grey.200',
                            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
                        }}
                    >
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                <Star sx={{ mr: 1, color: 'primary.main', fontSize: 32 }} />
                                <Typography variant="h6" fontWeight="bold">
                                    Avantages
                                </Typography>
                            </Box>
                            <Divider sx={{ mb: 3 }} />
                            
                            {contrat.avantages && contrat.avantages.length > 0 ? (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                                    {contrat.avantages.map((avantage, index) => (
                                        <Chip 
                                            key={index}
                                            label={avantage} 
                                            variant="outlined" 
                                            color="primary"
                                            size="medium"
                                            sx={{ borderRadius: 2, px: 1, py: 0.5 }}
                                        />
                                    ))}
                                </Box>
                            ) : (
                                <Box sx={{ py: 2, textAlign: 'center' }}>
                                    <Typography variant="body2" color="textSecondary">
                                        Aucun avantage spécifié
                                    </Typography>
                                </Box>
                            )}
                        </CardContent>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default ContractDetails;
