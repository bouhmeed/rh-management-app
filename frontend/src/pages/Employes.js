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
    DialogContentText,
    DialogActions,
    MenuItem,
    Grid,
    FormControl,
    InputLabel,
    Select,
    Tooltip,
    FormControlLabel,
    Checkbox,
    Tabs,
    Tab,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Stack,
    CircularProgress,
    Fade
} from '@mui/material';
import {
    Search,
    Add,
    Edit,
    Delete,
    Visibility,
    FilterList,
    Refresh,
    PersonAdd,
    EventNote,
    Settings,
    ExpandMore,
    Clear,
    Business,
    Info,
    Close,
    CheckCircle,
    Person,
    Email,
    Phone,
    Work,
    CalendarToday,
    Home,
    Payment
} from '@mui/icons-material';
import { employeService, departementService, congeService } from '../services/api';
import Layout from '../components/Layout';
import Loader from '../components/Loader';
import ModernHeader from '../components/ModernHeader';
import ModernCard from '../components/ModernCard';
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
    const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
    const [openCongeDialog, setOpenCongeDialog] = useState(false);
    const [openPayrollTemplateDialog, setOpenPayrollTemplateDialog] = useState(false);
    const [selectedEmploye, setSelectedEmploye] = useState(null);
    const [activeTab, setActiveTab] = useState(0);
    const [contratData, setContratData] = useState({
        typeContrat: 'CDI',
        dateDebut: new Date().toISOString().split('T')[0],
        dateFin: '',
        salaireBase: '',
        periodeEssai: { duree: '' },
        avantages: [],
        payrollTemplate: {
            defaultPrimes: [],
            defaultDeductions: [],
            transportAllowance: { enabled: false, montant: 0 },
            overtimeRate: { enabled: false, multiplier: 1.5 },
            mealAllowance: { enabled: false, montant: 0 }
        }
    });
    const [payrollTemplate, setPayrollTemplate] = useState({
        defaultPrimes: [],
        defaultDeductions: [],
        transportAllowance: { enabled: false, montant: 0 },
        overtimeRate: { enabled: false, multiplier: 1.5 },
        mealAllowance: { enabled: false, montant: 0 }
    });
    const [congeFormData, setCongeFormData] = useState({
        type: 'Annuel',
        dateDebut: '',
        dateFin: '',
        motif: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        nom: '',
        prenom: '',
        email: '',
        telephone: '',
        poste: '',
        departement: '',
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

    const handleOpenPayrollTemplate = async (employe) => {
        setSelectedEmploye(employe);
        try {
            const response = await employeService.getPayrollTemplate(employe._id);
            if (response.data.data) {
                setPayrollTemplate(response.data.data);
            }
            setOpenPayrollTemplateDialog(true);
        } catch (error) {
            toast.error('Erreur lors du chargement du modèle de paie');
        }
    };

    const handleSavePayrollTemplate = async () => {
        try {
            await employeService.updatePayrollTemplate(selectedEmploye._id, { payrollTemplate });
            toast.success('Modèle de paie enregistré avec succès');
            setOpenPayrollTemplateDialog(false);
            chargerEmployes();
        } catch (error) {
            toast.error('Erreur lors de l\'enregistrement du modèle de paie');
        }
    };

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

    const handleClearFilters = () => {
        setFiltres({
            departement: '',
            statut: ''
        });
        setPage(0);
    };

    const hasActiveFilters = filtres.departement || filtres.statut;

    const handleOpenDialog = (employe = null) => {
        if (employe) {
            setSelectedEmploye(employe);
            setFormData({
                nom: employe.nom || '',
                prenom: employe.prenom || '',
                email: employe.utilisateur?.email || '',
                telephone: employe.telephone || '',
                poste: employe.poste || '',
                departement: employe.departement?._id || '',
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
            setContratData({
                typeContrat: 'CDI',
                dateDebut: new Date().toISOString().split('T')[0],
                dateFin: '',
                salaireBase: '',
                periodeEssai: { duree: '' },
                avantages: [],
                payrollTemplate: {
                    defaultPrimes: [],
                    defaultDeductions: [],
                    transportAllowance: { enabled: false, montant: 0 },
                    overtimeRate: { enabled: false, multiplier: 1.5 },
                    mealAllowance: { enabled: false, montant: 0 }
                }
            });
            setActiveTab(0);
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

    const handleContratChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith('payrollTemplate.')) {
            const field = name.split('.')[1];
            setContratData({
                ...contratData,
                payrollTemplate: {
                    ...contratData.payrollTemplate,
                    [field]: value
                }
            });
        } else if (name.startsWith('periodeEssai.')) {
            const field = name.split('.')[1];
            setContratData({
                ...contratData,
                periodeEssai: {
                    ...contratData.periodeEssai,
                    [field]: value
                }
            });
        } else {
            setContratData({
                ...contratData,
                [name]: value
            });
        }
    };

    const handleSubmit = async () => {
        try {
            // Validation simple
            if (!formData.nom || !formData.prenom || !formData.poste || !formData.departement) {
                toast.warning('Veuillez remplir tous les champs obligatoires');
                return;
            }

            setSubmitting(true);

            if (selectedEmploye) {
                await employeService.update(selectedEmploye._id, formData);
                toast.success('Employé modifié avec succès');
            } else {
                // Pour les nouveaux employés, utiliser createWithContract
                if (!contratData.salaireBase) {
                    toast.warning('Veuillez renseigner le salaire de base dans l\'onglet Contrat');
                    setSubmitting(false);
                    return;
                }
                const data = {
                    ...formData,
                    contrat: {
                        ...contratData,
                        salaireBase: Number(contratData.salaireBase),
                        periodeEssai: {
                            duree: contratData.periodeEssai.duree ? Number(contratData.periodeEssai.duree) : undefined
                        }
                    }
                };
                await employeService.createWithContract(data);
                toast.success('Employé et contrat créés avec succès');
            }

            handleCloseDialog();
            chargerEmployes();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Erreur lors de l\'opération');
        } finally {
            setSubmitting(false);
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

    const handleViewDetails = (employe) => {
        setSelectedEmploye(employe);
        setOpenDetailsDialog(true);
    };

    const handleOpenCongeDialog = (employe) => {
        setSelectedEmploye(employe);
        setCongeFormData({
            type: 'Annuel',
            dateDebut: '',
            dateFin: '',
            motif: ''
        });
        setOpenCongeDialog(true);
    };

    const handleCongeInputChange = (e) => {
        setCongeFormData({
            ...congeFormData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmitConge = async () => {
        try {
            if (!congeFormData.dateDebut || !congeFormData.dateFin) {
                toast.warning('Veuillez sélectionner les dates de congé');
                return;
            }

            const congeData = {
                ...congeFormData,
                employe: selectedEmploye._id
            };

            await congeService.create(congeData);
            toast.success('Demande de congé créée avec succès');
            setOpenCongeDialog(false);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Erreur lors de la création du congé');
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
            <ModernHeader
                title="Gestion des Employés"
                subtitle="Gérez tous les employés de l'entreprise"
                icon={<PersonAdd />}
            />

            {/* Barre d'outils */}
            <Paper elevation={3} sx={{
                p: 2.5,
                mb: 3,
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'grey.200',
                background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
            }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <TextField
                        size="small"
                        placeholder="Rechercher un employé..."
                        value={searchTerm}
                        onChange={handleSearch}
                        sx={{ width: 250 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search fontSize="small" />
                                </InputAdornment>
                            )
                        }}
                    />
                    
                    <TextField
                        size="small"
                        select
                        label="Département"
                        value={filtres.departement}
                        onChange={(e) => handleFilterChange({ target: { name: 'departement', value: e.target.value } })}
                        sx={{ width: 200 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Business fontSize="small" />
                                </InputAdornment>
                            )
                        }}
                    >
                        <MenuItem value="">Tous</MenuItem>
                        {departements.map(dept => (
                            <MenuItem key={dept._id} value={dept._id}>
                                {dept.nomDepartement}
                            </MenuItem>
                        ))}
                    </TextField>
                    
                    <TextField
                        size="small"
                        select
                        label="Statut"
                        value={filtres.statut}
                        onChange={(e) => handleFilterChange({ target: { name: 'statut', value: e.target.value } })}
                        sx={{ width: 200 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Info fontSize="small" />
                                </InputAdornment>
                            )
                        }}
                    >
                        <MenuItem value="">Tous</MenuItem>
                        <MenuItem value="Actif">
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main', mr: 1 }} />
                                Actif
                            </Box>
                        </MenuItem>
                        <MenuItem value="En congé">
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'warning.main', mr: 1 }} />
                                En congé
                            </Box>
                        </MenuItem>
                        <MenuItem value="Suspendu">
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'error.main', mr: 1 }} />
                                Suspendu
                            </Box>
                        </MenuItem>
                    </TextField>
                    
                    <Box sx={{ ml: 'auto', display: 'flex', gap: 1, alignItems: 'center' }}>
                        {hasActiveFilters && (
                            <Tooltip title="Effacer les filtres">
                                <IconButton 
                                    onClick={handleClearFilters}
                                    color="error"
                                    size="small"
                                >
                                    <Clear fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        )}
                        <Tooltip title="Actualiser">
                            <IconButton onClick={chargerEmployes} size="small">
                                <Refresh fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        {peutModifier && (
                            <Button
                                variant="contained"
                                startIcon={<Add fontSize="small" />}
                                onClick={() => handleOpenDialog()}
                            >
                                Nouvel Employé
                            </Button>
                        )}
                    </Box>
                </Box>
                {hasActiveFilters && (
                    <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {filtres.departement && (
                            <Chip
                                label={`Département: ${departements.find(d => d._id === filtres.departement)?.nomDepartement || filtres.departement}`}
                                onDelete={() => setFiltres({ ...filtres, departement: '' })}
                                color="primary"
                                size="small"
                                icon={<Business fontSize="small" />}
                            />
                        )}
                        {filtres.statut && (
                            <Chip
                                label={`Statut: ${filtres.statut}`}
                                onDelete={() => setFiltres({ ...filtres, statut: '' })}
                                color="primary"
                                size="small"
                                icon={<Info fontSize="small" />}
                            />
                        )}
                    </Box>
                )}
            </Paper>

            {/* Tableau des employés */}
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
                                        {employe.dateEmbauche ? new Date(employe.dateEmbauche).toLocaleDateString() : '-'}
                                    </TableCell>
                                    <TableCell align="right">
                                        <Tooltip title="Ajouter congé">
                                            <IconButton size="small" color="secondary" onClick={() => handleOpenCongeDialog(employe)}>
                                                <EventNote />
                                            </IconButton>
                                        </Tooltip>
                                        {peutModifier && (
                                            <Tooltip title="Configurer modèle de paie">
                                                <IconButton size="small" color="warning" onClick={() => handleOpenPayrollTemplate(employe)}>
                                                    <Settings />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                        <Tooltip title="Voir détails">
                                            <IconButton size="small" color="info" onClick={() => handleViewDetails(employe)}>
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
            <Dialog 
                open={openDialog} 
                onClose={handleCloseDialog} 
                maxWidth="lg" 
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
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
                                {selectedEmploye ? <Edit /> : <PersonAdd />}
                            </Avatar>
                            <Box>
                                <Typography variant="h5" fontWeight="bold">
                                    {selectedEmploye ? 'Modifier l\'employé' : 'Nouvel employé'}
                                </Typography>
                                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                    {selectedEmploye 
                                        ? 'Mettez à jour les informations de l\'employé' 
                                        : 'Ajoutez un nouveau membre à votre équipe'
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

                {/* Onglets */}
                {!selectedEmploye && (
                    <Box sx={{ 
                        bgcolor: 'grey.50', 
                        borderBottom: '1px solid', 
                        borderColor: 'divider',
                        px: 3,
                        py: 2
                    }}>
                        <Tabs 
                            value={activeTab} 
                            onChange={(e, newValue) => setActiveTab(newValue)}
                            sx={{
                                '& .MuiTab-root': {
                                    textTransform: 'none',
                                    fontWeight: 500,
                                    minHeight: 48
                                }
                            }}
                        >
                            <Tab 
                                icon={<Person sx={{ mr: 1 }} />} 
                                label="Informations Employé" 
                                iconPosition="start"
                            />
                            <Tab 
                                icon={<Work sx={{ mr: 1 }} />} 
                                label="Contrat" 
                                iconPosition="start"
                            />
                            <Tab 
                                icon={<Payment sx={{ mr: 1 }} />} 
                                label="Paramètres Paie" 
                                iconPosition="start"
                            />
                        </Tabs>
                    </Box>
                )}

                <DialogContent sx={{ p: 3 }}>
                    {activeTab === 0 && (
                        <Grid container spacing={3}>
                            {/* Section Informations principales */}
                            <Grid item xs={12}>
                                <Paper sx={{ p: 3, borderRadius: 3, bgcolor: 'grey.50' }}>
                                    <Typography variant="h6" fontWeight="medium" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                                        <Person sx={{ mr: 1, color: 'primary.main' }} />
                                        Informations principales
                                    </Typography>
                                    
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} md={6}>
                                            <TextField
                                                fullWidth
                                                label="Nom *"
                                                name="nom"
                                                value={formData.nom}
                                                onChange={handleInputChange}
                                                placeholder="Nom de famille"
                                                InputProps={{
                                                    startAdornment: (
                                                        <InputAdornment position="start">
                                                            <Person color="action" />
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
                                        <Grid item xs={12} md={6}>
                                            <TextField
                                                fullWidth
                                                label="Prénom *"
                                                name="prenom"
                                                value={formData.prenom}
                                                onChange={handleInputChange}
                                                placeholder="Prénom"
                                                InputProps={{
                                                    startAdornment: (
                                                        <InputAdornment position="start">
                                                            <Person color="action" />
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
                                        <Grid item xs={12} md={6}>
                                            <TextField
                                                fullWidth
                                                label="Email"
                                                name="email"
                                                type="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                placeholder="email@exemple.com"
                                                InputProps={{
                                                    startAdornment: (
                                                        <InputAdornment position="start">
                                                            <Email color="action" />
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
                                        <Grid item xs={12} md={6}>
                                            <TextField
                                                fullWidth
                                                label="Téléphone"
                                                name="telephone"
                                                value={formData.telephone}
                                                onChange={handleInputChange}
                                                placeholder="+216 XX XXX XXX"
                                                InputProps={{
                                                    startAdornment: (
                                                        <InputAdornment position="start">
                                                            <Phone color="action" />
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
                                        <Grid item xs={12} md={6}>
                                            <TextField
                                                fullWidth
                                                label="Poste *"
                                                name="poste"
                                                value={formData.poste}
                                                onChange={handleInputChange}
                                                placeholder="Ex: Développeur Senior"
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
                                                    }
                                                }}
                                            />
                                        </Grid>
                                        <Box sx={{ minWidth: 280 }}>
                                            <FormControl fullWidth>
                                                <InputLabel>Département *</InputLabel>
                                                <Select
                                                    name="departement"
                                                    value={formData.departement}
                                                    onChange={handleInputChange}
                                                    label="Département"
                                                    sx={{ borderRadius: 2 }}
                                                >
                                                    <MenuItem value="">
                                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                            <Business sx={{ mr: 1, color: 'text.secondary' }} />
                                                            <Typography color="text.secondary">Aucun département</Typography>
                                                        </Box>
                                                    </MenuItem>
                                                    {departements.map(dept => (
                                                        <MenuItem key={dept._id} value={dept._id}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                                <Business sx={{ mr: 1, color: 'primary.main' }} />
                                                                {dept.nomDepartement}
                                                            </Box>
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Box>
                                        <Grid item xs={12} md={6}>
                                            <TextField
                                                fullWidth
                                                label="Date d'embauche"
                                                name="dateEmbauche"
                                                type="date"
                                                value={formData.dateEmbauche}
                                                onChange={handleInputChange}
                                                InputLabelProps={{ shrink: true }}
                                                InputProps={{
                                                    startAdornment: (
                                                        <InputAdornment position="start">
                                                            <CalendarToday color="action" />
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
                                        <Grid item xs={12} md={6}>
                                            <FormControl fullWidth>
                                                <InputLabel>Statut</InputLabel>
                                                <Select
                                                    name="statut"
                                                    value={formData.statut}
                                                    onChange={handleInputChange}
                                                    label="Statut"
                                                    sx={{ borderRadius: 2 }}
                                                >
                                                    <MenuItem value="Actif">
                                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main', mr: 1 }} />
                                                            Actif
                                                        </Box>
                                                    </MenuItem>
                                                    <MenuItem value="En congé">
                                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'warning.main', mr: 1 }} />
                                                            En congé
                                                        </Box>
                                                    </MenuItem>
                                                    <MenuItem value="Suspendu">
                                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'error.main', mr: 1 }} />
                                                            Suspendu
                                                        </Box>
                                                    </MenuItem>
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                    </Grid>
                                </Paper>
                            </Grid>

                            {/* Section Informations personnelles */}
                            <Grid item xs={12}>
                                <Paper sx={{ p: 3, borderRadius: 3, bgcolor: 'grey.50' }}>
                                    <Typography variant="h6" fontWeight="medium" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                                        <Person sx={{ mr: 1, color: 'primary.main' }} />
                                        Informations personnelles
                                    </Typography>
                                    
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} md={4}>
                                            <TextField
                                                fullWidth
                                                label="Date de naissance"
                                                name="dateNaissance"
                                                type="date"
                                                value={formData.dateNaissance}
                                                onChange={handleInputChange}
                                                InputLabelProps={{ shrink: true }}
                                                InputProps={{
                                                    startAdornment: (
                                                        <InputAdornment position="start">
                                                            <CalendarToday color="action" />
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
                                        <Box sx={{ minWidth: 200 }}>
                                            <FormControl fullWidth>
                                                <InputLabel>Genre</InputLabel>
                                                <Select
                                                    name="genre"
                                                    value={formData.genre}
                                                    onChange={handleInputChange}
                                                    label="Genre"
                                                    sx={{ borderRadius: 2 }}
                                                >
                                                    <MenuItem value="M">Masculin</MenuItem>
                                                    <MenuItem value="F">Féminin</MenuItem>
                                                    <MenuItem value="Autre">Autre</MenuItem>
                                                </Select>
                                            </FormControl>
                                        </Box>
                                        <Box sx={{ minWidth: 200 }}>
                                            <FormControl fullWidth>
                                                <InputLabel>Situation familiale</InputLabel>
                                                <Select
                                                    name="situationFamiliale"
                                                    value={formData.situationFamiliale}
                                                    onChange={handleInputChange}
                                                    label="Situation familiale"
                                                    sx={{ borderRadius: 2 }}
                                                >
                                                    <MenuItem value="Célibataire">Célibataire</MenuItem>
                                                    <MenuItem value="Marié(e)">Marié(e)</MenuItem>
                                                    <MenuItem value="Divorcé(e)">Divorcé(e)</MenuItem>
                                                    <MenuItem value="Veuf(ve)">Veuf(ve)</MenuItem>
                                                </Select>
                                            </FormControl>
                                        </Box>
                                        <Grid item xs={12} md={4}>
                                            <TextField
                                                fullWidth
                                                label="Nombre d'enfants"
                                                name="enfants"
                                                type="number"
                                                value={formData.enfants}
                                                onChange={handleInputChange}
                                                InputProps={{ 
                                                    inputProps: { min: 0 },
                                                    startAdornment: (
                                                        <InputAdornment position="start">
                                                            <Person color="action" />
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
                                    </Grid>
                                </Paper>
                            </Grid>

                            {/* Section Adresse */}
                            <Grid item xs={12}>
                                <Paper sx={{ p: 3, borderRadius: 3, bgcolor: 'grey.50' }}>
                                    <Typography variant="h6" fontWeight="medium" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                                        <Home sx={{ mr: 1, color: 'primary.main' }} />
                                        Adresse
                                    </Typography>
                                    
                                    <Grid container spacing={2}>
                                        <Grid item xs={12}>
                                            <TextField
                                                fullWidth
                                                label="Rue"
                                                name="adresse.rue"
                                                value={formData.adresse.rue}
                                                onChange={handleInputChange}
                                                placeholder="Numéro et nom de rue"
                                                InputProps={{
                                                    startAdornment: (
                                                        <InputAdornment position="start">
                                                            <Home color="action" />
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
                                            <TextField
                                                fullWidth
                                                label="Ville"
                                                name="adresse.ville"
                                                value={formData.adresse.ville}
                                                onChange={handleInputChange}
                                                placeholder="Ville"
                                                InputProps={{
                                                    startAdornment: (
                                                        <InputAdornment position="start">
                                                            <Home color="action" />
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
                                            <TextField
                                                fullWidth
                                                label="Code postal"
                                                name="adresse.codePostal"
                                                value={formData.adresse.codePostal}
                                                onChange={handleInputChange}
                                                placeholder="XXXXX"
                                                InputProps={{
                                                    startAdornment: (
                                                        <InputAdornment position="start">
                                                            <Home color="action" />
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
                                            <TextField
                                                fullWidth
                                                label="Pays"
                                                name="adresse.pays"
                                                value={formData.adresse.pays}
                                                onChange={handleInputChange}
                                                placeholder="Pays"
                                                InputProps={{
                                                    startAdornment: (
                                                        <InputAdornment position="start">
                                                            <Home color="action" />
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
                                    </Grid>
                                </Paper>
                            </Grid>
                        </Grid>
                    )}
                    {activeTab === 1 && (
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <Paper sx={{ p: 3, borderRadius: 3, bgcolor: 'grey.50' }}>
                                    <Typography variant="h6" fontWeight="medium" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                                        <Work sx={{ mr: 1, color: 'primary.main' }} />
                                        Informations du contrat
                                    </Typography>
                                    
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} md={6}>
                                            <FormControl fullWidth>
                                                <InputLabel>Type de contrat *</InputLabel>
                                                <Select
                                                    name="typeContrat"
                                                    value={contratData.typeContrat}
                                                    onChange={handleContratChange}
                                                    label="Type de contrat"
                                                    sx={{ borderRadius: 2 }}
                                                >
                                                    <MenuItem value="CDI">CDI</MenuItem>
                                                    <MenuItem value="CDD">CDD</MenuItem>
                                                    <MenuItem value="Stage">Stage</MenuItem>
                                                    <MenuItem value="Freelance">Freelance</MenuItem>
                                                    <MenuItem value="Intérim">Intérim</MenuItem>
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <TextField
                                                fullWidth
                                                label="Date de début *"
                                                name="dateDebut"
                                                type="date"
                                                value={contratData.dateDebut}
                                                onChange={handleContratChange}
                                                InputLabelProps={{ shrink: true }}
                                                InputProps={{
                                                    startAdornment: (
                                                        <InputAdornment position="start">
                                                            <CalendarToday color="action" />
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
                                        {contratData.typeContrat === 'CDD' && (
                                            <Grid item xs={12} md={6}>
                                                <TextField
                                                    fullWidth
                                                    label="Date de fin *"
                                                    name="dateFin"
                                                    type="date"
                                                    value={contratData.dateFin}
                                                    onChange={handleContratChange}
                                                    InputLabelProps={{ shrink: true }}
                                                    InputProps={{
                                                        startAdornment: (
                                                            <InputAdornment position="start">
                                                                <CalendarToday color="action" />
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
                                        )}
                                        <Grid item xs={12} md={6}>
                                            <TextField
                                                fullWidth
                                                label="Salaire base *"
                                                name="salaireBase"
                                                type="number"
                                                value={contratData.salaireBase}
                                                onChange={handleContratChange}
                                                placeholder="0.00"
                                                InputProps={{
                                                    endAdornment: <InputAdornment position="end">DT</InputAdornment>,
                                                    startAdornment: (
                                                        <InputAdornment position="start">
                                                            <Payment color="action" />
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
                                        <Grid item xs={12} md={6}>
                                            <TextField
                                                fullWidth
                                                label="Durée période d'essai (jours)"
                                                name="periodeEssai.duree"
                                                type="number"
                                                value={contratData.periodeEssai.duree}
                                                onChange={handleContratChange}
                                                placeholder="0"
                                                InputProps={{ 
                                                    inputProps: { min: 0 },
                                                    startAdornment: (
                                                        <InputAdornment position="start">
                                                            <CalendarToday color="action" />
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
                                    </Grid>
                                </Paper>
                            </Grid>
                        </Grid>
                    )}
                    {activeTab === 2 && (
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <Paper sx={{ p: 3, borderRadius: 3, bgcolor: 'grey.50' }}>
                                    <Typography variant="h6" fontWeight="medium" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                                        <Payment sx={{ mr: 1, color: 'primary.main' }} />
                                        Paramètres de paie
                                    </Typography>
                                    
                                    <Grid container spacing={3}>
                                        <Grid item xs={12} md={6}>
                                            <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
                                                <FormControlLabel
                                                    control={
                                                        <Checkbox
                                                            checked={contratData.payrollTemplate.transportAllowance.enabled}
                                                            onChange={(e) => setContratData({
                                                                ...contratData,
                                                                payrollTemplate: {
                                                                    ...contratData.payrollTemplate,
                                                                    transportAllowance: {
                                                                        ...contratData.payrollTemplate.transportAllowance,
                                                                        enabled: e.target.checked
                                                                    }
                                                                }
                                                            })}
                                                        />
                                                    }
                                                    label="Indemnité de transport"
                                                    sx={{ mb: 1 }}
                                                />
                                                {contratData.payrollTemplate.transportAllowance.enabled && (
                                                    <TextField
                                                        fullWidth
                                                        label="Montant"
                                                        type="number"
                                                        value={contratData.payrollTemplate.transportAllowance.montant}
                                                        onChange={(e) => setContratData({
                                                            ...contratData,
                                                            payrollTemplate: {
                                                                ...contratData.payrollTemplate,
                                                                transportAllowance: {
                                                                    ...contratData.payrollTemplate.transportAllowance,
                                                                    montant: Number(e.target.value)
                                                                }
                                                            }
                                                        })}
                                                        placeholder="0.00"
                                                        InputProps={{
                                                            endAdornment: <InputAdornment position="end">DT</InputAdornment>
                                                        }}
                                                        sx={{
                                                            '& .MuiOutlinedInput-root': {
                                                                borderRadius: 2,
                                                            }
                                                        }}
                                                    />
                                                )}
                                            </Paper>
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
                                                <FormControlLabel
                                                    control={
                                                        <Checkbox
                                                            checked={contratData.payrollTemplate.overtimeRate.enabled}
                                                            onChange={(e) => setContratData({
                                                                ...contratData,
                                                                payrollTemplate: {
                                                                    ...contratData.payrollTemplate,
                                                                    overtimeRate: {
                                                                        ...contratData.payrollTemplate.overtimeRate,
                                                                        enabled: e.target.checked
                                                                    }
                                                                }
                                                            })}
                                                        />
                                                    }
                                                    label="Heures supplémentaires"
                                                    sx={{ mb: 1 }}
                                                />
                                                {contratData.payrollTemplate.overtimeRate.enabled && (
                                                    <TextField
                                                        fullWidth
                                                        label="Multiplicateur"
                                                        type="number"
                                                        step="0.1"
                                                        value={contratData.payrollTemplate.overtimeRate.multiplier}
                                                        onChange={(e) => setContratData({
                                                            ...contratData,
                                                            payrollTemplate: {
                                                                ...contratData.payrollTemplate,
                                                                overtimeRate: {
                                                                    ...contratData.payrollTemplate.overtimeRate,
                                                                    multiplier: Number(e.target.value)
                                                                }
                                                            }
                                                        })}
                                                        placeholder="1.5"
                                                        sx={{
                                                            '& .MuiOutlinedInput-root': {
                                                                borderRadius: 2,
                                                            }
                                                        }}
                                                    />
                                                )}
                                            </Paper>
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
                                                <FormControlLabel
                                                    control={
                                                        <Checkbox
                                                            checked={contratData.payrollTemplate.mealAllowance.enabled}
                                                            onChange={(e) => setContratData({
                                                                ...contratData,
                                                                payrollTemplate: {
                                                                    ...contratData.payrollTemplate,
                                                                    mealAllowance: {
                                                                        ...contratData.payrollTemplate.mealAllowance,
                                                                        enabled: e.target.checked
                                                                    }
                                                                }
                                                            })}
                                                        />
                                                    }
                                                    label="Indemnité de repas"
                                                    sx={{ mb: 1 }}
                                                />
                                                {contratData.payrollTemplate.mealAllowance.enabled && (
                                                    <TextField
                                                        fullWidth
                                                        label="Montant"
                                                        type="number"
                                                        value={contratData.payrollTemplate.mealAllowance.montant}
                                                        onChange={(e) => setContratData({
                                                            ...contratData,
                                                            payrollTemplate: {
                                                                ...contratData.payrollTemplate,
                                                                mealAllowance: {
                                                                    ...contratData.payrollTemplate.mealAllowance,
                                                                    montant: Number(e.target.value)
                                                                }
                                                            }
                                                        })}
                                                        placeholder="0.00"
                                                        InputProps={{
                                                            endAdornment: <InputAdornment position="end">DT</InputAdornment>
                                                        }}
                                                        sx={{
                                                            '& .MuiOutlinedInput-root': {
                                                                borderRadius: 2,
                                                            }
                                                        }}
                                                    />
                                                )}
                                            </Paper>
                                        </Grid>
                                    </Grid>
                                </Paper>
                            </Grid>
                        </Grid>
                    )}
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
                        disabled={submitting || !formData.nom || !formData.prenom || !formData.poste || !formData.departement}
                        startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : (selectedEmploye ? <Edit /> : <PersonAdd />)}
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
                        {submitting ? 'En cours...' : (selectedEmploye ? 'Mettre à jour' : 'Créer')}
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

            {/* Dialog de congé */}
            <Dialog open={openCongeDialog} onClose={() => setOpenCongeDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    Demande de congé pour {selectedEmploye?.prenom} {selectedEmploye?.nom}
                </DialogTitle>
                <DialogContent dividers>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <InputLabel>Type de congé</InputLabel>
                                <Select
                                    name="type"
                                    value={congeFormData.type}
                                    onChange={handleCongeInputChange}
                                    label="Type de congé"
                                >
                                    <MenuItem value="Annuel">Congé annuel</MenuItem>
                                    <MenuItem value="Maladie">Congé maladie</MenuItem>
                                    <MenuItem value="Exceptionnel">Congé exceptionnel</MenuItem>
                                    <MenuItem value="Maternité">Congé maternité</MenuItem>
                                    <MenuItem value="Paternité">Congé paternité</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Date de début *"
                                name="dateDebut"
                                type="date"
                                value={congeFormData.dateDebut}
                                onChange={handleCongeInputChange}
                                InputLabelProps={{ shrink: true }}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Date de fin *"
                                name="dateFin"
                                type="date"
                                value={congeFormData.dateFin}
                                onChange={handleCongeInputChange}
                                InputLabelProps={{ shrink: true }}
                                required
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Motif (optionnel)"
                                name="motif"
                                multiline
                                rows={3}
                                value={congeFormData.motif}
                                onChange={handleCongeInputChange}
                                placeholder="Raison de la demande de congé..."
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenCongeDialog(false)}>Annuler</Button>
                    <Button onClick={handleSubmitConge} variant="contained">
                        Demander congé
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialog de détails */}
            <Dialog open={openDetailsDialog} onClose={() => setOpenDetailsDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle>Détails de l'employé</DialogTitle>
                <DialogContent dividers>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <Typography variant="h6" gutterBottom>Informations personnelles</Typography>
                            <Typography><strong>Nom:</strong> {selectedEmploye?.nom}</Typography>
                            <Typography><strong>Prénom:</strong> {selectedEmploye?.prenom}</Typography>
                            <Typography><strong>Email:</strong> {selectedEmploye?.utilisateur?.email || '-'}</Typography>
                            <Typography><strong>Téléphone:</strong> {selectedEmploye?.telephone || '-'}</Typography>
                            <Typography><strong>Matricule:</strong> {selectedEmploye?.matricule}</Typography>
                            <Typography><strong>Date de naissance:</strong> {selectedEmploye?.dateNaissance ? new Date(selectedEmploye.dateNaissance).toLocaleDateString() : '-'}</Typography>
                            <Typography><strong>Genre:</strong> {selectedEmploye?.genre === 'M' ? 'Masculin' : selectedEmploye?.genre === 'F' ? 'Féminin' : selectedEmploye?.genre || '-'}</Typography>
                            <Typography><strong>Situation familiale:</strong> {selectedEmploye?.situationFamiliale || '-'}</Typography>
                            <Typography><strong>Nombre d'enfants:</strong> {selectedEmploye?.enfants || 0}</Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Typography variant="h6" gutterBottom>Informations professionnelles</Typography>
                            <Typography><strong>Poste:</strong> {selectedEmploye?.poste}</Typography>
                            <Typography><strong>Département:</strong> {selectedEmploye?.departement?.nomDepartement || '-'}</Typography>
                            <Typography><strong>Salaire:</strong> {selectedEmploye?.salaire ? `${selectedEmploye.salaire} DT` : '-'}</Typography>
                            <Typography><strong>Date d'embauche:</strong> {selectedEmploye?.dateEmbauche ? new Date(selectedEmploye.dateEmbauche).toLocaleDateString() : '-'}</Typography>
                            <Typography><strong>Statut:</strong> {selectedEmploye?.statut}</Typography>
                            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Adresse</Typography>
                            <Typography><strong>Rue:</strong> {selectedEmploye?.adresse?.rue || '-'}</Typography>
                            <Typography><strong>Ville:</strong> {selectedEmploye?.adresse?.ville || '-'}</Typography>
                            <Typography><strong>Code postal:</strong> {selectedEmploye?.adresse?.codePostal || '-'}</Typography>
                            <Typography><strong>Pays:</strong> {selectedEmploye?.adresse?.pays || '-'}</Typography>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDetailsDialog(false)}>Fermer</Button>
                </DialogActions>
            </Dialog>

            {/* Payroll Template Dialog */}
            <Dialog open={openPayrollTemplateDialog} onClose={() => setOpenPayrollTemplateDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    Configurer le modèle de paie - {selectedEmploye?.prenom} {selectedEmploye?.nom}
                </DialogTitle>
                <DialogContent dividers>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                                Primes par défaut
                            </Typography>
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="caption" color="textSecondary">
                                Ces primes seront appliquées automatiquement chaque mois
                            </Typography>
                        </Grid>
                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                <TextField
                                    fullWidth
                                    label="Type de prime"
                                    placeholder="Ex: Prime responsabilité"
                                />
                                <TextField
                                    fullWidth
                                    label="Montant"
                                    type="number"
                                    placeholder="500"
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">DT</InputAdornment>
                                    }}
                                />
                                <Button variant="outlined" startIcon={<Add />}>
                                    Ajouter
                                </Button>
                            </Box>
                        </Grid>
                        
                        <Grid item xs={12}>
                            <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                                Déductions par défaut
                            </Typography>
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="caption" color="textSecondary">
                                Ces déductions seront appliquées automatiquement chaque mois
                            </Typography>
                        </Grid>
                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                <TextField
                                    fullWidth
                                    label="Type de déduction"
                                    placeholder="Ex: CNSS"
                                />
                                <TextField
                                    fullWidth
                                    label="Montant"
                                    type="number"
                                    placeholder="100"
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">DT</InputAdornment>
                                    }}
                                />
                                <Button variant="outlined" startIcon={<Add />}>
                                    Ajouter
                                </Button>
                            </Box>
                        </Grid>

                        <Grid item xs={12}>
                            <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                                Allocations
                            </Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={payrollTemplate.transportAllowance.enabled}
                                            onChange={(e) => setPayrollTemplate({
                                                ...payrollTemplate,
                                                transportAllowance: {
                                                    ...payrollTemplate.transportAllowance,
                                                    enabled: e.target.checked
                                                }
                                            })}
                                        />
                                    }
                                    label="Allocation de transport"
                                />
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Montant transport"
                                type="number"
                                value={payrollTemplate.transportAllowance.montant}
                                onChange={(e) => setPayrollTemplate({
                                    ...payrollTemplate,
                                    transportAllowance: {
                                        ...payrollTemplate.transportAllowance,
                                        montant: parseFloat(e.target.value) || 0
                                    }
                                })}
                                disabled={!payrollTemplate.transportAllowance.enabled}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">DT</InputAdornment>
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={payrollTemplate.overtimeRate.enabled}
                                            onChange={(e) => setPayrollTemplate({
                                                ...payrollTemplate,
                                                overtimeRate: {
                                                    ...payrollTemplate.overtimeRate,
                                                    enabled: e.target.checked
                                                }
                                            })}
                                        />
                                    }
                                    label="Heures supplémentaires"
                                />
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Taux multiplicateur"
                                type="number"
                                value={payrollTemplate.overtimeRate.multiplier}
                                onChange={(e) => setPayrollTemplate({
                                    ...payrollTemplate,
                                    overtimeRate: {
                                        ...payrollTemplate.overtimeRate,
                                        multiplier: parseFloat(e.target.value) || 1
                                    }
                                })}
                                disabled={!payrollTemplate.overtimeRate.enabled}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenPayrollTemplateDialog(false)}>Annuler</Button>
                    <Button onClick={handleSavePayrollTemplate} variant="contained">
                        Enregistrer
                    </Button>
                </DialogActions>
            </Dialog>
        </Layout>
    );
};

export default Employes;