// frontend/src/pages/Conges.js
import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    Button,
    Chip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Grid,
    FormControl,
    InputLabel,
    Select,
    Tooltip,
    Alert
} from '@mui/material';
import {
    Add,
    CheckCircle,
    Cancel,
    Visibility,
    EventNote,
    Pending
} from '@mui/icons-material';
import { congeService, employeService } from '../services/api';
import Layout from '../components/Layout';
import Loader from '../components/Loader';
import ModernHeader from '../components/ModernHeader';
import ModernCard from '../components/ModernCard';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const Conges = () => {
    const [conges, setConges] = useState([]);
    const [employes, setEmployes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [openViewDialog, setOpenViewDialog] = useState(false);
    const [selectedConge, setSelectedConge] = useState(null);
    const [filtreStatut, setFiltreStatut] = useState('');
    const [formData, setFormData] = useState({
        employe: '',
        type: 'Congé payé',
        dateDebut: '',
        dateFin: '',
        motif: ''
    });

    const { user, isManager, isAdmin, isManagerRH } = useAuth();
    const peutApprouver = isManager || isManagerRH || isAdmin;
    const [employeId, setEmployeId] = useState(null);

    useEffect(() => {
        chargerConges();
        chargerEmployes();
        // Fetch user profile to get employe ID
        fetchUserProfile();
    }, [filtreStatut]);

    const fetchUserProfile = async () => {
        try {
            const { authService } = await import('../services/api');
            const response = await authService.getMe();
            console.log('User profile response:', response.data);
            if (response.data.success && response.data.data.employe) {
                setEmployeId(response.data.data.employe._id);
                console.log('Set employeId:', response.data.data.employe._id);
            } else {
                console.log('No employe found in user profile');
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
        }
    };

    const chargerConges = async () => {
        try {
            setLoading(true);
            const params = {};
            if (filtreStatut) params.statut = filtreStatut;
            
            const response = await congeService.getAll(params);
            setConges(response.data.data || []);
        } catch (error) {
            toast.error('Erreur lors du chargement des congés');
        } finally {
            setLoading(false);
        }
    };

    const chargerEmployes = async () => {
        try {
            const response = await employeService.getAll({ limit: 100 });
            setEmployes(response.data.data || []);
        } catch (error) {
            console.error('Erreur chargement employés:', error);
        }
    };

    const handleOpenDialog = () => {
        setFormData({
            employe: user.employe || '',
            type: 'Congé payé',
            dateDebut: '',
            dateFin: '',
            motif: ''
        });
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedConge(null);
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async () => {
        try {
            // Validation - employe field only required for managers
            const isManagerOrAdmin = isManager || isAdmin || isManagerRH;
            if (isManagerOrAdmin && !formData.employe) {
                toast.warning('Veuillez sélectionner un employé');
                return;
            }
            if (!formData.dateDebut || !formData.dateFin || !formData.motif) {
                toast.warning('Veuillez remplir tous les champs obligatoires');
                return;
            }

            if (new Date(formData.dateDebut) > new Date(formData.dateFin)) {
                toast.error('La date de début doit être antérieure à la date de fin');
                return;
            }

            // For regular employees, set employe from fetched profile or user object
            const submitData = {
                ...formData,
                employe: formData.employe || employeId || user.employe?._id || user.employe || user._id
            };

            console.log('Submitting congé data:', submitData);
            console.log('User object:', user);
            console.log('Employe ID from profile:', employeId);

            await congeService.create(submitData);
            toast.success('Demande de congé envoyée avec succès');
            handleCloseDialog();
            chargerConges();
        } catch (error) {
            console.error('Congé creation error:', error);
            console.error('Error response:', error.response?.data);
            const errorMessage = error.response?.data?.message || error.message || 'Erreur lors de la demande';
            toast.error(errorMessage);
        }
    };

    const handleApprouver = async (conge) => {
        try {
            await congeService.approuver(conge._id);
            toast.success('Congé approuvé');
            chargerConges();
        } catch (error) {
            toast.error('Erreur lors de l\'approbation');
        }
    };

    const handleRefuser = async (conge) => {
        const raison = prompt('Raison du refus:');
        if (raison) {
            try {
                await congeService.refuser(conge._id, raison);
                toast.success('Congé refusé');
                chargerConges();
            } catch (error) {
                toast.error('Erreur lors du refus');
            }
        }
    };

    const handleViewDetails = (conge) => {
        setSelectedConge(conge);
        setOpenViewDialog(true);
    };

    const getStatutChip = (statut) => {
        const colors = {
            'En attente': 'warning',
            'Approuvé': 'success',
            'Refusé': 'error',
            'Annulé': 'default'
        };
        return <Chip label={statut} color={colors[statut]} size="small" />;
    };

    const getTypeChip = (type) => {
        const colors = {
            'Congé payé': 'primary',
            'Congé maladie': 'error',
            'Congé maternité': 'secondary',
            'Congé sans solde': 'default'
        };
        return <Chip label={type} color={colors[type]} size="small" variant="outlined" />;
    };

    const calculerJours = (debut, fin) => {
        const diff = new Date(fin) - new Date(debut);
        return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
    };

    return (
        <Layout>
            <ModernHeader
                title="Gestion des Congés"
                subtitle="Gérez les demandes de congés des employés"
                icon={<EventNote />}
            />

            {/* Statistiques rapides */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={3}>
                    <ModernCard
                        title="En attente"
                        value={conges.filter(c => c.statut === 'En attente').length || 0}
                        icon={<Pending />}
                        color="#ed6c02"
                    />
                </Grid>
                <Grid item xs={12} md={3}>
                    <ModernCard
                        title="Approuvés"
                        value={conges.filter(c => c.statut === 'Approuvé').length || 0}
                        icon={<CheckCircle />}
                        color="#2e7d32"
                    />
                </Grid>
                <Grid item xs={12} md={3}>
                    <ModernCard
                        title="Refusés"
                        value={conges.filter(c => c.statut === 'Refusé').length || 0}
                        icon={<Cancel />}
                        color="#d32f2f"
                    />
                </Grid>
                <Grid item xs={12} md={3}>
                    <ModernCard
                        title="Jours totaux"
                        value={conges.reduce((sum, c) => sum + (c.joursDemandes || 0), 0) || 0}
                        icon={<EventNote />}
                        color="#1976d2"
                    />
                </Grid>
            </Grid>

            {/* Barre d'outils */}
            <Paper elevation={3} sx={{
                p: 2.5,
                mb: 3,
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'grey.200',
                background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
            }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ minWidth: 200 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Filtrer par statut</InputLabel>
                            <Select
                                value={filtreStatut}
                                onChange={(e) => setFiltreStatut(e.target.value)}
                                label="Filtrer par statut"
                            >
                                <MenuItem value="">Tous</MenuItem>
                                <MenuItem value="En attente">En attente</MenuItem>
                                <MenuItem value="Approuvé">Approuvé</MenuItem>
                                <MenuItem value="Refusé">Refusé</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                    {!isManager && !isAdmin && (
                        <Button
                            variant="contained"
                            startIcon={<Add />}
                            onClick={handleOpenDialog}
                        >
                            Nouvelle demande
                        </Button>
                    )}
                </Box>
            </Paper>

            {/* Liste des congés */}
            <TableContainer component={Paper} elevation={3} sx={{
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'grey.200',
                background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
            }}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'background.default' }}>
                            <TableCell>Employé</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Période</TableCell>
                            <TableCell>Jours</TableCell>
                            <TableCell>Statut</TableCell>
                            <TableCell>Date demande</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center">
                                    <Loader />
                                </TableCell>
                            </TableRow>
                        ) : conges.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center">
                                    <Typography variant="body1" color="textSecondary">
                                        Aucune demande de congé
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            conges.map((conge) => (
                                <TableRow key={conge._id} hover>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight="bold">
                                            {conge.employe?.prenom} {conge.employe?.nom}
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary">
                                            {conge.employe?.matricule}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>{getTypeChip(conge.type)}</TableCell>
                                    <TableCell>
                                        {new Date(conge.dateDebut).toLocaleDateString()} - {new Date(conge.dateFin).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={`${conge.joursDemandes} jours`} 
                                            size="small" 
                                            variant="outlined"
                                        />
                                    </TableCell>
                                    <TableCell>{getStatutChip(conge.statut)}</TableCell>
                                    <TableCell>
                                        {new Date(conge.createdAt).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell align="right">
                                        <Tooltip title="Voir détails">
                                            <IconButton 
                                                size="small" 
                                                color="info"
                                                onClick={() => handleViewDetails(conge)}
                                            >
                                                <Visibility />
                                            </IconButton>
                                        </Tooltip>
                                        
                                        {peutApprouver && conge.statut === 'En attente' && (
                                            <>
                                                <Tooltip title="Approuver">
                                                    <IconButton 
                                                        size="small" 
                                                        color="success"
                                                        onClick={() => handleApprouver(conge)}
                                                    >
                                                        <CheckCircle />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Refuser">
                                                    <IconButton 
                                                        size="small" 
                                                        color="error"
                                                        onClick={() => handleRefuser(conge)}
                                                    >
                                                        <Cancel />
                                                    </IconButton>
                                                </Tooltip>
                                            </>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Modal moderne de nouvelle demande */}
            <Dialog 
                open={openDialog} 
                onClose={handleCloseDialog} 
                maxWidth="md" 
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        overflow: 'hidden'
                    }
                }}
            >
                <Box sx={{
                    p: 3,
                    background: 'linear-gradient(135deg, #4f58a5 0%, #49a2da 100%)',
                    color: 'white',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <EventNote sx={{ mr: 2, fontSize: 28 }} />
                        <Box>
                            <Typography variant="h5" fontWeight="bold">
                                Nouvelle Demande de Congé
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                Remplissez les informations pour votre demande
                            </Typography>
                        </Box>
                    </Box>
                    <IconButton 
                        onClick={handleCloseDialog}
                        sx={{ 
                            color: 'white',
                            bgcolor: 'rgba(255, 255, 255, 0.1)',
                            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)' }
                        }}
                    >
                        <Cancel />
                    </IconButton>
                </Box>
                
                <DialogContent sx={{ p: 3, bgcolor: 'grey.50' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {/* Section Employé (managers uniquement) */}
                        {(isManager || isAdmin || isManagerRH) && (
                            <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'white', border: '1px solid', borderColor: 'grey.200' }}>
                                <Typography variant="h6" fontWeight="medium" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                                    <EventNote sx={{ mr: 1, color: 'primary.main' }} />
                                    Sélection de l'employé
                                </Typography>
                                <Box sx={{ minWidth: 280 }}>
                                    <FormControl fullWidth>
                                        <InputLabel>Employé</InputLabel>
                                        <Select
                                            name="employe"
                                            value={formData.employe}
                                            onChange={handleInputChange}
                                            label="Employé"
                                            sx={{ borderRadius: 2, height: 56 }}
                                        >
                                            {employes.map(emp => (
                                                <MenuItem key={emp._id} value={emp._id}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                        <EventNote sx={{ mr: 1, color: 'primary.main', fontSize: 20 }} />
                                                        <Box>
                                                            <Typography variant="body2">
                                                                {emp.prenom} {emp.nom}
                                                            </Typography>
                                                            <Typography variant="caption" color="textSecondary">
                                                                {emp.matricule}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Box>
                            </Box>
                        )}

                        {/* Section Détails du congé */}
                        <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'white', border: '1px solid', borderColor: 'grey.200' }}>
                            <Typography variant="h6" fontWeight="medium" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                                <EventNote sx={{ mr: 1, color: 'primary.main' }} />
                                Détails du Congé
                            </Typography>
                            
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                                <Box sx={{ minWidth: 280 }}>
                                    <FormControl fullWidth>
                                        <InputLabel>Type de congé</InputLabel>
                                        <Select
                                            name="type"
                                            value={formData.type}
                                            onChange={handleInputChange}
                                            label="Type de congé"
                                            sx={{ borderRadius: 2, height: 56 }}
                                        >
                                            <MenuItem value="Congé payé">
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main', mr: 1 }} />
                                                    Congé payé
                                                </Box>
                                            </MenuItem>
                                            <MenuItem value="Congé maladie">
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'error.main', mr: 1 }} />
                                                    Congé maladie
                                                </Box>
                                            </MenuItem>
                                            <MenuItem value="Congé maternité">
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'warning.main', mr: 1 }} />
                                                    Congé maternité
                                                </Box>
                                            </MenuItem>
                                            <MenuItem value="Congé sans solde">
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'grey.main', mr: 1 }} />
                                                    Congé sans solde
                                                </Box>
                                            </MenuItem>
                                        </Select>
                                    </FormControl>
                                </Box>
                                
                                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                    <Box sx={{ minWidth: 200, flex: 1 }}>
                                        <TextField
                                            fullWidth
                                            label="Date de début"
                                            name="dateDebut"
                                            type="date"
                                            value={formData.dateDebut}
                                            onChange={handleInputChange}
                                            InputLabelProps={{ shrink: true }}
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
                                            label="Date de fin"
                                            name="dateFin"
                                            type="date"
                                            value={formData.dateFin}
                                            onChange={handleInputChange}
                                            InputLabelProps={{ shrink: true }}
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: 2,
                                                    height: 56,
                                                }
                                            }}
                                        />
                                    </Box>
                                </Box>
                                
                                <TextField
                                    fullWidth
                                    label="Motif de la demande"
                                    name="motif"
                                    multiline
                                    rows={3}
                                    value={formData.motif}
                                    onChange={handleInputChange}
                                    placeholder="Veuillez décrire la raison de votre demande de congé..."
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2,
                                        }
                                    }}
                                />
                            </Box>
                        </Box>

                        {/* Section Calcul des jours */}
                        {formData.dateDebut && formData.dateFin && (
                            <Box sx={{ 
                                p: 2.5, 
                                borderRadius: 2, 
                                bgcolor: '#e3f2fd', 
                                border: '1px solid', 
                                borderColor: '#bbdefb' 
                            }}>
                                <Typography variant="h6" fontWeight="medium" sx={{ mb: 1, display: 'flex', alignItems: 'center', color: '#1976d2' }}>
                                    <EventNote sx={{ mr: 1, color: '#1976d2' }} />
                                    Résumé de la demande
                                </Typography>
                                <Typography variant="body1" sx={{ color: '#1976d2', fontWeight: 500 }}>
                                    Nombre de jours demandés: <strong>{calculerJours(formData.dateDebut, formData.dateFin)} jours</strong>
                                </Typography>
                                <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                                    Période: {new Date(formData.dateDebut).toLocaleDateString('fr-FR')} - {new Date(formData.dateFin).toLocaleDateString('fr-FR')}
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </DialogContent>
                
                <DialogActions sx={{ p: 3, bgcolor: 'grey.50', gap: 2 }}>
                    <Button 
                        onClick={handleCloseDialog}
                        variant="outlined"
                        sx={{ borderRadius: 2, minWidth: 120 }}
                    >
                        Annuler
                    </Button>
                    <Button 
                        onClick={handleSubmit} 
                        variant="contained"
                        sx={{ 
                            borderRadius: 2, 
                            minWidth: 150,
                            background: 'linear-gradient(135deg, #4f58a5 0%, #49a2da 100%)',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #3d4580 0%, #3a85c0 100%)',
                            }
                        }}
                    >
                        Envoyer la demande
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialog des détails */}
            <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Détails de la demande de congé</DialogTitle>
                <DialogContent dividers>
                    {selectedConge && (
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <Typography variant="subtitle2" color="textSecondary">
                                    Employé
                                </Typography>
                                <Typography variant="body1" gutterBottom>
                                    {selectedConge.employe?.prenom} {selectedConge.employe?.nom}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="textSecondary">
                                    Type de congé
                                </Typography>
                                <Typography variant="body1" gutterBottom>
                                    {selectedConge.type}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="textSecondary">
                                    Statut
                                </Typography>
                                <Box sx={{ mt: 0.5 }}>
                                    {getStatutChip(selectedConge.statut)}
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="textSecondary">
                                    Date de début
                                </Typography>
                                <Typography variant="body1" gutterBottom>
                                    {new Date(selectedConge.dateDebut).toLocaleDateString()}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="textSecondary">
                                    Date de fin
                                </Typography>
                                <Typography variant="body1" gutterBottom>
                                    {new Date(selectedConge.dateFin).toLocaleDateString()}
                                </Typography>
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="subtitle2" color="textSecondary">
                                    Nombre de jours
                                </Typography>
                                <Typography variant="body1" gutterBottom>
                                    {selectedConge.joursDemandes} jours
                                </Typography>
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="subtitle2" color="textSecondary">
                                    Motif
                                </Typography>
                                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                                    <Typography variant="body2">
                                        {selectedConge.motif}
                                    </Typography>
                                </Paper>
                            </Grid>
                            {selectedConge.approuvePar && (
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="textSecondary">
                                        Traité par
                                    </Typography>
                                    <Typography variant="body2">
                                        {selectedConge.approuvePar.email} le {new Date(selectedConge.dateApprobation).toLocaleDateString()}
                                    </Typography>
                                </Grid>
                            )}
                            {selectedConge.commentaire && (
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="textSecondary">
                                        Commentaire
                                    </Typography>
                                    <Alert severity="info">
                                        {selectedConge.commentaire}
                                    </Alert>
                                </Grid>
                            )}
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenViewDialog(false)}>Fermer</Button>
                </DialogActions>
            </Dialog>
        </Layout>
    );
};

export default Conges;