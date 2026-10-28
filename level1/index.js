
import express from "express";
import dotenv from "dotenv";
import { ChatGoogle } from "@langchain/google";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const ai = new ChatGoogle({
  model: "gemini-3.5-flash",
  temperature: 0
});

app.post("/chat", async (req, res) => {
  try {
    const { prompt } = req.body;

    const result = await ai.invoke(prompt);

    res.json({ response: result.content });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to generate response" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is listening on http://localhost:${PORT}`);
});
