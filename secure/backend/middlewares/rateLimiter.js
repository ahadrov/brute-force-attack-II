import rateLimit from 'express-rate-limit'

export const loginRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { message: "Too many login attempts, please try again after a minute." }
})
