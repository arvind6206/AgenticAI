import express from 'express'
import dotenv from 'dotenv'
import chatRouter from './routes/chat.route.js';

dotenv.config()

const app = express()
app.use(express.json())

const PORT = process.env.PORT

app.use('/api', chatRouter)


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`)
})
