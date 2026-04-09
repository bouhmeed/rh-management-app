// backend/models/Presence.js
const mongoose = require('mongoose');

const presenceSchema = new mongoose.Schema({
    employe: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employe',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    checkIn: {
        type: Date,
        default: null
    },
    checkOut: {
        type: Date,
        default: null
    },
    status: {
        type: String,
        enum: ['Present', 'Absent', 'Late'],
        default: 'Absent'
    },
    hoursWorked: {
        type: Number,
        default: 0
    },
    note: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

// Index composé unique pour éviter les doublons par employé/date
presenceSchema.index({ employe: 1, date: 1 }, { unique: true });

// Méthode pour clock in
presenceSchema.methods.clockIn = function() {
    const now = new Date();
    this.checkIn = now;
    this.status = 'Present';
    
    // Set date to today (without time)
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    this.date = today;
    
    return this.save();
};

// Méthode pour clock out
presenceSchema.methods.clockOut = function() {
    const now = new Date();
    this.checkOut = now;
    
    // Calculate hours worked
    if (this.checkIn) {
        const diffMs = now - this.checkIn;
        this.hoursWorked = Math.round(diffMs / (1000 * 60 * 60) * 100) / 100; // hours with 2 decimals
    }
    
    // Determine if late (arrived after 9 AM)
    if (this.checkIn && this.checkIn.getHours() >= 9) {
        this.status = 'Late';
    }
    
    return this.save();
};

// Méthode pour marquer manuellement (admin)
presenceSchema.methods.markAttendance = function(status, note = '') {
    this.status = status;
    if (note) {
        this.note = note;
    }
    return this.save();
};

module.exports = mongoose.model('Presence', presenceSchema);
