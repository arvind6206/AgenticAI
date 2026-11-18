import express from 'express'
import { chatController } from '../controller/chatController.js';

const chatRouter = express();

chatRouter.post('/chat', chatController)

export default chatRouter;