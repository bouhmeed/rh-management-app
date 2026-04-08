// frontend/src/pages/PaieForm.js
import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    IconButton,
    Alert,
    CircularProgress,
    Divider,
    Paper,
    Chip
} from '@mui/material';
import {
    ArrowBack,
    Save,
    Add,
    Delete,
    Calculate,
    MonetizationOn,
    TrendingUp,
    TrendingDown,
    Work,
    BeachAccess,
    AccountBalance,
    Receipt
} from '@mui/icons-material';
import { paieService, employeService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';

const PaieForm = () => {
    const { user, isAdmin, isManagerRH } = useAuth();
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = Boolean(id);
    
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(isEdit);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [employes, setEmployes] = useState([]);
    
    const [formData, setFormData] = useState({
        employe: '',
        mois: new Date().toISOString().slice(0, 7), // YYYY-MM format
        salaireBase: 0,
        primes: [],
        deductions: [],
        heuresSupplementaires: {
            heures: 0,
            taux: 0
        },
        congesPayes: {
            pris: 0,
            restants: 0
        },
        cotisations: {
            cnss: 0,
            impot: 0,
            assurance: 0
        },
        statut: 'Brouillon'
    });

    const [calculations, setCalculations] = useState({
        totalPrimes: 0,
        totalDeductions: 0,
        totalCotisations: 0,
        netAvantImpots: 0,
        netAPayer: 0
    });

    // Fetch employees for dropdown
    const fetchEmployes = async () => {
        try {
            const response = await employeService.getAll();
            if (response.data.success !== false) {
                setEmployes(response.data.data || []);
            }
        } catch (err) {
            console.error('Error fetching employees:', err);
        }
    };

    // Fetch payroll data if editing
    const fetchPaie = async () => {
        try {
            const response = await paieService.getOne(id);
            if (response.data.success === false) {
                setError(response.data.message);
            } else {
                const paie = response.data.data;
                setFormData({
                    employe: paie.employe._id,
                    mois: paie.mois,
                    salaireBase: paie.salaireBase || 0,
                    primes: paie.primes || [],
                    deductions: paie.deductions || [],
                    heuresSupplementaires: paie.heuresSupplementaires || { heures: 0, taux: 0 },
                    congesPayes: paie.congesPayes || { pris: 0, restants: 0 },
                    cotisations: paie.cotisations || { cnss: 0, impot: 0, assurance: 0 },
                    statut: paie.statut
                });
            }
        } catch (err) {
            setError('Erreur lors du chargement de la paie');
            console.error('Error fetching payroll:', err);
        } finally {
            setInitialLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployes();
        if (isEdit) {
            fetchPaie();
        }
    }, [id]);

    // Real-time calculations
    useEffect(() => {
        calculateTotals();
    }, [formData]);

    const calculateTotals = () => {
        const totalPrimes = formData.primes.reduce((sum, prime) => sum + (Number(prime.montant) || 0), 0);
        const totalDeductions = formData.deductions.reduce((sum, deduction) => sum + (Number(deduction.montant) || 0), 0);
        const totalCotisations = (Number(formData.cotisations.cnss) || 0) + 
                               (Number(formData.cotisations.impot) || 0) + 
                               (Number(formData.cotisations.assurance) || 0);
        
        const baseSalary = Number(formData.salaireBase) || 0;
        const overtimeAmount = Number(formData.heuresSupplementaires.taux) || 0;
        
        const netAvantImpots = baseSalary + totalPrimes + overtimeAmount - totalDeductions;
        const netAPayer = netAvantImpots - totalCotisations;

        setCalculations({
            totalPrimes,
            totalDeductions,
            totalCotisations,
            netAvantImpots,
            netAPayer
        });
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleNestedChange = (parent, field, value) => {
        setFormData(prev => ({
            ...prev,
            [parent]: {
                ...prev[parent],
                [field]: value
            }
        }));
    };

    const addPrime = () => {
        setFormData(prev => ({
            ...prev,
            primes: [...prev.primes, { type: '', montant: 0 }]
        }));
    };

    const updatePrime = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            primes: prev.primes.map((prime, i) => 
                i === index ? { ...prime, [field]: value } : prime
            )
        }));
    };

    const removePrime = (index) => {
        setFormData(prev => ({
            ...prev,
            primes: prev.primes.filter((_, i) => i !== index)
        }));
    };

    const addDeduction = () => {
        setFormData(prev => ({
            ...prev,
            deductions: [...prev.deductions, { type: '', montant: 0 }]
        }));
    };

    const updateDeduction = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            deductions: prev.deductions.map((deduction, i) => 
                i === index ? { ...deduction, [field]: value } : deduction
            )
        }));
    };

    const removeDeduction = (index) => {
        setFormData(prev => ({
            ...prev,
            deductions: prev.deductions.filter((_, i) => i !== index)
        }));
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('fr-TN', {
            style: 'currency',
            currency: 'TND'
        }).format(amount || 0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const payload = {
                ...formData,
                salaireBase: Number(formData.salaireBase),
                netAvantImpots: calculations.netAvantImpots,
                netAPayer: calculations.netAPayer
            };

            let response;
            if (isEdit) {
                response = await paieService.update(id, payload);
            } else {
                response = await paieService.create(payload);
            }

            if (response.data.success === false) {
                setError(response.data.message);
            } else {
                setSuccess(isEdit ? 'Paie mise à jour avec succès' : 'Paie créée avec succès');
                setTimeout(() => navigate('/paies'), 2000);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la sauvegarde');
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress />
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
                        {isEdit ? 'Modifier la Paie' : 'Nouvelle Paie'}
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<Save />}
                    onClick={handleSubmit}
                    disabled={loading}
                    sx={{ borderRadius: 2 }}
                >
                    {loading ? <CircularProgress size={20} /> : 'Sauvegarder'}
                </Button>
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

            <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                    {/* Basic Information */}
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" fontWeight="bold" gutterBottom>
                                    Informations Générales
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <FormControl fullWidth required>
                                            <InputLabel>Employé</InputLabel>
                                            <Select
                                                value={formData.employe}
                                                label="Employé"
                                                onChange={(e) => handleInputChange('employe', e.target.value)}
                                                disabled={isEdit}
                                            >
                                                {employes.map((employe) => (
                                                    <MenuItem key={employe._id} value={employe._id}>
                                                        {employe.prenom} {employe.nom} ({employe.matricule})
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="Mois (YYYY-MM)"
                                            type="month"
                                            value={formData.mois}
                                            onChange={(e) => handleInputChange('mois', e.target.value)}
                                            required
                                            inputProps={{ 
                                                min: "2020-01", 
                                                max: new Date().toISOString().slice(0, 7)
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="Salaire de base"
                                            type="number"
                                            value={formData.salaireBase}
                                            onChange={(e) => handleInputChange('salaireBase', e.target.value)}
                                            required
                                            InputProps={{
                                                startAdornment: <MonetizationOn sx={{ mr: 1, color: 'primary.main' }} />
                                            }}
                                        />
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Real-time Calculations */}
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" fontWeight="bold" gutterBottom>
                                    <Calculate sx={{ mr: 1, verticalAlign: 'middle' }} />
                                    Calculs en Temps Réel
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                                            <TrendingUp color="success" sx={{ fontSize: 30, mb: 1 }} />
                                            <Typography variant="caption" color="textSecondary">
                                                Total Primes
                                            </Typography>
                                            <Typography variant="h6" fontWeight="bold" color="success.main">
                                                {formatCurrency(calculations.totalPrimes)}
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                                            <TrendingDown color="error" sx={{ fontSize: 30, mb: 1 }} />
                                            <Typography variant="caption" color="textSecondary">
                                                Total Déductions
                                            </Typography>
                                            <Typography variant="h6" fontWeight="bold" color="error.main">
                                                {formatCurrency(calculations.totalDeductions)}
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.light' }}>
                                            <Receipt color="warning" sx={{ fontSize: 30, mb: 1 }} />
                                            <Typography variant="caption" color="textSecondary">
                                                Net avant impôts
                                            </Typography>
                                            <Typography variant="h6" fontWeight="bold">
                                                {formatCurrency(calculations.netAvantImpots)}
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light' }}>
                                            <MonetizationOn color="success" sx={{ fontSize: 30, mb: 1 }} />
                                            <Typography variant="caption" color="textSecondary">
                                                Net à payer
                                            </Typography>
                                            <Typography variant="h6" fontWeight="bold" color="success.dark">
                                                {formatCurrency(calculations.netAPayer)}
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Primes */}
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="h6" fontWeight="bold">
                                        <TrendingUp sx={{ mr: 1, verticalAlign: 'middle', color: 'success.main' }} />
                                        Primes
                                    </Typography>
                                    <Button
                                        startIcon={<Add />}
                                        onClick={addPrime}
                                        size="small"
                                        variant="outlined"
                                    >
                                        Ajouter
                                    </Button>
                                </Box>
                                {formData.primes.map((prime, index) => (
                                    <Box key={index} sx={{ mb: 2 }}>
                                        <Grid container spacing={2} alignItems="center">
                                            <Grid item xs={5}>
                                                <TextField
                                                    fullWidth
                                                    label="Type"
                                                    value={prime.type}
                                                    onChange={(e) => updatePrime(index, 'type', e.target.value)}
                                                    size="small"
                                                />
                                            </Grid>
                                            <Grid item xs={5}>
                                                <TextField
                                                    fullWidth
                                                    label="Montant"
                                                    type="number"
                                                    value={prime.montant}
                                                    onChange={(e) => updatePrime(index, 'montant', e.target.value)}
                                                    size="small"
                                                />
                                            </Grid>
                                            <Grid item xs={2}>
                                                <IconButton
                                                    onClick={() => removePrime(index)}
                                                    color="error"
                                                    size="small"
                                                >
                                                    <Delete />
                                                </IconButton>
                                            </Grid>
                                        </Grid>
                                    </Box>
                                ))}
                                {formData.primes.length === 0 && (
                                    <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 2 }}>
                                        Aucune prime ajoutée
                                    </Typography>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Deductions */}
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="h6" fontWeight="bold">
                                        <TrendingDown sx={{ mr: 1, verticalAlign: 'middle', color: 'error.main' }} />
                                        Déductions
                                    </Typography>
                                    <Button
                                        startIcon={<Add />}
                                        onClick={addDeduction}
                                        size="small"
                                        variant="outlined"
                                    >
                                        Ajouter
                                    </Button>
                                </Box>
                                {formData.deductions.map((deduction, index) => (
                                    <Box key={index} sx={{ mb: 2 }}>
                                        <Grid container spacing={2} alignItems="center">
                                            <Grid item xs={5}>
                                                <TextField
                                                    fullWidth
                                                    label="Type"
                                                    value={deduction.type}
                                                    onChange={(e) => updateDeduction(index, 'type', e.target.value)}
                                                    size="small"
                                                />
                                            </Grid>
                                            <Grid item xs={5}>
                                                <TextField
                                                    fullWidth
                                                    label="Montant"
                                                    type="number"
                                                    value={deduction.montant}
                                                    onChange={(e) => updateDeduction(index, 'montant', e.target.value)}
                                                    size="small"
                                                />
                                            </Grid>
                                            <Grid item xs={2}>
                                                <IconButton
                                                    onClick={() => removeDeduction(index)}
                                                    color="error"
                                                    size="small"
                                                >
                                                    <Delete />
                                                </IconButton>
                                            </Grid>
                                        </Grid>
                                    </Box>
                                ))}
                                {formData.deductions.length === 0 && (
                                    <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 2 }}>
                                        Aucune déduction ajoutée
                                    </Typography>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Overtime */}
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" fontWeight="bold" gutterBottom>
                                    <Work sx={{ mr: 1, verticalAlign: 'middle', color: 'info.main' }} />
                                    Heures Supplémentaires
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <TextField
                                            fullWidth
                                            label="Nombre d'heures"
                                            type="number"
                                            value={formData.heuresSupplementaires.heures}
                                            onChange={(e) => handleNestedChange('heuresSupplementaires', 'heures', e.target.value)}
                                            size="small"
                                        />
                                    </Grid>
                                    <Grid item xs={6}>
                                        <TextField
                                            fullWidth
                                            label="Montant total"
                                            type="number"
                                            value={formData.heuresSupplementaires.taux}
                                            onChange={(e) => handleNestedChange('heuresSupplementaires', 'taux', e.target.value)}
                                            size="small"
                                        />
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Paid Leave */}
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" fontWeight="bold" gutterBottom>
                                    <BeachAccess sx={{ mr: 1, verticalAlign: 'middle', color: 'secondary.main' }} />
                                    Congés Payés
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <TextField
                                            fullWidth
                                            label="Jours pris"
                                            type="number"
                                            value={formData.congesPayes.pris}
                                            onChange={(e) => handleNestedChange('congesPayes', 'pris', e.target.value)}
                                            size="small"
                                        />
                                    </Grid>
                                    <Grid item xs={6}>
                                        <TextField
                                            fullWidth
                                            label="Jours restants"
                                            type="number"
                                            value={formData.congesPayes.restants}
                                            onChange={(e) => handleNestedChange('congesPayes', 'restants', e.target.value)}
                                            size="small"
                                        />
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Contributions */}
                    <Grid item xs={12}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" fontWeight="bold" gutterBottom>
                                    <AccountBalance sx={{ mr: 1, verticalAlign: 'middle', color: 'warning.main' }} />
                                    Cotisations Sociales
                                </Typography>
                                <Grid container spacing={3}>
                                    <Grid item xs={12} md={4}>
                                        <TextField
                                            fullWidth
                                            label="CNSS (%)"
                                            type="number"
                                            value={formData.cotisations.cnss}
                                            onChange={(e) => handleNestedChange('cotisations', 'cnss', e.target.value)}
                                            InputProps={{
                                                endAdornment: <Typography variant="caption">TND</Typography>
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={4}>
                                        <TextField
                                            fullWidth
                                            label="Impôt (%)"
                                            type="number"
                                            value={formData.cotisations.impot}
                                            onChange={(e) => handleNestedChange('cotisations', 'impot', e.target.value)}
                                            InputProps={{
                                                endAdornment: <Typography variant="caption">TND</Typography>
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={4}>
                                        <TextField
                                            fullWidth
                                            label="Assurance (%)"
                                            type="number"
                                            value={formData.cotisations.assurance}
                                            onChange={(e) => handleNestedChange('cotisations', 'assurance', e.target.value)}
                                            InputProps={{
                                                endAdornment: <Typography variant="caption">TND</Typography>
                                            }}
                                        />
                                    </Grid>
                                </Grid>
                                <Box sx={{ mt: 2, p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
                                    <Typography variant="body2" color="textSecondary" gutterBottom>
                                        Total des cotisations
                                    </Typography>
                                    <Typography variant="h5" fontWeight="bold" color="warning.dark">
                                        {formatCurrency(calculations.totalCotisations)}
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Status */}
                    <Grid item xs={12}>
                        <Card>
                            <CardContent>
                                <FormControl fullWidth>
                                    <InputLabel>Statut</InputLabel>
                                    <Select
                                        value={formData.statut}
                                        label="Statut"
                                        onChange={(e) => handleInputChange('statut', e.target.value)}
                                    >
                                        <MenuItem value="Brouillon">
                                            <Chip label="Brouillon" size="small" color="default" />
                                        </MenuItem>
                                        <MenuItem value="Validé">
                                            <Chip label="Validé" size="small" color="warning" />
                                        </MenuItem>
                                        <MenuItem value="Payé">
                                            <Chip label="Payé" size="small" color="success" />
                                        </MenuItem>
                                    </Select>
                                </FormControl>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </form>
        </Box>
    );
};

export default PaieForm;
