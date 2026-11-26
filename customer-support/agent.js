import dotenv from "dotenv";
dotenv.config();
import * as z from "zod";
import { createAgent, tool } from "langchain";
import readline from "readline/promises";
import { ChatGroq } from "@langchain/groq";
import { tools } from "./tools/tools.js";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const model = new ChatGroq({
  model: "openai/gpt-oss-20b",
  apiKey: process.env.GROQ_API_KEY,
});

const systemPrompt = `
    You are a customer support assistant.
    You are responseible for answering questions and helping customers with their issues.
    Address the customer with respect and professionalism.
    Address the customer by their name.
    You have access to some tools to help you answer questions and help customers with their issues.
    You will use this tool to answer questions and help customers with their issues.
`;

const agent = createAgent({
  model: model,
  systemPrompt: systemPrompt,
  tools: tools,
});

async function chatWithAgent(userInput) {
  const messages = [
    {
      role: "user",
      content: "User ID: U001",
    },
    {
      role: "user",
      content: userInput,
    },
  ];
  const stream = await agent.stream(
    { messages: messages },
    { streamMode: "messages" },
  );

  for await (const [chunk] of stream){
    if(chunk.getType() === "ai" && chunk.text){
        process.stdout.write(chunk.text)
    }
  }
  console.log('\n')
}


async function main() {
  while (true) {
    const userInput = await rl.question("Chat with customer support agent: ");
    if (userInput.toLocaleLowerCase() === "exit") {
      break;
    }
    await chatWithAgent(userInput);
  }
  rl.close();
}
main();
