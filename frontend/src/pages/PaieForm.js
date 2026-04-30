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
    Chip,
    InputAdornment,
    Fade
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
    Receipt,
    DateRange
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
                            {isEdit ? 'Modifier la Paie' : 'Nouvelle Paie'}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                            {isEdit ? 'Mettez à jour les informations de la paie' : 'Créez une nouvelle fiche de paie'}
                        </Typography>
                    </Box>
                </Box>
                <Button
                    variant="outlined"
                    startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Save />}
                    onClick={handleSubmit}
                    disabled={loading}
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
                        },
                        '&.Mui-disabled': {
                            borderColor: 'rgba(255, 255, 255, 0.3)',
                            color: 'rgba(255, 255, 255, 0.5)'
                        }
                    }}
                >
                    {loading ? 'En cours...' : 'Sauvegarder'}
                </Button>
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

            <form onSubmit={handleSubmit}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {/* Section Informations générales */}
                    <Paper sx={{ p: 3, borderRadius: 3, bgcolor: 'grey.50' }}>
                        <Typography variant="h6" fontWeight="medium" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                            <Receipt sx={{ mr: 1, color: 'primary.main' }} />
                            Informations Générales
                        </Typography>
                        
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                            <Box sx={{ minWidth: 280 }}>
                                <FormControl fullWidth required>
                                    <InputLabel>Employé</InputLabel>
                                    <Select
                                        value={formData.employe}
                                        label="Employé"
                                        onChange={(e) => handleInputChange('employe', e.target.value)}
                                        disabled={isEdit}
                                        sx={{ borderRadius: 2, height: 56 }}
                                    >
                                        {employes.map((employe) => (
                                            <MenuItem key={employe._id} value={employe._id}>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <Work sx={{ mr: 1, color: 'primary.main', fontSize: 20 }} />
                                                    <Box>
                                                        <Typography variant="body2">
                                                            {employe.prenom} {employe.nom}
                                                        </Typography>
                                                        <Typography variant="caption" color="textSecondary">
                                                            {employe.matricule}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>
                            
                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                <Box sx={{ minWidth: 200, flex: 1 }}>
                                    <TextField
                                        fullWidth
                                        label="Mois"
                                        type="month"
                                        value={formData.mois}
                                        onChange={(e) => handleInputChange('mois', e.target.value)}
                                        required
                                        inputProps={{ 
                                            min: "2020-01", 
                                            max: new Date().toISOString().slice(0, 7)
                                        }}
                                        InputLabelProps={{ shrink: true }}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <DateRange color="action" />
                                                </InputAdornment>
                                            ),
                                        }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2,
                                                height: 56,
                                            }
                                        }}
                                    />
                                </Box>
                                
                                <Box sx={{ minWidth: 200, flex: 1 }}>
                                    <TextField
                                        fullWidth
                                        label="Salaire de base (TND)"
                                        type="number"
                                        value={formData.salaireBase}
                                        onChange={(e) => handleInputChange('salaireBase', e.target.value)}
                                        required
                                        placeholder="0.00"
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <MonetizationOn color="action" />
                                                </InputAdornment>
                                            ),
                                        }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2,
                                                height: 56,
                                            }
                                        }}
                                    />
                                </Box>
                            </Box>
                        </Box>
                    </Paper>

                    {/* Section Calculs en temps réel */}
                    <Paper sx={{ p: 3, borderRadius: 3, bgcolor: 'grey.50' }}>
                        <Typography variant="h6" fontWeight="medium" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                            <Calculate sx={{ mr: 1, color: 'primary.main' }} />
                            Calculs en Temps Réel
                        </Typography>
                        
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            <Box sx={{ flex: 1, minWidth: 150 }}>
                                <Paper sx={{ p: 2.5, textAlign: 'center', borderRadius: 2, bgcolor: '#e8f5e9', border: '1px solid', borderColor: '#c8e6c9' }}>
                                    <TrendingUp sx={{ fontSize: 32, mb: 1, color: '#66bb6a' }} />
                                    <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 500 }}>
                                        Total Primes
                                    </Typography>
                                    <Typography variant="h6" fontWeight="bold" sx={{ color: '#43a047' }}>
                                        {formatCurrency(calculations.totalPrimes)}
                                    </Typography>
                                </Paper>
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 150 }}>
                                <Paper sx={{ p: 2.5, textAlign: 'center', borderRadius: 2, bgcolor: '#ffebee', border: '1px solid', borderColor: '#ffcdd2' }}>
                                    <TrendingDown sx={{ fontSize: 32, mb: 1, color: '#ef5350' }} />
                                    <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 500 }}>
                                        Total Déductions
                                    </Typography>
                                    <Typography variant="h6" fontWeight="bold" sx={{ color: '#e53935' }}>
                                        {formatCurrency(calculations.totalDeductions)}
                                    </Typography>
                                </Paper>
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 150 }}>
                                <Paper sx={{ p: 2.5, textAlign: 'center', borderRadius: 2, bgcolor: '#fff3e0', border: '1px solid', borderColor: '#ffe0b2' }}>
                                    <Receipt sx={{ fontSize: 32, mb: 1, color: '#ffa726' }} />
                                    <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 500 }}>
                                        Net avant impôts
                                    </Typography>
                                    <Typography variant="h6" fontWeight="bold" sx={{ color: '#fb8c00' }}>
                                        {formatCurrency(calculations.netAvantImpots)}
                                    </Typography>
                                </Paper>
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 150 }}>
                                <Paper sx={{ p: 2.5, textAlign: 'center', borderRadius: 2, bgcolor: '#e3f2fd', border: '2px solid', borderColor: '#90caf9' }}>
                                    <MonetizationOn sx={{ fontSize: 32, mb: 1, color: '#42a5f5' }} />
                                    <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 500 }}>
                                        Net à payer
                                    </Typography>
                                    <Typography variant="h5" fontWeight="bold" sx={{ color: '#1e88e5' }}>
                                        {formatCurrency(calculations.netAPayer)}
                                    </Typography>
                                </Paper>
                            </Box>
                        </Box>
                    </Paper>

                    {/* Section Primes et Déductions */}
                    <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                        {/* Primes */}
                        <Paper sx={{ p: 3, borderRadius: 3, bgcolor: 'grey.50', flex: 1, minWidth: 300 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                <Typography variant="h6" fontWeight="medium" sx={{ display: 'flex', alignItems: 'center' }}>
                                    <TrendingUp sx={{ mr: 1, color: 'success.main' }} />
                                    Primes
                                </Typography>
                                <Button
                                    startIcon={<Add />}
                                    onClick={addPrime}
                                    size="small"
                                    variant="outlined"
                                    sx={{ borderRadius: 2 }}
                                >
                                    Ajouter
                                </Button>
                            </Box>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {formData.primes.map((prime, index) => (
                                    <Box key={index} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                        <TextField
                                            fullWidth
                                            label="Type"
                                            value={prime.type}
                                            onChange={(e) => updatePrime(index, 'type', e.target.value)}
                                            size="small"
                                            sx={{ flex: 2 }}
                                        />
                                        <TextField
                                            fullWidth
                                            label="Montant"
                                            type="number"
                                            value={prime.montant}
                                            onChange={(e) => updatePrime(index, 'montant', e.target.value)}
                                            size="small"
                                            sx={{ flex: 1 }}
                                        />
                                        <IconButton
                                            onClick={() => removePrime(index)}
                                            color="error"
                                            size="small"
                                        >
                                            <Delete />
                                        </IconButton>
                                    </Box>
                                ))}
                                {formData.primes.length === 0 && (
                                    <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 2 }}>
                                        Aucune prime ajoutée
                                    </Typography>
                                )}
                            </Box>
                        </Paper>

                        {/* Déductions */}
                        <Paper sx={{ p: 3, borderRadius: 3, bgcolor: 'grey.50', flex: 1, minWidth: 300 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                <Typography variant="h6" fontWeight="medium" sx={{ display: 'flex', alignItems: 'center' }}>
                                    <TrendingDown sx={{ mr: 1, color: 'error.main' }} />
                                    Déductions
                                </Typography>
                                <Button
                                    startIcon={<Add />}
                                    onClick={addDeduction}
                                    size="small"
                                    variant="outlined"
                                    sx={{ borderRadius: 2 }}
                                >
                                    Ajouter
                                </Button>
                            </Box>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {formData.deductions.map((deduction, index) => (
                                    <Box key={index} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                        <TextField
                                            fullWidth
                                            label="Type"
                                            value={deduction.type}
                                            onChange={(e) => updateDeduction(index, 'type', e.target.value)}
                                            size="small"
                                            sx={{ flex: 2 }}
                                        />
                                        <TextField
                                            fullWidth
                                            label="Montant"
                                            type="number"
                                            value={deduction.montant}
                                            onChange={(e) => updateDeduction(index, 'montant', e.target.value)}
                                            size="small"
                                            sx={{ flex: 1 }}
                                        />
                                        <IconButton
                                            onClick={() => removeDeduction(index)}
                                            color="error"
                                            size="small"
                                        >
                                            <Delete />
                                        </IconButton>
                                    </Box>
                                ))}
                                {formData.deductions.length === 0 && (
                                    <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 2 }}>
                                        Aucune déduction ajoutée
                                    </Typography>
                                )}
                            </Box>
                        </Paper>
                    </Box>

                    {/* Section Heures supplémentaires et Congés */}
                    <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                        {/* Heures Supplémentaires */}
                        <Paper sx={{ p: 3, borderRadius: 3, bgcolor: 'grey.50', flex: 1, minWidth: 300 }}>
                            <Typography variant="h6" fontWeight="medium" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                                <Work sx={{ mr: 1, color: 'info.main' }} />
                                Heures Supplémentaires
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Box sx={{ flex: 1 }}>
                                    <TextField
                                        fullWidth
                                        label="Nombre d'heures"
                                        type="number"
                                        value={formData.heuresSupplementaires.heures}
                                        onChange={(e) => handleNestedChange('heuresSupplementaires', 'heures', e.target.value)}
                                        placeholder="0"
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Work color="action" />
                                                </InputAdornment>
                                            ),
                                        }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2,
                                                height: 56,
                                            }
                                        }}
                                    />
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <TextField
                                        fullWidth
                                        label="Montant total (TND)"
                                        type="number"
                                        value={formData.heuresSupplementaires.taux}
                                        onChange={(e) => handleNestedChange('heuresSupplementaires', 'taux', e.target.value)}
                                        placeholder="0.00"
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <MonetizationOn color="action" />
                                                </InputAdornment>
                                            ),
                                        }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2,
                                                height: 56,
                                            }
                                        }}
                                    />
                                </Box>
                            </Box>
                        </Paper>

                        {/* Congés Payés */}
                        <Paper sx={{ p: 3, borderRadius: 3, bgcolor: 'grey.50', flex: 1, minWidth: 300 }}>
                            <Typography variant="h6" fontWeight="medium" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                                <BeachAccess sx={{ mr: 1, color: 'secondary.main' }} />
                                Congés Payés
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Box sx={{ flex: 1 }}>
                                    <TextField
                                        fullWidth
                                        label="Jours pris"
                                        type="number"
                                        value={formData.congesPayes.pris}
                                        onChange={(e) => handleNestedChange('congesPayes', 'pris', e.target.value)}
                                        placeholder="0"
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <BeachAccess color="action" />
                                                </InputAdornment>
                                            ),
                                        }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2,
                                                height: 56,
                                            }
                                        }}
                                    />
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <TextField
                                        fullWidth
                                        label="Jours restants"
                                        type="number"
                                        value={formData.congesPayes.restants}
                                        onChange={(e) => handleNestedChange('congesPayes', 'restants', e.target.value)}
                                        placeholder="0"
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <BeachAccess color="action" />
                                                </InputAdornment>
                                            ),
                                        }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2,
                                                height: 56,
                                            }
                                        }}
                                    />
                                </Box>
                            </Box>
                        </Paper>
                    </Box>

                    {/* Section Cotisations Sociales */}
                    <Paper sx={{ p: 3, borderRadius: 3, bgcolor: 'grey.50' }}>
                        <Typography variant="h6" fontWeight="medium" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                            <AccountBalance sx={{ mr: 1, color: 'warning.main' }} />
                            Cotisations Sociales
                        </Typography>
                        
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
                            <Box sx={{ minWidth: 200, flex: 1 }}>
                                <TextField
                                    fullWidth
                                    label="CNSS (TND)"
                                    type="number"
                                    value={formData.cotisations.cnss}
                                    onChange={(e) => handleNestedChange('cotisations', 'cnss', e.target.value)}
                                    placeholder="0.00"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <AccountBalance color="action" />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2,
                                            height: 56,
                                        }
                                    }}
                                />
                            </Box>
                            <Box sx={{ minWidth: 200, flex: 1 }}>
                                <TextField
                                    fullWidth
                                    label="Impôt (TND)"
                                    type="number"
                                    value={formData.cotisations.impot}
                                    onChange={(e) => handleNestedChange('cotisations', 'impot', e.target.value)}
                                    placeholder="0.00"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <AccountBalance color="action" />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2,
                                            height: 56,
                                        }
                                    }}
                                />
                            </Box>
                            <Box sx={{ minWidth: 200, flex: 1 }}>
                                <TextField
                                    fullWidth
                                    label="Assurance (TND)"
                                    type="number"
                                    value={formData.cotisations.assurance}
                                    onChange={(e) => handleNestedChange('cotisations', 'assurance', e.target.value)}
                                    placeholder="0.00"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <AccountBalance color="action" />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2,
                                            height: 56,
                                        }
                                    }}
                                />
                            </Box>
                        </Box>
                        
                        <Box sx={{ p: 2.5, bgcolor: '#f3e5f5', borderRadius: 2, border: '1px solid', borderColor: '#e1bee7' }}>
                            <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5, fontWeight: 500 }}>
                                Total des cotisations
                            </Typography>
                            <Typography variant="h5" fontWeight="bold" sx={{ color: '#8e24aa' }}>
                                {formatCurrency(calculations.totalCotisations)}
                            </Typography>
                        </Box>
                    </Paper>

                    {/* Section Statut */}
                    <Paper sx={{ p: 3, borderRadius: 3, bgcolor: 'grey.50' }}>
                        <Typography variant="h6" fontWeight="medium" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                            <Receipt sx={{ mr: 1, color: 'primary.main' }} />
                            Statut de la Paie
                        </Typography>
                        
                        <Box sx={{ minWidth: 200 }}>
                            <FormControl fullWidth>
                                <InputLabel>Statut</InputLabel>
                                <Select
                                    value={formData.statut}
                                    label="Statut"
                                    onChange={(e) => handleInputChange('statut', e.target.value)}
                                    sx={{ borderRadius: 2, height: 56 }}
                                >
                                    <MenuItem value="Brouillon">
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'grey.500', mr: 1 }} />
                                            <Chip label="Brouillon" size="small" color="default" />
                                        </Box>
                                    </MenuItem>
                                    <MenuItem value="Validé">
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'warning.main', mr: 1 }} />
                                            <Chip label="Validé" size="small" color="warning" />
                                        </Box>
                                    </MenuItem>
                                    <MenuItem value="Payé">
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main', mr: 1 }} />
                                            <Chip label="Payé" size="small" color="success" />
                                        </Box>
                                    </MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                    </Paper>
                </Box>
            </form>
        </Box>
    );
};

export default PaieForm;
