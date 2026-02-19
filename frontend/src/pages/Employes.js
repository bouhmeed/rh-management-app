// frontend/src/pages/Employes.js
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
    TablePagination,
    TextField,
    InputAdornment,
    IconButton,
    Button,
    Chip,
    Avatar,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    MenuItem,
    Grid,
    FormControl,
    InputLabel,
    Select,
    Tooltip
} from '@mui/material';
import {
    Search,
    Add,
    Edit,
    Delete,
    Visibility,
    FilterList,
    Refresh,
    PersonAdd
} from '@mui/icons-material';
import { employeService, departementService } from '../services/api';
import Layout from '../components/Layout';
import Loader from '../components/Loader';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const Employes = () => {
    const [employes, setEmployes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [total, setTotal] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [filtres, setFiltres] = useState({
        departement: '',
        statut: ''
    });
    const [departements, setDepartements] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [selectedEmploye, setSelectedEmploye] = useState(null);
    const [formData, setFormData] = useState({
        nom: '',
        prenom: '',
        email: '',
        telephone: '',
        poste: '',
        departement: '',
        salaire: '',
        dateEmbauche: new Date().toISOString().split('T')[0],
        statut: 'Actif',
        adresse: {
            rue: '',
            ville: '',
            codePostal: '',
            pays: 'Tunisie'
        },
        dateNaissance: '',
        genre: '',
        situationFamiliale: '',
        enfants: 0
    });

    const { isAdmin, isManagerRH } = useAuth();
    const peutModifier = isAdmin || isManagerRH;

    useEffect(() => {
        chargerEmployes();
        chargerDepartements();
    }, [page, rowsPerPage, searchTerm, filtres]);

    const chargerEmployes = async () => {
        try {
            setLoading(true);
            const params = {
                page: page + 1,
                limit: rowsPerPage,
                recherche: searchTerm || undefined,
                ...filtres
            };
            
            const response = await employeService.getAll(params);
            setEmployes(response.data.data || []);
            setTotal(response.data.total || 0);
        } catch (error) {
            toast.error('Erreur lors du chargement des employés');
        } finally {
            setLoading(false);
        }
    };

    const chargerDepartements = async () => {
        try {
            const response = await departementService.getAll();
            setDepartements(response.data.data || []);
        } catch (error) {
            console.error('Erreur chargement départements:', error);
        }
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleSearch = (event) => {
        setSearchTerm(event.target.value);
        setPage(0);
    };

    const handleFilterChange = (event) => {
        setFiltres({
            ...filtres,
            [event.target.name]: event.target.value
        });
        setPage(0);
    };

    const handleOpenDialog = (employe = null) => {
        if (employe) {
            setSelectedEmploye(employe);
            setFormData({
                nom: employe.nom || '',
                prenom: employe.prenom || '',
                email: employe.email || '',
                telephone: employe.telephone || '',
                poste: employe.poste || '',
                departement: employe.departement?._id || '',
                salaire: employe.salaire || '',
                dateEmbauche: employe.dateEmbauche?.split('T')[0] || new Date().toISOString().split('T')[0],
                statut: employe.statut || 'Actif',
                adresse: employe.adresse || {
                    rue: '',
                    ville: '',
                    codePostal: '',
                    pays: 'Tunisie'
                },
                dateNaissance: employe.dateNaissance?.split('T')[0] || '',
                genre: employe.genre || '',
                situationFamiliale: employe.situationFamiliale || '',
                enfants: employe.enfants || 0
            });
        } else {
            setSelectedEmploye(null);
            setFormData({
                nom: '',
                prenom: '',
                email: '',
                telephone: '',
                poste: '',
                departement: '',
                salaire: '',
                dateEmbauche: new Date().toISOString().split('T')[0],
                statut: 'Actif',
                adresse: {
                    rue: '',
                    ville: '',
                    codePostal: '',
                    pays: 'Tunisie'
                },
                dateNaissance: '',
                genre: '',
                situationFamiliale: '',
                enfants: 0
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedEmploye(null);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith('adresse.')) {
            const adresseField = name.split('.')[1];
            setFormData({
                ...formData,
                adresse: {
                    ...formData.adresse,
                    [adresseField]: value
                }
            });
        } else {
            setFormData({
                ...formData,
                [name]: value
            });
        }
    };

    const handleSubmit = async () => {
        try {
            // Validation simple
            if (!formData.nom || !formData.prenom || !formData.poste || !formData.salaire) {
                toast.warning('Veuillez remplir tous les champs obligatoires');
                return;
            }

            if (selectedEmploye) {
                await employeService.update(selectedEmploye._id, formData);
                toast.success('Employé modifié avec succès');
            } else {
                await employeService.create(formData);
                toast.success('Employé ajouté avec succès');
            }
            
            handleCloseDialog();
            chargerEmployes();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Erreur lors de l\'opération');
        }
    };

    const handleDeleteClick = (employe) => {
        setSelectedEmploye(employe);
        setOpenDeleteDialog(true);
    };

    const handleDeleteConfirm = async () => {
        try {
            await employeService.delete(selectedEmploye._id);
            toast.success('Employé supprimé avec succès');
            setOpenDeleteDialog(false);
            chargerEmployes();
        } catch (error) {
            toast.error('Erreur lors de la suppression');
        }
    };

    const getStatutChip = (statut) => {
        const colors = {
            'Actif': 'success',
            'En congé': 'warning',
            'Suspendu': 'error',
            'Démissionné': 'default'
        };
        return <Chip label={statut} color={colors[statut] || 'default'} size="small" />;
    };

    return (
        <Layout>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" gutterBottom fontWeight="bold">
                    Gestion des Employés
                </Typography>
                <Typography variant="body1" color="textSecondary">
                    Gérez tous les employés de l'entreprise
                </Typography>
            </Box>

            {/* Barre d'outils */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={4}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Rechercher un employé..."
                            value={searchTerm}
                            onChange={handleSearch}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search />
                                    </InputAdornment>
                                )
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Département</InputLabel>
                            <Select
                                name="departement"
                                value={filtres.departement}
                                onChange={handleFilterChange}
                                label="Département"
                            >
                                <MenuItem value="">Tous</MenuItem>
                                {departements.map(dept => (
                                    <MenuItem key={dept._id} value={dept._id}>
                                        {dept.nomDepartement}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Statut</InputLabel>
                            <Select
                                name="statut"
                                value={filtres.statut}
                                onChange={handleFilterChange}
                                label="Statut"
                            >
                                <MenuItem value="">Tous</MenuItem>
                                <MenuItem value="Actif">Actif</MenuItem>
                                <MenuItem value="En congé">En congé</MenuItem>
                                <MenuItem value="Suspendu">Suspendu</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={4} sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <Tooltip title="Actualiser">
                            <IconButton onClick={chargerEmployes}>
                                <Refresh />
                            </IconButton>
                        </Tooltip>
                        {peutModifier && (
                            <Button
                                variant="contained"
                                startIcon={<Add />}
                                onClick={() => handleOpenDialog()}
                            >
                                Nouvel Employé
                            </Button>
                        )}
                    </Grid>
                </Grid>
            </Paper>

            {/* Tableau des employés */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'background.default' }}>
                            <TableCell>Employé</TableCell>
                            <TableCell>Contact</TableCell>
                            <TableCell>Poste</TableCell>
                            <TableCell>Département</TableCell>
                            <TableCell>Statut</TableCell>
                            <TableCell>Date d'embauche</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                                    <Loader />
                                </TableCell>
                            </TableRow>
                        ) : employes.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                                    <Typography variant="body1" color="textSecondary">
                                        Aucun employé trouvé
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            employes.map((employe) => (
                                <TableRow key={employe._id} hover>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                                                {employe.prenom?.charAt(0)}{employe.nom?.charAt(0)}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="body2" fontWeight="bold">
                                                    {employe.prenom} {employe.nom}
                                                </Typography>
                                                <Typography variant="caption" color="textSecondary">
                                                    {employe.matricule}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">{employe.email}</Typography>
                                        <Typography variant="caption" color="textSecondary">
                                            {employe.telephone}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>{employe.poste}</TableCell>
                                    <TableCell>{employe.departement?.nomDepartement || '-'}</TableCell>
                                    <TableCell>{getStatutChip(employe.statut)}</TableCell>
                                    <TableCell>
                                        {new Date(employe.dateEmbauche).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell align="right">
                                        <Tooltip title="Voir détails">
                                            <IconButton size="small" color="info">
                                                <Visibility />
                                            </IconButton>
                                        </Tooltip>
                                        {peutModifier && (
                                            <>
                                                <Tooltip title="Modifier">
                                                    <IconButton 
                                                        size="small" 
                                                        color="primary"
                                                        onClick={() => handleOpenDialog(employe)}
                                                    >
                                                        <Edit />
                                                    </IconButton>
                                                </Tooltip>
                                                {isAdmin && (
                                                    <Tooltip title="Supprimer">
                                                        <IconButton 
                                                            size="small" 
                                                            color="error"
                                                            onClick={() => handleDeleteClick(employe)}
                                                        >
                                                            <Delete />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                            </>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    component="div"
                    count={total}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    labelRowsPerPage="Lignes par page"
                />
            </TableContainer>

            {/* Dialog d'ajout/modification */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle>
                    {selectedEmploye ? 'Modifier l\'employé' : 'Nouvel employé'}
                </DialogTitle>
                <DialogContent dividers>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Nom *"
                                name="nom"
                                value={formData.nom}
                                onChange={handleInputChange}
                                margin="normal"
                                required
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Prénom *"
                                name="prenom"
                                value={formData.prenom}
                                onChange={handleInputChange}
                                margin="normal"
                                required
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                margin="normal"
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Téléphone"
                                name="telephone"
                                value={formData.telephone}
                                onChange={handleInputChange}
                                margin="normal"
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Poste *"
                                name="poste"
                                value={formData.poste}
                                onChange={handleInputChange}
                                margin="normal"
                                required
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth margin="normal">
                                <InputLabel>Département</InputLabel>
                                <Select
                                    name="departement"
                                    value={formData.departement}
                                    onChange={handleInputChange}
                                    label="Département"
                                >
                                    <MenuItem value="">Aucun</MenuItem>
                                    {departements.map(dept => (
                                        <MenuItem key={dept._id} value={dept._id}>
                                            {dept.nomDepartement}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                label="Salaire *"
                                name="salaire"
                                type="number"
                                value={formData.salaire}
                                onChange={handleInputChange}
                                margin="normal"
                                required
                                InputProps={{
                                    endAdornment: <InputAdornment position="end">DT</InputAdornment>
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                label="Date d'embauche"
                                name="dateEmbauche"
                                type="date"
                                value={formData.dateEmbauche}
                                onChange={handleInputChange}
                                margin="normal"
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <FormControl fullWidth margin="normal">
                                <InputLabel>Statut</InputLabel>
                                <Select
                                    name="statut"
                                    value={formData.statut}
                                    onChange={handleInputChange}
                                    label="Statut"
                                >
                                    <MenuItem value="Actif">Actif</MenuItem>
                                    <MenuItem value="En congé">En congé</MenuItem>
                                    <MenuItem value="Suspendu">Suspendu</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                                Informations personnelles
                            </Typography>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                label="Date de naissance"
                                name="dateNaissance"
                                type="date"
                                value={formData.dateNaissance}
                                onChange={handleInputChange}
                                margin="normal"
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <FormControl fullWidth margin="normal">
                                <InputLabel>Genre</InputLabel>
                                <Select
                                    name="genre"
                                    value={formData.genre}
                                    onChange={handleInputChange}
                                    label="Genre"
                                >
                                    <MenuItem value="M">Masculin</MenuItem>
                                    <MenuItem value="F">Féminin</MenuItem>
                                    <MenuItem value="Autre">Autre</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <FormControl fullWidth margin="normal">
                                <InputLabel>Situation familiale</InputLabel>
                                <Select
                                    name="situationFamiliale"
                                    value={formData.situationFamiliale}
                                    onChange={handleInputChange}
                                    label="Situation familiale"
                                >
                                    <MenuItem value="Célibataire">Célibataire</MenuItem>
                                    <MenuItem value="Marié(e)">Marié(e)</MenuItem>
                                    <MenuItem value="Divorcé(e)">Divorcé(e)</MenuItem>
                                    <MenuItem value="Veuf(ve)">Veuf(ve)</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                label="Nombre d'enfants"
                                name="enfants"
                                type="number"
                                value={formData.enfants}
                                onChange={handleInputChange}
                                margin="normal"
                                InputProps={{ inputProps: { min: 0 } }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="subtitle2" gutterBottom>
                                Adresse
                            </Typography>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Rue"
                                name="adresse.rue"
                                value={formData.adresse.rue}
                                onChange={handleInputChange}
                                margin="normal"
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                label="Ville"
                                name="adresse.ville"
                                value={formData.adresse.ville}
                                onChange={handleInputChange}
                                margin="normal"
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                label="Code postal"
                                name="adresse.codePostal"
                                value={formData.adresse.codePostal}
                                onChange={handleInputChange}
                                margin="normal"
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                label="Pays"
                                name="adresse.pays"
                                value={formData.adresse.pays}
                                onChange={handleInputChange}
                                margin="normal"
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Annuler</Button>
                    <Button onClick={handleSubmit} variant="contained">
                        {selectedEmploye ? 'Modifier' : 'Ajouter'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialog de confirmation de suppression */}
            <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
                <DialogTitle>Confirmer la suppression</DialogTitle>
                <DialogContent>
                    <Typography>
                        Êtes-vous sûr de vouloir supprimer l'employé {selectedEmploye?.prenom} {selectedEmploye?.nom} ?
                    </Typography>
                    <Typography variant="caption" color="error">
                        Cette action est irréversible.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDeleteDialog(false)}>Annuler</Button>
                    <Button onClick={handleDeleteConfirm} color="error" variant="contained">
                        Supprimer
                    </Button>
                </DialogActions>
            </Dialog>
        </Layout>
    );
};

export default Employes;