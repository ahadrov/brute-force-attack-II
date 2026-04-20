import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import authRoutes from './routes/authRoutes.js'

const app = express()
mongoose.connect('mongodb://localhost:27017/secure_db')

app.use(cors())
app.use(express.json())

// Mount the authentication routes
// Since the frontend is likely calling /login and /register directly,
// we'll map the router to the root.
app.use('/', authRoutes)

app.listen(4000, () => console.log("Server is running at http://localhost:4000"))