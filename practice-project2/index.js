import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf"
async function indexDocument(){
    const PDF_PATH = './dsa.pdf'
    const pdfLoader = new PDFLoader(PDF_PATH)
    const rawDocs = await pdfLoader.load()

    console.log(rawDocs.length)
}

indexDocument()
