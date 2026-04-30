// backend/controllers/paieController.js
const Paie = require('../models/Paie');
const Employe = require('../models/Employe');
const Contrat = require('../models/Contrat');

// @desc    Récupérer toutes les paies
// @route   GET /api/paies
// @access  Private (Admin, Manager RH, Manager)
exports.getAllPaies = async (req, res) => {
    try {
        const { mois, statut, employe } = req.query;
        let query = {};
        
        // Filtrage
        if (mois) query.mois = mois;
        if (statut) query.statut = statut;
        if (employe) query.employe = employe;

        const paies = await Paie.find(query)
            .populate('employe', 'nom prenom email matricule')
            .populate('contrat')
            .sort({ mois: -1, createdAt: -1 });

        res.status(200).json({
            success: true,
            count: paies.length,
            data: paies
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des paies',
            error: error.message
        });
    }
};

// @desc    Récupérer les paies de l'employé connecté
// @route   GET /api/paies/my-paies
// @access  Private (Employé)
exports.getMyPaies = async (req, res) => {
    try {
        const mongoose = require('mongoose');
        const Employe = require('../models/Employe');
        
        // Récupérer l'employé connecté
        const employe = await Employe.findOne({ 
            utilisateur: new mongoose.Types.ObjectId(req.utilisateur._id) 
        });
        
        if (!employe) {
            return res.status(404).json({
                success: false,
                message: 'Employé non trouvé'
            });
        }

        const { mois, statut } = req.query;
        let query = { employe: employe._id };
        
        if (mois) query.mois = mois;
        if (statut) query.statut = statut;

        const paies = await Paie.find(query)
            .populate('employe', 'nom prenom email matricule')
            .populate('contrat')
            .sort({ mois: -1, createdAt: -1 });

        res.status(200).json({
            success: true,
            count: paies.length,
            data: paies
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des paies',
            error: error.message
        });
    }
};

// @desc    Récupérer une paie par ID
// @route   GET /api/paies/:id
// @access  Private
exports.getPaieById = async (req, res) => {
    try {
        const paie = await Paie.findById(req.params.id)
            .populate('employe', 'nom prenom email matricule departement')
            .populate('contrat');

        if (!paie) {
            return res.status(404).json({
                success: false,
                message: 'Paie non trouvée'
            });
        }

        // Vérifier les autorisations
        const userRole = req.utilisateur.role.nomRole;
        const mongoose = require('mongoose');
        const Employe = require('../models/Employe');
        
        if (userRole === 'Employé') {
            const employe = await Employe.findOne({ 
                utilisateur: new mongoose.Types.ObjectId(req.utilisateur._id) 
            });
            
            if (!employe._id.equals(paie.employe._id)) {
                return res.status(403).json({
                    success: false,
                    message: 'Accès non autorisé'
                });
            }
        }

        res.status(200).json({
            success: true,
            data: paie
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération de la paie',
            error: error.message
        });
    }
};

// @desc    Créer une paie
// @route   POST /api/paies
// @access  Private (Admin, Manager RH)
exports.createPaie = async (req, res) => {
    try {
        const paieData = req.body;

        // Vérifier si une paie existe déjà pour cet employé et ce mois
        const existingPaie = await Paie.findOne({
            employe: paieData.employe,
            mois: paieData.mois
        });

        if (existingPaie) {
            return res.status(400).json({
                success: false,
                message: 'Une paie existe déjà pour cet employé ce mois-ci'
            });
        }

        // Si contrat n'est pas fourni, récupérer le contrat actif de l'employé
        if (!paieData.contrat) {
            const contrat = await Contrat.findOne({
                employe: paieData.employe,
                statut: 'Actif'
            }).sort({ dateDebut: -1 });

            if (!contrat) {
                return res.status(400).json({
                    success: false,
                    message: 'Aucun contrat actif trouvé pour cet employé'
                });
            }

            paieData.contrat = contrat._id;
        }

        // Calculer le salaire automatiquement
        const paie = new Paie(paieData);
        await paie.calculerSalaire();

        await paie.save();

        const populatedPaie = await Paie.findById(paie._id)
            .populate('employe', 'nom prenom email matricule')
            .populate('contrat');

        res.status(201).json({
            success: true,
            message: 'Paie créée avec succès',
            data: populatedPaie
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Erreur lors de la création de la paie',
            error: error.message
        });
    }
};

