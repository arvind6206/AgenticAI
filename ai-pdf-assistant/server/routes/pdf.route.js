import express from 'express'

const pdfRouter = express()

pdfRouter.post('/uploads', pdfUpload)

export default pdfRouter