const Url = require('../models/Url');
const generateCode = require('../utils/generateCode');
const redisClient = require('../config/redis');

// Regex to validate custom alias
const aliasRegex = /^[a-zA-Z0-9-_]{3,20}$/;
const reservedKeywords = ['api', 'login', 'admin', 'register', 'dashboard', 'auth'];

// Helper to validate URL
const isValidHttpUrl = (string) => {
    let url;
    try {
        url = new URL(string);
    } catch (_) {
        return false;
    }
    return url.protocol === "http:" || url.protocol === "https:";
};

exports.shortenUrl = async (req, res, next) => {
    try {
        const { originalUrl, customCode, expiryMinutes } = req.body;

        if (!originalUrl || !isValidHttpUrl(originalUrl)) {
            res.status(400);
            return next(new Error('Invalid or missing URL'));
        }

        let shortCode = '';

        if (customCode) {
            if (!aliasRegex.test(customCode)) {
                res.status(400);
                return next(new Error('Invalid custom code format. Must be 3-20 chars long, alphanumeric, hyphens, or underscores.'));
            }
            shortCode = customCode.toLowerCase();
            
            if (reservedKeywords.includes(shortCode)) {
                res.status(400);
                return next(new Error('Custom code is a reserved keyword.'));
            }
            
            const existingUrl = await Url.findOne({ shortCode });
            if (existingUrl) {
                res.status(409); // Conflict
                return next(new Error('Custom code already in use.'));
            }
        } else {
            // Collision handling logic
            let isUnique = false;
            let attempts = 0;
            while (!isUnique && attempts < 5) {
                shortCode = generateCode();
                const existing = await Url.findOne({ shortCode });
                if (!existing) {
                    isUnique = true;
                }
                attempts++;
            }
            if (!isUnique) {
                res.status(500);
                return next(new Error('Could not generate unique short code. Please try again.'));
            }
        }

        let expiresAt = null;
        if (expiryMinutes && Number(expiryMinutes) > 0) {
            expiresAt = new Date(Date.now() + Number(expiryMinutes) * 60 * 1000);
        }

        const newUrl = await Url.create({
            shortCode,
            longUrl: originalUrl,
            expiresAt
        });

        // Store in Redis (cache for 24h or until expiry)
        let ttl = 86400; // 24 hours in seconds
        if (expiryMinutes && Number(expiryMinutes) > 0) {
            ttl = Number(expiryMinutes) * 60;
        }
        
        try {
            if (redisClient.isReady) {
                await redisClient.set(shortCode, originalUrl, { EX: ttl });
            }
        } catch (redisError) {
            console.warn('Redis Cache Set warning:', redisError);
        }

        const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
        
        res.status(201).json({
            success: true,
            data: {
                shortCode,
                shortUrl: `${baseUrl}/${shortCode}`,
                longUrl: originalUrl,
                expiresAt
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.redirectUrl = async (req, res, next) => {
    try {
        const { code } = req.params;

        // 1. Check Cache
        let cachedUrl = null;
        try {
            if (redisClient.isReady) {
                cachedUrl = await redisClient.get(code);
            }
        } catch (redisError) {
            console.warn('Redis Cache Get warning:', redisError);
        }

        if (cachedUrl) {
            return res.redirect(302, cachedUrl);
        }

        // 2. Check Database
        const urlEntry = await Url.findOne({ shortCode: code });
        
        if (!urlEntry) {
            res.status(404);
            return next(new Error('URL not found'));
        }

        // 3. Expiry Check (Safety fallback in case TTL hasn't run)
        if (urlEntry.expiresAt && new Date() > urlEntry.expiresAt) {
            res.status(410); // Gone
            return next(new Error('This link has expired'));
        }

        // 4. Cache it back (determine TTL)
        let ttl = 86400;
        if (urlEntry.expiresAt) {
            const secondsLeft = Math.floor((urlEntry.expiresAt.getTime() - Date.now()) / 1000);
            ttl = secondsLeft > 0 ? secondsLeft : 0;
        }

        if (ttl > 0) {
            try {
                if (redisClient.isReady) {
                    await redisClient.set(code, urlEntry.longUrl, { EX: ttl });
                }
            } catch (redisError) {
                 console.warn('Redis Cache Restore warning:', redisError);
            }
        }

        res.redirect(302, urlEntry.longUrl);
    } catch (error) {
        next(error);
    }
};
