import express from 'express'
import { pdfUpload } from '../controllers/pdfUpload.controller.js'
import pdfUploadMiddleware from '../middleware/pdfUpload.middleware.js'
import { extractPdfText } from '../controllers/pdfExtraction.js'

const pdfRouter = express()

pdfRouter.post('/upload', pdfUploadMiddleware, pdfUpload)
pdfRouter.post('/extract', pdfUploadMiddleware, extractPdfText)

export default pdfRouter