import * as argon2 from 'argon2'
import User from '../models/User.js'
import { generateCaptcha, verifyCaptcha } from '../services/captchaService.js'

const MAX_FAILED_ATTEMPTS = 5
const LOCK_TIME_MS = 15 * 60 * 1000 // 15-minute lockout

export const getCaptcha = (req, res) => {
    try {
        const captcha = generateCaptcha()
        res.status(200).json(captcha)
    } catch (error) {
        console.error("Captcha generation error:", error)
        res.status(500).json({ message: "Failed to generate security verification" })
    }
}

export const register = async (req, res) => {
    const { username, password } = req.body

    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" })
    }

    try {
        const existingUser = await User.findOne({ username })
        if (existingUser) {
            return res.status(409).json({ message: "User already exists" })
        }

        const hashedPassword = await argon2.hash(password)

        await User.create({ username, password: hashedPassword })

        res.status(201).json({ message: "Registration successful" })
    } catch (error) {
        console.error("Registration error:", error)
        res.status(500).json({ message: "An error occurred during registration", error: error.message })
    }
}

export const secureLogin = async (req, res) => {
    const { username, password, captchaId, captchaAnswer } = req.body

    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" })
    }

    try {
        const user = await User.findOne({ username })

        // 1. Account Lockout verification
        if (user && user.lockUntil && user.lockUntil > Date.now()) {
            const remainingSeconds = Math.ceil((user.lockUntil - Date.now()) / 1000)
            const remainingMinutes = Math.ceil(remainingSeconds / 60)
            return res.status(423).json({
                message: `Account is temporarily locked due to excessive failed attempts. Please try again in ${remainingMinutes} minute(s).`,
                isLocked: true,
                lockUntil: user.lockUntil,
                remainingSeconds
            })
        }

        // 2. CAPTCHA verification (Bot / Brute-Force defense)
        // If a CAPTCHA was submitted, validate it
        if (captchaId) {
            const isCaptchaValid = verifyCaptcha(captchaId, captchaAnswer)
            if (!isCaptchaValid) {
                return res.status(403).json({
                    message: "Incorrect security verification code. Please try again with the new CAPTCHA.",
                    requiresCaptcha: true
                })
            }
        } else {
            // Adaptive defense: if an automated tool attacks without CAPTCHA after repeated failures, block it
            const previousAttempts = user?.failedLoginAttempts || 0
            if (previousAttempts >= 2) {
                return res.status(403).json({
                    message: "Security verification (CAPTCHA) required due to repeated failed login attempts. Automated requests are blocked.",
                    requiresCaptcha: true
                })
            }
        }

        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" })
        }

        const isPasswordValid = await argon2.verify(user.password, password)

        if (isPasswordValid) {
            // Successful authentication: reset failed counters and unlock
            if (user.failedLoginAttempts > 0 || user.lockUntil) {
                user.failedLoginAttempts = 0
                user.lockUntil = undefined
                await user.save()
            }
            return res.status(200).json({ message: "Login successful" })
        } else {
            // Failed attempt: increment counter
            const newAttempts = (user.failedLoginAttempts || 0) + 1
            const updates = { failedLoginAttempts: newAttempts }

            if (newAttempts >= MAX_FAILED_ATTEMPTS) {
                const lockTime = new Date(Date.now() + LOCK_TIME_MS)
                updates.lockUntil = lockTime
                await User.updateOne({ _id: user._id }, updates)

                return res.status(423).json({
                    message: "Account has been locked due to excessive failed login attempts. Please try again after 15 minutes.",
                    isLocked: true,
                    lockUntil: lockTime,
                    remainingSeconds: Math.ceil(LOCK_TIME_MS / 1000)
                })
            }

            await User.updateOne({ _id: user._id }, updates)

            return res.status(401).json({
                message: "Invalid credentials",
                requiresCaptcha: newAttempts >= 2
            })
        }
    } catch (error) {
        console.error("Secure login error:", error)
        res.status(500).json({ message: "An error occurred", error: error.message })
    }
}
