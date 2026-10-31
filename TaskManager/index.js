
import express from "express";
import dotenv from "dotenv";

import connectDB from "./config/db.js";
import graph from "./agent/graph.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Connect MongoDB
await connectDB();

// Health check route
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Task Manager AI Agent is running"
    });
});

// AI Chat API
app.post("/chat", async (req, res) => {
    try {
        const { message } = req.body;

        // Validate user message
        if (!message || typeof message !== "string" || !message.trim()) {
            return res.status(400).json({
                success: false,
                message: "Message is required"
            });
        }

        console.log("User message:", message);

        // Invoke LangGraph agent
        const result = await graph.invoke(
            {
                messages: [
                    {
                        role: "user",
                        content: message
                    }
                ]
            },
            {
                recursionLimit: 10
            }
        );

        // Get final AI response
        const finalMessage =
            result.messages[result.messages.length - 1];

        console.log("Agent response:", finalMessage.content);

        return res.status(200).json({
            success: true,
            response: finalMessage.content
        });

    } catch (error) {
        console.error("Agent execution error:", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong",
            error: error.message
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
