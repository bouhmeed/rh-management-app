// frontend/src/pages/ContractForm.js
import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    Paper,
    Divider,
    CircularProgress,
    Alert,
    Chip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    InputAdornment,
    Fade
} from '@mui/material';
import {
    ArrowBack,
    Save,
    Add,
    Delete,
    Description,
    Business,
    Person,
    Event,
    AttachMoney,
    Work,
    Star,
    Edit,
    Close,
    CheckCircle
} from '@mui/icons-material';
import { contratService, employeService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';

const ContractForm = () => {
    const { user, isAdmin, isManagerRH, isManager } = useAuth();
    const navigate = useNavigate();
    const { id } = useParams();
    
    const isEdit = Boolean(id);
    
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [employes, setEmployes] = useState([]);
    
    const [formData, setFormData] = useState({
        employe: '',
        typeContrat: 'CDI',
        dateDebut: '',
        dateFin: '',
        salaireBase: '',
        periodeEssai: {
            duree: '',
            finPeriodeEssai: ''
        },
        avantages: [],
        statut: 'Actif'
    });

    const [newAvantage, setNewAvantage] = useState('');

    const contratTypes = ['CDI', 'CDD', 'Stage', 'Freelance', 'Intérim'];
    const statuts = ['Actif', 'Expiré', 'Résilié'];
    const avantagesList = [
        'Tickets restaurant',
        'Mutuelle',
        'Véhicule',
        'Téléphone',
        'Prime',
        'Formation',
        'Transport',
        'Logement'
    ];

    // Check if user can manage contracts
    const canManageContracts = isAdmin || isManagerRH || isManager;

    useEffect(() => {
        if (!canManageContracts) {
            navigate('/contrats');
            return;
        }

        fetchEmployes();
        
        if (isEdit) {
            fetchContract();
        }
    }, [id, isEdit]);

    const fetchEmployes = async () => {
        try {
            setFetchLoading(true);
            const response = await employeService.getAll();
            
            if (response.data.success === false) {
                setError(response.data.message);
            } else {
                setEmployes(response.data.data || response.data || []);
            }
        } catch (err) {
            setError('Erreur lors du chargement des employés');
            console.error('Error fetching employees:', err);
        } finally {
            setFetchLoading(false);
        }
    };

    const fetchContract = async () => {
        try {
            setFetchLoading(true);
            const response = await contratService.getOne(id);
            
            if (response.data.success === false) {
                setError(response.data.message);
            } else {
                const contrat = response.data.data;
                setFormData({
                    employe: contrat.employe?._id || '',
                    typeContrat: contrat.typeContrat || 'CDI',
                    dateDebut: contrat.dateDebut ? new Date(contrat.dateDebut).toISOString().split('T')[0] : '',
                    dateFin: contrat.dateFin ? new Date(contrat.dateFin).toISOString().split('T')[0] : '',
                    salaireBase: contrat.salaireBase || '',
                    periodeEssai: {
                        duree: contrat.periodeEssai?.duree || '',
                        finPeriodeEssai: contrat.periodeEssai?.finPeriodeEssai 
                            ? new Date(contrat.periodeEssai.finPeriodeEssai).toISOString().split('T')[0] 
                            : ''
                    },
                    avantages: contrat.avantages || [],
                    statut: contrat.statut || 'Actif'
                });
            }
        } catch (err) {
            setError('Erreur lors du chargement du contrat');
            console.error('Error fetching contract:', err);
        } finally {
            setFetchLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleNestedChange = (parent, child, value) => {
        setFormData(prev => ({
            ...prev,
            [parent]: {
                ...prev[parent],
                [child]: value
            }
        }));
    };

    const handleAddAvantage = () => {
        if (newAvantage && !formData.avantages.includes(newAvantage)) {
            setFormData(prev => ({
                ...prev,
                avantages: [...prev.avantages, newAvantage]
            }));
            setNewAvantage('');
        }
    };

    const handleRemoveAvantage = (avantageToRemove) => {
        setFormData(prev => ({
            ...prev,
            avantages: prev.avantages.filter(av => av !== avantageToRemove)
        }));
    };

    const validateForm = () => {
        const errors = [];
        
        if (!formData.employe) errors.push('L\'employé est requis');
        if (!formData.typeContrat) errors.push('Le type de contrat est requis');
        if (!formData.dateDebut) errors.push('La date de début est requise');
        if (!formData.salaireBase || formData.salaireBase <= 0) {
            errors.push('Le salaire de base doit être supérieur à 0');
        }
        if (formData.typeContrat === 'CDD' && !formData.dateFin) {
            errors.push('La date de fin est requise pour un contrat CDD');
        }
        
        return errors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const errors = validateForm();
        if (errors.length > 0) {
            setError(errors.join(', '));
            return;
        }

        try {
            setLoading(true);
            setError('');
            
            // Prepare data for submission
            const submitData = {
                ...formData,
                salaireBase: parseFloat(formData.salaireBase),
                periodeEssai: {
                    duree: formData.periodeEssai.duree ? parseInt(formData.periodeEssai.duree) : undefined,
                    finPeriodeEssai: formData.periodeEssai.finPeriodeEssai || undefined
                }
            };

            // Remove empty values
            if (!submitData.periodeEssai.duree) {
                delete submitData.periodeEssai.duree;
            }
            if (!submitData.periodeEssai.finPeriodeEssai) {
                delete submitData.periodeEssai.finPeriodeEssai;
            }
            if (!submitData.dateFin) {
                delete submitData.dateFin;
            }

            let response;
            if (isEdit) {
                response = await contratService.update(id, submitData);
                setSuccess('Contrat mis à jour avec succès');
            } else {
                response = await contratService.create(submitData);
                setSuccess('Contrat créé avec succès');
            }

            if (response.data.success === false) {
                setError(response.data.message);
            } else {
                setTimeout(() => {
                    navigate('/contrats');
                }, 1500);
            }
        } catch (err) {
            setError(`Erreur lors de ${isEdit ? 'la mise à jour' : 'la création'} du contrat`);
            console.error('Error saving contract:', err);
        } finally {
            setLoading(false);
        }
    };

    if (fetchLoading) {
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
                            {isEdit ? 'Modifier le Contrat' : 'Nouveau Contrat'}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                            {isEdit ? 'Mettez à jour les informations du contrat' : 'Créez un nouveau contrat pour un employé'}
                        </Typography>
                    </Box>
                </Box>
                <Button
                    variant="outlined"
                    startIcon={loading ? <CircularProgress size={16} color="inherit" /> : (isEdit ? <Edit /> : <Save />)}
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
                    {loading ? 'En cours...' : (isEdit ? 'Mettre à jour' : 'Créer')}
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

            {/* Form avec sections */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Section Informations principales */}
                <Paper sx={{ p: 3, borderRadius: 3, bgcolor: 'grey.50' }}>
                    <Typography variant="h6" fontWeight="medium" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                        <Description sx={{ mr: 1, color: 'primary.main' }} />
                        Informations principales
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            <Box sx={{ minWidth: 280, flex: 1 }}>
                                <FormControl fullWidth required>
                                    <InputLabel>Employé</InputLabel>
                                    <Select
                                        name="employe"
                                        value={formData.employe}
                                        onChange={handleChange}
                                        label="Employé"
                                        sx={{ borderRadius: 2, height: 56 }}
                                    >
                                        {employes.map((employe) => (
                                            <MenuItem key={employe._id} value={employe._id}>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <Person sx={{ mr: 1, color: 'primary.main', fontSize: 20 }} />
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
                            
                            <Box sx={{ minWidth: 200, flex: 1 }}>
                                <FormControl fullWidth required>
                                    <InputLabel>Type de contrat</InputLabel>
                                    <Select
                                        name="typeContrat"
                                        value={formData.typeContrat}
                                        onChange={handleChange}
                                        label="Type de contrat"
                                        sx={{ borderRadius: 2, height: 56 }}
                                    >
                                        {contratTypes.map((type) => (
                                            <MenuItem key={type} value={type}>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <Description sx={{ mr: 1, color: 'primary.main', fontSize: 20 }} />
                                                    {type}
                                                </Box>
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            <Box sx={{ minWidth: 200, flex: 1 }}>
                                <TextField
                                    fullWidth
                                    type="date"
                                    name="dateDebut"
                                    label="Date de début *"
                                    value={formData.dateDebut}
                                    onChange={handleChange}
                                    required
                                    InputLabelProps={{ shrink: true }}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Event color="action" />
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
                                    type="date"
                                    name="dateFin"
                                    label="Date de fin"
                                    value={formData.dateFin}
                                    onChange={handleChange}
                                    InputLabelProps={{ shrink: true }}
                                    helperText={formData.typeContrat === 'CDD' ? 'Requis pour les contrats CDD' : 'Optionnel pour CDI'}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Event color="action" />
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

                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            <Box sx={{ minWidth: 200, flex: 1 }}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    name="salaireBase"
                                    label="Salaire de base (TND) *"
                                    value={formData.salaireBase}
                                    onChange={handleChange}
                                    required
                                    placeholder="0.00"
                                    inputProps={{ min: 0, step: 0.001 }}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <AttachMoney color="action" />
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
                                <FormControl fullWidth required>
                                    <InputLabel>Statut</InputLabel>
                                    <Select
                                        name="statut"
                                        value={formData.statut}
                                        onChange={handleChange}
                                        label="Statut"
                                        sx={{ borderRadius: 2, height: 56 }}
                                    >
                                        {statuts.map((statut) => (
                                            <MenuItem key={statut} value={statut}>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <Box sx={{ 
                                                        width: 8, 
                                                        height: 8, 
                                                        borderRadius: '50%', 
                                                        bgcolor: statut === 'Actif' ? 'success.main' : 
                                                               statut === 'Expiré' ? 'error.main' : 'grey.500',
                                                        mr: 1 
                                                    }} />
                                                    {statut}
                                                </Box>
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>
                        </Box>
                    </Box>
                </Paper>

                {/* Section Période d'essai */}
                <Paper sx={{ p: 3, borderRadius: 3, bgcolor: 'grey.50' }}>
                    <Typography variant="h6" fontWeight="medium" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                        <Work sx={{ mr: 1, color: 'primary.main' }} />
                        Période d'essai (Optionnel)
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Box sx={{ minWidth: 200, flex: 1 }}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Durée (jours)"
                                value={formData.periodeEssai.duree}
                                onChange={(e) => handleNestedChange('periodeEssai', 'duree', e.target.value)}
                                placeholder="0"
                                inputProps={{ min: 0 }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Event color="action" />
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
                                type="date"
                                label="Fin de période d'essai"
                                value={formData.periodeEssai.finPeriodeEssai}
                                onChange={(e) => handleNestedChange('periodeEssai', 'finPeriodeEssai', e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Event color="action" />
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

                {/* Section Avantages */}
                <Paper sx={{ p: 3, borderRadius: 3, bgcolor: 'grey.50' }}>
                    <Typography variant="h6" fontWeight="medium" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                        <Star sx={{ mr: 1, color: 'primary.main' }} />
                        Avantages
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {/* Add Benefit */}
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            <Box sx={{ minWidth: 280, flex: 1 }}>
                                <FormControl fullWidth>
                                    <InputLabel>Ajouter un avantage</InputLabel>
                                    <Select
                                        value={newAvantage}
                                        onChange={(e) => setNewAvantage(e.target.value)}
                                        label="Ajouter un avantage"
                                        sx={{ borderRadius: 2, height: 56 }}
                                    >
                                        {avantagesList.map((avantage) => (
                                            <MenuItem key={avantage} value={avantage}>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <Star sx={{ mr: 1, color: 'primary.main', fontSize: 20 }} />
                                                    {avantage}
                                                </Box>
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>
                            <Button
                                variant="outlined"
                                startIcon={<Add />}
                                onClick={handleAddAvantage}
                                sx={{ 
                                    minWidth: 120,
                                    height: 56,
                                    borderRadius: 2
                                }}
                            >
                                Ajouter
                            </Button>
                        </Box>

                        {/* Selected Benefits */}
                        {formData.avantages.length > 0 && (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {formData.avantages.map((avantage, index) => (
                                    <Chip
                                        key={index}
                                        label={avantage}
                                        onDelete={() => handleRemoveAvantage(avantage)}
                                        deleteIcon={<Delete />}
                                        color="primary"
                                        variant="outlined"
                                        sx={{ borderRadius: 2 }}
                                    />
                                ))}
                            </Box>
                        )}
                    </Box>
                </Paper>
            </Box>
        </Box>
    );
};

export default ContractForm;
