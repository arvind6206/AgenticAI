import { TaskModel } from "../models/Task.js"

export const createTask = async(req, res) => {
    try {
        const {title, description, priority, status, dueDate} = req.body
        if(!title || !priority || !status || !dueDate){
            return res.status(400).json({
                msg: "These fields are required"
            })
        }

        const task = await TaskModel.create({
            title, description, priority, status, dueDate
        })
        return res.status(201).json({
            msg: "task created successfully",
            task
        })
    } catch (error) {
        console.error(error)
        return res.status(500).json({
            msg: "Internal Server Error"
        })
    }
}