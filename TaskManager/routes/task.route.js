import express from 'express'
import { createTask, getTask, updateTask } from '../controllers/taskController.js'

const taskRouter = express()

taskRouter.post('/create', createTask)
taskRouter.get('/:id', getTask)
taskRouter.put('/', updateTask)
taskRouter.delete('/:id', deleteTask)
export default taskRouter
