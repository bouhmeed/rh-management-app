// backend/controllers/departementController.js
const Departement = require('../models/Departement');

// @desc    Créer un département
// @route   POST /api/departements
// @access  Private (Admin, Manager RH)
const createDepartement = async (req, res) => {
    try {
        const departement = await Departement.create(req.body);
        res.status(201).json({
            success: true,
            data: departement
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Obtenir tous les départements
// @route   GET /api/departements
// @access  Private
const getDepartements = async (req, res) => {
    try {
        const departements = await Departement.find()
            .populate('responsable', 'nom prenom')
            .populate('employes', 'nom prenom matricule');
        
        res.status(200).json({
            success: true,
            count: departements.length,
            data: departements
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Ajouter un employé à un département
// @route   POST /api/departements/:id/employes/:employeId
// @access  Private (Admin, Manager RH)
const addEmployeToDepartement = async (req, res) => {
    try {
        const departement = await Departement.findById(req.params.id);
        
        if (!departement) {
            return res.status(404).json({
                success: false,
                message: 'Département non trouvé'
            });
        }

        await departement.ajouterEmploye(req.params.employeId);

        res.status(200).json({
            success: true,
            data: departement
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Modifier un département
// @route   PUT /api/departements/:id
// @access  Private (Admin, Manager RH)
const updateDepartement = async (req, res) => {
    try {
        const departement = await Departement.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!departement) {
            return res.status(404).json({
                success: false,
                message: 'Département non trouvé'
            });
        }

        res.status(200).json({
            success: true,
            data: departement
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Supprimer un département
// @route   DELETE /api/departements/:id
// @access  Private (Admin)
const deleteDepartement = async (req, res) => {
    try {
        const departement = await Departement.findById(req.params.id);

        if (!departement) {
            return res.status(404).json({
                success: false,
                message: 'Département non trouvé'
            });
        }

        await departement.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    createDepartement,
    getDepartements,
    addEmployeToDepartement,
    updateDepartement,
    deleteDepartement
};
