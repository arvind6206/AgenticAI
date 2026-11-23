import express from 'express'
import { pdfUpload } from '../controllers/pdfUpload.controller.js'
import pdfUploadMiddleware from '../middleware/pdfUpload.middleware.js'

const pdfRouter = express()

pdfRouter.post('/upload', pdfUploadMiddleware, pdfUpload)

export default pdfRouter