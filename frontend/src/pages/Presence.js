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
    DialogActions,
    Autocomplete
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
    Add,
    AddCircle,
    ArrowDropDown,
    Delete,
    Description,
    Edit,
    Event
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
import ModernHeader from '../components/ModernHeader';
import ModernCard from '../components/ModernCard';

const DnDCalendar = withDragAndDrop(Calendar);
const localizer = momentLocalizer(moment);

const statusColorMap = {
    'Present': '#4CAF50',
    'Absent': '#F44336',
    'Late': '#FF9800',
    'En attente': '#2196F3',
    'En cours': '#9C27B0',
    'Terminé': '#00BCD4',
    'Annulé': '#757575'
};

const getStatusColor = (status) => statusColorMap[status] || '#2196F3';

const Presence = () => {
    const { user, isAdmin, isManagerRH } = useAuth();
    const [tabValue, setTabValue] = useState(0);
    const [todayPresence, setTodayPresence] = useState(null);
    const [presences, setPresences] = useState([]);
    const [calendarEvents, setCalendarEvents] = useState([]);
    const [optimisticEvents, setOptimisticEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [employes, setEmployes] = useState([]);
    const [resources, setResources] = useState([]);
    const [selectedResourceId, setSelectedResourceId] = useState(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [currentView, setCurrentView] = useState('month');
    const [filtersExpanded, setFiltersExpanded] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('calendar');
    const [draggedEvent, setDraggedEvent] = useState(null);
    const [budgetTasks, setBudgetTasks] = useState([]);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [selectedDateForDrop, setSelectedDateForDrop] = useState(null);
    const [taskToSchedule, setTaskToSchedule] = useState(null);
    const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
    const [showTaskDetailModal, setShowTaskDetailModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [showDescriptionModal, setShowDescriptionModal] = useState(false);
    const [subtaskDescription, setSubtaskDescription] = useState('');
    const [dropDate, setDropDate] = useState(null);
    const [taskDescription, setTaskDescription] = useState('');
    const [editStartTime, setEditStartTime] = useState('');
    const [editEndTime, setEditEndTime] = useState('');
    const [editHoursWorked, setEditHoursWorked] = useState(0);
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        employe: '',
        priority: 'Medium',
        dureeEstimee: 8,
        startDate: '',
        endDate: '',
        startTime: '08:00',
        endTime: '09:00'
    });

    // Calculate duration from start and end times
    const calculateDuration = (startTime, endTime) => {
        if (!startTime || !endTime) return 8;
        const [startHours, startMinutes] = startTime.split(':').map(Number);
        const [endHours, endMinutes] = endTime.split(':').map(Number);
        
        const startTotalMinutes = startHours * 60 + startMinutes;
        const endTotalMinutes = endHours * 60 + endMinutes;
        
        let durationMinutes = endTotalMinutes - startTotalMinutes;
        if (durationMinutes <= 0) durationMinutes += 24 * 60; // Handle overnight
        
        return Math.round(durationMinutes / 60 * 10) / 10; // Round to 1 decimal
    };

    // Calculate end time from start time and duration
    const calculateEndTime = (startTime, duration) => {
        if (!startTime || !duration) return '09:00';
        const [hours, minutes] = startTime.split(':').map(Number);
        const totalMinutes = hours * 60 + minutes + duration * 60;
        const endHours = Math.floor(totalMinutes / 60) % 24;
        const endMinutes = totalMinutes % 60;
        return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
    };

    const handleTimeChange = (field, value) => {
        const updatedTask = { ...newTask, [field]: value };
        
        if (field === 'startTime' || field === 'endTime') {
            // Recalculate duration when start or end time changes
            const duration = calculateDuration(updatedTask.startTime, updatedTask.endTime);
            updatedTask.dureeEstimee = duration;
        } else if (field === 'dureeEstimee') {
            // Recalculate end time when duration changes
            updatedTask.endTime = calculateEndTime(updatedTask.startTime, value);
        }
        
        setNewTask(updatedTask);
    };

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
        }
        fetchBudgetTasks(); // Call for all users (will filter by employee if not admin/manager)
    }, [isAdmin, isManagerRH]);

    // Auto-select current user's employee ID for employee users
    useEffect(() => {
        if (!isAdmin && !isManagerRH && user?.employe) {
            const employeId = user.employe._id || user.employe;
            console.log('Auto-selecting employee ID for employee user:', employeId);
            setSelectedResourceId(employeId);
        }
    }, [user, isAdmin, isManagerRH]);

    useEffect(() => {
        convertPresencesToEvents();
    }, [presences]);

    const fetchBudgetTasks = async () => {
        try {
            const employeId = user.employe?._id || user.employe;
            console.log('Fetching budget tasks for user:', { employeId, isAdmin, isManagerRH, user });

            // Admins see all tasks, employees see only their assigned tasks
            const params = {};
            if (!isAdmin && !isManagerRH && employeId) {
                params.employeAssigne = employeId;
                console.log('Filtering tasks for employee:', employeId);
            }

            console.log('Fetching with params:', params);
            const response = await taskService.getAll(params);
            console.log('Tasks response:', response.data);

            const tasks = (response.data.data || []).map(task => ({
                id: task._id,
                title: task.titre,
                description: task.description,
                resourceId: task.employeAssigne?._id,
                resource: task.employeAssigne,
                quantity: task.dureeEstimee,
                status: task.statut,
                color: getStatusColor(task.statut),
                isBudget: true,
                priority: task.priorite,
                startTime: task.heureDebut || '08:00',
                endTime: task.heureFin || '09:00'
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
                status: 'En attente',
                color: getStatusColor('En attente'),
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
            // Map English priority values to French enum values
            const priorityMap = {
                'Low': 'Basse',
                'Medium': 'Moyenne',
                'High': 'Haute'
            };
            
            const taskData = {
                titre: newTask.title,
                description: newTask.description,
                employeAssigne: newTask.employe,
                priorite: priorityMap[newTask.priority] || 'Moyenne',
                dureeEstimee: newTask.dureeEstimee || 8,
                dateDebut: newTask.startDate,
                dateFin: newTask.endDate,
                heureDebut: newTask.startTime,
                heureFin: newTask.endTime
            };
            await taskService.create(taskData);
            toast.success('Tâche créée avec succès');
            setShowCreateTaskModal(false);
            setNewTask({
                title: '',
                description: '',
                employe: '',
                priority: 'Moyenne',
                dureeEstimee: 8,
                startDate: '',
                endDate: '',
                startTime: '08:00',
                endTime: '09:00'
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
                title: presence.description
                    ? `${presence.employe?.prenom} ${presence.employe?.nom} - ${presence.description}`
                    : `${presence.employe?.prenom} ${presence.employe?.nom}`,
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
            // Update backend with new date, checkIn, and checkOut times
            const newDate = moment(start).format('YYYY-MM-DD');
            const hoursWorked = (end - start) / (1000 * 60 * 60);
            await presenceService.update(id, {
                date: newDate,
                checkIn: start,
                checkOut: end,
                hoursWorked: hoursWorked
            });
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
            // Update both hoursWorked and checkIn/checkOut times
            await presenceService.update(id, {
                hoursWorked,
                checkIn: start,
                checkOut: end
            });
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
        console.log('handleBudgetTaskDragStart called with task:', task);
        setTaskToSchedule(task);
        setDraggedEvent(task);
    };

    const handleDropFromOutside = useCallback(async ({ start, end }) => {
        console.log('handleDropFromOutside called with start:', start, 'end:', end, 'taskToSchedule:', taskToSchedule);
        const task = taskToSchedule;
        if (!task) {
            toast.error('Aucune tâche sélectionnée');
            return;
        }

        // Use the actual drop time from the calendar
        const startDate = new Date(start);
        // Always default to 1 hour duration from the drop time (ignore end from calendar)
        const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

        console.log('Calculated times:', {
            startDate,
            endDate,
            durationHours: (endDate - startDate) / (1000 * 60 * 60)
        });

        // Store drop date and show description modal
        setDropDate({ startDate, endDate });
        setShowDescriptionModal(true);
    }, [taskToSchedule]);

    const handleScheduleWithDescription = async () => {
        const task = taskToSchedule;
        if (!task || !dropDate) return;

        const { startDate, endDate } = dropDate;
        const description = subtaskDescription || '';

        // Optimistic UI update - add event immediately with temporary ID
        const tempEventId = `temp-${Date.now()}`;
        const newEvent = {
            id: tempEventId,
            title: task.title || task.titre || 'Nouvelle tâche',
            start: startDate,
            end: endDate,
            allDay: false,
            resourceId: task.employeAssigne?._id || selectedResourceId,
            resource: task.employeAssigne,
            color: getStatusColor('Present'),
            status: 'Present'
        };
        setOptimisticEvents(prev => [...prev, newEvent]);

        try {
            // Use task API to schedule the task with description
            const response = await taskService.schedule(task.id, {
                date: moment(startDate).format('YYYY-MM-DD'),
                checkIn: startDate,
                checkOut: endDate,
                description: description
            });
            console.log('Schedule response:', response.data);
            toast.success('Sous-tâche créée avec succès');

            // Remove temporary event and add actual presence
            setOptimisticEvents(prev => {
                // Remove the temporary event
                const filtered = prev.filter(e => e.id !== tempEventId);
                // Add the actual presence from backend if available
                if (response.data.presence) {
                    const newPresence = response.data.presence;
                    const actualEvent = {
                        id: newPresence._id,
                        title: `${newPresence.employe?.prenom || ''} ${newPresence.employe?.nom || ''} - ${newPresence.description || ''}`,
                        start: new Date(newPresence.checkIn),
                        end: new Date(newPresence.checkOut),
                        allDay: false,
                        resource: newPresence,
                        resourceId: newPresence.employe?._id,
                        color: getStatusColor(newPresence.status || 'Present')
                    };
                    return [...filtered, actualEvent];
                }
                return filtered;
            });

            // Refresh data to get all presences from backend
            fetchAdminData();
            fetchBudgetTasks();
        } catch (error) {
            // Revert optimistic update on error
            setOptimisticEvents(prev => prev.filter(e => e.id !== tempEventId));
            console.error('Error scheduling task:', error);
            toast.error('Erreur lors de la planification');
        } finally {
            // Reset modal state
            setShowDescriptionModal(false);
            setSubtaskDescription('');
            setDropDate(null);
            setTaskToSchedule(null);
        }
    };

    const handleEventClick = async (event) => {
        try {
            console.log('Event clicked:', event);
            console.log('Event resource:', event.resource);
            // Use the event data directly since we already have it
            setSelectedTask(event.resource || event);
            // Reset edit fields
            setEditStartTime('');
            setEditEndTime('');
            setEditHoursWorked(0);
            setShowTaskDetailModal(true);
        } catch (error) {
            console.error('Error displaying presence details:', error);
            toast.error('Erreur lors de l\'affichage des détails');
        }
    };

    const handleSavePresenceDetails = async () => {
        if (!selectedTask) return;
        try {
            const updates = {};
            let hasChanges = false;

            if (editStartTime) {
                const date = selectedTask.date ? moment(selectedTask.date).format('YYYY-MM-DD') : moment(selectedTask.start).format('YYYY-MM-DD');
                const newCheckIn = moment(`${date} ${editStartTime}`, 'YYYY-MM-DD HH:mm').toDate();
                updates.checkIn = newCheckIn;
                hasChanges = true;
            }

            if (editEndTime) {
                const date = selectedTask.date ? moment(selectedTask.date).format('YYYY-MM-DD') : moment(selectedTask.end).format('YYYY-MM-DD');
                const newCheckOut = moment(`${date} ${editEndTime}`, 'YYYY-MM-DD HH:mm').toDate();
                updates.checkOut = newCheckOut;
                hasChanges = true;
            }

            if (editHoursWorked > 0) {
                updates.hoursWorked = editHoursWorked;
                hasChanges = true;
            }

            if (selectedTask.description !== undefined) {
                updates.description = selectedTask.description;
                hasChanges = true;
            }

            if (hasChanges && selectedTask._id) {
                await presenceService.update(selectedTask._id, updates);
                toast.success('Présence mise à jour avec succès');
                fetchAdminData();
            }

            setShowTaskDetailModal(false);
        } catch (error) {
            console.error('Error updating presence:', error);
            toast.error('Erreur lors de la mise à jour');
        }
    };

    const handleDeleteTask = async () => {
        if (!selectedTask) return;

        try {
            // Check if it's a presence or a task
            // Presence has: employe, date, status fields
            // Task has: titre/title, employeAssigne fields
            if (selectedTask.employe && selectedTask.date && selectedTask.status) {
                // It's a presence
                await presenceService.delete(selectedTask._id);
                toast.success('Présence supprimée avec succès');
            } else if (selectedTask.titre || selectedTask.title || selectedTask.employeAssigne) {
                // It's a task
                await taskService.delete(selectedTask._id);
                toast.success('Tâche supprimée avec succès');
            } else {
                toast.error('Type d\'élément non reconnu');
            }

            setShowTaskDetailModal(false);
            // Refresh data
            if (isAdmin || isManagerRH) {
                fetchAdminData();
            } else {
                fetchEmployeeData();
            }
            fetchBudgetTasks();
        } catch (error) {
            console.error('Error deleting:', error);
            toast.error('Erreur lors de la suppression');
        }
    };

    const fetchEmployeeData = async () => {
        try {
            setLoading(true);
            const employeId = user.employe?._id || user.employe;
            if (!employeId) {
                toast.error('Employé ID non trouvé');
                return;
            }

            // Fetch today's presence
            const todayResponse = await presenceService.getTodayPresence(employeId);
            setTodayPresence(todayResponse.data.data);

            // Fetch all presences for the employee to show in calendar
            const allPresencesResponse = await presenceService.getAll({ employe: employeId });
            setPresences(allPresencesResponse.data.data || []);
        } catch (error) {
            console.error('Error fetching employee data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAdminData = async () => {
        try {
            setLoading(true);
            console.log('Fetching admin data with selectedResourceId:', selectedResourceId);
            const params = {};
            if (selectedResourceId) {
                params.employe = selectedResourceId;
                console.log('Filtering by employe:', selectedResourceId);
            } else {
                console.log('No employee selected, fetching all presences');
            }
            const presencesRes = await presenceService.getAll(params);

            console.log('Presences fetched count:', presencesRes.data.data?.length || 0);
            setPresences(presencesRes.data.data || []);
            // Convert presences to events after fetching
            console.log('Calling convertPresencesToEvents');
            convertPresencesToEvents();
            console.log('Optimistic events after conversion count:', optimisticEvents.length);
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
            <ModernHeader
                title="Planification des Présences"
                subtitle={isAdmin || isManagerRH ? 'Gérez et planifiez les présences des employés' : 'Gérez vos présences'}
                icon={<Schedule />}
            />

            {/* Resource Planning Calendar - Available for all users */}
            <Grid container spacing={3}>
                {/* Mobile View Controls */}
                <Grid item xs={12} sx={{ display: { xs: 'block', lg: 'none' } }}>
                    <Paper elevation={3} sx={{
                        p: 1,
                        borderRadius: 3,
                        border: '1px solid',
                        borderColor: 'grey.200',
                        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
                    }}>
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
                        <Paper elevation={3}
                            sx={{
                                width: { xs: '100%', lg: 280 },
                                p: 2,
                                borderRadius: 3,
                                border: '1px solid',
                                borderColor: 'grey.200',
                                background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                                display: { xs: activeTab === 'filters' ? 'flex' : 'none', lg: 'flex' },
                                flexDirection: 'column'
                            }}>
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
                                        {(isAdmin || isManagerRH) && (
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
                                        )}
                                    </Box>
                                </Collapse>

                            </Paper>

                            {/* Calendar Area */}
                            <Paper elevation={3}
                                sx={{
                                    flex: 1,
                                    p: 2,
                                    borderRadius: 3,
                                    border: '1px solid',
                                    borderColor: 'grey.200',
                                    background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
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
                                    onSelectEvent={handleEventClick}
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
                                    min={new Date(2023, 0, 1, 7, 0)}
                                    max={new Date(2023, 0, 1, 19, 0)}
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
                            <Paper elevation={3}
                                sx={{
                                    width: { xs: '100%', lg: 300 },
                                    p: 2,
                                    borderRadius: 3,
                                    border: '1px solid',
                                    borderColor: 'grey.200',
                                    background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                                    display: { xs: activeTab === 'tasks' ? 'flex' : 'none', md: 'flex' },
                                    flexDirection: 'column',
                                    overflow: 'hidden'
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
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <TextField
                                    label="Heure de début"
                                    type="time"
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                    value={newTask.startTime}
                                    onChange={(e) => handleTimeChange('startTime', e.target.value)}
                                />
                                <TextField
                                    label="Heure de fin"
                                    type="time"
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                    value={newTask.endTime}
                                    onChange={(e) => handleTimeChange('endTime', e.target.value)}
                                />
                                <TextField
                                    label="Durée (heures)"
                                    type="number"
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                    value={newTask.dureeEstimee}
                                    onChange={(e) => handleTimeChange('dureeEstimee', parseFloat(e.target.value))}
                                    inputProps={{ min: 0, step: 0.5 }}
                                />
                            </Box>
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setShowCreateTaskModal(false)}>Annuler</Button>
                        <Button onClick={handleCreateTask} variant="contained">Créer</Button>
                    </DialogActions>
                </Dialog>

                {/* Task Detail Dialog */}
                <Dialog open={showTaskDetailModal} onClose={() => setShowTaskDetailModal(false)} maxWidth="md" fullWidth PaperProps={{
                    sx: {
                        borderRadius: 3,
                        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                    }
                }}>
                    <DialogTitle sx={{
                        background: 'linear-gradient(135deg, #4f58a5 0%, #49a2da 100%)',
                        color: 'white',
                        py: 2,
                        px: 3
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{
                                width: 40,
                                height: 40,
                                borderRadius: 2,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'rgba(255, 255, 255, 0.2)'
                            }}>
                                <CalendarToday sx={{ color: 'white', fontSize: 24 }} />
                            </Box>
                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: 18 }}>
                                    Détails de la Présence
                                </Typography>
                                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                                    Informations sur la présence
                                </Typography>
                            </Box>
                        </Box>
                    </DialogTitle>
                    <DialogContent sx={{ p: 3 }}>
                        {selectedTask && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                                {/* Employee and Date */}
                                <Box sx={{
                                    background: '#f8f9fa',
                                    p: 2,
                                    borderRadius: 2,
                                    border: '1px solid #e9ecef'
                                }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Person sx={{ fontSize: 16, color: '#4f58a5' }} />
                                        Informations générales
                                    </Typography>
                                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                                        <Box>
                                            <Typography variant="caption" color="textSecondary">Employé:</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                {selectedTask.employe?.prenom || selectedTask.resource?.employe?.prenom || ''} {selectedTask.employe?.nom || selectedTask.resource?.employe?.nom || ''}
                                            </Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" color="textSecondary">Date:</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                {selectedTask.date ? moment(selectedTask.date).format('DD/MM/YYYY') : selectedTask.start ? moment(selectedTask.start).format('DD/MM/YYYY') : 'N/A'}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>

                                {/* Time Info - Editable */}
                                <Box sx={{
                                    background: '#f8f9fa',
                                    p: 2,
                                    borderRadius: 2,
                                    border: '1px solid #e9ecef'
                                }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <AccessTime sx={{ fontSize: 16, color: '#4f58a5' }} />
                                        Horaires
                                    </Typography>
                                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                                        <Box>
                                            <Typography variant="caption" color="textSecondary">Heure d'entrée:</Typography>
                                            <TextField
                                                type="time"
                                                size="small"
                                                fullWidth
                                                value={editStartTime || (selectedTask.heureEntree || selectedTask.checkIn ? moment(selectedTask.heureEntree || selectedTask.checkIn).format('HH:mm') : selectedTask.start ? moment(selectedTask.start).format('HH:mm') : '08:00')}
                                                onChange={(e) => {
                                                    setEditStartTime(e.target.value);
                                                    // Recalculate hours worked
                                                    if (editEndTime || selectedTask.heureSortie || selectedTask.checkOut || selectedTask.end) {
                                                        const endStr = editEndTime || (selectedTask.heureSortie || selectedTask.checkOut ? moment(selectedTask.heureSortie || selectedTask.checkOut).format('HH:mm') : selectedTask.end ? moment(selectedTask.end).format('HH:mm') : '09:00');
                                                        const start = moment(e.target.value, 'HH:mm');
                                                        const end = moment(endStr, 'HH:mm');
                                                        const hours = end.diff(start, 'hours', true);
                                                        setEditHoursWorked(Math.max(0, hours));
                                                    }
                                                }}
                                                inputProps={{ step: 900 }}
                                            />
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" color="textSecondary">Heure de sortie:</Typography>
                                            <TextField
                                                type="time"
                                                size="small"
                                                fullWidth
                                                value={editEndTime || (selectedTask.heureSortie || selectedTask.checkOut ? moment(selectedTask.heureSortie || selectedTask.checkOut).format('HH:mm') : selectedTask.end ? moment(selectedTask.end).format('HH:mm') : '09:00')}
                                                onChange={(e) => {
                                                    setEditEndTime(e.target.value);
                                                    // Recalculate hours worked
                                                    if (editStartTime || selectedTask.heureEntree || selectedTask.checkIn || selectedTask.start) {
                                                        const startStr = editStartTime || (selectedTask.heureEntree || selectedTask.checkIn ? moment(selectedTask.heureEntree || selectedTask.checkIn).format('HH:mm') : selectedTask.start ? moment(selectedTask.start).format('HH:mm') : '08:00');
                                                        const start = moment(startStr, 'HH:mm');
                                                        const end = moment(e.target.value, 'HH:mm');
                                                        const hours = end.diff(start, 'hours', true);
                                                        setEditHoursWorked(Math.max(0, hours));
                                                    }
                                                }}
                                                inputProps={{ step: 900 }}
                                            />
                                        </Box>
                                    </Box>
                                    <Box sx={{ mt: 1 }}>
                                        <Typography variant="caption" color="textSecondary">Heures travaillées:</Typography>
                                        <TextField
                                            type="number"
                                            size="small"
                                            fullWidth
                                            value={editHoursWorked || selectedTask.heuresTravaillees || selectedTask.actualWorkHours || selectedTask.hoursWorked || selectedTask.quantity || 0}
                                            onChange={(e) => setEditHoursWorked(parseFloat(e.target.value) || 0)}
                                            inputProps={{ step: 0.25, min: 0 }}
                                        />
                                    </Box>
                                </Box>

                                {/* Status */}
                                <Box sx={{
                                    background: '#f8f9fa',
                                    p: 2,
                                    borderRadius: 2,
                                    border: '1px solid #e9ecef'
                                }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <CheckCircle sx={{ fontSize: 16, color: '#4f58a5' }} />
                                        Statut
                                    </Typography>
                                    <Chip label={selectedTask.status || selectedTask.sessionStatus || 'Présent'} color={getStatusColor(selectedTask.status || selectedTask.sessionStatus || 'Present')} />
                                </Box>

                                {/* Description - always shown and editable */}
                                <Box sx={{
                                    background: '#f8f9fa',
                                    p: 2,
                                    borderRadius: 2,
                                    border: '1px solid #e9ecef'
                                }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Description sx={{ fontSize: 16, color: '#4f58a5' }} />
                                        Description
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={3}
                                        size="small"
                                        value={selectedTask.description || ''}
                                        onChange={(e) => {
                                            const newValue = e.target.value;
                                            setSelectedTask(prev => prev ? { ...prev, description: newValue } : null);
                                        }}
                                        placeholder="Décrivez ce que vous avez fait..."
                                    />
                                </Box>

                                {/* Pauses */}
                                {(selectedTask.pauses && selectedTask.pauses.length > 0) && (
                                    <Box sx={{
                                        background: '#f8f9fa',
                                        p: 2,
                                        borderRadius: 2,
                                        border: '1px solid #e9ecef'
                                    }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Schedule sx={{ fontSize: 16, color: '#4f58a5' }} />
                                            Pauses
                                        </Typography>
                                        {selectedTask.pauses.map((pause, index) => (
                                            <Typography key={index} variant="body2" sx={{ fontWeight: 500 }}>
                                                {moment(pause.start).format('HH:mm')} - {moment(pause.end).format('HH:mm')} ({pause.duration} min)
                                            </Typography>
                                        ))}
                                    </Box>
                                )}
                            </Box>
                        )}
                    </DialogContent>
                    <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #e9ecef' }}>
                        <Button
                            onClick={handleDeleteTask}
                            color="error"
                            sx={{
                                borderRadius: 2,
                                px: 3,
                                py: 1.5
                            }}
                        >
                            Supprimer
                        </Button>
                        <Button
                            onClick={() => setShowTaskDetailModal(false)}
                            sx={{
                                borderRadius: 2,
                                px: 3,
                                py: 1.5
                            }}
                        >
                            Annuler
                        </Button>
                        <Button
                            onClick={handleSavePresenceDetails}
                            variant="contained"
                            sx={{
                                borderRadius: 2,
                                px: 4,
                                py: 1.5,
                                background: 'linear-gradient(135deg, #4f58a5 0%, #49a2da 100%)',
                                '&:hover': {
                                    background: 'linear-gradient(135deg, #3d4a94 0%, #3a8cc8 100%)',
                                }
                            }}
                        >
                            Sauvegarder
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Description Modal for Subtask */}
                <Dialog open={showDescriptionModal} onClose={() => setShowDescriptionModal(false)} maxWidth="sm" fullWidth PaperProps={{
                    sx: {
                        borderRadius: 3,
                        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                    }
                }}>
                    <DialogTitle sx={{
                        background: 'linear-gradient(135deg, #4f58a5 0%, #49a2da 100%)',
                        color: 'white',
                        py: 2,
                        px: 3
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{
                                width: 40,
                                height: 40,
                                borderRadius: 2,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'rgba(255, 255, 255, 0.2)'
                            }}>
                                <Assignment sx={{ color: 'white', fontSize: 24 }} />
                            </Box>
                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: 18 }}>
                                    Description de la sous-tâche
                                </Typography>
                                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                                    Détails et configuration
                                </Typography>
                            </Box>
                        </Box>
                    </DialogTitle>
                    <DialogContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                            {/* Task Info */}
                            <Box sx={{
                                background: '#f8f9fa',
                                p: 2,
                                borderRadius: 2,
                                border: '1px solid #e9ecef'
                            }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <EventNote sx={{ fontSize: 16, color: '#4f58a5' }} />
                                    Détails de la tâche
                                </Typography>
                                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                                    <Box>
                                        <Typography variant="caption" color="textSecondary">Tâche:</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                            {taskToSchedule?.title || taskToSchedule?.titre || 'Nouvelle tâche'}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" color="textSecondary">Heure:</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                            {dropDate ? `${moment(dropDate.startDate).format('HH:mm')} - ${moment(dropDate.endDate).format('HH:mm')}` : ''}
                                        </Typography>
                                    </Box>
                                </Box>
                                <Box sx={{ mt: 1 }}>
                                    <Typography variant="caption" color="textSecondary">Durée:</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#4f58a5' }}>
                                        {dropDate ? `${Math.round((dropDate.endDate - dropDate.startDate) / (1000 * 60 * 60) * 10) / 10} heure(s)` : '1 heure'}
                                    </Typography>
                                </Box>
                            </Box>

                            {/* Description Dropdown */}
                            <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Description sx={{ fontSize: 16, color: '#4f58a5' }} />
                                    Type de travail
                                </Typography>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Type de travail</InputLabel>
                                    <Select
                                        value={subtaskDescription || ''}
                                        label="Type de travail"
                                        onChange={(e) => setSubtaskDescription(e.target.value)}
                                    >
                                        <MenuItem value="">-- Sélectionner --</MenuItem>
                                        <MenuItem value="Développement">Développement</MenuItem>
                                        <MenuItem value="Testing">Testing</MenuItem>
                                        <MenuItem value="Documentation">Documentation</MenuItem>
                                        <MenuItem value="Design">Design</MenuItem>
                                        <MenuItem value="Réunion">Réunion</MenuItem>
                                        <MenuItem value="Analyse">Analyse</MenuItem>
                                        <MenuItem value="Autre">Autre</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>

                            {/* Description Text Field */}
                            <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Edit sx={{ fontSize: 16, color: '#4f58a5' }} />
                                    Description détaillée
                                </Typography>
                                <TextField
                                    autoFocus
                                    multiline
                                    rows={3}
                                    fullWidth
                                    label="Description de ce que vous avez fait"
                                    value={subtaskDescription}
                                    onChange={(e) => setSubtaskDescription(e.target.value)}
                                    placeholder="Ex: Développement de la fonctionnalité X, Testing du module Y..."
                                    size="small"
                                />
                            </Box>
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #e9ecef' }}>
                        <Button
                            onClick={() => setShowDescriptionModal(false)}
                            sx={{
                                borderRadius: 2,
                                px: 3,
                                py: 1.5
                            }}
                        >
                            Annuler
                        </Button>
                        <Button
                            onClick={handleScheduleWithDescription}
                            variant="contained"
                            sx={{
                                borderRadius: 2,
                                px: 4,
                                py: 1.5,
                                background: 'linear-gradient(135deg, #4f58a5 0%, #49a2da 100%)',
                                '&:hover': {
                                    background: 'linear-gradient(135deg, #3d4a94 0%, #3a8cc8 100%)',
                                }
                            }}
                        >
                            Créer la sous-tâche
                        </Button>
                    </DialogActions>
                </Dialog>
            </Layout>
        );
};

export default Presence;
