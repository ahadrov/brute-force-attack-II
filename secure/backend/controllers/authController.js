import * as argon2 from 'argon2'
import User from '../models/User.js'

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
    const { username, password } = req.body

    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" })
    }

    try {
        const user = await User.findOne({ username })
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" })
        }

        const isPasswordValid = await argon2.verify(user.password, password)

        if (isPasswordValid) {
            res.status(200).json({ message: "Login successful" })
        } else {
            res.status(401).json({ message: "Invalid credentials" })
        }
    } catch (error) {
        console.error("Secure login error:", error)
        res.status(500).json({ message: "An error occurred", error: error.message })
    }
}
