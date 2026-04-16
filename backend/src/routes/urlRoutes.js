const express = require('express');
const router = express.Router();
const urlController = require('../controllers/urlController');
const { shortenLimiter } = require('../middlewares/rateLimiter');

// @route   POST /api/shorten
// @desc    Create a short URL
router.post('/api/shorten', shortenLimiter, urlController.shortenUrl);

// @route   GET /:code
// @desc    Redirect to original URL
router.get('/:code', urlController.redirectUrl);

module.exports = router;
