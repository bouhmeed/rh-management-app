const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    employe: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employe',
        required: true
    },
    quantity: {
        type: Number,
        default: 8,
        min: 0
    },
    status: {
        type: String,
        enum: ['Open', 'In Progress', 'Completed', 'Cancelled'],
        default: 'Open'
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Medium'
    },
    startDate: {
        type: Date
    },
    endDate: {
        type: Date
    },
    scheduled: {
        type: Boolean,
        default: false
    },
    presence: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Presence'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Utilisateur'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

taskSchema.pre('save', async function() {
    this.updatedAt = Date.now();
});

module.exports = mongoose.model('Task', taskSchema);
