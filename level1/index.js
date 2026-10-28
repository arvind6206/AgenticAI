import express from 'express';
import deotenv from 'dotenv'

import { GoogleGenAI } from '@google/genai';

deotenv.config()
const app = express()


const PORT = process.env.PORT;

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
})

const main = async () => {
    const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: 'hello'
    })
    console.log(response.text)
}
main()


app.listen(PORT, () => {
    console.log(`Server is listening on http://localhost:${PORT}`)
})