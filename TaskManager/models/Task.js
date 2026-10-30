import mongoose from 'mongoose'

const TaskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    priority: {
        type: String,
        enum: ["LOW", "HIGH", "MEDIUM"],
        default: 'HIGH'
    },
    Status: {
        type: String,
        enum: ["PENDING", "INPROGRESS", "COMPLETED"],
        default: "PENDING"
    },
    dueDate: {
        type: Date
    },
}, {timestamps: true})

export const TaskModel = mongoose.model('task', TaskSchema)