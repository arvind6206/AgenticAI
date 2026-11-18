
import Groq from "groq-sdk";
import { calculator } from "../tools/calculator.js";
import dotenv from 'dotenv'
dotenv.config()

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const tools = [
  {
    type: "function",
    function: {
      name: "calculator",
      description: "Perform mathematical calculations.",
      parameters: {
        type: "object",
        properties: {
          a: { type: "number" },
          b: { type: "number" },
          operation: {
            type: "string",
            enum: ["add", "subtract", "multiply", "divide"]
          }
        },
        required: ["a", "b", "operation"]
      }
    }
  }
];

export const chatController = async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({
        msg: "prompt is required"
      });
    }

    // STEP 1: Send prompt and available tools to Groq

    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",

      messages: [
        {
          role: "system",
          content: `
            You are a helpful AI assistant.

            Use the calculator tool whenever the
            user asks you to perform calculations.

            For normal questions, answer normally.
          `
        },
        {
          role: "user",
          content: prompt
        }
      ],

      tools,
      tool_choice: "auto"
    });

    // STEP 2: Get the LLM response

    const responseMessage = completion.choices[0].message;

    // STEP 3: Check whether the LLM requested a tool

    if (responseMessage.tool_calls?.length) {

      const messages = [
        {
          role: "system",
          content: "You are a helpful AI assistant."
        },
        {
          role: "user",
          content: prompt
        },
        responseMessage
      ];

      // STEP 4: Execute requested tools

      for (const toolCall of responseMessage.tool_calls) {

        const toolName = toolCall.function.name;

        const args = JSON.parse(
          toolCall.function.arguments
        );

        let result;

        if (toolName === "calculator") {
          result = calculator(args);
        } else {
          throw new Error("Unknown tool requested");
        }

        // STEP 5: Send tool result back to LLM

        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify({ result })
        });
      }

      // STEP 6: Ask LLM to generate final answer

      const finalResponse = await groq.chat.completions.create({
        model: "openai/gpt-oss-120b",
        messages,
        tool_choice: "none"
      });

      return res.status(200).json({
        msg: finalResponse.choices[0].message.content
      });
    }

    // No tool required: return normal AI response

    return res.status(200).json({
      msg: responseMessage.content
    });

  } catch (error) {
    console.error("Chat controller error:", error);

    return res.status(500).json({
      msg: "Something went wrong"
    });
  }
};
