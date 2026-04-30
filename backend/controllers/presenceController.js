// backend/controllers/presenceController.js
const Presence = require('../models/Presence');
const Employe = require('../models/Employe');

// @desc    Clock in
// @route   POST /api/presences/clock-in/:employeId
// @access  Private
exports.clockIn = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        let presence = await Presence.findOne({
            employe: req.params.employeId,
            date: { $gte: today, $lt: tomorrow }
        });

        if (!presence) {
            presence = new Presence({ employe: req.params.employeId });
        }

        await presence.clockIn();
        await presence.populate('employe', 'prenom nom');

        res.status(200).json({
            success: true,
            data: presence
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Clock out
// @route   POST /api/presences/clock-out/:employeId
// @access  Private
exports.clockOut = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const presence = await Presence.findOne({
            employe: req.params.employeId,
            date: { $gte: today, $lt: tomorrow }
        });

        if (!presence) {
            return res.status(404).json({
                success: false,
                message: 'Aucune présence trouvée pour aujourd\'hui'
            });
        }

        await presence.clockOut();
        await presence.populate('employe', 'prenom nom');

        res.status(200).json({
            success: true,
            data: presence
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get today's presence for employee
// @route   GET /api/presences/today/:employeId
// @access  Private
exports.getTodayPresence = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const presence = await Presence.findOne({
            employe: req.params.employeId,
            date: { $gte: today, $lt: tomorrow }
        }).populate('employe', 'prenom nom');

        res.status(200).json({
            success: true,
            data: presence
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Mark attendance (admin)
// @route   POST /api/presences/mark/:id
// @access  Private (Admin, Manager RH)
exports.markAttendance = async (req, res) => {
    try {
        const { status, note } = req.body;

        const presence = await Presence.findById(req.params.id);

        if (!presence) {
            return res.status(404).json({
                success: false,
                message: 'Présence non trouvée'
            });
        }

        await presence.markAttendance(status, note);

        res.status(200).json({
            success: true,
            data: presence
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get all presences
// @route   GET /api/presences
// @access  Private
exports.getPresences = async (req, res) => {
    try {
        const filter = {};
        if (req.query.employe) filter.employe = req.query.employe;
        if (req.query.date) {
            const date = new Date(req.query.date);
            const today = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            filter.date = { $gte: today, $lt: tomorrow };
        }
        if (req.query.status) filter.status = req.query.status;

        const presences = await Presence.find(filter)
            .populate('employe', 'nom prenom matricule')
            .sort({ date: -1 });

        res.status(200).json({
            success: true,
            data: presences
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get presence stats
// @route   GET /api/presences/stats
// @access  Private
exports.getStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayPresences = await Presence.find({
            date: { $gte: today, $lt: tomorrow }
        }).populate('employe', 'nom prenom');

        const present = todayPresences.filter(p => p.status === 'Present').length;
        const absent = todayPresences.filter(p => p.status === 'Absent').length;
        const late = todayPresences.filter(p => p.status === 'Late').length;

        const stats = {
            present,
            absent,
            late,
            total: todayPresences.length
        };

        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Delete a presence
// @route   DELETE /api/presences/:id
// @access  Private
exports.deletePresence = async (req, res) => {
    try {
        const presence = await Presence.findById(req.params.id);

        if (!presence) {
            return res.status(404).json({
                success: false,
                message: 'Présence non trouvée'
            });
        }

        await Presence.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Présence supprimée avec succès'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update a presence
// @route   PUT /api/presences/:id
// @access  Private
exports.updatePresence = async (req, res) => {
    try {
        const presence = await Presence.findById(req.params.id);

        if (!presence) {
            return res.status(404).json({
                success: false,
                message: 'Présence non trouvée'
            });
        }

        const updatedPresence = await Presence.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('employe', 'prenom nom');

        res.status(200).json({
            success: true,
            data: updatedPresence
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
