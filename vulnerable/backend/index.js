import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import authRoutes from './routes/authRoutes.js'

const app = express()
mongoose.connect('mongodb://localhost:27017/vulnerable_db')

app.use(cors())
app.use(express.json())

app.use('/', authRoutes)

app.listen(3000, () => console.log("Server is running at http://localhost:3000"))