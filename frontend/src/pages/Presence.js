// frontend/src/pages/Presence.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    Button,
    Card,
    CardContent,
    CircularProgress,
    Alert,
    Tabs,
    Tab,
    IconButton,
    Chip,
    TextField,
    MenuItem,
    Collapse,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Divider,
    Select,
    FormControl,
    InputLabel,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import {
    Login,
    Logout,
    Refresh,
    CalendarToday,
    AccessTime,
    CheckCircle,
    Cancel,
    ViewList,
    EventNote,
    FilterList,
    ExpandMore,
    ExpandLess,
    Person,
    Assignment,
    Schedule,
    Add
} from '@mui/icons-material';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import { presenceService, employeService, taskService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';

const DnDCalendar = withDragAndDrop(Calendar);
const localizer = momentLocalizer(moment);

const statusColorMap = {
    'Present': '#4CAF50',
    'Absent': '#F44336',
    'Late': '#FF9800',
    'Open': '#2196F3',
    'In Progress': '#9C27B0',
    'Completed': '#00BCD4'
};

const getStatusColor = (status) => statusColorMap[status] || '#2196F3';

const Presence = () => {
    const { user, isAdmin, isManagerRH } = useAuth();
    const [tabValue, setTabValue] = useState(0);
    const [todayPresence, setTodayPresence] = useState(null);
    const [presences, setPresences] = useState([]);
    const [calendarEvents, setCalendarEvents] = useState([]);
    const [optimisticEvents, setOptimisticEvents] = useState([]);
    const [stats, setStats] = useState({ present: 0, absent: 0, late: 0, total: 0 });
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [employes, setEmployes] = useState([]);
    const [resources, setResources] = useState([]);
    const [selectedResourceId, setSelectedResourceId] = useState(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [currentView, setCurrentView] = useState('month');
    const [filtersExpanded, setFiltersExpanded] = useState(true);
    const [legendExpanded, setLegendExpanded] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('calendar');
    const [draggedEvent, setDraggedEvent] = useState(null);
    const [budgetTasks, setBudgetTasks] = useState([]);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [selectedDateForDrop, setSelectedDateForDrop] = useState(null);
    const [taskToSchedule, setTaskToSchedule] = useState(null);
    const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        employe: '',
        priority: 'Medium',
        startDate: '',
        endDate: ''
    });

    useEffect(() => {
        if (isAdmin || isManagerRH) {
            fetchAdminData();
        } else {
            fetchEmployeeData();
        }
    }, [selectedDate]);

    useEffect(() => {
        if (isAdmin || isManagerRH) {
            fetchResources();
            fetchBudgetTasks();
        }
    }, [isAdmin, isManagerRH]);

    useEffect(() => {
        if (isAdmin || isManagerRH) {
            convertPresencesToEvents();
        }
    }, [presences, isAdmin, isManagerRH]);

    const fetchBudgetTasks = async () => {
        try {
            const employeId = user.employe?._id || user.employe;
            console.log('Fetching budget tasks for user:', { employeId, isAdmin, isManagerRH, user });
            
            // Admins see all tasks, employees see only their assigned tasks
            const params = { scheduled: false };
            if (!isAdmin && !isManagerRH && employeId) {
                params.employe = employeId;
                console.log('Filtering tasks for employee:', employeId);
            }
            
            console.log('Fetching with params:', params);
            const response = await taskService.getAll(params);
            console.log('Tasks response:', response.data);
            
            const tasks = (response.data.data || []).map(task => ({
                id: task._id,
                title: task.title,
                description: task.description,
                resourceId: task.employe?._id,
                resource: task.employe,
                quantity: task.quantity,
                status: task.status,
                color: getStatusColor(task.status),
                isBudget: true,
                priority: task.priority
            }));
            console.log('Mapped tasks:', tasks);
            setBudgetTasks(tasks);
        } catch (error) {
            console.error('Error fetching budget tasks:', error);
            // Fallback to sample tasks if API fails
            const sampleBudgetTasks = resources.map((resource, index) => ({
                id: `budget-${resource.id}-${index}`,
                title: `Quart de travail - ${resource.name}`,
                description: 'Quart de travail à planifier',
                resourceId: resource.id,
                resource: resource,
                quantity: 8,
                status: 'Open',
                color: getStatusColor('Open'),
                isBudget: true
            }));
            setBudgetTasks(sampleBudgetTasks);
        }
    };

    const handleCreateTask = async () => {
        if (!newTask.employe) {
            toast.error('Veuillez sélectionner un employé');
            return;
        }
        if (!newTask.title) {
            toast.error('Veuillez entrer un titre');
            return;
        }
        try {
            await taskService.create(newTask);
            toast.success('Tâche créée avec succès');
            setShowCreateTaskModal(false);
            setNewTask({
                title: '',
                description: '',
                employe: '',
                priority: 'Medium',
                startDate: '',
                endDate: ''
            });
            fetchBudgetTasks();
        } catch (error) {
            toast.error('Erreur lors de la création de la tâche');
        }
    };

    const fetchResources = async () => {
        try {
            const response = await employeService.getAll({ statut: 'Actif', limit: 100 });
            const mappedResources = (response.data.data || []).map((emp, index) => ({
                id: emp._id,
                name: `${emp.prenom} ${emp.nom}`,
                color: ['#FF3B30', '#4CAF50', '#2196F3', '#FF9800', '#9C27B0'][index % 5]
            }));
            setResources(mappedResources);
        } catch (error) {
            console.error('Error fetching resources:', error);
        }
    };

    const convertPresencesToEvents = () => {
        const events = presences.map(presence => {
            const date = new Date(presence.date);
            let start, end;

            // Use actual checkIn/checkOut times if available
            if (presence.checkIn && presence.checkOut) {
                start = new Date(presence.checkIn);
                end = new Date(presence.checkOut);
            } else if (presence.checkIn) {
                start = new Date(presence.checkIn);
                end = new Date(start);
                end.setHours(end.getHours() + 8); // Default 8 hours if no checkout
            } else {
                // Default to 8:00 AM - 5:00 PM for scheduled presence
                start = new Date(date);
                start.setHours(8, 0, 0, 0);
                end = new Date(date);
                end.setHours(17, 0, 0, 0);
            }

            return {
                id: presence._id,
                title: `${presence.employe?.prenom} ${presence.employe?.nom}`,
                start,
                end,
                allDay: false,
                resource: presence,
                resourceId: presence.employe?._id,
                color: getStatusColor(presence.status)
            };
        });
        setCalendarEvents(events);
        setOptimisticEvents(events);
    };

    const handleEventDrop = useCallback(async ({ event, start, end }) => {
        const { id } = event;
        
        // Optimistic UI update
        setOptimisticEvents(prev =>
            prev.map(t => t.id === id ? { ...t, start, end } : t)
        );

        try {
            // Update backend
            const newDate = moment(start).format('YYYY-MM-DD');
            await presenceService.update(id, { date: newDate });
            toast.success('Présence déplacée avec succès');
            
            // Refresh data
            fetchAdminData();
        } catch (error) {
            // Revert on error
            setOptimisticEvents(calendarEvents);
            toast.error('Erreur lors du déplacement');
        }
    }, [calendarEvents]);

    const handleEventResize = useCallback(async ({ event, start, end }) => {
        const { id } = event;
        
        // Optimistic UI update
        setOptimisticEvents(prev =>
            prev.map(t => t.id === id ? { ...t, start, end } : t)
        );

        try {
            // Calculate hours worked
            const hoursWorked = (end - start) / (1000 * 60 * 60);
            await presenceService.update(id, { hoursWorked });
            toast.success('Durée modifiée avec succès');
            
            // Refresh data
            fetchAdminData();
        } catch (error) {
            // Revert on error
            setOptimisticEvents(calendarEvents);
            toast.error('Erreur lors de la modification');
        }
    }, [calendarEvents]);

    const handleBudgetTaskDragStart = (task) => {
        setTaskToSchedule(task);
        setDraggedEvent(task);
    };

    const handleDropFromOutside = useCallback(async ({ start, end }) => {
        const task = taskToSchedule;
        if (!task) {
            toast.error('Aucune tâche sélectionnée');
            return;
        }

        const startDate = new Date(start);
        const endDate = new Date(end || start);
        
        // Default to 8 hours if no end time
        if (!end || start === end) {
            endDate.setHours(startDate.getHours() + 8);
        }

        try {
            // Use task API to schedule the task
            await taskService.schedule(task.id, {
                date: moment(startDate).format('YYYY-MM-DD'),
                checkIn: startDate,
                checkOut: endDate
            });
            toast.success('Tâche planifiée avec succès');
            
            // Remove from budget tasks
            setBudgetTasks(prev => prev.filter(t => t.id !== task.id));
            
            // Refresh data
            fetchAdminData();
            fetchBudgetTasks();
        } catch (error) {
            toast.error('Erreur lors de la planification');
        }
    }, [taskToSchedule]);

    const fetchEmployeeData = async () => {
        try {
            setLoading(true);
            const employeId = user.employe?._id || user.employe;
            if (!employeId) {
                toast.error('Employé ID non trouvé');
                return;
            }

            const response = await presenceService.getTodayPresence(employeId);
            setTodayPresence(response.data.data);
        } catch (error) {
            console.error('Error fetching employee data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAdminData = async () => {
        try {
            setLoading(true);
            const [presencesRes, statsRes] = await Promise.all([
                presenceService.getAll({ date: selectedDate }),
                presenceService.getStats()
            ]);

            setPresences(presencesRes.data.data || []);
            setStats(statsRes.data.data);
        } catch (error) {
            console.error('Error fetching admin data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Filter events by selected resource
    const filteredEvents = useMemo(() => {
        if (!selectedResourceId) return optimisticEvents;
        return optimisticEvents.filter(event => event.resourceId === selectedResourceId);
    }, [optimisticEvents, selectedResourceId]);

    const resourceOptions = useMemo(() => [
        { value: null, label: 'Tous les employés' },
        ...resources.map(r => ({ value: r.id, label: r.name }))
    ], [resources]);

    const handleResourceFilter = (event) => {
        setSelectedResourceId(event.target.value);
    };

    const handleViewChange = (view) => {
        setCurrentView(view);
    };

    const handleNavigate = (date) => {
        setCurrentDate(date);
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'Present': return 'Présent';
            case 'Absent': return 'Absent';
            case 'Late': return 'Retard';
            default: return status;
        }
    };

    const handleClockIn = async () => {
        setActionLoading(true);
        try {
            const employeId = user.employe?._id || user.employe;
            await presenceService.clockIn(employeId);
            toast.success('Pointage enregistré avec succès');
            fetchEmployeeData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Erreur lors du pointage');
        } finally {
            setActionLoading(false);
        }
    };

    const handleClockOut = async () => {
        setActionLoading(true);
        try {
            const employeId = user.employe?._id || user.employe;
            await presenceService.clockOut(employeId);
            toast.success('Sortie enregistrée avec succès');
            fetchEmployeeData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Erreur lors de la sortie');
        } finally {
            setActionLoading(false);
        }
    };

    const handleMarkAttendance = async (presenceId, status) => {
        try {
            await presenceService.markAttendance(presenceId, { status });
            toast.success('Présence mise à jour');
            fetchAdminData();
        } catch (error) {
            toast.error('Erreur lors de la mise à jour');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Present': return 'success';
            case 'Absent': return 'error';
            case 'Late': return 'warning';
            default: return 'default';
        }
    };

    if (loading) {
        return (
            <Layout>
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                    <CircularProgress />
                </Box>
            </Layout>
        );
    }

    return (
        <Layout>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" gutterBottom fontWeight="bold">
                    Planification des Présences
                </Typography>
                <Typography variant="body1" color="textSecondary">
                    {isAdmin || isManagerRH ? 'Gérez et planifiez les présences des employés' : 'Gérez vos présences'}
                </Typography>
            </Box>

            {/* Resource Planning Calendar - Available for all users */}
            <Grid container spacing={3}>
                {/* Stats Cards */}
                <Grid item xs={6} sm={3}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" gap={2}>
                                <CheckCircle color="success" />
                                <Box>
                                    <Typography variant="h4">{stats.present}</Typography>
                                    <Typography variant="body2" color="textSecondary">Présents</Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" gap={2}>
                                <Cancel color="error" />
                                <Box>
                                    <Typography variant="h4">{stats.absent}</Typography>
                                    <Typography variant="body2" color="textSecondary">Absents</Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" gap={2}>
                                <AccessTime color="warning" />
                                <Box>
                                    <Typography variant="h4">{stats.late}</Typography>
                                    <Typography variant="body2" color="textSecondary">Retards</Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" gap={2}>
                                <CalendarToday color="info" />
                                <Box>
                                    <Typography variant="h4">{stats.total}</Typography>
                                    <Typography variant="body2" color="textSecondary">Total</Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Mobile View Controls */}
                <Grid item xs={12} sx={{ display: { xs: 'block', lg: 'none' } }}>
                    <Paper sx={{ p: 1 }}>
                        <Tabs
                            value={activeTab}
                            onChange={(e, newValue) => setActiveTab(newValue)}
                            variant="fullWidth"
                            textColor="primary"
                            indicatorColor="primary"
                        >
                            <Tab label="Calendrier" value="calendar" />
                            <Tab label="Filtres" value="filters" />
                            <Tab label="Tâches" value="tasks" />
                        </Tabs>
                    </Paper>
                </Grid>

                {/* Main Content Area */}
                <Grid item xs={12}>
                    <Box sx={{ display: 'flex', gap: 2, height: { xs: '500px', md: '700px' }, flexDirection: { xs: 'column', lg: 'row' } }}>
                        {/* Left Sidebar - Filters */}
                        <Paper 
                                sx={{ 
                                    width: { xs: '100%', lg: 280 }, 
                                    p: 2, 
                                    display: { xs: activeTab === 'filters' ? 'flex' : 'none', lg: 'flex' },
                                    flexDirection: 'column'
                                }}
                            >
                                <Typography variant="h6" gutterBottom>
                                    <FilterList sx={{ mr: 1, verticalAlign: 'middle' }} />
                                    Filtres
                                </Typography>
                                
                                {/* Filters Toggle */}
                                <Box sx={{ mb: 2 }}>
                                    <Button
                                        fullWidth
                                        onClick={() => setFiltersExpanded(!filtersExpanded)}
                                        endIcon={filtersExpanded ? <ExpandLess /> : <ExpandMore />}
                                        variant="outlined"
                                    >
                                        Filtres
                                    </Button>
                                </Box>

                                <Collapse in={filtersExpanded}>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
                                        <Button
                                            variant="contained"
                                            onClick={() => setCurrentDate(new Date())}
                                        >
                                            Aujourd'hui
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            startIcon={<Refresh />}
                                            onClick={fetchAdminData}
                                        >
                                            Actualiser
                                        </Button>
                                        <FormControl fullWidth>
                                            <InputLabel>Employé</InputLabel>
                                            <Select
                                                value={selectedResourceId}
                                                onChange={handleResourceFilter}
                                                label="Employé"
                                            >
                                                {resourceOptions.map(option => (
                                                    <MenuItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Box>
                                </Collapse>

                                {/* Status Legend Toggle */}
                                <Box sx={{ mb: 2 }}>
                                    <Button
                                        fullWidth
                                        onClick={() => setLegendExpanded(!legendExpanded)}
                                        endIcon={legendExpanded ? <ExpandLess /> : <ExpandMore />}
                                        variant="outlined"
                                    >
                                        Légende
                                    </Button>
                                </Box>

                                <Collapse in={legendExpanded}>
                                    <List dense>
                                        {Object.entries(statusColorMap).map(([status, color]) => (
                                            <ListItem key={status}>
                                                <ListItemIcon>
                                                    <Box sx={{ width: 20, height: 20, backgroundColor: color, borderRadius: 1 }} />
                                                </ListItemIcon>
                                                <ListItemText primary={getStatusText(status)} />
                                            </ListItem>
                                        ))}
                                    </List>
                                </Collapse>
                            </Paper>

                            {/* Calendar Area */}
                            <Paper 
                                sx={{ 
                                    flex: 1, 
                                    p: 2, 
                                    overflow: 'hidden', 
                                    display: 'flex',
                                    flexDirection: 'column'
                                }}
                            >
                                <DnDCalendar
                                    localizer={localizer}
                                    events={filteredEvents}
                                    onEventDrop={handleEventDrop}
                                    onEventResize={handleEventResize}
                                    onDropFromOutside={handleDropFromOutside}
                                    onDragOver={(e) => e.preventDefault()}
                                    dragFromOutsideItem={() => taskToSchedule ? {
                                        id: taskToSchedule.id,
                                        title: taskToSchedule.title,
                                        start: new Date(),
                                        end: new Date(Date.now() + 8 * 60 * 60 * 1000),
                                        allDay: false
                                    } : null}
                                    resizable
                                    startAccessor="start"
                                    endAccessor="end"
                                    style={{ height: '100%', minHeight: 400 }}
                                    views={['month', 'week', 'day', 'agenda']}
                                    view={currentView}
                                    date={currentDate}
                                    onNavigate={handleNavigate}
                                    onView={handleViewChange}
                                    eventPropGetter={(event) => ({
                                        style: {
                                            backgroundColor: event.color + 'CC',
                                            borderRadius: '4px',
                                            color: 'white',
                                            border: 'none',
                                            fontSize: '12px'
                                        }
                                    })}
                                    messages={{
                                        today: "Aujourd'hui",
                                        previous: 'Précédent',
                                        next: 'Suivant',
                                        month: 'Mois',
                                        week: 'Semaine',
                                        day: 'Jour',
                                        agenda: 'Agenda',
                                        date: 'Date',
                                        time: 'Heure',
                                        event: 'Présence',
                                        noEventsInRange: 'Aucune présence'
                                    }}
                                />
                            </Paper>

                            {/* Right Sidebar - Budget Tasks */}
                            <Paper 
                                sx={{ 
                                    width: { xs: '100%', lg: 300 }, 
                                    p: 2, 
                                    display: { xs: activeTab === 'tasks' ? 'flex' : 'none', md: 'flex' },
                                    flexDirection: 'column',
                                    overflow: 'auto'
                                }}
                            >
                                <Typography variant="h6" gutterBottom>
                                    <Assignment sx={{ mr: 1, verticalAlign: 'middle' }} />
                                    Tâches à Planifier
                                </Typography>
                                <Typography variant="body2" color="textSecondary" gutterBottom>
                                    Glissez les tâches vers le calendrier
                                </Typography>
                                
                                {(isAdmin || isManagerRH) && (
                                    <Button
                                        variant="contained"
                                        startIcon={<Add />}
                                        onClick={() => setShowCreateTaskModal(true)}
                                        sx={{ mb: 2 }}
                                    >
                                        Créer une Tâche
                                    </Button>
                                )}
                                
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
                                    {budgetTasks.length === 0 ? (
                                        <Typography variant="body2" color="textSecondary" align="center">
                                            Aucune tâche à planifier
                                        </Typography>
                                    ) : (
                                        budgetTasks.map(task => (
                                            <Box
                                                key={task.id}
                                                draggable
                                                onDragStart={() => handleBudgetTaskDragStart(task)}
                                                sx={{
                                                    p: 2,
                                                    backgroundColor: 'white',
                                                    border: '1px solid #e0e0e0',
                                                    borderRadius: 1,
                                                    cursor: 'grab',
                                                    '&:hover': {
                                                        backgroundColor: '#f5f5f5',
                                                        borderColor: task.color
                                                    },
                                                    borderLeft: `4px solid ${task.color}`
                                                }}
                                            >
                                                <Typography variant="body2" fontWeight="medium">
                                                    {task.title}
                                                </Typography>
                                                <Typography variant="caption" color="textSecondary">
                                                    {task.description} • {task.quantity}h
                                                </Typography>
                                            </Box>
                                        ))
                                    )}
                                </Box>
                            </Paper>
                        </Box>
                    </Grid>
                </Grid>

                {/* Create Task Dialog */}
                <Dialog open={showCreateTaskModal} onClose={() => setShowCreateTaskModal(false)} maxWidth="sm" fullWidth>
                    <DialogTitle>Créer une Tâche</DialogTitle>
                    <DialogContent>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                            <TextField
                                label="Titre"
                                fullWidth
                                value={newTask.title}
                                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                            />
                            <TextField
                                label="Description"
                                fullWidth
                                multiline
                                rows={3}
                                value={newTask.description}
                                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                            />
                            <FormControl fullWidth>
                                <InputLabel>Employé</InputLabel>
                                <Select
                                    value={newTask.employe}
                                    onChange={(e) => setNewTask({ ...newTask, employe: e.target.value })}
                                    label="Employé"
                                >
                                    {resources.map((resource) => (
                                        <MenuItem key={resource.id} value={resource.id}>
                                            {resource.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <FormControl fullWidth>
                                <InputLabel>Priorité</InputLabel>
                                <Select
                                    value={newTask.priority}
                                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                                    label="Priorité"
                                >
                                    <MenuItem value="Low">Faible</MenuItem>
                                    <MenuItem value="Medium">Moyenne</MenuItem>
                                    <MenuItem value="High">Haute</MenuItem>
                                </Select>
                            </FormControl>
                            <TextField
                                label="Date de début"
                                type="date"
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                value={newTask.startDate}
                                onChange={(e) => setNewTask({ ...newTask, startDate: e.target.value })}
                            />
                            <TextField
                                label="Date de fin (deadline)"
                                type="date"
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                value={newTask.endDate}
                                onChange={(e) => setNewTask({ ...newTask, endDate: e.target.value })}
                            />
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setShowCreateTaskModal(false)}>Annuler</Button>
                        <Button onClick={handleCreateTask} variant="contained">Créer</Button>
                    </DialogActions>
                </Dialog>
            </Layout>
        );
};

export default Presence;
