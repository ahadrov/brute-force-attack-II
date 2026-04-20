import express from 'express'
import { register, secureLogin } from '../controllers/authController.js'
import { loginRateLimiter } from '../middlewares/rateLimiter.js'

const router = express.Router()

router.post('/register', register)

// Apply rate limiting middleware to the secure login endpoint
router.post('/login', loginRateLimiter, secureLogin)

export default router
