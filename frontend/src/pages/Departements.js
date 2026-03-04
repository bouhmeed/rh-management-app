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
    DialogActions,
    TextField,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Chip,
    Divider,
    Tooltip
} from '@mui/material';
import {
    Add,
    Edit,
    Delete,
    People,
    Business,
    Person
} from '@mui/icons-material';
import { departementService, employeService } from '../services/api';
import Layout from '../components/Layout';
import Loader from '../components/Loader';
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
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" gutterBottom fontWeight="bold">
                    Gestion des Départements
                </Typography>
                <Typography variant="body1" color="textSecondary">
                    Organisez les départements de l'entreprise
                </Typography>
            </Box>

            {/* Bouton d'ajout */}
            {peutModifier && (
                <Box sx={{ mb: 3 }}>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => handleOpenDialog()}
                    >
                        Nouveau département
                    </Button>
                </Box>
            )}

            {/* Liste des départements */}
            <Grid container spacing={3}>
                {departements.map((dept) => (
                    <Grid item xs={12} md={6} lg={4} key={dept._id}>
                        <Card elevation={2}>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                                        <Business />
                                    </Avatar>
                                    <Box>
                                        <Typography variant="h6" fontWeight="bold">
                                            {dept.nomDepartement}
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary">
                                            Créé le {new Date(dept.createdAt).toLocaleDateString()}
                                        </Typography>
                                    </Box>
                                </Box>

                                <Typography variant="body2" color="textSecondary" paragraph>
                                    {dept.description || 'Aucune description'}
                                </Typography>

                                <Divider sx={{ my: 2 }} />

                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                    <People sx={{ fontSize: 20, mr: 1, color: 'text.secondary' }} />
                                    <Typography variant="body2">
                                        {dept.employes?.length || 0} employés
                                    </Typography>
                                </Box>

                                {dept.responsable && (
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Person sx={{ fontSize: 20, mr: 1, color: 'text.secondary' }} />
                                        <Typography variant="body2">
                                            Responsable: {dept.responsable.prenom} {dept.responsable.nom}
                                        </Typography>
                                    </Box>
                                )}

                                {/* Aperçu des employés */}
                                {dept.employes && dept.employes.length > 0 && (
                                    <Box sx={{ mt: 2 }}>
                                        <Typography variant="caption" color="textSecondary">
                                            Derniers employés:
                                        </Typography>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                                            {dept.employes.slice(0, 3).map(emp => (
                                                <Chip
                                                    key={emp._id}
                                                    size="small"
                                                    label={`${emp.prenom} ${emp.nom}`}
                                                    avatar={<Avatar>{emp.prenom?.charAt(0)}</Avatar>}
                                                />
                                            ))}
                                            {dept.employes.length > 3 && (
                                                <Chip
                                                    size="small"
                                                    label={`+${dept.employes.length - 3}`}
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

                {departements.length === 0 && (
                    <Grid item xs={12}>
                        <Paper sx={{ p: 4, textAlign: 'center' }}>
                            <Typography variant="body1" color="textSecondary">
                                Aucun département créé
                            </Typography>
                        </Paper>
                    </Grid>
                )}
            </Grid>

            {/* Dialog d'ajout/modification */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {selectedDept ? 'Modifier le département' : 'Nouveau département'}
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Nom du département *"
                                name="nomDepartement"
                                value={formData.nomDepartement}
                                onChange={handleInputChange}
                                required
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Description"
                                name="description"
                                multiline
                                rows={3}
                                value={formData.description}
                                onChange={handleInputChange}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                select
                                label="Responsable"
                                name="responsable"
                                value={formData.responsable}
                                onChange={handleInputChange}
                                SelectProps={{
                                    native: true
                                }}
                            >
                                <option value="">Aucun responsable</option>
                                {employes.map(emp => (
                                    <option key={emp._id} value={emp._id}>
                                        {emp.prenom} {emp.nom} - {emp.poste}
                                    </option>
                                ))}
                            </TextField>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Annuler</Button>
                    <Button onClick={handleSubmit} variant="contained">
                        {selectedDept ? 'Modifier' : 'Créer'}
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