import rateLimit from 'express-rate-limit'

export const loginRateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    limit: 5, // Limit each IP to 5 requests per `window` (here, per minute).
    standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
    message: { message: "Too many login attempts, please try again after a minute." }
})
