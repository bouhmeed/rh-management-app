// frontend/src/pages/Departements.js
import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    Grid,
    Card,
    CardContent,
    CardActions,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    TextField,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Chip,
    Divider,
    Tooltip,
    InputAdornment,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress,
    Fade
} from '@mui/material';
import {
    Add,
    Edit,
    Delete,
    People,
    Business,
    Person,
    Search,
    FilterList,
    TrendingUp,
    AssignmentInd,
    Groups,
    Close,
    CheckCircle,
    Info
} from '@mui/icons-material';
import { departementService, employeService } from '../services/api';
import Layout from '../components/Layout';
import Loader from '../components/Loader';
import ModernHeader from '../components/ModernHeader';
import ModernCard from '../components/ModernCard';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const Departements = () => {
    const [departements, setDepartements] = useState([]);
    const [employes, setEmployes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [openEmployesDialog, setOpenEmployesDialog] = useState(false);
    const [selectedDept, setSelectedDept] = useState(null);
    const [formData, setFormData] = useState({
        nomDepartement: '',
        description: '',
        responsable: ''
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [filterBy, setFilterBy] = useState('all');
    const [submitting, setSubmitting] = useState(false);

    const { isAdmin, isManagerRH } = useAuth();
    const peutModifier = isAdmin || isManagerRH;

    useEffect(() => {
        chargerDonnees();
    }, []);

    const chargerDonnees = async () => {
        try {
            setLoading(true);
            const [deptsRes, employesRes] = await Promise.all([
                departementService.getAll(),
                employeService.getAll({ limit: 100 })
            ]);
            
            setDepartements(deptsRes.data.data || []);
            setEmployes(employesRes.data.data || []);
        } catch (error) {
            toast.error('Erreur lors du chargement des données');
        } finally {
            setLoading(false);
        }
    };

    // Calcul des statistiques
    const totalDepartements = departements.length;
    const totalEmployes = employes.length;
    const departementsAvecResponsable = departements.filter(dept => dept.responsable).length;
    const employesMoyenParDept = totalDepartements > 0 ? Math.round(totalEmployes / totalDepartements) : 0;

    // Filtrage et recherche
    const filteredDepartements = departements.filter(dept => {
        const matchesSearch = dept.nomDepartement.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (dept.description && dept.description.toLowerCase().includes(searchTerm.toLowerCase()));
        
        if (filterBy === 'all') return matchesSearch;
        if (filterBy === 'withResponsable') return matchesSearch && dept.responsable;
        if (filterBy === 'withoutResponsable') return matchesSearch && !dept.responsable;
        if (filterBy === 'withEmployees') return matchesSearch && dept.employes && dept.employes.length > 0;
        if (filterBy === 'withoutEmployees') return matchesSearch && (!dept.employes || dept.employes.length === 0);
        
        return matchesSearch;
    });

    const handleOpenDialog = (dept = null) => {
        if (dept) {
            setSelectedDept(dept);
            setFormData({
                nomDepartement: dept.nomDepartement,
                description: dept.description || '',
                responsable: dept.responsable?._id || ''
            });
        } else {
            setSelectedDept(null);
            setFormData({
                nomDepartement: '',
                description: '',
                responsable: ''
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedDept(null);
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async () => {
        try {
            if (!formData.nomDepartement) {
                toast.warning('Le nom du département est requis');
                return;
            }

            setSubmitting(true);

            // Prepare data, exclude empty responsable
            const submitData = { ...formData };
            if (!submitData.responsable) {
                delete submitData.responsable;
            }

            if (selectedDept) {
                await departementService.update(selectedDept._id, submitData);
                toast.success('Département modifié avec succès');
            } else {
                await departementService.create(submitData);
                toast.success('Département créé avec succès');
            }
            
            handleCloseDialog();
            chargerDonnees();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Erreur lors de l\'opération');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (dept) => {
        if (window.confirm(`Êtes-vous sûr de vouloir supprimer le département ${dept.nomDepartement} ?`)) {
            try {
                await departementService.delete(dept._id);
                toast.success('Département supprimé');
                chargerDonnees();
            } catch (error) {
                toast.error('Erreur lors de la suppression');
            }
        }
    };

    const handleVoirEmployes = (dept) => {
        setSelectedDept(dept);
        setOpenEmployesDialog(true);
    };

    if (loading) return <Layout><Loader /></Layout>;

    return (
        <Layout>
            <ModernHeader
                title="Gestion des Départements"
                subtitle="Organisez les départements de l'entreprise"
                icon={<Business />}
            />

            {/* Section Statistiques */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Paper elevation={2} sx={{
                        p: 3,
                        borderRadius: 3,
                        height: '100%',
                        minHeight: 140,
                        background: 'linear-gradient(135deg, #e8eaf6 0%, #c5cae9 100%)',
                        color: '#3949ab',
                        border: '1px solid',
                        borderColor: '#c5cae9'
                    }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <Business sx={{ mr: 1, fontSize: 32, color: '#3949ab' }} />
                                <Typography variant="h4" fontWeight="bold">
                                    {totalDepartements}
                                </Typography>
                            </Box>
                            <Typography variant="body2" sx={{ opacity: 0.8, fontWeight: 500 }}>
                                Total départements
                            </Typography>
                        </Box>
                    </Paper>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Paper elevation={2} sx={{
                        p: 3,
                        borderRadius: 3,
                        height: '100%',
                        minHeight: 140,
                        background: 'linear-gradient(135deg, #fce4ec 0%, #f8bbd0 100%)',
                        color: '#c2185b',
                        border: '1px solid',
                        borderColor: '#f8bbd0'
                    }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <Groups sx={{ mr: 1, fontSize: 32, color: '#c2185b' }} />
                                <Typography variant="h4" fontWeight="bold">
                                    {totalEmployes}
                                </Typography>
                            </Box>
                            <Typography variant="body2" sx={{ opacity: 0.8, fontWeight: 500 }}>
                                Total employés
                            </Typography>
                        </Box>
                    </Paper>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Paper elevation={2} sx={{
                        p: 3,
                        borderRadius: 3,
                        height: '100%',
                        minHeight: 140,
                        background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                        color: '#1976d2',
                        border: '1px solid',
                        borderColor: '#bbdefb'
                    }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <AssignmentInd sx={{ mr: 1, fontSize: 32, color: '#1976d2' }} />
                                <Typography variant="h4" fontWeight="bold">
                                    {departementsAvecResponsable}
                                </Typography>
                            </Box>
                            <Typography variant="body2" sx={{ opacity: 0.8, fontWeight: 500 }}>
                                Avec responsable
                            </Typography>
                        </Box>
                    </Paper>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Paper elevation={2} sx={{
                        p: 3,
                        borderRadius: 3,
                        height: '100%',
                        minHeight: 140,
                        background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
                        color: '#388e3c',
                        border: '1px solid',
                        borderColor: '#c8e6c9'
                    }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <TrendingUp sx={{ mr: 1, fontSize: 32, color: '#388e3c' }} />
                                <Typography variant="h4" fontWeight="bold">
                                    {employesMoyenParDept}
                                </Typography>
                            </Box>
                            <Typography variant="body2" sx={{ opacity: 0.8, fontWeight: 500 }}>
                                Moy. employés/dépt
                            </Typography>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            {/* Section Filtres et Recherche */}
            <Paper elevation={2} sx={{
                p: 3,
                mb: 3,
                borderRadius: 3,
                background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                border: '1px solid',
                borderColor: 'grey.200'
            }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            placeholder="Rechercher un département..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search color="action" />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                }
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <FormControl fullWidth>
                            <InputLabel>Filtrer par</InputLabel>
                            <Select
                                value={filterBy}
                                onChange={(e) => setFilterBy(e.target.value)}
                                label="Filtrer par"
                                sx={{ borderRadius: 2 }}
                            >
                                <MenuItem value="all">Tous les départements</MenuItem>
                                <MenuItem value="withResponsable">Avec responsable</MenuItem>
                                <MenuItem value="withoutResponsable">Sans responsable</MenuItem>
                                <MenuItem value="withEmployees">Avec employés</MenuItem>
                                <MenuItem value="withoutEmployees">Sans employés</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={2}>
                        {peutModifier && (
                            <Button
                                variant="contained"
                                fullWidth
                                startIcon={<Add />}
                                onClick={() => handleOpenDialog()}
                                sx={{
                                    borderRadius: 2,
                                    height: '56px',
                                    background: 'linear-gradient(135deg, #4f58a5 0%, #49a2da 100%)',
                                    '&:hover': {
                                        background: 'linear-gradient(135deg, #3d4a94 0%, #3a8cc8 100%)',
                                    }
                                }}
                            >
                                Nouveau
                            </Button>
                        )}
                    </Grid>
                </Grid>
            </Paper>

            {/* Liste des départements */}
            <Grid container spacing={3}>
                {filteredDepartements.map((dept) => (
                    <Grid item xs={12} sm={6} md={4} key={dept._id}>
                        <Card elevation={3} sx={{
                            borderRadius: 3,
                            border: '1px solid',
                            borderColor: 'grey.200',
                            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            height: '100%',
                            minHeight: 380,
                            display: 'flex',
                            flexDirection: 'column',
                            position: 'relative',
                            overflow: 'hidden',
                            '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: 8,
                                '& .card-overlay': {
                                    opacity: 1
                                }
                            }
                        }}>
                            <CardContent sx={{ flexGrow: 1 }}>
                                {/* Header de la carte */}
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                                    <Avatar sx={{ 
                                        bgcolor: 'primary.main', 
                                        mr: 2,
                                        width: 48, 
                                        height: 48,
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                                    }}>
                                        <Business />
                                    </Avatar>
                                    <Box sx={{ flexGrow: 1 }}>
                                        <Typography variant="h6" fontWeight="bold" sx={{ mb: 0.5 }}>
                                            {dept.nomDepartement}
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary">
                                            Créé le {new Date(dept.createdAt).toLocaleDateString()}
                                        </Typography>
                                        
                                        {/* Badges d'état */}
                                        <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
                                            {dept.responsable && (
                                                <Chip 
                                                    size="small" 
                                                    label="Responsable assigné" 
                                                    color="success" 
                                                    variant="outlined"
                                                    icon={<Person sx={{ fontSize: 14 }} />}
                                                />
                                            )}
                                            {dept.employes && dept.employes.length > 0 && (
                                                <Chip 
                                                    size="small" 
                                                    label={`${dept.employes.length} employés`} 
                                                    color="primary" 
                                                    variant="outlined"
                                                    icon={<People sx={{ fontSize: 14 }} />}
                                                />
                                            )}
                                        </Box>
                                    </Box>
                                </Box>

                                {/* Description */}
                                <Typography variant="body2" color="textSecondary" sx={{ mb: 2, lineHeight: 1.4 }}>
                                    {dept.description || 'Aucune description disponible'}
                                </Typography>

                                <Divider sx={{ my: 2 }} />

                                {/* Informations détaillées */}
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                    {/* Statistiques employés */}
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <People sx={{ fontSize: 20, mr: 1, color: 'primary.main' }} />
                                            <Typography variant="body2" fontWeight="medium">
                                                {dept.employes?.length || 0} employé{dept.employes?.length > 1 ? 's' : ''}
                                            </Typography>
                                        </Box>
                                        {dept.employes && dept.employes.length > 0 && (
                                            <Typography variant="caption" color="textSecondary">
                                                Actifs: {dept.employes.filter(e => e.statut === 'Actif').length}
                                            </Typography>
                                        )}
                                    </Box>

                                    {/* Responsable */}
                                    {dept.responsable ? (
                                        <Box sx={{ 
                                            display: 'flex', 
                                            alignItems: 'center',
                                            p: 1,
                                            borderRadius: 2,
                                            backgroundColor: 'rgba(25, 118, 210, 0.08)'
                                        }}>
                                            <Avatar sx={{ 
                                                width: 32, 
                                                height: 32, 
                                                mr: 1.5,
                                                bgcolor: 'primary.main',
                                                fontSize: 14
                                            }}>
                                                {dept.responsable.prenom?.charAt(0)}{dept.responsable.nom?.charAt(0)}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="body2" fontWeight="medium">
                                                    {dept.responsable.prenom} {dept.responsable.nom}
                                                </Typography>
                                                <Typography variant="caption" color="textSecondary">
                                                    {dept.responsable.poste}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    ) : (
                                        <Box sx={{ 
                                            display: 'flex', 
                                            alignItems: 'center',
                                            p: 1,
                                            borderRadius: 2,
                                            backgroundColor: 'rgba(244, 67, 54, 0.08)'
                                        }}>
                                            <Person sx={{ fontSize: 20, mr: 1, color: 'error.main' }} />
                                            <Typography variant="body2" color="error.main" fontWeight="medium">
                                                Aucun responsable assigné
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>

                                {/* Aperçu des employés */}
                                {dept.employes && dept.employes.length > 0 && (
                                    <Box sx={{ mt: 2 }}>
                                        <Typography variant="caption" color="textSecondary" sx={{ mb: 1, display: 'block' }}>
                                            Équipe:
                                        </Typography>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {dept.employes.slice(0, 3).map(emp => (
                                                <Chip
                                                    key={emp._id}
                                                    size="small"
                                                    label={`${emp.prenom} ${emp.nom}`}
                                                    avatar={<Avatar sx={{ width: 24, height: 24, fontSize: 12 }}>{emp.prenom?.charAt(0)}</Avatar>}
                                                    variant="outlined"
                                                />
                                            ))}
                                            {dept.employes.length > 3 && (
                                                <Chip
                                                    size="small"
                                                    label={`+${dept.employes.length - 3}`}
                                                    variant="outlined"
                                                    color="default"
                                                />
                                            )}
                                        </Box>
                                    </Box>
                                )}
                            </CardContent>
                            <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
                                <Tooltip title="Voir les employés">
                                    <IconButton 
                                        size="small" 
                                        color="info"
                                        onClick={() => handleVoirEmployes(dept)}
                                    >
                                        <People />
                                    </IconButton>
                                </Tooltip>
                                {peutModifier && (
                                    <>
                                        <Tooltip title="Modifier">
                                            <IconButton 
                                                size="small" 
                                                color="primary"
                                                onClick={() => handleOpenDialog(dept)}
                                            >
                                                <Edit />
                                            </IconButton>
                                        </Tooltip>
                                        {isAdmin && (
                                            <Tooltip title="Supprimer">
                                                <IconButton 
                                                    size="small" 
                                                    color="error"
                                                    onClick={() => handleDelete(dept)}
                                                >
                                                    <Delete />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                    </>
                                )}
                            </CardActions>
                        </Card>
                    </Grid>
                ))}

                {filteredDepartements.length === 0 && (
                    <Grid item xs={12}>
                        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
                            <Business sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                            <Typography variant="h6" color="textSecondary" gutterBottom>
                                {searchTerm || filterBy !== 'all' 
                                    ? 'Aucun département trouvé pour ces critères' 
                                    : 'Aucun département créé'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                {searchTerm || filterBy !== 'all' 
                                    ? 'Essayez de modifier votre recherche ou vos filtres' 
                                    : 'Créez votre premier département pour commencer'}
                            </Typography>
                            {peutModifier && !searchTerm && filterBy === 'all' && (
                                <Button
                                    variant="contained"
                                    startIcon={<Add />}
                                    onClick={() => handleOpenDialog()}
                                    sx={{
                                        borderRadius: 2,
                                        background: 'linear-gradient(135deg, #4f58a5 0%, #49a2da 100%)',
                                        '&:hover': {
                                            background: 'linear-gradient(135deg, #3d4a94 0%, #3a8cc8 100%)',
                                        }
                                    }}
                                >
                                    Créer un département
                                </Button>
                            )}
                        </Paper>
                    </Grid>
                )}
            </Grid>

            {/* Dialog d'ajout/modification */}
            <Dialog 
                open={openDialog} 
                onClose={handleCloseDialog} 
                maxWidth="md" 
                fullWidth
                TransitionComponent={Fade}
                PaperProps={{
                    sx: {
                        borderRadius: 4,
                        overflow: 'hidden'
                    }
                }}
            >
                {/* Header de la modal */}
                <Box sx={{
                    background: 'linear-gradient(135deg, #4f58a5 0%, #49a2da 100%)',
                    color: 'white',
                    p: 3,
                    position: 'relative'
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{ 
                                bgcolor: 'rgba(255, 255, 255, 0.2)', 
                                mr: 2,
                                width: 48,
                                height: 48
                            }}>
                                {selectedDept ? <Edit /> : <Add />}
                            </Avatar>
                            <Box>
                                <Typography variant="h5" fontWeight="bold">
                                    {selectedDept ? 'Modifier le département' : 'Nouveau département'}
                                </Typography>
                                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                    {selectedDept 
                                        ? 'Mettez à jour les informations du département' 
                                        : 'Créez un nouveau département pour organiser votre équipe'
                                    }
                                </Typography>
                            </Box>
                        </Box>
                        <IconButton 
                            onClick={handleCloseDialog}
                            sx={{ 
                                color: 'white',
                                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' }
                            }}
                        >
                            <Close />
                        </IconButton>
                    </Box>
                </Box>

                <DialogContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {/* Section Informations principales */}
                        <Paper sx={{ p: 3, borderRadius: 3, bgcolor: 'grey.50' }}>
                            <Typography variant="h6" fontWeight="medium" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                                <Business sx={{ mr: 1, color: 'primary.main' }} />
                                Informations principales
                            </Typography>
                            
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                                <TextField
                                    fullWidth
                                    label="Nom du département *"
                                    name="nomDepartement"
                                    value={formData.nomDepartement}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="Ex: Marketing, Développement, Ressources Humaines..."
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Business color="action" />
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
                                
                                <TextField
                                    fullWidth
                                    label="Description"
                                    name="description"
                                    multiline
                                    rows={4}
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    placeholder="Décrivez la mission et les responsabilités de ce département..."
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 2 }}>
                                                <Info color="action" />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2,
                                        }
                                    }}
                                />
                            </Box>
                        </Paper>

                        {/* Section Responsable */}
                        <Paper sx={{ p: 3, borderRadius: 3, bgcolor: 'grey.50' }}>
                            <Typography variant="h6" fontWeight="medium" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                                <Person sx={{ mr: 1, color: 'primary.main' }} />
                                Responsable du département
                            </Typography>
                            
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <FormControl fullWidth>
                                    <InputLabel>Sélectionner un responsable</InputLabel>
                                    <Select
                                        value={formData.responsable}
                                        onChange={handleInputChange}
                                        label="Sélectionner un responsable"
                                        name="responsable"
                                        sx={{ borderRadius: 2, height: 56 }}
                                    >
                                        <MenuItem value="">
                                            <Box sx={{ display: 'flex', alignItems: 'center', py: 1 }}>
                                                <Person sx={{ mr: 1, color: 'text.secondary' }} />
                                                <Typography color="text.secondary">Aucun responsable</Typography>
                                            </Box>
                                        </MenuItem>
                                        {employes.map(emp => (
                                            <MenuItem key={emp._id} value={emp._id}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', py: 0.5 }}>
                                                    <Avatar sx={{ width: 24, height: 24, mr: 1.5, fontSize: 12 }}>
                                                        {emp.prenom?.charAt(0)}{emp.nom?.charAt(0)}
                                                    </Avatar>
                                                    <Box>
                                                        <Typography variant="body2">
                                                            {emp.prenom} {emp.nom}
                                                        </Typography>
                                                        <Typography variant="caption" color="textSecondary">
                                                            {emp.poste}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                {formData.responsable && (
                                    <Box sx={{ 
                                        p: 2, 
                                        borderRadius: 2, 
                                        bgcolor: 'primary.50', 
                                        border: '1px solid', 
                                        borderColor: 'primary.200',
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}>
                                        <CheckCircle sx={{ mr: 1, fontSize: 18, color: 'primary.main' }} />
                                        <Typography variant="body2" color="primary.main">
                                            Un responsable sera assigné pour superviser ce département
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        </Paper>
                    </Box>
                </DialogContent>

                <DialogActions sx={{ p: 3, bgcolor: 'grey.50', borderTop: '1px solid', borderColor: 'divider' }}>
                    <Button 
                        onClick={handleCloseDialog}
                        size="large"
                        sx={{ borderRadius: 2 }}
                    >
                        Annuler
                    </Button>
                    <Button 
                        onClick={handleSubmit} 
                        variant="outlined" 
                        size="medium"
                        disabled={submitting || !formData.nomDepartement}
                        startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : (selectedDept ? <Edit /> : <Add />)}
                        sx={{
                            borderRadius: 3,
                            minWidth: 100,
                            px: 3,
                            py: 1,
                            color: 'primary.main',
                            borderColor: 'primary.main',
                            borderWidth: 1.5,
                            fontWeight: 500,
                            '&:hover': {
                                borderColor: 'primary.dark',
                                borderWidth: 2,
                                bgcolor: 'primary.50',
                            },
                            '&.Mui-disabled': {
                                borderColor: 'grey.300',
                                color: 'grey.400'
                            }
                        }}
                    >
                        {submitting ? 'En cours...' : (selectedDept ? 'Mettre à jour' : 'Créer')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialog liste des employés du département */}
            <Dialog 
                open={openEmployesDialog} 
                onClose={() => setOpenEmployesDialog(false)} 
                maxWidth="sm" 
                fullWidth
            >
                <DialogTitle>
                    Employés du département {selectedDept?.nomDepartement}
                </DialogTitle>
                <DialogContent dividers>
                    <List>
                        {selectedDept?.employes?.length > 0 ? (
                            selectedDept.employes.map((emp, index) => (
                                <React.Fragment key={emp._id}>
                                    <ListItem>
                                        <ListItemAvatar>
                                            <Avatar>
                                                {emp.prenom?.charAt(0)}{emp.nom?.charAt(0)}
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={`${emp.prenom} ${emp.nom}`}
                                            secondary={emp.poste}
                                        />
                                        <Chip 
                                            label={emp.statut} 
                                            size="small"
                                            color={emp.statut === 'Actif' ? 'success' : 'default'}
                                        />
                                    </ListItem>
                                    {index < selectedDept.employes.length - 1 && <Divider />}
                                </React.Fragment>
                            ))
                        ) : (
                            <ListItem>
                                <ListItemText
                                    primary="Aucun employé dans ce département"
                                    secondary="Ajoutez des employés via la page Employés"
                                />
                            </ListItem>
                        )}
                    </List>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenEmployesDialog(false)}>Fermer</Button>
                </DialogActions>
            </Dialog>
        </Layout>
    );
};

export default Departements;