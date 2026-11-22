
import Groq from "groq-sdk";
import dotenv from "dotenv";
import readlineSync from "readline-sync";

dotenv.config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const History = [];

export async function Chatting(userProblem) {
  const reply = await getGroqChatCompletion(userProblem);
  console.log("AI:", reply);
}

export const getGroqChatCompletion = async (userProblem) => {
  History.push({
    role: "user",
    content: userProblem,
  });

  const completion = await groq.chat.completions.create({
    messages: History,
    model: "openai/gpt-oss-20b",
  });

  const assistantReply =
    completion.choices[0]?.message?.content || "";

  History.push({
    role: "assistant",
    content: assistantReply,
  });

  return assistantReply;
};

async function main() {
  const userProblem = readlineSync.question("Ask me anything --> ");

  await Chatting(userProblem);
  main()
}

main().catch((error) => {
  console.error("Error:", error.message);
});
