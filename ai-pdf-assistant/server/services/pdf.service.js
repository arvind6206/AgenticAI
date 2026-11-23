import { PDFParse } from "pdf-parse";
import fs from 'fs/promises'
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

export const extractTextFromPdf = async (filePath) => {
    const dataBuffer = await fs.readFile(filePath)
    const parser = new PDFParse({data: dataBuffer})

    try {
        const result = await parser.getText()
        return {
            text: result.text,
            pageCount: result.pages?.length??0
        }
    } catch (error) {
        console.error(error)
    }
}

export const splitIntoChunks = async (text) => {
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200
    })

    return splitter.createDocuments([text])
}

export const processPdf = async (filePath) => {
    const {text, pageCount} = await extractTextFromPdf(filePath)
    const chunks = await splitIntoChunks(text)
    return {text, pageCount, chunks}
}