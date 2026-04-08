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
    Alert,
    Stepper,
    Step,
    StepLabel
} from '@mui/material';
import {
    Add,
    CheckCircle,
    Cancel,
    Visibility,
    EventNote
} from '@mui/icons-material';
import { congeService, employeService } from '../services/api';
import Layout from '../components/Layout';
import Loader from '../components/Loader';
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

    useEffect(() => {
        chargerConges();
        chargerEmployes();
    }, [filtreStatut]);

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
            // Validation
            if (!formData.employe || !formData.dateDebut || !formData.dateFin || !formData.motif) {
                toast.warning('Veuillez remplir tous les champs obligatoires');
                return;
            }

            if (new Date(formData.dateDebut) > new Date(formData.dateFin)) {
                toast.error('La date de début doit être antérieure à la date de fin');
                return;
            }

            await congeService.create(formData);
            toast.success('Demande de congé envoyée avec succès');
            handleCloseDialog();
            chargerConges();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Erreur lors de la demande');
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
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" gutterBottom fontWeight="bold">
                    Gestion des Congés
                </Typography>
                <Typography variant="body1" color="textSecondary">
                    Gérez les demandes de congés des employés
                </Typography>
            </Box>

            {/* Statistiques rapides */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.light', color: 'white' }}>
                        <Typography variant="h4">
                            {conges.filter(c => c.statut === 'En attente').length}
                        </Typography>
                        <Typography variant="body2">En attente</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light', color: 'white' }}>
                        <Typography variant="h4">
                            {conges.filter(c => c.statut === 'Approuvé').length}
                        </Typography>
                        <Typography variant="body2">Approuvés</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'error.light', color: 'white' }}>
                        <Typography variant="h4">
                            {conges.filter(c => c.statut === 'Refusé').length}
                        </Typography>
                        <Typography variant="body2">Refusés</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'info.light', color: 'white' }}>
                        <Typography variant="h4">
                            {conges.reduce((sum, c) => sum + (c.joursDemandes || 0), 0)}
                        </Typography>
                        <Typography variant="body2">Jours totaux</Typography>
                    </Paper>
                </Grid>
            </Grid>

            {/* Barre d'outils */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={4}>
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
                    </Grid>
                    <Grid item xs={12} md={8} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        {!isManager && !isAdmin && (
                            <Button
                                variant="contained"
                                startIcon={<Add />}
                                onClick={handleOpenDialog}
                            >
                                Nouvelle demande
                            </Button>
                        )}
                    </Grid>
                </Grid>
            </Paper>

            {/* Liste des congés */}
            <TableContainer component={Paper}>
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

            {/* Dialog de nouvelle demande */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>Nouvelle demande de congé</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        {isManager && (
                            <Grid item xs={12}>
                                <FormControl fullWidth>
                                    <InputLabel>Employé</InputLabel>
                                    <Select
                                        name="employe"
                                        value={formData.employe}
                                        onChange={handleInputChange}
                                        label="Employé"
                                    >
                                        {employes.map(emp => (
                                            <MenuItem key={emp._id} value={emp._id}>
                                                {emp.prenom} {emp.nom}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        )}
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <InputLabel>Type de congé</InputLabel>
                                <Select
                                    name="type"
                                    value={formData.type}
                                    onChange={handleInputChange}
                                    label="Type de congé"
                                >
                                    <MenuItem value="Congé payé">Congé payé</MenuItem>
                                    <MenuItem value="Congé maladie">Congé maladie</MenuItem>
                                    <MenuItem value="Congé maternité">Congé maternité</MenuItem>
                                    <MenuItem value="Congé sans solde">Congé sans solde</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Date de début"
                                name="dateDebut"
                                type="date"
                                value={formData.dateDebut}
                                onChange={handleInputChange}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Date de fin"
                                name="dateFin"
                                type="date"
                                value={formData.dateFin}
                                onChange={handleInputChange}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Motif"
                                name="motif"
                                multiline
                                rows={3}
                                value={formData.motif}
                                onChange={handleInputChange}
                                placeholder="Raison de la demande de congé"
                            />
                        </Grid>
                        
                        {formData.dateDebut && formData.dateFin && (
                            <Grid item xs={12}>
                                <Alert severity="info">
                                    Nombre de jours demandés: {calculerJours(formData.dateDebut, formData.dateFin)} jours
                                </Alert>
                            </Grid>
                        )}
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Annuler</Button>
                    <Button onClick={handleSubmit} variant="contained">
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