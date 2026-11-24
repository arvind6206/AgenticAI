import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf"
import {RecursiveCharacterTextSplitter} from '@langchain/textsplitters'
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai"
import dotenv from 'dotenv'
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone"
import {PineconeStore} from '@langchain/pinecone'

dotenv.config()

async function embedWithRetry(embeddings, text, retries = 6) {
    for (let attempt = 0; ; attempt++) {
        try {
            return await embeddings.embedQuery(text)
        } catch (err) {
            if (attempt >= retries) throw err
            const delay = Math.min(1000 * 2 ** attempt, 30000)
            console.log(`Embedding failed (${err.message.slice(0, 80)}), retrying in ${delay}ms...`)
            await new Promise(r => setTimeout(r, delay))
        }
    }
}

async function indexDocument(){
    const PDF_PATH = './dsa.pdf'
    const pdfLoader = new PDFLoader(PDF_PATH)
    const rawDocs = await pdfLoader.load()

    console.log("PDF Loaded")

    //chunking
    const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200
    })

    const chunkedDocs = await textSplitter.splitDocuments(rawDocs)
    console.log("Chunk completed")

    const embeddings = new GoogleGenerativeAIEmbeddings({
        apiKey: process.env.GEMINI_API_KEY,
        model: "gemini-embedding-001",
        outputDimensionality: 768
    })

    console.log("Pinecone configured")

    //confihure db
    const pinecone = new PineconeClient();
    const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX);

    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
        pineconeIndex,
    })

    // embed one doc at a time with retry — batchEmbedContents hits 429 quota
    // and LangChain silently returns empty vectors for failed batches
    const vectors = []
    for (const doc of chunkedDocs) {
        vectors.push(await embedWithRetry(embeddings, doc.pageContent))
    }

    await vectorStore.addVectors(vectors, chunkedDocs)

    console.log("Data Store successfully")




}

indexDocument()
