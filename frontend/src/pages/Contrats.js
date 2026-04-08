// frontend/src/pages/Contrats.js
import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Button,
    Chip,
    IconButton,
    TextField,
    InputAdornment,
    Grid,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    CircularProgress,
    Tooltip
} from '@mui/material';
import {
    Add,
    Search,
    Edit,
    Delete,
    Visibility,
    Business,
    Person,
    Event,
    AttachMoney,
    MoreVert
} from '@mui/icons-material';
import { contratService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Contrats = () => {
    const { user, isAdmin, isManagerRH, isManager } = useAuth();
    const navigate = useNavigate();
    
    const [contrats, setContrats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [deleteDialog, setDeleteDialog] = useState({ open: false, contrat: null });
    const [filteredContrats, setFilteredContrats] = useState([]);

    // Check if user can manage contracts
    const canManageContracts = isAdmin || isManagerRH || isManager;

    // Fetch contracts based on user role
    const fetchContrats = async () => {
        try {
            setLoading(true);
            setError('');
            
            let response;
            if (canManageContracts) {
                response = await contratService.getAll();
            } else {
                response = await contratService.getMyContract();
                // For employees, wrap single contract in array
                response.data.data = response.data.data ? [response.data.data] : [];
            }
            
            if (response.data.success === false) {
                setError(response.data.message);
            } else {
                setContrats(response.data.data || response.data || []);
            }
        } catch (err) {
            setError('Erreur lors du chargement des contrats');
            console.error('Error fetching contracts:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContrats();
    }, []);

    // Filter contracts based on search
    useEffect(() => {
        const filtered = contrats.filter(contrat => {
            const employeeName = contrat.employe 
                ? `${contrat.employe.nom} ${contrat.employe.prenom}`.toLowerCase()
                : '';
            const searchLower = searchTerm.toLowerCase();
            
            return employeeName.includes(searchLower) ||
                   contrat.typeContrat?.toLowerCase().includes(searchLower) ||
                   contrat.statut?.toLowerCase().includes(searchLower);
        });
        setFilteredContrats(filtered);
    }, [contrats, searchTerm]);

    const handleDelete = async () => {
        try {
            await contratService.delete(deleteDialog.contrat._id);
            setSuccess('Contrat supprimé avec succès');
            fetchContrats();
            setDeleteDialog({ open: false, contrat: null });
        } catch (err) {
            setError('Erreur lors de la suppression du contrat');
        }
    };

    const getStatusColor = (statut) => {
        switch (statut) {
            case 'Actif': return 'success';
            case 'Expiré': return 'error';
            case 'Résilié': return 'default';
            default: return 'default';
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('fr-FR');
    };

    const formatSalary = (salary) => {
        return new Intl.NumberFormat('fr-TN', {
            style: 'currency',
            currency: 'TND'
        }).format(salary);
    };

    if (loading) {
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
                <Typography variant="h4" fontWeight="bold" color="primary">
                    Gestion des Contrats
                </Typography>
                {canManageContracts && (
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => navigate('/contrats/nouveau')}
                        sx={{ borderRadius: 2 }}
                    >
                        Nouveau Contrat
                    </Button>
                )}
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

            {/* Search and Filters */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                placeholder="Rechercher par employé, type ou statut..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Search />
                                        </InputAdornment>
                                    )
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Chip 
                                    label="Actif" 
                                    clickable 
                                    onClick={() => setSearchTerm('Actif')}
                                    color="success"
                                    variant="outlined"
                                />
                                <Chip 
                                    label="Expiré" 
                                    clickable 
                                    onClick={() => setSearchTerm('Expiré')}
                                    color="error"
                                    variant="outlined"
                                />
                                <Chip 
                                    label="Résilié" 
                                    clickable 
                                    onClick={() => setSearchTerm('Résilié')}
                                    color="default"
                                    variant="outlined"
                                />
                            </Box>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* Contracts Table */}
            <Card>
                <CardContent sx={{ p: 0 }}>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Employé</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Salaire</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Date Début</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Date Fin</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Statut</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredContrats.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                            <Typography variant="h6" color="textSecondary">
                                                {searchTerm ? 'Aucun contrat trouvé' : 'Aucun contrat disponible'}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredContrats.map((contrat) => (
                                        <TableRow key={contrat._id} hover>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <Person sx={{ mr: 1, color: 'primary.main' }} />
                                                    <Box>
                                                        <Typography variant="body2" fontWeight="bold">
                                                            {contrat.employe ? `${contrat.employe.prenom} ${contrat.employe.nom}` : 'N/A'}
                                                        </Typography>
                                                        <Typography variant="caption" color="textSecondary">
                                                            {contrat.employe?.matricule || 'N/A'}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Chip 
                                                    label={contrat.typeContrat} 
                                                    variant="outlined" 
                                                    size="small"
                                                    color="primary"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <AttachMoney sx={{ mr: 1, fontSize: 16, color: 'success.main' }} />
                                                    <Typography fontWeight="bold">
                                                        {formatSalary(contrat.salaireBase)}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <Event sx={{ mr: 1, fontSize: 16, color: 'info.main' }} />
                                                    {formatDate(contrat.dateDebut)}
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <Event sx={{ mr: 1, fontSize: 16, color: 'warning.main' }} />
                                                    {formatDate(contrat.dateFin)}
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Chip 
                                                    label={contrat.statut} 
                                                    color={getStatusColor(contrat.statut)}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', gap: 1 }}>
                                                    <Tooltip title="Voir les détails">
                                                        <IconButton 
                                                            size="small"
                                                            onClick={() => navigate(`/contrats/${contrat._id}`)}
                                                        >
                                                            <Visibility />
                                                        </IconButton>
                                                    </Tooltip>
                                                    {canManageContracts && (
                                                        <>
                                                            <Tooltip title="Modifier">
                                                                <IconButton 
                                                                    size="small"
                                                                    onClick={() => navigate(`/contrats/${contrat._id}/edit`)}
                                                                >
                                                                    <Edit />
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Tooltip title="Supprimer">
                                                                <IconButton 
                                                                    size="small"
                                                                    color="error"
                                                                    onClick={() => setDeleteDialog({ open: true, contrat })}
                                                                >
                                                                    <Delete />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </>
                                                    )}
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, contrat: null })}>
                <DialogTitle>Confirmer la suppression</DialogTitle>
                <DialogContent>
                    <Typography>
                        Êtes-vous sûr de vouloir supprimer le contrat de{' '}
                        <strong>
                            {deleteDialog.contrat?.employe 
                                ? `${deleteDialog.contrat.employe.prenom} ${deleteDialog.contrat.employe.nom}`
                                : 'cet employé'
                            }?
                        </strong>
                        <br />
                        Cette action est irréversible.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialog({ open: false, contrat: null })}>
                        Annuler
                    </Button>
                    <Button 
                        onClick={handleDelete} 
                        color="error" 
                        variant="contained"
                    >
                        Supprimer
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Contrats;
