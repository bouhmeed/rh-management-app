// backend/models/Presence.js
const mongoose = require('mongoose');

const pauseSchema = new mongoose.Schema({
    start: { type: Date, required: true },
    end: { type: Date },
    duration: { type: Number, default: 0 } // in minutes
});

const presenceSchema = new mongoose.Schema({
    employe: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employe',
        required: true
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    sessionStatus: {
        type: String,
        enum: ['not_started', 'active', 'paused', 'ended'],
        default: 'not_started'
    },
    startTime: Date,
    pauses: [pauseSchema],
    endTime: Date,
    totalPauseTime: { type: Number, default: 0 }, // in minutes
    actualWorkHours: { type: Number, default: 0 }, // in hours
    anomalies: [String],
    note: String
}, {
    timestamps: true
});

// Index composé unique pour éviter les doublons par employé/date
presenceSchema.index({ employe: 1, date: 1 }, { unique: true });

// Méthodes
presenceSchema.methods.startWork = function() {
    const now = new Date();
    if (this.sessionStatus === 'not_started') {
        this.startTime = now;
        this.sessionStatus = 'active';
        this.date = now;
        return this.save();
    }
    throw new Error('Session already started');
};

presenceSchema.methods.pauseWork = function() {
    if (this.sessionStatus === 'active') {
        this.pauses.push({ start: new Date() });
        this.sessionStatus = 'paused';
        return this.save();
    }
    throw new Error('Cannot pause: session not active');
};

presenceSchema.methods.resumeWork = function() {
    if (this.sessionStatus === 'paused') {
        const lastPause = this.pauses[this.pauses.length - 1];
        if (lastPause && !lastPause.end) {
            lastPause.end = new Date();
            lastPause.duration = (lastPause.end - lastPause.start) / (1000 * 60); // minutes
            this.totalPauseTime += lastPause.duration;
            this.sessionStatus = 'active';
            return this.save();
        }
    }
    throw new Error('Cannot resume: no active pause');
};

presenceSchema.methods.endWork = function() {
    if (this.sessionStatus === 'active' || this.sessionStatus === 'paused') {
        // End any ongoing pause
        if (this.sessionStatus === 'paused') {
            this.resumeWork();
        }
        this.endTime = new Date();
        this.sessionStatus = 'ended';
        
        // Calculate actual work hours
        const totalTime = (this.endTime - this.startTime) / (1000 * 60 * 60); // hours
        this.actualWorkHours = Math.max(0, totalTime - (this.totalPauseTime / 60));
        
        // Detect anomalies
        this.detectAnomalies();
        
        return this.save();
    }
    throw new Error('Cannot end: session not active');
};

presenceSchema.methods.detectAnomalies = function() {
    this.anomalies = [];
    
    if (this.startTime) {
        const startHour = this.startTime.getHours();
        if (startHour > 9) { // Assuming 9 AM start
            this.anomalies.push('Arrivée tardive');
        }
    }
    
    if (this.endTime) {
        const endHour = this.endTime.getHours();
        if (endHour < 17) { // Assuming 5 PM end
            this.anomalies.push('Départ anticipé');
        }
    }
    
    if (this.actualWorkHours < 7) { // Assuming 8 hours - 1 hour break
        this.anomalies.push('Heures insuffisantes');
    } else if (this.actualWorkHours > 9) {
        this.anomalies.push('Heures supplémentaires');
    }
    
    if (this.totalPauseTime > 120) { // More than 2 hours pause
        this.anomalies.push('Pauses excessives');
    }
};

module.exports = mongoose.model('Presence', presenceSchema);