// @desc    Mettre à jour une paie
// @route   PUT /api/paies/:id
// @access  Private (Admin, Manager RH)
exports.updatePaie = async (req, res) => {
    try {
        let paie = await Paie.findById(req.params.id);

        if (!paie) {
            return res.status(404).json({
                success: false,
                message: 'Paie non trouvée'
            });
        }

        // Mettre à jour les données
        Object.assign(paie, req.body);
        
        // Recalculer le salaire
        await paie.calculerSalaire();
        
        await paie.save();
        
        const updatedPaie = await Paie.findById(paie._id)
            .populate('employe', 'nom prenom email matricule')
            .populate('contrat');
        
        res.status(200).json({
            success: true,
            message: 'Paie mise à jour avec succès',
            data: updatedPaie
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Erreur lors de la mise à jour de la paie',
            error: error.message
        });
    }
};

// @desc    Supprimer une paie
// @route   DELETE /api/paies/:id
// @access  Private (Admin, Manager RH)
exports.deletePaie = async (req, res) => {
    try {
        const paie = await Paie.findById(req.params.id);

        if (!paie) {
            return res.status(404).json({
                success: false,
                message: 'Paie non trouvée'
            });
        }

        // Vérifier si la paie est déjà payée
        if (paie.statut === 'Payé') {
            return res.status(400).json({
                success: false,
                message: 'Impossible de supprimer une paie déjà payée'
            });
        }

        await paie.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Paie supprimée avec succès'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression de la paie',
            error: error.message
        });
    }
};

// @desc    Valider une paie
// @route   PUT /api/paies/:id/valider
// @access  Private (Admin, Manager RH)
exports.validerPaie = async (req, res) => {
    try {
        const paie = await Paie.findById(req.params.id);

        if (!paie) {
            return res.status(404).json({
                success: false,
                message: 'Paie non trouvée'
            });
        }

        if (paie.statut !== 'Brouillon') {
            return res.status(400).json({
                success: false,
                message: 'Seules les paies en brouillon peuvent être validées'
            });
        }

        paie.statut = 'Validé';
        await paie.save();

        const updatedPaie = await Paie.findById(paie._id)
            .populate('employe', 'nom prenom email matricule')
            .populate('contrat');
        
        res.status(200).json({
            success: true,
            message: 'Paie validée avec succès',
            data: updatedPaie
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Erreur lors de la validation de la paie',
            error: error.message
        });
    }
};

// @desc    Marquer une paie comme payée
// @route   PUT /api/paies/:id/payer
// @access  Private (Admin, Manager RH)
exports.payerPaie = async (req, res) => {
    try {
        const paie = await Paie.findById(req.params.id);

        if (!paie) {
            return res.status(404).json({
                success: false,
                message: 'Paie non trouvée'
            });
        }

        if (paie.statut !== 'Validé') {
            return res.status(400).json({
                success: false,
                message: 'Seules les paies validées peuvent être payées'
            });
        }

        paie.statut = 'Payé';
        paie.datePaiement = new Date();
        await paie.save();

        const updatedPaie = await Paie.findById(paie._id)
            .populate('employe', 'nom prenom email matricule')
            .populate('contrat');
        
        res.status(200).json({
            success: true,
            message: 'Paie marquée comme payée avec succès',
            data: updatedPaie
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Erreur lors du paiement de la paie',
            error: error.message
        });
    }
};

