// backend/models/Role.js
const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
    nomRole: {
        type: String,
        required: [true, 'Le nom du rôle est requis'],
        unique: true,
        enum: ['Admin', 'Manager RH', 'Manager', 'Employé'],
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    permissions: [{
        type: String,
        enum: ['create_employee', 'read_employee', 'update_employee', 'delete_employee',
               'manage_leave', 'manage_contract', 'manage_payroll', 'view_reports']
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Role', roleSchema);