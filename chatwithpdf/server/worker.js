import { Worker } from "bullmq";
import { QdrantVectorStore } from "@langchain/qdrant";
import { Document } from "@langchain/core/documents";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { CharacterTextSplitter } from "@langchain/textsplitters";
import { pipeline } from "@xenova/transformers";
import { QdrantClient } from "@qdrant/js-client-rest";
import { randomUUID } from "crypto";
import dotenv from "dotenv";
dotenv.config();

class LocalEmbeddings {
  constructor() {
    this.model = null;
  }

  async init() {
    if (!this.model) {
      console.log("Loading local embedding model...");
      this.model = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
      console.log("Embedding model loaded");
    }
  }

  async embedDocuments(texts) {
    await this.init();
    const embeddings = [];
    for (const text of texts) {
      const output = await this.model(text, { pooling: "mean", normalize: true });
      embeddings.push(Array.from(output.data));
    }
    return embeddings;
  }

  async embedQuery(text) {
    await this.init();
    const output = await this.model(text, { pooling: "mean", normalize: true });
    return Array.from(output.data);
  }
}

const embeddings = new LocalEmbeddings();

console.log("Worker starting...");

const worker = new Worker(
  "file-upload-queue",
  async (job) => {
    try {
      console.log(`job name:`, job.name);
      console.log(`job data:`, job.data);

      const data = job.data;

      const loader = new PDFLoader(data.path);
      const docs = await loader.load();
      console.log(`Loaded ${docs.length} documents from PDF`);

      const textSplitter = new CharacterTextSplitter({
        chunkSize: 300,
        chunkOverlap: 0,
      });

      const texts = await textSplitter.splitDocuments(docs);
      console.log(`Split into ${texts.length} chunks`);

      const qdrantUrl = process.env.QDRANT_URL || "http://localhost:6333";
      console.log(`Connecting to Qdrant at ${qdrantUrl}`);
      const qdrantClient = new QdrantClient({ url: qdrantUrl });
      const collectionName = "pdf";

      // Check if collection exists, create if not
      const collections = await qdrantClient.getCollections();
      const collectionExists = collections.collections.some(c => c.name === collectionName);

      if (!collectionExists) {
        console.log(`Creating collection ${collectionName}...`);
        await qdrantClient.createCollection(collectionName, {
          vectors: {
            size: 384,
            distance: "Cosine"
          }
        });
        console.log(`Collection ${collectionName} created`);
      } else {
        console.log(`Collection ${collectionName} already exists`);
      }

      // Generate embeddings and insert points in batches
      const batchSize = 10;
      const points = [];
      let totalInserted = 0;

      for (let i = 0; i < texts.length; i++) {
        const doc = texts[i];
        console.log(`Generating embedding for chunk ${i + 1}/${texts.length}`);
        const embedding = await embeddings.embedQuery(doc.pageContent);
        console.log(`Embedding generated, length: ${embedding.length}`);
        points.push({
          id: randomUUID(),
          vector: embedding,
          payload: {
            text: doc.pageContent,
            source: data.filename
          }
        });

        // Insert in batches
        if (points.length >= batchSize || i === texts.length - 1) {
          console.log(`Inserting batch of ${points.length} points into Qdrant...`);
          await qdrantClient.upsert(collectionName, {
            points: points
          });
          totalInserted += points.length;
          console.log(`Batch inserted. Total inserted: ${totalInserted}`);
          points.length = 0; // Clear the array
        }
      }
      console.log(`All docs are added to vector store. Total: ${totalInserted} points`);
    } catch (error) {
      console.error(`Error processing job:`, error);
      throw error;
    }
  },
  {
    concurrency: 100,
    connection: {
      host: "localhost",
      port: 6379,
    },
  },
);

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);
});

console.log("Worker is ready");
