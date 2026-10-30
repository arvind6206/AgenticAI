import express from 'express'
import dotenv from 'dotenv'
import { connectDB } from './config/db.js'
import taskRouter from './routes/task.route.js'
dotenv.config()

const app = express()
app.use(express.json())

const PORT = process.env.PORT

app.use('/api/v1/task', taskRouter)

connectDB()
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`)
})