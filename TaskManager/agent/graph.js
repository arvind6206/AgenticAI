import "dotenv/config";
import { ChatGoogle } from "@langchain/google";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { MessagesAnnotation, StateGraph } from "@langchain/langgraph";

import { tools } from "../tools/taskTools.js";


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

export default graph