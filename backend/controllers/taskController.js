const Task = require('../models/Task');
const Employe = require('../models/Employe');
const Presence = require('../models/Presence');

// Create a new task
exports.createTask = async (req, res) => {
    try {
        console.log('Creating task with body:', req.body);
        console.log('User:', req.user);

        const { title, description, employe, quantity, priority, startDate, endDate } = req.body;

        // Verify employe exists
        const employeExists = await Employe.findById(employe);
        if (!employeExists) {
            console.log('Employé not found:', employe);
            return res.status(404).json({ message: 'Employé non trouvé' });
        }

        const task = new Task({
            title,
            description,
            employe,
            quantity: quantity || 8,
            priority: priority || 'Medium',
            startDate,
            endDate,
            createdBy: req.user?._id
        });

        await task.save();
        console.log('Task saved with employe:', task.employe);
        await task.populate('employe', 'prenom nom');
        console.log('Task after populate:', task);

        res.status(201).json({ data: task });
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get all tasks (unscheduled/budget tasks)
exports.getTasks = async (req, res) => {
    try {
        const { employe, status, scheduled } = req.query;
        console.log('getTasks called with query:', req.query);

        const filter = {};
        if (employe) {
            // Convert to ObjectId for proper comparison
            const mongoose = require('mongoose');
            filter.employe = new mongoose.Types.ObjectId(employe);
        }
        if (status) filter.status = status;
        if (scheduled !== undefined) filter.scheduled = scheduled === 'true';

        console.log('Filter:', filter);
        const tasks = await Task.find(filter)
            .populate('employe', 'prenom nom')
            .sort({ createdAt: -1 });

        console.log('Found tasks:', tasks.length, tasks);
        res.json({ data: tasks });
    } catch (error) {
        console.error('Error in getTasks:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get a single task by ID
exports.getTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id)
            .populate('employe', 'prenom nom')
            .populate('presence');

        if (!task) {
            return res.status(404).json({ message: 'Tâche non trouvée' });
        }

        res.json({ data: task });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update a task
exports.updateTask = async (req, res) => {
    try {
        const { title, description, quantity, status, priority, startDate, endDate, scheduled, presence } = req.body;

        const task = await Task.findByIdAndUpdate(
            req.params.id,
            {
                title,
                description,
                quantity,
                status,
                priority,
                startDate,
                endDate,
                scheduled,
                presence,
                updatedAt: Date.now()
            },
            { new: true, runValidators: true }
        ).populate('employe', 'prenom nom');

        if (!task) {
            return res.status(404).json({ message: 'Tâche non trouvée' });
        }

        res.json({ data: task });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete a task
exports.deleteTask = async (req, res) => {
    try {
        const task = await Task.findByIdAndDelete(req.params.id);

        if (!task) {
            return res.status(404).json({ message: 'Tâche non trouvée' });
        }

        res.json({ message: 'Tâche supprimée avec succès' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Schedule a task (create presence and link to task)
exports.scheduleTask = async (req, res) => {
    try {
        const { taskId, date, checkIn, checkOut } = req.body;

        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ message: 'Tâche non trouvée' });
        }

        // Create presence
        const presence = new Presence({
            employe: task.employe,
            date: date || new Date().toISOString().split('T')[0],
            checkIn: checkIn || new Date(),
            checkOut: checkOut || new Date(Date.now() + task.quantity * 60 * 60 * 1000),
            status: 'Present',
            hoursWorked: task.quantity
        });

        await presence.save();

        // Update task
        task.scheduled = true;
        task.presence = presence._id;
        task.startDate = checkIn || new Date();
        task.endDate = checkOut || new Date(Date.now() + task.quantity * 60 * 60 * 1000);
        task.status = 'In Progress';
        await task.save();

        await task.populate('employe', 'prenom nom');

        res.json({ data: task, presence });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get tasks for a specific employee
exports.getEmployeTasks = async (req, res) => {
    try {
        const { employeId } = req.params;
        const { scheduled } = req.query;

        const filter = { employe: employeId };
        if (scheduled !== undefined) filter.scheduled = scheduled === 'true';

        const tasks = await Task.find(filter)
            .populate('employe', 'prenom nom')
            .populate('presence')
            .sort({ createdAt: -1 });

        res.json({ data: tasks });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
