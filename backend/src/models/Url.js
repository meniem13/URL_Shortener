const mongoose = require('mongoose');

const urlSchema = new mongoose.Schema({
    shortCode: {
        type: String,
        required: true,
        unique: true,
    },
    longUrl: {
        type: String,
        required: true,
    },
    expiresAt: {
        type: Date,
        default: null,
    }
}, {
    timestamps: true
});

// TTL Index for auto-deletion of expired links
// If expiresAt is null, the document won't be deleted.
urlSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Url', urlSchema);
