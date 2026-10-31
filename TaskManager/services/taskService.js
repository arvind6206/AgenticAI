import { TaskModel } from "../models/Task.js"

export const addTask = async (data) => {
    return await TaskModel.create(data)
}

export const getTask = async(id) => {
    return await TaskModel.findById(id);
}

export const updateTask = async(id, updates) => {
    return await TaskModel.findByIdAndUpdate(
        id,
        { $set: updates },
        {new: true, runValidators: true}
    )
}

export const deleteTask = async(id) => {
    return await TaskModel.findByIdAndDelete(id)
}

export const getPendingTask = async () => {
    return await TaskModel.find({
        status: "PENDING"
    })
}