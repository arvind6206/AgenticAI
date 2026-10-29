import express from "express";
import dotenv from "dotenv";
import { ChatGoogle } from "@langchain/google";
import { TavilySearch } from "@langchain/tavily";
import { createAgent } from "langchain";

dotenv.config();
const app = express();
app.use(express.json());

const PORT = process.env.PORT;

const tool = new TavilySearch({
  maxResults: 5,
  topic: "general",
});

//custom tool


const model = new ChatGoogle("gemini-3.5-flash");

app.post("/chat", async (req, res) => {
  const { prompt } = req.body;

  const agent = createAgent({
    model,
    tools: [tool],
  });
  const result = await agent.invoke({
    messages: [
      {
        role: "user",
        content: prompt
      },
    ],
  });
  return res.json(result.messages[result.messages.length - 1].content);
});

//ai agent = llm + tool

app.listen(PORT, () => {
  console.log(`Server is listening on http://localhost:${PORT}`);
});
