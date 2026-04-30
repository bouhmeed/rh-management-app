// frontend/src/components/AttendanceTable.js
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
    Chip,
    IconButton,
    TextField,
    InputAdornment,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    Grid,
    Alert,
    CircularProgress
} from '@mui/material';
import {
    Search,
    FilterList,
    Refresh,
    Visibility,
    Edit,
    Delete,
    GetApp,
    CalendarToday,
    AccessTime,
    Warning,
    CheckCircle,
    Error
} from '@mui/icons-material';
import { presenceService, employeService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

const AttendanceTable = ({ viewMode = 'employee' }) => {
    const { user, isAdmin, isManagerRH } = useAuth();
    const [presences, setPresences] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [total, setTotal] = useState(0);
    const [filters, setFilters] = useState({
        search: '',
        employe: '',
        departement: '',
        dateDebut: null,
        dateFin: null,
        statut: '',
        anomalies: false
    });
    const [selectedPresence, setSelectedPresence] = useState(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);

    useEffect(() => {
        fetchPresences();
        if (isAdmin || isManagerRH) {
            fetchEmployees();
        }
    }, [page, rowsPerPage, filters, viewMode]);

    const fetchPresences = async () => {
        setLoading(true);
        try {
            const params = {
                page: page + 1,
                limit: rowsPerPage,
                ...filters
            };

            // Remove null values
            Object.keys(params).forEach(key => {
                if (params[key] === null || params[key] === '') {
                    delete params[key];
                }
            });

            // Format dates
            if (filters.dateDebut) {
                params.dateDebut = filters.dateDebut.format('YYYY-MM-DD');
            }
            if (filters.dateFin) {
                params.dateFin = filters.dateFin.format('YYYY-MM-DD');
            }

            // For employee view, only show their presences
            if (viewMode === 'employee' && user?.employe) {
                params.employe = user.employe;
            }

            const response = await presenceService.getAll(params);
            setPresences(response.data.data);
            setTotal(response.data.total);
        } catch (error) {
            toast.error('Erreur lors du chargement des présences');
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const response = await employeService.getAll();
            setEmployees(response.data.data);
        } catch (error) {
            console.error('Error fetching employees:', error);
        }
    };

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
        setPage(0); // Reset to first page
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'success';
            case 'paused': return 'warning';
            case 'ended': return 'default';
            case 'not_started': return 'info';
            default: return 'default';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'active': return 'En cours';
            case 'paused': return 'En pause';
            case 'ended': return 'Terminé';
            case 'not_started': return 'Non démarré';
            default: return status;
        }
    };

    const getAnomalyColor = (anomalies) => {
        if (!anomalies || anomalies.length === 0) return 'success';
        if (anomalies.includes('Arrivée tardive') || anomalies.includes('Départ anticipé')) return 'warning';
        if (anomalies.includes('Heures insuffisantes')) return 'error';
        return 'info';
    };

    const formatDuration = (minutes) => {
        if (!minutes) return '0h';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h${mins > 0 ? mins + 'min' : ''}`;
    };

    const handleViewDetails = (presence) => {
        setSelectedPresence(presence);
        setDetailsOpen(true);
    };

    const handleEdit = (presence) => {
        setSelectedPresence(presence);
        setEditOpen(true);
    };

    const handleDelete = async (presenceId) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette présence ?')) return;
        
        try {
            await presenceService.delete(presenceId);
            toast.success('Présence supprimée avec succès');
            fetchPresences();
        } catch (error) {
            toast.error('Erreur lors de la suppression');
        }
    };

    const exportData = async () => {
        try {
            const params = { ...filters, export: true };
            const response = await presenceService.exportData(params);
            
            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `presences_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            
            toast.success('Export réussi');
        } catch (error) {
            toast.error('Erreur lors de l\'export');
        }
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Paper sx={{ width: '100%', overflow: 'hidden' }}>
                {/* Filters */}
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={3}>
                            <TextField
                                fullWidth
                                placeholder="Rechercher..."
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Search />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                        
                        {(isAdmin || isManagerRH) && (
                            <Grid item xs={12} md={2}>
                                <FormControl fullWidth>
                                    <InputLabel>Employé</InputLabel>
                                    <Select
                                        value={filters.employe}
                                        onChange={(e) => handleFilterChange('employe', e.target.value)}
                                    >
                                        <MenuItem value="">Tous</MenuItem>
                                        {employees.map((emp) => (
                                            <MenuItem key={emp._id} value={emp._id}>
                                                {emp.nom} {emp.prenom}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        )}
                        
                        <Grid item xs={12} md={2}>
                            <DatePicker
                                label="Date début"
                                value={filters.dateDebut}
                                onChange={(date) => handleFilterChange('dateDebut', date)}
                                renderInput={(params) => <TextField {...params} fullWidth />}
                            />
                        </Grid>
                        
                        <Grid item xs={12} md={2}>
                            <DatePicker
                                label="Date fin"
                                value={filters.dateFin}
                                onChange={(date) => handleFilterChange('dateFin', date)}
                                renderInput={(params) => <TextField {...params} fullWidth />}
                            />
                        </Grid>
                        
                        <Grid item xs={12} md={3}>
                            <Box display="flex" gap={1}>
                                <Button
                                    variant="outlined"
                                    startIcon={<Refresh />}
                                    onClick={fetchPresences}
                                    disabled={loading}
                                >
                                    Actualiser
                                </Button>
                                <Button
                                    variant="outlined"
                                    startIcon={<GetApp />}
                                    onClick={exportData}
                                >
                                    Exporter
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </Box>

                {/* Table */}
                <TableContainer sx={{ maxHeight: 600 }}>
                    <Table stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell>Date</TableCell>
                                <TableCell>Employé</TableCell>
                                <TableCell>Arrivée</TableCell>
                                <TableCell>Départ</TableCell>
                                <TableCell>Heures travaillées</TableCell>
                                <TableCell>Pauses</TableCell>
                                <TableCell>Statut</TableCell>
                                <TableCell>Anomalies</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={9} align="center">
                                        <CircularProgress />
                                    </TableCell>
                                </TableRow>
                            ) : presences.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} align="center">
                                        <Alert severity="info">Aucune présence trouvée</Alert>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                presences.map((presence) => (
                                    <TableRow key={presence._id} hover>
                                        <TableCell>
                                            {new Date(presence.date).toLocaleDateString('fr-FR')}
                                        </TableCell>
                                        <TableCell>
                                            {presence.employe?.nom} {presence.employe?.prenom}
                                        </TableCell>
                                        <TableCell>
                                            {presence.startTime ? 
                                                new Date(presence.startTime).toLocaleTimeString('fr-FR', {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                }) : '-'
                                            }
                                        </TableCell>
                                        <TableCell>
                                            {presence.endTime ? 
                                                new Date(presence.endTime).toLocaleTimeString('fr-FR', {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                }) : '-'
                                            }
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="bold">
                                                {presence.actualWorkHours?.toFixed(1) || 0}h
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            {formatDuration(presence.totalPauseTime)}
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={getStatusText(presence.sessionStatus)}
                                                color={getStatusColor(presence.sessionStatus)}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {presence.anomalies && presence.anomalies.length > 0 ? (
                                                <Chip
                                                    label={`${presence.anomalies.length} anomalie(s)`}
                                                    color={getAnomalyColor(presence.anomalies)}
                                                    size="small"
                                                    icon={<Warning />}
                                                />
                                            ) : (
                                                <Chip
                                                    label="Normal"
                                                    color="success"
                                                    size="small"
                                                    icon={<CheckCircle />}
                                                />
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Box display="flex" gap={1}>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleViewDetails(presence)}
                                                >
                                                    <Visibility />
                                                </IconButton>
                                                {(isAdmin || isManagerRH) && (
                                                    <>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleEdit(presence)}
                                                        >
                                                            <Edit />
                                                        </IconButton>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleDelete(presence._id)}
                                                            color="error"
                                                        >
                                                            <Delete />
                                                        </IconButton>
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

                {/* Pagination */}
                <TablePagination
                    rowsPerPageOptions={[10, 25, 50, 100]}
                    component="div"
                    count={total}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={(event, newPage) => setPage(newPage)}
                    onRowsPerPageChange={(event) => {
                        setRowsPerPage(parseInt(event.target.value, 10));
                        setPage(0);
                    }}
                    labelRowsPerPage="Lignes par page:"
                />

                {/* Details Dialog */}
                <Dialog
                    open={detailsOpen}
                    onClose={() => setDetailsOpen(false)}
                    maxWidth="md"
                    fullWidth
                >
                    <DialogTitle>Détails de la présence</DialogTitle>
                    <DialogContent>
                        {selectedPresence && (
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle2">Date:</Typography>
                                    <Typography variant="body1">
                                        {new Date(selectedPresence.date).toLocaleDateString('fr-FR')}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle2">Employé:</Typography>
                                    <Typography variant="body1">
                                        {selectedPresence.employe?.nom} {selectedPresence.employe?.prenom}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle2">Heure d'arrivée:</Typography>
                                    <Typography variant="body1">
                                        {selectedPresence.startTime ? 
                                            new Date(selectedPresence.startTime).toLocaleTimeString('fr-FR') : '-'
                                        }
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle2">Heure de départ:</Typography>
                                    <Typography variant="body1">
                                        {selectedPresence.endTime ? 
                                            new Date(selectedPresence.endTime).toLocaleTimeString('fr-FR') : '-'
                                        }
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2">Pauses:</Typography>
                                    {selectedPresence.pauses && selectedPresence.pauses.length > 0 ? (
                                        selectedPresence.pauses.map((pause, index) => (
                                            <Typography key={index} variant="body2">
                                                {new Date(pause.start).toLocaleTimeString('fr-FR')} - 
                                                {pause.end ? new Date(pause.end).toLocaleTimeString('fr-FR') : 'En cours'}
                                                ({pause.duration || 0} min)
                                            </Typography>
                                        ))
                                    ) : (
                                        <Typography variant="body2">Aucune pause</Typography>
                                    )}
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2">Anomalies:</Typography>
                                    {selectedPresence.anomalies && selectedPresence.anomalies.length > 0 ? (
                                        selectedPresence.anomalies.map((anomaly, index) => (
                                            <Chip
                                                key={index}
                                                label={anomaly}
                                                color="warning"
                                                size="small"
                                                sx={{ mr: 1, mb: 1 }}
                                            />
                                        ))
                                    ) : (
                                        <Typography variant="body2">Aucune anomalie</Typography>
                                    )}
                                </Grid>
                            </Grid>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setDetailsOpen(false)}>Fermer</Button>
                    </DialogActions>
                </Dialog>
            </Paper>
        </LocalizationProvider>
    );
};

export default AttendanceTable;
