import {tool} from 'langchain'
import z from 'zod'
import {addTask, getTask, updateTask, deleteTask, getPendingTask} from '../services/taskService.js'

export const addTaskTool = tool(async({title, description, priority, dueDate}) => {
    try {
        const task = await addTask({
            title,
            description: description || "",
            priority,
            status: "PENDING",
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

export const getTaskTool = tool(async({id}) => {
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

export const updateTaskTool = tool(async({id, title, description, priority, status, dueDate}) => {
    try {
        const findTask = await getTask(id)
        if(!findTask){
            return JSON.stringify({
                msg: "Task not found"
            })
        }
        const updates = {}

        if(title !== undefined) updates.title = title
        if(description !== undefined) updates.description = description
        if(priority !== undefined) updates.priority = priority
        if(status !== undefined) updates.status = status
        if(dueDate !== undefined) updates.dueDate = dueDate

        if(Object.keys(updates).length === 0){
            return JSON.stringify({
                msg: "No fields provided for update"
            })
        }

        const updatedTask = await updateTask(id, updates)

        return JSON.stringify({
            msg: "Task updated successfully",
            task: updatedTask
        })
    } catch (error) {
        console.error(error)
        return JSON.stringify({
            msg: "Unable to update the task"
        })
    }
}, {
    name: "update_task",
    description: "update the existing task using its MongoDB id. whenever user asks to update any task with their specific id",
    schema: z.object({
        title: z.string().describe("Task title"),
        description: z.string().optional().describe("Task description"),
        priority: z.enum(["LOW", "MEDIUM", "HIGH"]).describe("Task proirity"),
        dueDate: z.string().optional().describe("Task due date")
    })
})

export const deleteTaskTool = tool(async({id}) => {
    try {
        const task = await getTask(id)
        if(!task){
            return JSON.stringify({
                msg: "Task not found"
            })
        }

        const removeTask = await deleteTask(id)
        return JSON.stringify({
            msg: "Task deleted successfully"
        })
    } catch (error) {
        console.error(error)
        return JSON.stringify({
            msg: "Unable to delete the Task"
        })
    }
}, {
    name: "delete_task",
    description: "delete the task using its MongoDB id. Whenever user asks you to remove or delete any task given a specific id",
    schema: z.object({
        id: z.string().describe("MongoDB id")
    })
})

export const getAllPendingTaskTool = tool(async() => {
    try {
        const tasks = await getPendingTask()
        if(tasks.length === 0){
            return JSON.stringify({
                msg: "No Pending task found",
                tasks: []
            })
        }

        return JSON.stringify({
            msg: "Pending tasks fetchedd successfully",
            totalTasks: tasks.length,
            tasks
        })
    } catch (error) {
        console.error(error)
        return JSON.stringify({
            msg: "Unable to fetch the pending tasks"
        })
    }
}, {
    name: "get_pending_tasks",
    description: "Fetch all tasks having PENDING status. use this tool whenever the user asks to see their pending, incomplete or remaining tasks",
    schema: z.object({})
})

export const tools = [addTaskTool, getTaskTool, updateTaskTool, deleteTaskTool, getAllPendingTaskTool]