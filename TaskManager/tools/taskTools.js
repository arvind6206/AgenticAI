import {tool} from 'langchain'
import z from 'zod'
import {addTask, getTask} from '../services/taskService.js'

export const addTaskTool = tool(async({title, description, priority, dueDate}) => {
    try {
        const task = await addTask({
            title,
            description: description || "",
            priority,
            statu: "PENDING",
            dueDate: dueDate || null
        })
        return JSON.stringify({
            message: "Task created successfully",
            task
        })
    } catch (error) {
        console.error(error)
        return JSON.stringify({
            msg: "Unable to create task"
        })
    }
}, {
    name: "add_task",
    description: "Create a new task. Use this tool whenever the user asks to add or create a new task.",
    schema: z.object({
        title: z.string().describe("Task title"),
        description: z.string().optional().describe("Task description"),
        priority: z.enum(["LOW", "MEDIUM", "HIGH"]).describe("Task proirity"),
        dueDate: z.string().optional().describe("Task due date")
    })
})

export const getTask = tool(async({id}) => {
    try {
        const task = await getTask(id)
        if(!task){
            return JSON.stringify({
                msg: "Task not found"
            })
        }
        return JSON.stringify({
            msg: "Task fetched successfully",
            task
        })
    } catch (error) {
        console.error(error)
        return JSON.stringify({
            msg: "Unable to get task"
        })
    }
}, {
    name: "get_task",
    description: "Fetch a single task using its MongoDB ID. use this tool whenever the user wants to find or view a specific task by ID",
    schema: z.object({
        id: z.string().describe("MongoDB ID of the task")
    })
})