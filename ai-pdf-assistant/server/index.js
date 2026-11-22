import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
dotenv.config()

const app = express()
app.use(express.json())
app.use(cors())
const PORT = process.env.PORT

app.use('/api/pdf', pdfRouter)

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`)
})

