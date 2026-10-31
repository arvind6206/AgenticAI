import dotenv from "dotenv";
import connectDB from "./config/db.js";
import graph from "./agent/graph.js";

dotenv.config();

await connectDB();

const result = await graph.invoke(
    {
        messages: [
            {
                role: "user",
                content: "Add a task to learn JavaScript with HIGH priority"
            }
        ]
    },
    {
        recursionLimit: 10
    }
);

console.log(
    result.messages[result.messages.length - 1].content
);

process.exit(0);