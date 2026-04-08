// frontend/src/pages/Paies.js
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
    Tooltip,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import {
    Add,
    Search,
    Edit,
    Delete,
    Visibility,
    MonetizationOn,
    Person,
    DateRange,
    MoreVert,
    CheckCircle,
    Payment,
    HourglassEmpty
} from '@mui/icons-material';
import { paieService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Paies = () => {
    const { user, isAdmin, isManagerRH, isManager, isEmploye } = useAuth();
    const navigate = useNavigate();
    
    const [paies, setPaies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [monthFilter, setMonthFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [deleteDialog, setDeleteDialog] = useState({ open: false, paie: null });
    const [filteredPaies, setFilteredPaies] = useState([]);

    // Check if user can manage payrolls
    const canManagePayrolls = isAdmin || isManagerRH;
    const canViewAllPayrolls = isAdmin || isManagerRH || isManager;

    // Fetch payrolls based on user role
    const fetchPaies = async () => {
        try {
            setLoading(true);
            setError('');
            
            const params = {};
            if (monthFilter) params.mois = monthFilter;
            if (statusFilter) params.statut = statusFilter;
            
            let response;
            if (canViewAllPayrolls) {
                response = await paieService.getAll(params);
            } else {
                response = await paieService.getMyPaies(params);
            }
            
            if (response.data.success === false) {
                setError(response.data.message);
            } else {
                setPaies(response.data.data || []);
            }
        } catch (err) {
            setError('Erreur lors du chargement des paies');
            console.error('Error fetching payrolls:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPaies();
    }, [monthFilter, statusFilter]);

    // Filter payrolls based on search
    useEffect(() => {
        const filtered = paies.filter(paie => {
            const employeeName = paie.employe 
                ? `${paie.employe.nom} ${paie.employe.prenom}`.toLowerCase()
                : '';
            const searchLower = searchTerm.toLowerCase();
            
            return employeeName.includes(searchLower) ||
                   paie.mois?.toLowerCase().includes(searchLower) ||
                   paie.statut?.toLowerCase().includes(searchLower);
        });
        setFilteredPaies(filtered);
    }, [paies, searchTerm]);

    const handleDelete = async () => {
        try {
            await paieService.delete(deleteDialog.paie._id);
            setSuccess('Paie supprimée avec succès');
            fetchPaies();
            setDeleteDialog({ open: false, paie: null });
        } catch (err) {
            setError('Erreur lors de la suppression de la paie');
        }
    };

    const handleValidate = async (paieId) => {
        try {
            await paieService.valider(paieId);
            setSuccess('Paie validée avec succès');
            fetchPaies();
        } catch (err) {
            setError('Erreur lors de la validation de la paie');
        }
    };

    const handlePay = async (paieId) => {
        try {
            await paieService.payer(paieId);
            setSuccess('Paie marquée comme payée avec succès');
            fetchPaies();
        } catch (err) {
            setError('Erreur lors du paiement de la paie');
        }
    };

    const getStatusColor = (statut) => {
        switch (statut) {
            case 'Payé': return 'success';
            case 'Validé': return 'warning';
            case 'Brouillon': return 'default';
            default: return 'default';
        }
    };

    const getStatusIcon = (statut) => {
        switch (statut) {
            case 'Payé': return <Payment />;
            case 'Validé': return <CheckCircle />;
            case 'Brouillon': return <HourglassEmpty />;
            default: return <HourglassEmpty />;
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('fr-TN', {
            style: 'currency',
            currency: 'TND'
        }).format(amount || 0);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('fr-FR');
    };

    // Generate month options for filter
    const generateMonthOptions = () => {
        const months = [];
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;
        
        for (let year = currentYear; year >= currentYear - 2; year--) {
            for (let month = 12; month >= 1; month--) {
                const monthStr = month.toString().padStart(2, '0');
                const value = `${year}-${monthStr}`;
                const label = new Date(year, month - 1).toLocaleDateString('fr-FR', { 
                    year: 'numeric', 
                    month: 'long' 
                });
                months.push({ value, label });
            }
        }
        return months;
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
                    Gestion des Paies
                </Typography>
                {canManagePayrolls && (
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => navigate('/paies/nouveau')}
                        sx={{ borderRadius: 2 }}
                    >
                        Nouvelle Paie
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
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                placeholder="Rechercher par employé, mois ou statut..."
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
                        <Grid item xs={12} md={3}>
                            <FormControl fullWidth>
                                <InputLabel>Mois</InputLabel>
                                <Select
                                    value={monthFilter}
                                    label="Mois"
                                    onChange={(e) => setMonthFilter(e.target.value)}
                                >
                                    <MenuItem value="">Tous les mois</MenuItem>
                                    {generateMonthOptions().map((month) => (
                                        <MenuItem key={month.value} value={month.value}>
                                            {month.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <FormControl fullWidth>
                                <InputLabel>Statut</InputLabel>
                                <Select
                                    value={statusFilter}
                                    label="Statut"
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <MenuItem value="">Tous les statuts</MenuItem>
                                    <MenuItem value="Brouillon">Brouillon</MenuItem>
                                    <MenuItem value="Validé">Validé</MenuItem>
                                    <MenuItem value="Payé">Payé</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                <Chip 
                                    label="Brouillon" 
                                    clickable 
                                    onClick={() => setStatusFilter('Brouillon')}
                                    color="default"
                                    variant="outlined"
                                    size="small"
                                />
                                <Chip 
                                    label="Validé" 
                                    clickable 
                                    onClick={() => setStatusFilter('Validé')}
                                    color="warning"
                                    variant="outlined"
                                    size="small"
                                />
                                <Chip 
                                    label="Payé" 
                                    clickable 
                                    onClick={() => setStatusFilter('Payé')}
                                    color="success"
                                    variant="outlined"
                                    size="small"
                                />
                            </Box>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* Payrolls Table */}
            <Card>
                <CardContent sx={{ p: 0 }}>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Employé</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Mois</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Salaire Base</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Net à Payer</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Statut</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Date Paiement</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredPaies.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                            <Typography variant="h6" color="textSecondary">
                                                {searchTerm || monthFilter || statusFilter 
                                                    ? 'Aucune paie trouvée' 
                                                    : 'Aucune paie disponible'}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredPaies.map((paie) => (
                                        <TableRow key={paie._id} hover>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <Person sx={{ mr: 1, color: 'primary.main' }} />
                                                    <Box>
                                                        <Typography variant="body2" fontWeight="bold">
                                                            {paie.employe ? `${paie.employe.prenom} ${paie.employe.nom}` : 'N/A'}
                                                        </Typography>
                                                        <Typography variant="caption" color="textSecondary">
                                                            {paie.employe?.matricule || 'N/A'}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <DateRange sx={{ mr: 1, fontSize: 16, color: 'info.main' }} />
                                                    <Typography variant="body2">
                                                        {new Date(paie.mois + '-01').toLocaleDateString('fr-FR', {
                                                            year: 'numeric',
                                                            month: 'long'
                                                        })}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <MonetizationOn sx={{ mr: 1, fontSize: 16, color: 'grey.600' }} />
                                                    <Typography variant="body2">
                                                        {formatCurrency(paie.salaireBase)}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <MonetizationOn sx={{ mr: 1, fontSize: 16, color: 'success.main' }} />
                                                    <Typography fontWeight="bold" color="success.main">
                                                        {formatCurrency(paie.netAPayer)}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Chip 
                                                    icon={getStatusIcon(paie.statut)}
                                                    label={paie.statut} 
                                                    color={getStatusColor(paie.statut)}
                                                    size="small"
                                                    variant="outlined"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">
                                                    {formatDate(paie.datePaiement)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', gap: 1 }}>
                                                    <Tooltip title="Voir les détails">
                                                        <IconButton 
                                                            size="small"
                                                            onClick={() => navigate(`/paies/${paie._id}`)}
                                                        >
                                                            <Visibility />
                                                        </IconButton>
                                                    </Tooltip>
                                                    {canManagePayrolls && (
                                                        <>
                                                            <Tooltip title="Modifier">
                                                                <IconButton 
                                                                    size="small"
                                                                    onClick={() => navigate(`/paies/${paie._id}/edit`)}
                                                                    disabled={paie.statut === 'Payé'}
                                                                >
                                                                    <Edit />
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Tooltip title="Valider">
                                                                <IconButton 
                                                                    size="small"
                                                                    onClick={() => handleValidate(paie._id)}
                                                                    disabled={paie.statut !== 'Brouillon'}
                                                                    color="warning"
                                                                >
                                                                    <CheckCircle />
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Tooltip title="Marquer comme payé">
                                                                <IconButton 
                                                                    size="small"
                                                                    onClick={() => handlePay(paie._id)}
                                                                    disabled={paie.statut !== 'Validé'}
                                                                    color="success"
                                                                >
                                                                    <Payment />
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Tooltip title="Supprimer">
                                                                <IconButton 
                                                                    size="small"
                                                                    color="error"
                                                                    onClick={() => setDeleteDialog({ open: true, paie })}
                                                                    disabled={paie.statut === 'Payé'}
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
            <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, paie: null })}>
                <DialogTitle>Confirmer la suppression</DialogTitle>
                <DialogContent>
                    <Typography>
                        Êtes-vous sûr de vouloir supprimer la paie de{' '}
                        <strong>
                            {deleteDialog.paie?.employe 
                                ? `${deleteDialog.paie.employe.prenom} ${deleteDialog.paie.employe.nom}`
                                : 'cet employé'
                            } pour le mois de{' '}
                            {deleteDialog.paie?.mois && new Date(deleteDialog.paie.mois + '-01').toLocaleDateString('fr-FR', {
                                year: 'numeric',
                                month: 'long'
                            })}?
                        </strong>
                        <br />
                        Cette action est irréversible.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialog({ open: false, paie: null })}>
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

export default Paies;
