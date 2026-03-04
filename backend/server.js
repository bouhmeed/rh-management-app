// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Import des routes
const authRoutes = require('./routes/authRoutes');
const employeRoutes = require('./routes/employeRoutes');
const congeRoutes = require('./routes/congeRoutes');
const departementRoutes = require('./routes/departementRoutes');
const presenceRoutes = require('./routes/presenceRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connexion à MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('✅ Connecté à MongoDB avec succès!');
        // Initialiser les rôles par défaut
        return initialiserRoles();
    })
    .catch(err => {
        console.error('❌ Erreur de connexion à MongoDB:', err);
        process.exit(1);
    });

// Fonction pour initialiser les rôles par défaut
async function initialiserRoles() {
    try {
        const Role = require('./models/Role');
        
        const rolesParDefaut = [
            { 
                nomRole: 'Admin', 
                description: 'Administrateur système',
                permissions: ['create_employee', 'read_employee', 'update_employee', 'delete_employee',
                            'manage_leave', 'manage_contract', 'manage_payroll', 'view_reports']
            },
            { 
                nomRole: 'Manager RH', 
                description: 'Manager des ressources humaines',
                permissions: ['create_employee', 'read_employee', 'update_employee', 
                            'manage_leave', 'manage_contract', 'view_reports']
            },
            { 
                nomRole: 'Manager', 
                description: 'Manager de département',
                permissions: ['read_employee', 'manage_leave']
            },
            { 
                nomRole: 'Employé', 
                description: 'Employé standard',
                permissions: ['read_employee']
            }
        ];

        // Vérifier si les rôles existent déjà
        for (const role of rolesParDefaut) {
            const roleExistant = await Role.findOne({ nomRole: role.nomRole });
            if (!roleExistant) {
                await Role.create(role);
                console.log(`✅ Rôle créé: ${role.nomRole}`);
            }
        }

        console.log('✅ Rôles initialisés avec succès!');
        
        // Créer un admin par défaut si aucun utilisateur n'existe
        const Utilisateur = require('./models/Utilisateur');
        const adminCount = await Utilisateur.countDocuments();
        
        if (adminCount === 0) {
            const adminRole = await Role.findOne({ nomRole: 'Admin' });
            if (adminRole) {
                const bcrypt = require('bcryptjs');
                const hashedPassword = bcrypt.hashSync('admin123', 10);
                
                await Utilisateur.create({
                    email: 'admin@rh.com',
                    motDePasse: hashedPassword,
                    role: adminRole._id
                });
                console.log('✅ Admin par défaut créé (email: admin@rh.com, mot de passe: admin123)');
            }
        }
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error.message);
        console.error('❌ Stack trace:', error.stack);
    }
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/employes', employeRoutes);
app.use('/api/conges', congeRoutes);
app.use('/api/departements', departementRoutes);
app.use('/api/presences', presenceRoutes);

// Route de test
app.get('/', (req, res) => {
    res.json({
        message: '🚀 API Gestion RH opérationnelle!',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            employes: '/api/employes',
            conges: '/api/conges',
            departements: '/api/departements',
            presences: '/api/presences'
        }
    });
});

// Gestion des erreurs 404
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route non trouvée: ${req.method} ${req.originalUrl}`
    });
});

// Démarrage du serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ Serveur démarré sur le port ${PORT}`);
});