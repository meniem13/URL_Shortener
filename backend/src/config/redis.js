const redis = require('redis');
const dotenv = require('dotenv');
dotenv.config({ override: true });

const redisClient = redis.createClient({
    url: process.env.REDIS_URL || 'redis://127.0.0.1:6379'
});

redisClient.on('error', (err) => {
    console.error('Redis Connection Error:', err);
});

redisClient.on('connect', () => {
    console.log('Redis Connected');
});

module.exports = redisClient;
