import express from 'express'
import { register, secureLogin, getCaptcha } from '../controllers/authController.js'
import { loginRateLimiter } from '../middlewares/rateLimiter.js'

const router = express.Router()

router.get('/captcha', getCaptcha)
router.post('/register', register)
router.post('/login', loginRateLimiter, secureLogin)

export default router
