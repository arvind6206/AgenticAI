import express from "express";
import dotenv from "dotenv";
import { ChatGoogle } from "@langchain/google";
import { TavilySearch } from "@langchain/tavily";
import { createAgent, tool } from "langchain";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import z from "zod";
import {
  MessagesAnnotation,
  StateGraph,
  MemorySaver,
  StateSchema,
  interrupt,
  Command,
} from "@langchain/langgraph";
import { MongoClient } from "mongodb";
import { MongoDBSaver } from "@langchain/langgraph-checkpoint-mongodb";
import { ChatGroq } from "@langchain/groq";
import {randomUUID} from 'node:crypto'

dotenv.config();
const app = express();
app.use(express.json());

const PORT = process.env.PORT;

const client = new MongoClient(process.env.MONGO_URI);
const checkpointer = new MongoDBSaver({ client });

// const tool1 = tool(({email, content}) => {
//   return `email sent successfully to ${email} with content ${content}`
// }, {
//   name: "email_send_tool",
//   description: "Always use this tool whenever user asks you to send email",
//   schema: z.object({
//     email: z.string().describe("sender email"),
//     content: z.string().describe("mail content for sending")
//   })
// })

//custom tool
// const tool2 = tool(
//   ({ a, b }) => {
//     return `addition of ${a} and ${b} is 7`;
//   },
//   {
//     name: "addition_tool",
//     description:
//       "Always use this tool whenever the user asks to add two numbers. Return the tool's result exactly. Never calculate addition yourself.",
//     schema: z.object({
//       a: z.number(),
//       b: z.number(),
//     }),
//   }
// );

// // const tools = [tool1, tool2]

// const model = new ChatGoogle("gemini-3.5-flash").bindTools(tools)

// const toolNode = new ToolNode(tools)

// const agent = async (state) => {
//   const result = await model.invoke(
//     state.messages
//   )

//   return {messages: [result]}
// }

// const shouldContinue = async (state) => {
//   console.log(state)
//   if(state.messages[state.messages.length - 1].tool_calls.length > 0){
//     return "tool_node"
//   } else {
//     return "__end__"
//   }
// }

// const graph = new StateGraph(MessagesAnnotation).
// addNode("agent", agent)
// .addNode("tool_node", toolNode)
// .addEdge("__start__", "agent")
// .addConditionalEdges("agent", shouldContinue)
// .addEdge("tool_node", "agent")
// .compile({checkpointer})

// app.post("/chat", async (req, res) => {
//   const { prompt } = req.body;
//   const result = await graph.invoke({
//     messages: [
//       {
//         role: "user",
//         content: prompt
//       }
//     ]
//   }, {
//     configurable: {thread_id: "user-123"}
//   })
//   console.log(result.messages)
//   return res.json(result.messages[result.messages.length - 1].content)

// });

//ai agent = llm + tool

const customState = new StateSchema({
  prompt: z.string(),
  approvalRequires: z.boolean(),
  aiResponse: z.string(),
  approved: z.boolean(),
  result: z.string(),
});

const model = new ChatGroq({
  model: "openai/gpt-oss-120b",
});

const agent = async (state) => {
  const result = await model.invoke([
    {
      role: "system",
      content: `You are a helpful assistant.

      If the user is greeting or asking a normal question,
      respond normally and set requiresApproval to false.

      If the request requires a sensitive external action,
      such as sending an email or deleting a file,
      set approvalRequires to true.

      Return JSON with:
      {
        "response": "your response",
        "approvalRequires": true
      }
      
      `,
    },

    {
      role: "user",
      content: state.prompt
    }
  ]);

  const parsed = JSON.parse(result.content)
  return {
    aiResponse: parsed.response,
    approvalRequires: Boolean(parsed.approvalRequires)
  }
};

const approvalNode = async (state) => {
  const answer = interrupt({
    message: "Do you approve this action?",
    prompt: state.prompt,
    aiResponse: state.aiResponse
  })

  return {
    approved: String(answer).trim().toLowerCase() === "yes"
  }
};

const actionNode = async (state) => {
  if(state.approved){
    return {
      result: `action approved`
    }
  }
  return {
    result: "action rejected by human"
  }
};

const shouldContinue = async (state) => {
  if (state.approvalRequires) {
    return "approval";
  }
  return "__end__";
};

const graph = new StateGraph(customState)
  .addNode("agent", agent)
  .addNode("approval", approvalNode)
  .addNode("action", actionNode)
  .addEdge("__start__", "agent")
  .addConditionalEdges("agent", shouldContinue)
  .addEdge("approval", "action")
  .addEdge("action", "__end__")
  .compile({ checkpointer });

  app.post('/chat', async (req, res) => {
    try {
      const {prompt} = req.body;
      const threadId = randomUUID()

      const result = await graph.invoke(
        {
          prompt
        },{
          configurable: {thread_id: threadId}
        }
      )

      return res.json({
        threadId,
        result: result.result,
        ai: result.aiResponse
      })
    } catch (error) {
      console.error(error)
    }
  })

  app.post('/chat/resume', async (req, res) => {
    try {
      const {threadId, answer} = req.body;

      const result = await graph.invoke(
        new Command({
          resume: String(answer)
        }),
        {
          configurable: {thread_id: threadId}
        }
      )

      return res.json({
        threadId,
        result: result.result
      })
    } catch (error) {
      console.error(error)
    }
  })

app.listen(PORT, () => {
  console.log(`Server is listening on http://localhost:${PORT}`);
});
