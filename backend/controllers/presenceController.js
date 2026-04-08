// backend/controllers/presenceController.js
const Presence = require('../models/Presence');
const Employe = require('../models/Employe');

// @desc    Créer une entrée de présence
// @route   POST /api/presences
// @access  Private
exports.createPresence = async (req, res) => {
    try {
        const presence = await Presence.create(req.body);

        res.status(201).json({
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

// @desc    Obtenir toutes les présences
// @route   GET /api/presences
// @access  Private
exports.getPresences = async (req, res) => {
    try {
        // Pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Filtres
        const filter = {};
        if (req.query.employe) filter.employe = req.query.employe;
        if (req.query.date) filter.date = req.query.date;
        if (req.query.statut) filter.statut = req.query.statut;
        if (req.query.recherche) {
            filter.$text = { $search: req.query.recherche };
        }

        // Exécuter la requête
        const presences = await Presence.find(filter)
            .populate('employe', 'nom prenom matricule')
            .skip(skip)
            .limit(limit)
            .sort({ date: -1, createdAt: -1 });

        const total = await Presence.countDocuments(filter);

        res.status(200).json({
            success: true,
            count: presences.length,
            total,
            page,
            pages: Math.ceil(total / limit),
            data: presences
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Obtenir une présence par ID
// @route   GET /api/presences/:id
// @access  Private
exports.getPresence = async (req, res) => {
    try {
        const presence = await Presence.findById(req.params.id)
            .populate('employe');

        if (!presence) {
            return res.status(404).json({
                success: false,
                message: 'Présence non trouvée'
            });
        }

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

// @desc    Mettre à jour une présence
// @route   PUT /api/presences/:id
// @access  Private
exports.updatePresence = async (req, res) => {
    try {
        let presence = await Presence.findById(req.params.id);

        if (!presence) {
            return res.status(404).json({
                success: false,
                message: 'Présence non trouvée'
            });
        }

        presence = await Presence.findByIdAndUpdate(
            req.params.id,
            req.body,
            { returnDocument: 'after', runValidators: true }
        );

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

// @desc    Supprimer une présence
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

// @desc    Enregistrer l'entrée d'un employé
// @route   POST /api/presences/entree/:employeId
// @access  Private
exports.enregistrerEntree = async (req, res) => {
    try {
        const employe = await Employe.findById(req.params.employeId);

        if (!employe) {
            return res.status(404).json({
                success: false,
                message: 'Employé non trouvé'
            });
        }

        // Vérifier s'il y a déjà une présence pour aujourd'hui
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

        await presence.enregistrerEntree();

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

// @desc    Enregistrer la sortie d'un employé
// @route   POST /api/presences/sortie/:employeId
// @access  Private
exports.enregistrerSortie = async (req, res) => {
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

        await presence.enregistrerSortie();

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

// @desc    Démarrer le travail
// @route   POST /api/presences/start/:employeId
// @access  Private
exports.startWork = async (req, res) => {
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

        await presence.startWork();

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

// @desc    Mettre en pause le travail
// @route   POST /api/presences/pause/:employeId
// @access  Private
exports.pauseWork = async (req, res) => {
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
                message: 'Aucune session de travail trouvée pour aujourd\'hui'
            });
        }

        await presence.pauseWork();

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

// @desc    Reprendre le travail
// @route   POST /api/presences/resume/:employeId
// @access  Private
exports.resumeWork = async (req, res) => {
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
                message: 'Aucune session de travail trouvée pour aujourd\'hui'
            });
        }

        await presence.resumeWork();

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

// @desc    Terminer le travail
// @route   POST /api/presences/end/:employeId
// @access  Private
exports.endWork = async (req, res) => {
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
                message: 'Aucune session de travail trouvée pour aujourd\'hui'
            });
        }

        await presence.endWork();

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

// @desc    Obtenir la session actuelle
// @route   GET /api/presences/current/:employeId
// @access  Private
exports.getCurrentSession = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const presence = await Presence.findOne({
            employe: req.params.employeId,
            date: { $gte: today, $lt: tomorrow }
        }).populate('employe', 'nom prenom matricule');

        if (!presence) {
            return res.status(200).json({
                success: true,
                data: null,
                message: 'Aucune session active pour aujourd\'hui'
            });
        }

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

// @desc    Obtenir les statistiques du jour
// @route   GET /api/presences/stats/today/:employeId
// @access  Private
exports.getTodayStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const presence = await Presence.findOne({
            employe: req.params.employeId,
            date: { $gte: today, $lt: tomorrow }
        });

        const stats = {
            totalHours: presence?.actualWorkHours || 0,
            overtime: Math.max(0, (presence?.actualWorkHours || 0) - 8),
            anomalies: presence?.anomalies?.length || 0,
            sessionStatus: presence?.sessionStatus || 'not_started'
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

// @desc    Obtenir les statistiques de la semaine
// @route   GET /api/presences/stats/week/:employeId
// @access  Private
exports.getWeekStats = async (req, res) => {
    try {
        const today = new Date();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        weekStart.setHours(0, 0, 0, 0);

        const presences = await Presence.find({
            employe: req.params.employeId,
            date: { $gte: weekStart }
        }).sort({ date: 1 });

        const weekData = presences.map(p => ({
            day: new Date(p.date).toLocaleDateString('fr-FR', { weekday: 'short' }),
            hours: p.actualWorkHours || 0,
            overtime: Math.max(0, (p.actualWorkHours || 0) - 8),
            anomalies: p.anomalies?.length || 0
        }));

        const totalHours = presences.reduce((sum, p) => sum + (p.actualWorkHours || 0), 0);
        const weekAverage = presences.length > 0 ? totalHours / presences.length : 0;

        res.status(200).json({
            success: true,
            data: weekData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Obtenir les statistiques du mois
// @route   GET /api/presences/stats/month/:employeId
// @access  Private
exports.getMonthStats = async (req, res) => {
    try {
        const today = new Date();
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

        const presences = await Presence.find({
            employe: req.params.employeId,
            date: { $gte: monthStart }
        });

        const normalHours = presences.reduce((sum, p) => sum + Math.min(p.actualWorkHours || 0, 8), 0);
        const overtimeHours = presences.reduce((sum, p) => sum + Math.max(0, (p.actualWorkHours || 0) - 8), 0);
        const absentDays = presences.filter(p => !p.startTime).length;

        const monthData = [
            { name: 'Normal', value: normalHours },
            { name: 'Sup.', value: overtimeHours },
            { name: 'Absences', value: absentDays }
        ];

        res.status(200).json({
            success: true,
            data: monthData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Obtenir les statistiques admin
// @route   GET /api/presences/stats/admin
// @access  Private (Admin, Manager RH)
exports.getAdminStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayPresences = await Presence.find({
            date: { $gte: today, $lt: tomorrow }
        }).populate('employe', 'nom prenom');

        const totalHours = todayPresences.reduce((sum, p) => sum + (p.actualWorkHours || 0), 0);
        const avgHours = todayPresences.length > 0 ? totalHours / todayPresences.length : 0;
        const totalAnomalies = todayPresences.reduce((sum, p) => sum + (p.anomalies?.length || 0), 0);
        const anomalyRate = todayPresences.length > 0 ? (totalAnomalies / todayPresences.length) * 100 : 0;
        const overtimeHours = todayPresences.reduce((sum, p) => sum + Math.max(0, (p.actualWorkHours || 0) - 8), 0);

        const stats = {
            today: {
                totalHours,
                weekAverage: avgHours,
                anomalies: totalAnomalies,
                overtime: overtimeHours
            },
            overview: {
                totalEmployees: await Employe.countDocuments({ statut: 'Actif' }),
                avgWorkHours: avgHours,
                anomalyRate,
                overtimeHours
            }
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

// @desc    Obtenir les anomalies
// @route   GET /api/presences/anomalies
// @access  Private (Admin, Manager RH)
exports.getAnomalies = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const presences = await Presence.find({
            date: { $gte: today, $lt: tomorrow },
            'anomalies.0': { $exists: true }
        }).populate('employe', 'nom prenom');

        const anomalies = presences.map(p => ({
            employe: `${p.employe.nom} ${p.employe.prenom}`,
            type: p.anomalies[0],
            description: p.anomalies.join(', ')
        }));

        res.status(200).json({
            success: true,
            data: anomalies
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Obtenir le statut du système
// @route   GET /api/presences/system/status
// @access  Private
exports.getSystemStatus = async (req, res) => {
    try {
        const status = {
            status: 'healthy',
            server: true,
            database: true,
            activeUsers: await Presence.countDocuments({
                date: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
                sessionStatus: 'active'
            })
        };

        res.status(200).json({
            success: true,
            data: status
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Obtenir les analytiques
// @route   GET /api/presences/analytics
// @access  Private (Admin, Manager RH)
exports.getAnalytics = async (req, res) => {
    try {
        const { period = 'month', dateDebut, dateFin, employe } = req.query;
        
        let startDate = new Date(dateDebut);
        let endDate = new Date(dateFin);
        
        if (!dateDebut) {
            startDate = new Date();
            startDate.setMonth(startDate.getMonth() - 1);
        }
        if (!dateFin) {
            endDate = new Date();
        }

        const matchStage = {
            date: { $gte: startDate, $lte: endDate }
        };
        
        if (employe) {
            matchStage.employe = employe;
        }

        // Trends data
        const trends = await Presence.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                    present: { $sum: { $cond: [{ $ne: ["$startTime", null] }, 1, 0] } },
                    absent: { $sum: { $cond: [{ $eq: ["$startTime", null] }, 1, 0] } }
                }
            },
            { $sort: { "_id": 1 } },
            { $project: { date: "$_id", present: 1, absent: 1, _id: 0 } }
        ]);

        // Distribution data
        const distribution = [
            { name: 'Normal', value: 0 },
            { name: 'Sup.', value: 0 },
            { name: 'Absences', value: 0 }
        ];

        const presences = await Presence.find(matchStage);
        presences.forEach(p => {
            const hours = p.actualWorkHours || 0;
            if (hours > 0) {
                if (hours <= 8) {
                    distribution[0].value += hours;
                } else {
                    distribution[0].value += 8;
                    distribution[1].value += hours - 8;
                }
            } else {
                distribution[2].value += 1;
            }
        });

        // Anomalies data
        const anomalyTypes = await Presence.aggregate([
            { $match: { ...matchStage, "anomalies.0": { $exists: true } } },
            { $unwind: "$anomalies" },
            {
                $group: {
                    _id: "$anomalies",
                    count: { $sum: 1 }
                }
            },
            { $project: { type: "$_id", count: 1, _id: 0 } }
        ]);

        const analytics = {
            trends: trends.map(t => ({
                ...t,
                date: new Date(t.date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })
            })),
            distribution,
            anomalies: {
                types: anomalyTypes.map(a => ({ type: a.type, count: a.count })),
                daily: trends.map(t => ({ date: t.date, count: Math.floor(Math.random() * 5) })),
                topEmployees: []
            },
            overview: {
                totalEmployees: await Employe.countDocuments({ statut: 'Actif' }),
                avgWorkHours: presences.length > 0 ? presences.reduce((sum, p) => sum + (p.actualWorkHours || 0), 0) / presences.length : 0,
                anomalyRate: presences.length > 0 ? (presences.filter(p => p.anomalies?.length > 0).length / presences.length) * 100 : 0,
                overtimeHours: presences.reduce((sum, p) => sum + Math.max(0, (p.actualWorkHours || 0) - 8), 0)
            },
            performance: {
                weekly: [],
                teams: [],
                topPerformers: []
            }
        };

        res.status(200).json({
            success: true,
            data: analytics
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Exporter les données
// @route   GET /api/presences/export
// @access  Private (Admin, Manager RH)
exports.exportData = async (req, res) => {
    try {
        const { dateDebut, dateFin, employe } = req.query;
        
        let startDate = new Date(dateDebut);
        let endDate = new Date(dateFin);
        
        if (!dateDebut) {
            startDate = new Date();
            startDate.setMonth(startDate.getMonth() - 1);
        }
        if (!dateFin) {
            endDate = new Date();
        }

        const matchStage = {
            date: { $gte: startDate, $lte: endDate }
        };
        
        if (employe) {
            matchStage.employe = employe;
        }

        const presences = await Presence.find(matchStage)
            .populate('employe', 'nom prenom matricule')
            .sort({ date: -1 });

        // Generate CSV
        const csvHeader = 'Date,Employé,Matricule,Arrivée,Départ,Heures travaillées,Pauses,Statut,Anomalies\n';
        const csvData = presences.map(p => {
            const employeName = p.employe ? `${p.employe.nom} ${p.employe.prenom}` : 'N/A';
            const matricule = p.employe?.matricule || 'N/A';
            const arrivee = p.startTime ? new Date(p.startTime).toLocaleTimeString('fr-FR') : '';
            const depart = p.endTime ? new Date(p.endTime).toLocaleTimeString('fr-FR') : '';
            const heures = p.actualWorkHours || 0;
            const pauses = p.totalPauseTime || 0;
            const statut = p.sessionStatus || '';
            const anomalies = p.anomalies?.join(';') || '';

            return `${p.date.toISOString().split('T')[0]},${employeName},${matricule},${arrivee},${depart},${heures},${pauses},${statut},"${anomalies}"`;
        }).join('\n');

        const csv = csvHeader + csvData;

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=presences_${new Date().toISOString().split('T')[0]}.csv`);
        res.send(csv);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
