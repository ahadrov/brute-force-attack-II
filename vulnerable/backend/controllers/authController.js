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

        // PURE VULNERABLE: Save password as plain-text
        await User.create({ username, password })
        
        res.status(201).json({ message: "Registration successful" })
    } catch (error) {
        console.error("Registration error:", error)
        res.status(500).json({ message: "An error occurred during registration", error: error.message })
    }
}

// Vulnerable Login Endpoint
export const login = async (req, res) => {
    const { username, password } = req.body
    
    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" })
    }

    try {
        const user = await User.findOne({ username })
        if (!user) {
            return res.status(401).json({ message: "Login failed" })
        }

        // PURE VULNERABLE: Compare plain-text password
        const isPasswordValid = (user.password === password)

        if (isPasswordValid) {
            res.status(200).json({ message: "Login successful" })
        } else {
            res.status(401).json({ message: "Login failed" })
        }
    } catch (error) {
        console.error("Vulnerable login error:", error)
        res.status(500).json({ message: "An error occurred", error: error.message })
    }
}