// @desc    Générer la paie en masse pour tous les employés
// @route   POST /api/paies/generate-bulk
// @access  Private (Admin, Manager RH)
exports.generateBulkPaie = async (req, res) => {
    try {
        const { mois, includeAll = true } = req.body;

        console.log('Génération de paie en masse pour mois:', mois);

        if (!mois) {
            return res.status(400).json({
                success: false,
                message: 'Le mois est requis (format: YYYY-MM)'
            });
        }

        // Validate month format
        if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(mois)) {
            return res.status(400).json({
                success: false,
                message: 'Format mois invalide (YYYY-MM)'
            });
        }

        // Get all active employees
        const employees = await Employe.find({ statut: 'Actif' });
        console.log('Employés actifs trouvés:', employees.length);

        if (employees.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Aucun employé actif trouvé'
            });
        }

        const results = {
            generated: [],
            skipped: [],
            errors: []
        };

        for (const employe of employees) {
            console.log('Traitement employé:', employe.nom, employe.prenom);
            try {
                // Check if payroll already exists for this employee and month
                const existingPaie = await Paie.findOne({
                    employe: employe._id,
                    mois: mois
                });
                
                if (existingPaie) {
                    results.skipped.push({
                        employee: `${employe.nom} ${employe.prenom}`,
                        reason: 'Payroll already exists for this month'
                    });
                    continue;
                }
                
                // Get active contract
                const contrat = await Contrat.findOne({
                    employe: employe._id,
                    statut: 'Actif'
                }).sort({ dateDebut: -1 });

                console.log('Contrat trouvé pour', employe.nom, ':', contrat ? 'OUI' : 'NON');

                if (!contrat) {
                    console.log('Aucun contrat actif trouvé pour', employe.nom);
                    results.skipped.push({
                        employee: `${employe.nom} ${employe.prenom}`,
                        reason: 'No active contract found'
                    });
                    continue;
                }
                
                // Create payroll with template defaults
                const paieData = {
                    employe: employe._id,
                    contrat: contrat._id,
                    mois: mois,
                    montant: 0, // Will be calculated
                    primes: [],
                    deductions: [],
                    heuresSupplementaires: {
                        heures: 0,
                        taux: 0
                    },
                    statut: 'Brouillon'
                };

                // Apply contract template if available
                if (contrat.payrollTemplate) {
                    const template = contrat.payrollTemplate;

                    // Add recurring primes from template
                    if (template.defaultPrimes && template.defaultPrimes.length > 0) {
                        template.defaultPrimes.forEach(prime => {
                            if (prime.recurring) {
                                paieData.primes.push({
                                    type: prime.type,
                                    montant: prime.montant
                                });
                            }
                        });
                    }

                    // Add recurring deductions from template
                    if (template.defaultDeductions && template.defaultDeductions.length > 0) {
                        template.defaultDeductions.forEach(ded => {
                            if (ded.recurring) {
                                paieData.deductions.push({
                                    type: ded.type,
                                    montant: ded.montant
                                });
                            }
                        });
                    }
                }
                
                // Create and calculate payroll
                const paie = new Paie(paieData);
                await paie.calculerSalaire();
                await paie.save();
                
                const populatedPaie = await Paie.findById(paie._id)
                    .populate('employe', 'nom prenom email matricule')
                    .populate('contrat');
                
                results.generated.push(populatedPaie);
                
            } catch (error) {
                results.errors.push({
                    employee: `${employe.nom} ${employe.prenom}`,
                    error: error.message
                });
            }
        }
        
        res.status(200).json({
            success: true,
            message: 'Génération de paie en masse terminée',
            summary: {
                generated: results.generated.length,
                skipped: results.skipped.length,
                errors: results.errors.length,
                total: employees.length
            },
            data: results
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la génération de paie en masse',
            error: error.message
        });
    }
};

// @desc    Ajouter un ajustement à une paie
// @route   POST /api/paies/:id/adjustments
// @access  Private (Admin, Manager RH)
exports.addAdjustment = async (req, res) => {
    try {
        const paie = await Paie.findById(req.params.id);

        if (!paie) {
            return res.status(404).json({
                success: false,
                message: 'Paie non trouvée'
            });
        }

        if (paie.statut === 'Payé') {
            return res.status(400).json({
                success: false,
                message: 'Impossible d\'ajuster une paie déjà payée'
            });
        }

        const { type, montant, description } = req.body;

        if (!type || montant === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Type et montant sont requis'
            });
        }

        const adjustment = {
            type,
            montant,
            description,
            addedBy: req.user._id,
            addedAt: new Date()
        };

        paie.adjustments.push(adjustment);
        
        // Recalculate salary with new adjustment
        await paie.calculerSalaire();
        await paie.save();

        const updatedPaie = await Paie.findById(paie._id)
            .populate('employe', 'nom prenom email matricule')
            .populate('contrat');

        res.status(200).json({
            success: true,
            message: 'Ajustement ajouté avec succès',
            data: updatedPaie
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Erreur lors de l\'ajout de l\'ajustement',
            error: error.message
        });
    }
};

// @desc    Supprimer un ajustement d'une paie
// @route   DELETE /api/paies/:id/adjustments/:adjustmentId
// @access  Private (Admin, Manager RH)
exports.removeAdjustment = async (req, res) => {
    try {
        const paie = await Paie.findById(req.params.id);

        if (!paie) {
            return res.status(404).json({
                success: false,
                message: 'Paie non trouvée'
            });
        }

        if (paie.statut === 'Payé') {
            return res.status(400).json({
                success: false,
                message: 'Impossible de modifier une paie déjà payée'
            });
        }

        const adjustmentId = req.params.adjustmentId;
        paie.adjustments = paie.adjustments.filter(adj => adj._id.toString() !== adjustmentId);
        
        // Recalculate salary without the adjustment
        await paie.calculerSalaire();
        await paie.save();

        const updatedPaie = await Paie.findById(paie._id)
            .populate('employe', 'nom prenom email matricule')
            .populate('contrat');

        res.status(200).json({
            success: true,
            message: 'Ajustement supprimé avec succès',
            data: updatedPaie
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Erreur lors de la suppression de l\'ajustement',
            error: error.message
        });
    }
};
