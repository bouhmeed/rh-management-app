const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Create task (Admin/Manager RH only)
router.post('/', authorize('Admin', 'Manager RH'), taskController.createTask);

// Get all tasks
router.get('/', taskController.getTasks);

// Get tasks for a specific employee
router.get('/employe/:employeId', taskController.getEmployeTasks);

// Get single task
router.get('/:id', taskController.getTask);

// Update task
router.put('/:id', authorize('Admin', 'Manager RH'), taskController.updateTask);

// Delete task (Admin/Manager RH only)
router.delete('/:id', authorize('Admin', 'Manager RH'), taskController.deleteTask);

// Schedule a task (any authenticated user can schedule)
router.post('/:id/schedule', taskController.scheduleTask);

module.exports = router;
