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
                        onClick={() => navigate('/paies')} 
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
                            Détails de la Paie
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                            Consultez les informations détaillées de votre bulletin de paie
                        </Typography>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Télécharger le bulletin">
                        <Button
                            variant="outlined"
                            startIcon={<Download />}
                            onClick={handleDownloadPDF}
                            sx={{
                                color: 'white',
                                borderColor: 'white',
                                borderWidth: 1.5,
                                '&:hover': {
                                    borderColor: 'white',
                                    borderWidth: 2,
                                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                                }
                            }}
                        >
                            PDF
                        </Button>
                    </Tooltip>
                    {canManagePayrolls && paie.statut !== 'Payé' && (
                        <Button
                            variant="contained"
                            startIcon={<Edit />}
                            onClick={() => navigate(`/paies/${id}/edit`)}
                            sx={{
                                bgcolor: 'white',
                                color: 'primary.main',
                                '&:hover': {
                                    bgcolor: 'grey.100',
                                }
                            }}
                        >
                            Modifier
                        </Button>
                    )}
                </Box>
            </Paper>

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

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Section Informations générales et Actions */}
                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                    {/* Informations Générales */}
                    <Paper sx={{ p: 3, borderRadius: 3, bgcolor: 'grey.50', flex: 1, minWidth: 300, height: '100%' }}>
                        <Typography variant="h6" fontWeight="medium" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                            <Person sx={{ mr: 1, color: 'primary.main' }} />
                            Informations Générales
                        </Typography>
                        
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Person sx={{ mr: 2, color: 'primary.main', fontSize: 24 }} />
                                <Box>
                                    <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 500 }}>
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
                            
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <DateRange sx={{ mr: 2, color: 'info.main', fontSize: 24 }} />
                                <Box>
                                    <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 500 }}>
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
                                <Box sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
                                    {getStatusIcon(paie.statut)}
                                </Box>
                                <Box>
                                    <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 500 }}>
                                        Statut
                                    </Typography>
                                    <Chip 
                                        label={paie.statut} 
                                        color={getStatusColor(paie.statut)}
                                        size="small"
                                        sx={{ mt: 0.5, borderRadius: 2 }}
                                    />
                                </Box>
                            </Box>
                        </Box>
                    </Paper>

                    {/* Actions et Statut */}
                    <Paper sx={{ p: 3, borderRadius: 3, bgcolor: 'grey.50', flex: 1, minWidth: 300, height: '100%' }}>
                        <Typography variant="h6" fontWeight="medium" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                            <Receipt sx={{ mr: 1, color: 'primary.main' }} />
                            Actions et Statut
                        </Typography>
                        
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                            {paie.datePaiement && (
                                <Box>
                                    <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 500 }}>
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
                                        startIcon={<CheckCircle />}
                                        onClick={handleValidate}
                                        fullWidth
                                        sx={{ borderRadius: 2, py: 1.5 }}
                                    >
                                        Valider la paie
                                    </Button>
                                )}
                                {canManagePayrolls && paie.statut === 'Validé' && (
                                    <Button
                                        variant="contained"
                                        startIcon={<Payment />}
                                        onClick={handlePay}
                                        fullWidth
                                        sx={{ borderRadius: 2, py: 1.5 }}
                                    >
                                        Marquer comme payée
                                    </Button>
                                )}
                            </Box>
                        </Box>
                    </Paper>
                </Box>

                {/* Section Salaire de base et Montants finaux */}
                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                    {/* Salaire de Base */}
                    <Paper sx={{ p: 3, borderRadius: 3, bgcolor: 'grey.50', flex: 1, minWidth: 300, height: '100%' }}>
                        <Typography variant="h6" fontWeight="medium" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                            <MonetizationOn sx={{ mr: 1, color: 'primary.main' }} />
                            Salaire de Base
                        </Typography>
                        
                        <Box sx={{ 
                            p: 3, 
                            bgcolor: '#e3f2fd', 
                            borderRadius: 2, 
                            border: '1px solid', 
                            borderColor: '#bbdefb',
                            textAlign: 'center'
                        }}>
                            <MonetizationOn sx={{ fontSize: 40, color: '#1976d2', mb: 1 }} />
                            <Typography variant="h4" color="#1976d2" fontWeight="bold">
                                {formatCurrency(paie.salaireBase)}
                            </Typography>
                        </Box>
                    </Paper>

                    {/* Montants Finaux */}
                    <Paper sx={{ p: 3, borderRadius: 3, bgcolor: 'grey.50', flex: 1, minWidth: 300, height: '100%' }}>
                        <Typography variant="h6" fontWeight="medium" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                            <AttachMoney sx={{ mr: 1, color: 'primary.main' }} />
                            Montants Finaux
                        </Typography>
                        
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Box sx={{ flex: 1 }}>
                                <Box sx={{ 
                                    p: 2.5, 
                                    bgcolor: '#fff3e0', 
                                    borderRadius: 2, 
                                    border: '1px solid', 
                                    borderColor: '#ffe0b2',
                                    textAlign: 'center'
                                }}>
                                    <Receipt sx={{ fontSize: 32, color: '#fb8c00', mb: 1 }} />
                                    <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 500 }}>
                                        Net avant impôts
                                    </Typography>
                                    <Typography variant="h6" fontWeight="bold" sx={{ color: '#fb8c00' }}>
                                        {formatCurrency(paie.netAvantImpots)}
                                    </Typography>
                                </Box>
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <Box sx={{ 
                                    p: 2.5, 
                                    bgcolor: '#e8f5e9', 
                                    borderRadius: 2, 
                                    border: '2px solid', 
                                    borderColor: '#c8e6c9',
                                    textAlign: 'center'
                                }}>
                                    <MonetizationOn sx={{ fontSize: 32, color: '#388e3c', mb: 1 }} />
                                    <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 500 }}>
                                        Net à payer
                                    </Typography>
                                    <Typography variant="h5" fontWeight="bold" sx={{ color: '#388e3c' }}>
                                        {formatCurrency(paie.netAPayer)}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    </Paper>
                </Box>

                {/* Section Primes et Déductions */}
                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                    {/* Primes */}
                    <Paper sx={{ p: 3, borderRadius: 3, bgcolor: 'grey.50', flex: 1, minWidth: 300, height: '100%' }}>
                        <Typography variant="h6" fontWeight="medium" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                            <TrendingUp sx={{ mr: 1, color: 'success.main' }} />
                            Primes et Augmentations
                        </Typography>
                        
                        {paie.primes && paie.primes.length > 0 ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                {paie.primes.map((prime, index) => (
                                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', p: 1.5, bgcolor: '#e8f5e9', borderRadius: 1 }}>
                                        <TrendingUp sx={{ mr: 2, color: '#43a047', fontSize: 20 }} />
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="body2" fontWeight="medium">
                                                {prime.type || 'Prime'}
                                            </Typography>
                                            <Typography variant="caption" color="textSecondary">
                                                {formatCurrency(prime.montant)}
                                            </Typography>
                                        </Box>
                                    </Box>
                                ))}
                                <Box sx={{ p: 2, bgcolor: '#c8e6c9', borderRadius: 1, mt: 1, border: '1px solid', borderColor: '#a5d6a7' }}>
                                    <Typography variant="body2" fontWeight="bold" color="#2e7d32">
                                        Total des primes: {formatCurrency(calculateTotal(paie.primes))}
                                    </Typography>
                                </Box>
                            </Box>
                        ) : (
                            <Box sx={{ textAlign: 'center', py: 3, color: 'text.secondary' }}>
                                <TrendingUp sx={{ fontSize: 32, mb: 1, color: 'grey.400' }} />
                                <Typography variant="body2">
                                    Aucune prime pour cette période
                                </Typography>
                            </Box>
                        )}
                    </Paper>

                    {/* Déductions */}
                    <Paper sx={{ p: 3, borderRadius: 3, bgcolor: 'grey.50', flex: 1, minWidth: 300, height: '100%' }}>
                        <Typography variant="h6" fontWeight="medium" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                            <TrendingDown sx={{ mr: 1, color: 'error.main' }} />
                            Déductions
                        </Typography>
                        
                        {paie.deductions && paie.deductions.length > 0 ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                {paie.deductions.map((deduction, index) => (
                                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', p: 1.5, bgcolor: '#ffebee', borderRadius: 1 }}>
                                        <TrendingDown sx={{ mr: 2, color: '#e53935', fontSize: 20 }} />
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="body2" fontWeight="medium">
                                                {deduction.type || 'Déduction'}
                                            </Typography>
                                            <Typography variant="caption" color="textSecondary">
                                                {formatCurrency(deduction.montant)}
                                            </Typography>
                                        </Box>
                                    </Box>
                                ))}
                                <Box sx={{ p: 2, bgcolor: '#ffcdd2', borderRadius: 1, mt: 1, border: '1px solid', borderColor: '#ef9a9a' }}>
                                    <Typography variant="body2" fontWeight="bold" color="#c62828">
                                        Total des déductions: {formatCurrency(calculateTotal(paie.deductions))}
                                    </Typography>
                                </Box>
                            </Box>
                        ) : (
                            <Box sx={{ textAlign: 'center', py: 3, color: 'text.secondary' }}>
                                <TrendingDown sx={{ fontSize: 32, mb: 1, color: 'grey.400' }} />
                                <Typography variant="body2">
                                    Aucune déduction pour cette période
                                </Typography>
                            </Box>
                        )}
                    </Paper>
                </Box>

                {/* Section Heures supplémentaires et Congés */}
                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                    {/* Heures Supplémentaires */}
                    {paie.heuresSupplementaires && (
                        <Paper sx={{ p: 3, borderRadius: 3, bgcolor: 'grey.50', flex: 1, minWidth: 300, height: '100%' }}>
                            <Typography variant="h6" fontWeight="medium" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                                <Work sx={{ mr: 1, color: 'info.main' }} />
                                Heures Supplémentaires
                            </Typography>
                            
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Box sx={{ flex: 1, p: 2.5, bgcolor: '#e3f2fd', borderRadius: 2, border: '1px solid', borderColor: '#bbdefb', textAlign: 'center' }}>
                                    <Work sx={{ fontSize: 32, color: '#1976d2', mb: 1 }} />
                                    <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 500 }}>
                                        Nombre d'heures
                                    </Typography>
                                    <Typography variant="h6" fontWeight="bold" sx={{ color: '#1976d2' }}>
                                        {paie.heuresSupplementaires.heures || 0}h
                                    </Typography>
                                </Box>
                                <Box sx={{ flex: 1, p: 2.5, bgcolor: '#e3f2fd', borderRadius: 2, border: '1px solid', borderColor: '#bbdefb', textAlign: 'center' }}>
                                    <MonetizationOn sx={{ fontSize: 32, color: '#1976d2', mb: 1 }} />
                                    <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 500 }}>
                                        Montant
                                    </Typography>
                                    <Typography variant="h6" fontWeight="bold" sx={{ color: '#1976d2' }}>
                                        {formatCurrency(paie.heuresSupplementaires.taux || 0)}
                                    </Typography>
                                </Box>
                            </Box>
                        </Paper>
                    )}

                    {/* Congés Payés */}
                    {paie.congesPayes && (
                        <Paper sx={{ p: 3, borderRadius: 3, bgcolor: 'grey.50', flex: 1, minWidth: 300, height: '100%' }}>
                            <Typography variant="h6" fontWeight="medium" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                                <BeachAccess sx={{ mr: 1, color: 'secondary.main' }} />
                                Congés Payés
                            </Typography>
                            
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Box sx={{ flex: 1, p: 2.5, bgcolor: '#fce4ec', borderRadius: 2, border: '1px solid', borderColor: '#f8bbd0', textAlign: 'center' }}>
                                    <BeachAccess sx={{ fontSize: 32, color: '#c2185b', mb: 1 }} />
                                    <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 500 }}>
                                        Jours pris
                                    </Typography>
                                    <Typography variant="h6" fontWeight="bold" sx={{ color: '#c2185b' }}>
                                        {paie.congesPayes.pris || 0} jours
                                    </Typography>
                                </Box>
                                <Box sx={{ flex: 1, p: 2.5, bgcolor: '#fce4ec', borderRadius: 2, border: '1px solid', borderColor: '#f8bbd0', textAlign: 'center' }}>
                                    <BeachAccess sx={{ fontSize: 32, color: '#c2185b', mb: 1 }} />
                                    <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 500 }}>
                                        Jours restants
                                    </Typography>
                                    <Typography variant="h6" fontWeight="bold" sx={{ color: '#c2185b' }}>
                                        {paie.congesPayes.restants || 0} jours
                                    </Typography>
                                </Box>
                            </Box>
                        </Paper>
                    )}
                </Box>

                {/* Section Cotisations Sociales */}
                {paie.cotisations && (
                    <Paper sx={{ p: 3, borderRadius: 3, bgcolor: 'grey.50' }}>
                        <Typography variant="h6" fontWeight="medium" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                            <AccountBalance sx={{ mr: 1, color: 'warning.main' }} />
                            Cotisations Sociales
                        </Typography>
                        
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            <Box sx={{ minWidth: 200, flex: 1 }}>
                                <Box sx={{ p: 2.5, bgcolor: '#e8eaf6', borderRadius: 2, border: '1px solid', borderColor: '#c5cae9', textAlign: 'center' }}>
                                    <AccountBalance sx={{ fontSize: 32, color: '#3949ab', mb: 1 }} />
                                    <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 500 }}>
                                        CNSS
                                    </Typography>
                                    <Typography variant="h6" fontWeight="bold" sx={{ color: '#3949ab' }}>
                                        {formatCurrency(paie.cotisations.cnss || 0)}
                                    </Typography>
                                </Box>
                            </Box>
                            <Box sx={{ minWidth: 200, flex: 1 }}>
                                <Box sx={{ p: 2.5, bgcolor: '#ffebee', borderRadius: 2, border: '1px solid', borderColor: '#ffcdd2', textAlign: 'center' }}>
                                    <Receipt sx={{ fontSize: 32, color: '#c2185b', mb: 1 }} />
                                    <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 500 }}>
                                        Impôt
                                    </Typography>
                                    <Typography variant="h6" fontWeight="bold" sx={{ color: '#c2185b' }}>
                                        {formatCurrency(paie.cotisations.impot || 0)}
                                    </Typography>
                                </Box>
                            </Box>
                            <Box sx={{ minWidth: 200, flex: 1 }}>
                                <Box sx={{ p: 2.5, bgcolor: '#e8f5e9', borderRadius: 2, border: '1px solid', borderColor: '#c8e6c9', textAlign: 'center' }}>
                                    <HealthAndSafety sx={{ fontSize: 32, color: '#388e3c', mb: 1 }} />
                                    <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 500 }}>
                                        Assurance
                                    </Typography>
                                    <Typography variant="h6" fontWeight="bold" sx={{ color: '#388e3c' }}>
                                        {formatCurrency(paie.cotisations.assurance || 0)}
                                    </Typography>
                                </Box>
                            </Box>
                            <Box sx={{ minWidth: 200, flex: 1 }}>
                                <Box sx={{ p: 2.5, bgcolor: '#f3e5f5', borderRadius: 2, border: '2px solid', borderColor: '#e1bee7', textAlign: 'center' }}>
                                    <MonetizationOn sx={{ fontSize: 32, color: '#8e24aa', mb: 1 }} />
                                    <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 500 }}>
                                        Total cotisations
                                    </Typography>
                                    <Typography variant="h5" fontWeight="bold" sx={{ color: '#8e24aa' }}>
                                        {formatCurrency(
                                            (paie.cotisations.cnss || 0) + 
                                            (paie.cotisations.impot || 0) + 
                                            (paie.cotisations.assurance || 0)
                                        )}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    </Paper>
                )}
            </Box>
        </Box>
    );
};

export default PaieDetails;
