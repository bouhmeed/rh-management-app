const Task = require('../models/Task');
const Employe = require('../models/Employe');
const Presence = require('../models/Presence');
const moment = require('moment');

// Create a new task
exports.createTask = async (req, res) => {
    try {
        console.log('Creating task with body:', req.body);
        console.log('User:', req.user);

        const { titre, description, employeAssigne, categorie, priorite, dateDebut, dateFin, heureDebut, heureFin, dureeEstimee, couleur } = req.body;

        // Verify employe exists
        const employeExists = await Employe.findById(employeAssigne);
        if (!employeExists) {
            console.log('Employé not found:', employeAssigne);
            return res.status(404).json({ message: 'Employé non trouvé' });
        }

        const task = new Task({
            titre,
            description,
            employeAssigne,
            categorie,
            priorite: priorite || 'Moyenne',
            dateDebut,
            dateFin,
            heureDebut: heureDebut || '08:00',
            heureFin: heureFin || '09:00',
            dureeEstimee: dureeEstimee || 8,
            couleur,
            createur: req.user?._id
        });

        await task.save();
        console.log('Task saved with employeAssigne:', task.employeAssigne);
        await task.populate('employeAssigne', 'prenom nom');
        console.log('Task after populate:', task);

        res.status(201).json({ data: task });
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get all tasks
exports.getTasks = async (req, res) => {
    try {
        const { employeAssigne, statut } = req.query;
        console.log('getTasks called with query:', req.query);

        const filter = {};
        if (employeAssigne) {
            // Convert to ObjectId for proper comparison
            const mongoose = require('mongoose');
            filter.employeAssigne = new mongoose.Types.ObjectId(employeAssigne);
        }
        if (statut) filter.statut = statut;

        console.log('Filter:', filter);
        const tasks = await Task.find(filter)
            .populate('employeAssigne', 'prenom nom')
            .populate('createur', 'email')
            .sort({ dateCreation: -1 });

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
            .populate('employeAssigne', 'prenom nom')
            .populate('createur', 'email');

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
        const { titre, description, categorie, priorite, statut, dateDebut, dateFin, dureeEstimee, couleur, progression } = req.body;

        const task = await Task.findByIdAndUpdate(
            req.params.id,
            {
                titre,
                description,
                categorie,
                priorite,
                statut,
                dateDebut,
                dateFin,
                dureeEstimee,
                couleur,
                progression,
                dateModification: Date.now()
            },
            { new: true, runValidators: true }
        ).populate('employeAssigne', 'prenom nom');

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
        const { date, checkIn, checkOut, description } = req.body;
        const taskId = req.params.id;

        console.log('Schedule task request body:', { date, checkIn, checkOut, taskId, description });

        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ message: 'Tâche non trouvée' });
        }

        // Convert checkIn and checkOut to Date objects if they are strings
        const checkInDate = checkIn ? new Date(checkIn) : new Date();
        const checkOutDate = checkOut ? new Date(checkOut) : new Date(Date.now() + task.dureeEstimee * 60 * 60 * 1000);

        console.log('Parsed dates:', { checkInDate, checkOutDate });

        // Calculate actual hours worked based on checkIn and checkOut
        const hoursWorked = (checkOutDate - checkInDate) / (1000 * 60 * 60);

        console.log('Hours worked calculated:', hoursWorked);

        // Create presence with parentTaskId and description
        const presence = new Presence({
            employe: task.employeAssigne,
            date: date || new Date().toISOString().split('T')[0],
            checkIn: checkInDate,
            checkOut: checkOutDate,
            status: 'Present',
            hoursWorked: hoursWorked,
            parentTaskId: taskId,
            description: description || ''
        });

        await presence.save();

        console.log('Presence saved:', presence);

        // Do NOT update task status - keep it in budget tasks list
        // The task remains as a main task that can have multiple sub-tasks

        console.log('Populating task employeAssigne...');
        await task.populate('employeAssigne', 'prenom nom');
        console.log('Task populated:', task);

        console.log('Sending response...');
        res.json({ data: task, presence });
    } catch (error) {
        console.error('Error in scheduleTask:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get tasks for a specific employee
exports.getEmployeTasks = async (req, res) => {
    try {
        const { employeId } = req.params;
        const { statut } = req.query;

        const filter = { employeAssigne: employeId };
        if (statut) filter.statut = statut;

        const tasks = await Task.find(filter)
            .populate('employeAssigne', 'prenom nom')
            .populate('createur', 'email')
            .sort({ dateCreation: -1 });

        res.json({ data: tasks });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
