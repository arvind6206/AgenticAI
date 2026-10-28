
import express from "express";
import dotenv from "dotenv";
import { ChatGoogle } from "@langchain/google";
import { ChatGroq } from "@langchain/groq"

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const ai = new ChatGroq({
  model: "openai/gpt-oss-120b",
  temperature: 0.7,
});

app.post("/chat", async (req, res) => {
  try {
    const { prompt } = req.body;

    const result = await ai.invoke([
        {
            role: 'system',
            content: 'you are jarvis and my assistant'
        },
        {
            role: 'user',
            content: prompt
        }
    ]);


    return res.json(result.content);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to generate response" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is listening on http://localhost:${PORT}`);
});
