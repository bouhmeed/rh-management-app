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
            {/* Header */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <IconButton onClick={() => navigate('/contrats')} sx={{ mr: 2 }}>
                        <ArrowBack />
                    </IconButton>
                    <Typography variant="h4" fontWeight="bold" color="primary">
                        Détails du Contrat
                    </Typography>
                </Box>
                {canManageContracts && (
                    <Button
                        variant="contained"
                        startIcon={<Edit />}
                        onClick={() => navigate(`/contrats/${id}/edit`)}
                    >
                        Modifier
                    </Button>
                )}
            </Box>

            <Grid container spacing={3}>
                {/* Employee Information */}
                <Grid item xs={12} md={6}>
                    <Card elevation={2}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <Person sx={{ mr: 1, color: 'primary.main', fontSize: 28 }} />
                                <Typography variant="h6" fontWeight="bold">
                                    Informations Employé
                                </Typography>
                            </Box>
                            <Divider sx={{ mb: 2 }} />
                            
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" color="textSecondary">
                                    Nom complet
                                </Typography>
                                <Typography variant="body1" fontWeight="bold">
                                    {contrat.employe ? `${contrat.employe.prenom} ${contrat.employe.nom}` : 'N/A'}
                                </Typography>
                            </Box>
                            
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" color="textSecondary">
                                    Matricule
                                </Typography>
                                <Typography variant="body1" fontWeight="bold">
                                    {contrat.employe?.matricule || 'N/A'}
                                </Typography>
                            </Box>
                            
                            <Box>
                                <Typography variant="body2" color="textSecondary">
                                    Email
                                </Typography>
                                <Typography variant="body1" fontWeight="bold">
                                    {contrat.employe?.email || 'N/A'}
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Contract Information */}
                <Grid item xs={12} md={6}>
                    <Card elevation={2}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <Description sx={{ mr: 1, color: 'primary.main', fontSize: 28 }} />
                                <Typography variant="h6" fontWeight="bold">
                                    Informations Contrat
                                </Typography>
                            </Box>
                            <Divider sx={{ mb: 2 }} />
                            
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" color="textSecondary">
                                    Type de contrat
                                </Typography>
                                <Chip 
                                    label={contrat.typeContrat} 
                                    color={getContractTypeColor(contrat.typeContrat)}
                                    variant="outlined"
                                    sx={{ mt: 1 }}
                                />
                            </Box>
                            
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" color="textSecondary">
                                    Statut
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                    {getStatusIcon(contrat.statut)}
                                    <Chip 
                                        label={contrat.statut} 
                                        color={getStatusColor(contrat.statut)}
                                        sx={{ ml: 1 }}
                                    />
                                </Box>
                            </Box>
                            
                            <Box>
                                <Typography variant="body2" color="textSecondary">
                                    Salaire de base
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                    <AttachMoney sx={{ mr: 1, color: 'success.main' }} />
                                    <Typography variant="h6" fontWeight="bold" color="success.main">
                                        {formatSalary(contrat.salaireBase)}
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Dates */}
                <Grid item xs={12} md={6}>
                    <Card elevation={2}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <Event sx={{ mr: 1, color: 'primary.main', fontSize: 28 }} />
                                <Typography variant="h6" fontWeight="bold">
                                    Période du Contrat
                                </Typography>
                            </Box>
                            <Divider sx={{ mb: 2 }} />
                            
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" color="textSecondary">
                                    Date de début
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                    <Timeline sx={{ mr: 1, color: 'info.main' }} />
                                    <Typography variant="body1" fontWeight="bold">
                                        {formatDate(contrat.dateDebut)}
                                    </Typography>
                                </Box>
                            </Box>
                            
                            <Box>
                                <Typography variant="body2" color="textSecondary">
                                    Date de fin
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                    <Timeline sx={{ mr: 1, color: 'warning.main' }} />
                                    <Typography variant="body1" fontWeight="bold">
                                        {formatDate(contrat.dateFin)}
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Trial Period */}
                <Grid item xs={12} md={6}>
                    <Card elevation={2}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <Work sx={{ mr: 1, color: 'primary.main', fontSize: 28 }} />
                                <Typography variant="h6" fontWeight="bold">
                                    Période d'Essai
                                </Typography>
                            </Box>
                            <Divider sx={{ mb: 2 }} />
                            
                            {contrat.periodeEssai ? (
                                <>
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="body2" color="textSecondary">
                                            Durée
                                        </Typography>
                                        <Typography variant="body1" fontWeight="bold">
                                            {contrat.periodeEssai.duree ? `${contrat.periodeEssai.duree} jours` : 'Non définie'}
                                        </Typography>
                                    </Box>
                                    
                                    <Box>
                                        <Typography variant="body2" color="textSecondary">
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
                                <Typography variant="body2" color="textSecondary">
                                    Aucune période d'essai définie
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Benefits */}
                <Grid item xs={12}>
                    <Card elevation={2}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <Star sx={{ mr: 1, color: 'primary.main', fontSize: 28 }} />
                                <Typography variant="h6" fontWeight="bold">
                                    Avantages
                                </Typography>
                            </Box>
                            <Divider sx={{ mb: 2 }} />
                            
                            {contrat.avantages && contrat.avantages.length > 0 ? (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {contrat.avantages.map((avantage, index) => (
                                        <Chip 
                                            key={index}
                                            label={avantage} 
                                            variant="outlined" 
                                            color="primary"
                                            size="small"
                                        />
                                    ))}
                                </Box>
                            ) : (
                                <Typography variant="body2" color="textSecondary">
                                    Aucun avantage spécifié
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default ContractDetails;
