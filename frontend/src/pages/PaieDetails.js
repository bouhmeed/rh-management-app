// frontend/src/pages/PaieDetails.js
import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    Chip,
    Button,
    Divider,
    Alert,
    CircularProgress,
    IconButton,
    Tooltip,
    Paper,
    List,
    ListItem,
    ListItemText,
    ListItemIcon
} from '@mui/material';
import {
    ArrowBack,
    Edit,
    Download,
    MonetizationOn,
    Person,
    DateRange,
    CheckCircle,
    Payment,
    HourglassEmpty,
    Work,
    BeachAccess,
    HealthAndSafety,
    Receipt,
    TrendingUp,
    TrendingDown,
    AccountBalance,
    AttachMoney
} from '@mui/icons-material';
import { paieService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';

const PaieDetails = () => {
    const { user, isAdmin, isManagerRH } = useAuth();
    const navigate = useNavigate();
    const { id } = useParams();
    
    const [paie, setPaie] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Check if user can manage payrolls
    const canManagePayrolls = isAdmin || isManagerRH;

    const fetchPaie = async () => {
        try {
            setLoading(true);
            setError('');
            
            const response = await paieService.getOne(id);
            
            if (response.data.success === false) {
                setError(response.data.message);
            } else {
                setPaie(response.data.data);
            }
        } catch (err) {
            setError('Erreur lors du chargement de la paie');
            console.error('Error fetching payroll:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPaie();
    }, [id]);

    const handleValidate = async () => {
        try {
            await paieService.valider(id);
            setSuccess('Paie validée avec succès');
            fetchPaie();
        } catch (err) {
            setError('Erreur lors de la validation de la paie');
        }
    };

    const handlePay = async () => {
        try {
            await paieService.payer(id);
            setSuccess('Paie marquée comme payée avec succès');
            fetchPaie();
        } catch (err) {
            setError('Erreur lors du paiement de la paie');
        }
    };

    const handleDownloadPDF = () => {
        // TODO: Implement PDF download functionality
        setSuccess('Fonctionnalité de téléchargement PDF bientôt disponible');
    };

    const getStatusColor = (statut) => {
        switch (statut) {
            case 'Payé': return 'success';
            case 'Validé': return 'warning';
            case 'Brouillon': return 'default';
            default: return 'default';
        }
    };

    const getStatusIcon = (statut) => {
        switch (statut) {
            case 'Payé': return <Payment />;
            case 'Validé': return <CheckCircle />;
            case 'Brouillon': return <HourglassEmpty />;
            default: return <HourglassEmpty />;
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('fr-TN', {
            style: 'currency',
            currency: 'TND'
        }).format(amount || 0);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const calculateTotal = (items) => {
        return items?.reduce((total, item) => total + (item.montant || 0), 0) || 0;
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!paie) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">Paie non trouvée</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <IconButton onClick={() => navigate('/paies')} sx={{ mr: 2 }}>
                        <ArrowBack />
                    </IconButton>
                    <Typography variant="h4" fontWeight="bold" color="primary">
                        Détails de la Paie
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Télécharger le bulletin">
                        <Button
                            variant="outlined"
                            startIcon={<Download />}
                            onClick={handleDownloadPDF}
                        >
                            PDF
                        </Button>
                    </Tooltip>
                    {canManagePayrolls && paie.statut !== 'Payé' && (
                        <Button
                            variant="contained"
                            startIcon={<Edit />}
                            onClick={() => navigate(`/paies/${id}/edit`)}
                        >
                            Modifier
                        </Button>
                    )}
                </Box>
            </Box>

            {/* Alerts */}
            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}
            {success && (
                <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
                    {success}
                </Alert>
            )}

            <Grid container spacing={3}>
                {/* Employee and Period Info */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" fontWeight="bold" gutterBottom>
                                Informations Générales
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <Person sx={{ mr: 1, color: 'primary.main' }} />
                                <Box>
                                    <Typography variant="body2" color="textSecondary">
                                        Employé
                                    </Typography>
                                    <Typography variant="body1" fontWeight="bold">
                                        {paie.employe ? `${paie.employe.prenom} ${paie.employe.nom}` : 'N/A'}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                        {paie.employe?.matricule || 'N/A'}
                                    </Typography>
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <DateRange sx={{ mr: 1, color: 'info.main' }} />
                                <Box>
                                    <Typography variant="body2" color="textSecondary">
                                        Période
                                    </Typography>
                                    <Typography variant="body1" fontWeight="bold">
                                        {new Date(paie.mois + '-01').toLocaleDateString('fr-FR', {
                                            year: 'numeric',
                                            month: 'long'
                                        })}
                                    </Typography>
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                {getStatusIcon(paie.statut)}
                                <Box sx={{ ml: 1 }}>
                                    <Typography variant="body2" color="textSecondary">
                                        Statut
                                    </Typography>
                                    <Chip 
                                        label={paie.statut} 
                                        color={getStatusColor(paie.statut)}
                                        size="small"
                                        sx={{ mt: 0.5 }}
                                    />
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Status Actions */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" fontWeight="bold" gutterBottom>
                                Actions
                            </Typography>
                            {paie.datePaiement && (
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="textSecondary">
                                        Date de paiement
                                    </Typography>
                                    <Typography variant="body1" fontWeight="bold">
                                        {formatDate(paie.datePaiement)}
                                    </Typography>
                                </Box>
                            )}
                            <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
                                {canManagePayrolls && paie.statut === 'Brouillon' && (
                                    <Button
                                        variant="contained"
                                        color="warning"
                                        startIcon={<CheckCircle />}
                                        onClick={handleValidate}
                                        fullWidth
                                    >
                                        Valider la paie
                                    </Button>
                                )}
                                {canManagePayrolls && paie.statut === 'Validé' && (
                                    <Button
                                        variant="contained"
                                        color="success"
                                        startIcon={<Payment />}
                                        onClick={handlePay}
                                        fullWidth
                                    >
                                        Marquer comme payée
                                    </Button>
                                )}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Salary Breakdown */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" fontWeight="bold" gutterBottom>
                                <MonetizationOn sx={{ mr: 1, verticalAlign: 'middle' }} />
                                Salaire de Base
                            </Typography>
                            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                                <Typography variant="h4" color="primary" fontWeight="bold">
                                    {formatCurrency(paie.salaireBase)}
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Final Amounts */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" fontWeight="bold" gutterBottom>
                                <AttachMoney sx={{ mr: 1, verticalAlign: 'middle' }} />
                                Montants Finaux
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Box sx={{ p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
                                        <Typography variant="caption" color="textSecondary">
                                            Net avant impôts
                                        </Typography>
                                        <Typography variant="h6" fontWeight="bold">
                                            {formatCurrency(paie.netAvantImpots)}
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={6}>
                                    <Box sx={{ p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                                        <Typography variant="caption" color="textSecondary">
                                            Net à payer
                                        </Typography>
                                        <Typography variant="h6" fontWeight="bold" color="success.dark">
                                            {formatCurrency(paie.netAPayer)}
                                        </Typography>
                                    </Box>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Primes */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" fontWeight="bold" gutterBottom>
                                <TrendingUp sx={{ mr: 1, verticalAlign: 'middle', color: 'success.main' }} />
                                Primes et Augmentations
                            </Typography>
                            {paie.primes && paie.primes.length > 0 ? (
                                <List dense>
                                    {paie.primes.map((prime, index) => (
                                        <ListItem key={index}>
                                            <ListItemIcon>
                                                <TrendingUp color="success" />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={prime.type || 'Prime'}
                                                secondary={formatCurrency(prime.montant)}
                                            />
                                        </ListItem>
                                    ))}
                                    <Divider />
                                    <ListItem>
                                        <ListItemText
                                            primary="Total des primes"
                                            primaryTypographyProps={{ fontWeight: 'bold' }}
                                            secondary={formatCurrency(calculateTotal(paie.primes))}
                                        />
                                    </ListItem>
                                </List>
                            ) : (
                                <Typography variant="body2" color="textSecondary">
                                    Aucune prime pour cette période
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Deductions */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" fontWeight="bold" gutterBottom>
                                <TrendingDown sx={{ mr: 1, verticalAlign: 'middle', color: 'error.main' }} />
                                Déductions
                            </Typography>
                            {paie.deductions && paie.deductions.length > 0 ? (
                                <List dense>
                                    {paie.deductions.map((deduction, index) => (
                                        <ListItem key={index}>
                                            <ListItemIcon>
                                                <TrendingDown color="error" />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={deduction.type || 'Déduction'}
                                                secondary={formatCurrency(deduction.montant)}
                                            />
                                        </ListItem>
                                    ))}
                                    <Divider />
                                    <ListItem>
                                        <ListItemText
                                            primary="Total des déductions"
                                            primaryTypographyProps={{ fontWeight: 'bold' }}
                                            secondary={formatCurrency(calculateTotal(paie.deductions))}
                                        />
                                    </ListItem>
                                </List>
                            ) : (
                                <Typography variant="body2" color="textSecondary">
                                    Aucune déduction pour cette période
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Overtime */}
                {paie.heuresSupplementaires && (
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" fontWeight="bold" gutterBottom>
                                    <Work sx={{ mr: 1, verticalAlign: 'middle', color: 'info.main' }} />
                                    Heures Supplémentaires
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <Typography variant="body2" color="textSecondary">
                                            Nombre d'heures
                                        </Typography>
                                        <Typography variant="h6" fontWeight="bold">
                                            {paie.heuresSupplementaires.heures || 0}h
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="body2" color="textSecondary">
                                            Montant
                                        </Typography>
                                        <Typography variant="h6" fontWeight="bold">
                                            {formatCurrency(paie.heuresSupplementaires.taux || 0)}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>
                )}

                {/* Paid Leave */}
                {paie.congesPayes && (
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" fontWeight="bold" gutterBottom>
                                    <BeachAccess sx={{ mr: 1, verticalAlign: 'middle', color: 'secondary.main' }} />
                                    Congés Payés
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <Typography variant="body2" color="textSecondary">
                                            Jours pris
                                        </Typography>
                                        <Typography variant="h6" fontWeight="bold">
                                            {paie.congesPayes.pris || 0} jours
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="body2" color="textSecondary">
                                            Jours restants
                                        </Typography>
                                        <Typography variant="h6" fontWeight="bold">
                                            {paie.congesPayes.restants || 0} jours
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>
                )}

                {/* Contributions */}
                {paie.cotisations && (
                    <Grid item xs={12}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" fontWeight="bold" gutterBottom>
                                    <HealthAndSafety sx={{ mr: 1, verticalAlign: 'middle', color: 'warning.main' }} />
                                    Cotisations Sociales
                                </Typography>
                                <Grid container spacing={3}>
                                    <Grid item xs={12} md={3}>
                                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                                            <AccountBalance sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                                            <Typography variant="body2" color="textSecondary">
                                                CNSS
                                            </Typography>
                                            <Typography variant="h6" fontWeight="bold">
                                                {formatCurrency(paie.cotisations.cnss || 0)}
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                    <Grid item xs={12} md={3}>
                                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                                            <Receipt sx={{ fontSize: 40, color: 'error.main', mb: 1 }} />
                                            <Typography variant="body2" color="textSecondary">
                                                Impôt
                                            </Typography>
                                            <Typography variant="h6" fontWeight="bold">
                                                {formatCurrency(paie.cotisations.impot || 0)}
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                    <Grid item xs={12} md={3}>
                                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                                            <HealthAndSafety sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                                            <Typography variant="body2" color="textSecondary">
                                                Assurance
                                            </Typography>
                                            <Typography variant="h6" fontWeight="bold">
                                                {formatCurrency(paie.cotisations.assurance || 0)}
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                    <Grid item xs={12} md={3}>
                                        <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.light' }}>
                                            <MonetizationOn sx={{ fontSize: 40, color: 'warning.dark', mb: 1 }} />
                                            <Typography variant="body2" color="textSecondary">
                                                Total cotisations
                                            </Typography>
                                            <Typography variant="h6" fontWeight="bold">
                                                {formatCurrency(
                                                    (paie.cotisations.cnss || 0) + 
                                                    (paie.cotisations.impot || 0) + 
                                                    (paie.cotisations.assurance || 0)
                                                )}
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>
                )}
            </Grid>
        </Box>
    );
};

export default PaieDetails;
