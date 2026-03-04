// frontend/src/pages/Presence.js
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
    DialogActions,
    TextField,
    MenuItem,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip,
    FormControl,
    InputLabel,
    Select
} from '@mui/material';
import {
    Add,
    Edit,
    Delete,
    CheckCircle,
    Cancel
} from '@mui/icons-material';
import { presenceService, employeService } from '../services/api';
import Layout from '../components/Layout';
import Loader from '../components/Loader';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const Presence = () => {
    const { user, isAdmin, isManagerRH } = useAuth();
    const [presences, setPresences] = useState([]);
    const [employes, setEmployes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedPresence, setSelectedPresence] = useState(null);
    const [formData, setFormData] = useState({
        employe: '',
        date: new Date().toISOString().split('T')[0],
        statut: 'Présent',
        note: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [presencesRes, employesRes] = await Promise.all([
                presenceService.getAll(),
                employeService.getAll({ limit: 1000 })
            ]);
            let filteredPresences = presencesRes.data.data;
            let filteredEmployes = employesRes.data.data;

            if (!isAdmin && !isManagerRH) {
                filteredEmployes = filteredEmployes.filter(e => e._id === user.employe);
                filteredPresences = filteredPresences.filter(p => p.employe && p.employe._id === user.employe);
            }

            setPresences(filteredPresences);
            setEmployes(filteredEmployes);
        } catch (error) {
            toast.error('Erreur lors du chargement des données');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (presence = null) => {
        if (presence) {
            setSelectedPresence(presence);
            setFormData({
                employe: presence.employe._id,
                date: new Date(presence.date).toISOString().split('T')[0],
                statut: presence.statut,
                note: presence.note || ''
            });
        } else {
            setSelectedPresence(null);
            setFormData({
                employe: (!isAdmin && !isManagerRH) ? user.employe : '',
                date: new Date().toISOString().split('T')[0],
                statut: 'Présent',
                note: ''
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedPresence(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (selectedPresence) {
                await presenceService.update(selectedPresence._id, formData);
                toast.success('Présence mise à jour avec succès');
            } else {
                await presenceService.create(formData);
                toast.success('Présence créée avec succès');
            }
            handleCloseDialog();
            loadData();
        } catch (error) {
            toast.error('Erreur lors de la sauvegarde');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cette présence ?')) {
            try {
                await presenceService.delete(id);
                toast.success('Présence supprimée avec succès');
                loadData();
            } catch (error) {
                toast.error('Erreur lors de la suppression');
            }
        }
    };

    const handleEntree = async (employeId) => {
        try {
            await presenceService.enregistrerEntree(employeId);
            toast.success('Entrée enregistrée');
            loadData();
        } catch (error) {
            toast.error('Erreur lors de l\'enregistrement de l\'entrée');
        }
    };

    const handleSortie = async (employeId) => {
        try {
            await presenceService.enregistrerSortie(employeId);
            toast.success('Sortie enregistrée');
            loadData();
        } catch (error) {
            toast.error('Erreur lors de l\'enregistrement de la sortie');
        }
    };

    const getStatutColor = (statut) => {
        switch (statut) {
            case 'Présent': return 'success';
            case 'Absent': return 'error';
            case 'Retard': return 'warning';
            case 'Départ anticipé': return 'info';
            case 'Congé': return 'secondary';
            default: return 'default';
        }
    };

    if (loading) {
        return (
            <Layout>
                <Loader />
            </Layout>
        );
    }

    return (
        <Layout>
            <Box sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h4" component="h1">
                        {(!isAdmin && !isManagerRH) ? 'Mes Présences' : 'Gestion des Présences'}
                    </Typography>
                    {(isAdmin || isManagerRH) && (
                        <Button
                            variant="contained"
                            startIcon={<Add />}
                            onClick={() => handleOpenDialog()}
                        >
                            Nouvelle Présence
                        </Button>
                    )}
                </Box>

                {/* Section pour enregistrer entrée/sortie */}
                <Paper sx={{ p: 2, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Enregistrement Entrée/Sortie
                    </Typography>
                    {employes.length === 0 ? (
                        <Typography variant="body1" color="text.secondary">
                            {!isAdmin && !isManagerRH ? 'Votre profil employé n\'est pas configuré. Contactez l\'administrateur.' : 'Aucun employé disponible.'}
                        </Typography>
                    ) : (
                        <Grid container spacing={2}>
                            {employes.slice(0, 10).map((employe) => (
                                <Grid item xs={12} sm={6} md={4} key={employe._id}>
                                    <Card>
                                        <CardContent>
                                            <Typography variant="subtitle1">
                                                {employe.nom} {employe.prenom}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {employe.matricule}
                                            </Typography>
                                        </CardContent>
                                        <CardActions>
                                            <Button
                                                size="small"
                                                startIcon={<CheckCircle />}
                                                onClick={() => handleEntree(employe._id)}
                                                color="success"
                                            >
                                                Entrée
                                            </Button>
                                            <Button
                                                size="small"
                                                startIcon={<Cancel />}
                                                onClick={() => handleSortie(employe._id)}
                                                color="error"
                                            >
                                                Sortie
                                            </Button>
                                        </CardActions>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    )}
                </Paper>

                {/* Liste des présences */}
                <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                        Liste des Présences
                    </Typography>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    {(!isAdmin && !isManagerRH) ? null : <TableCell>Employé</TableCell>}
                                    <TableCell>Date</TableCell>
                                    <TableCell>Heure Entrée</TableCell>
                                    <TableCell>Heure Sortie</TableCell>
                                    <TableCell>Statut</TableCell>
                                    <TableCell>Heures Travaillées</TableCell>
                                    {(!isAdmin && !isManagerRH) ? null : <TableCell>Actions</TableCell>}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {presences.map((presence) => (
                                    <TableRow key={presence._id}>
                                        {(!isAdmin && !isManagerRH) ? null : (
                                            <TableCell>
                                                {presence.employe ? `${presence.employe.nom} ${presence.employe.prenom}` : 'Employé inconnu'}
                                            </TableCell>
                                        )}
                                        <TableCell>
                                            {new Date(presence.date).toLocaleDateString('fr-FR')}
                                        </TableCell>
                                        <TableCell>{presence.heureEntree || '-'}</TableCell>
                                        <TableCell>{presence.heureSortie || '-'}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={presence.statut}
                                                color={getStatutColor(presence.statut)}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>{presence.heuresTravaillees || 0}h</TableCell>
                                        {(!isAdmin && !isManagerRH) ? null : (
                                            <TableCell>
                                                <Tooltip title="Modifier">
                                                    <IconButton
                                                        onClick={() => handleOpenDialog(presence)}
                                                        color="primary"
                                                    >
                                                        <Edit />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Supprimer">
                                                    <IconButton
                                                        onClick={() => handleDelete(presence._id)}
                                                        color="error"
                                                    >
                                                        <Delete />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>

                {/* Dialog pour créer/modifier */}
                <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                    <form onSubmit={handleSubmit}>
                        <DialogTitle>
                            {selectedPresence ? 'Modifier la Présence' : 'Nouvelle Présence'}
                        </DialogTitle>
                        <DialogContent>
                            <Grid container spacing={2} sx={{ mt: 1 }}>
                                {(isAdmin || isManagerRH) && (
                                    <Grid item xs={12}>
                                        <FormControl fullWidth required>
                                            <InputLabel>Employé</InputLabel>
                                            <Select
                                                value={formData.employe}
                                                onChange={(e) => setFormData({ ...formData, employe: e.target.value })}
                                                label="Employé"
                                            >
                                                {employes.map((employe) => (
                                                    <MenuItem key={employe._id} value={employe._id}>
                                                        {employe.nom} {employe.prenom} ({employe.matricule})
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                )}
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Date"
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        required
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth required>
                                        <InputLabel>Statut</InputLabel>
                                        <Select
                                            value={formData.statut}
                                            onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
                                            label="Statut"
                                        >
                                            <MenuItem value="Présent">Présent</MenuItem>
                                            <MenuItem value="Absent">Absent</MenuItem>
                                            <MenuItem value="Retard">Retard</MenuItem>
                                            <MenuItem value="Départ anticipé">Départ anticipé</MenuItem>
                                            <MenuItem value="Congé">Congé</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Note"
                                        multiline
                                        rows={3}
                                        value={formData.note}
                                        onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                                    />
                                </Grid>
                            </Grid>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={handleCloseDialog}>Annuler</Button>
                            <Button type="submit" variant="contained">
                                {selectedPresence ? 'Modifier' : 'Créer'}
                            </Button>
                        </DialogActions>
                    </form>
                </Dialog>
            </Box>
        </Layout>
    );
};

export default Presence;
