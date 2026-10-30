import express from 'express'
import dotenv from 'dotenv'
import {ChatGoogle} from '@langchain/google'
import{tool} from 'langchain'
import {ToolNode} from '@langchain/langgraph/prebuilt'
import { MessagesAnnotation, StateGraph } from '@langchain/langgraph'
import z from 'zod';
import nodemailer from 'nodemailer'
dotenv.config()

const app = express()
app.use(express.json())
const PORT = process.env.PORT;

//nodemailer
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
    }
})
//email sending tool
const emailTool = tool(
    async({email, subject, content}) => {
        try {
            const info = await transporter.sendMail({
                from: process.env.GMAIL_USER,
                to: email,
                subject: subject,
                text: content,
            })
            return `Email successfully sent to ${email}. Message ID: ${info.messageId}`;
        } catch (error) {
            console.error("Email Sending failed", error.message)
            return `Failed to send email ${error.message}`
        }
    }, {
        name: "email_sending_tool",
        description: "Use this tool whenver the user requets to send an email. Send this email to specified user using the exact subject and content provided",
        schema: z.object({
            email: z.string().email().describe("Recipient email address"),
            subject: z.string().describe("Email Subject"),
            content: z.string().min(1).describe("Email body content")      
          })
    }
)

const tools = [emailTool]

const model = new ChatGoogle({
    model: 'gemini-3.5-flash',
    apiKey: process.env.GOOGLE_API_KEY
}).bindTools(tools)

const toolNode = new ToolNode(tools)

const agent = async(state) => {
    const result = await model.invoke(state.messages)

    return {
        messages: [result]
    }
}

const shouldContinue = (state) => {
    const lastMessage = state.messages[state.messages.length - 1];

    if(lastMessage.tool_calls?.length > 0){
        return "tool_node"
    }
    return "__end__"
}

const graph = new StateGraph(MessagesAnnotation)
.addNode("agent", agent)
.addNode("tool_node", toolNode)
.addEdge("__start__", "agent")
.addConditionalEdges("agent", shouldContinue)
.addEdge("tool_node", "agent")
.compile()

app.post('/chat', async(req, res) => {
    try {
        const {email, subject, content} = req.body
        if(!email || !content){
            return res.status(400).json({
                msg: "Email and content are required",
            })
        }
     const prompt = `
      The user wants to send an email.

      Recipient email: ${email}
      Subject: ${subject || "Message from AI Agent"}
      Email content: ${content}

      You MUST call email_send_tool to send this email.
      Use the exact recipient email, subject and content provided.
      Do not just tell the user that the email was sent.
      Wait for the tool result before responding.
    `;

    const result = await graph.invoke({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const finalMessage =
      result.messages[result.messages.length - 1];

    return res.json({
      success: true,
      response: finalMessage.content,
    });

  } catch (error) {
    console.error("Agent Error:", error);

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`)
})