import express from 'express'
import { createTask } from '../controllers/taskController.js'

const taskRouter = express()

taskRouter.post('/create', createTask)
export default taskRouter
