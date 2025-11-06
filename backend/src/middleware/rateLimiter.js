const { RateLimiterMemory } = require('rate-limiter-flexible');

const rateLimiter = new RateLimiterMemory({
  keyPrefix: 'general',
  points: process.env.RATE_LIMIT_MAX_REQUESTS || 5000, // Much higher limit for development
  duration: process.env.RATE_LIMIT_WINDOW_MS / 1000 || 60, // 60 seconds window
});

const rateLimiterMiddleware = async (req, res, next) => {
  try {
    // Use user ID if authenticated, otherwise use IP
    const key = req.user?.id || req.ip || req.connection.remoteAddress;
    
    // More lenient rate limiting for authenticated users
    const points = req.user ? 0.1 : 0.5; // Much lower consumption for authenticated users
    await rateLimiter.consume(key, points);
    next();
  } catch (rejRes) {
    const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
    res.set('Retry-After', String(secs));
    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later.',
      retryAfter: secs
    });
  }
};

module.exports = rateLimiterMiddleware;
