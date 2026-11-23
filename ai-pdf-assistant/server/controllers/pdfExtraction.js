import { processPdf } from "../services/pdf.service.js"

export const extractPdfText = async (req, res, next) => {
    try {
        if(!req.file){
            return res.status(400).json({
                msg: "No PDF file provided"
            })
        }

        const {text, pageCount, chunks} = await processPdf(req.file.path)
        return res.status(200).json({
            msg: "PDF processed successfully",
            file: {
                name: req.file.filename,
                size: req.file.size,
            },
            stats:{
                pageCount,
                characterCount: text.length,
                chunkCount: chunks.length,
            },
            preview: text.substring(0, 500) + (text.length > 500 ? '...' : '')
        })
    } catch (error) {
        next(error)
        
    }
}