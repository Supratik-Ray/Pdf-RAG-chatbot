import "dotenv/config";
import { Worker } from "bullmq";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

const worker = new Worker(
  "file-upload-queue",
  async (job) => {
    const data = JSON.parse(job.data);

    //load the pdf and split it into documents
    const loader = new PDFLoader(data.path);
    const docs = await loader.load();

    //split the documents into smaller chunks
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 50,
    });

    const texts = await splitter.splitDocuments(docs);

    // initialize embeddings model
    const embeddings = new GoogleGenerativeAIEmbeddings({
      model: "models/gemini-embedding-001",
    });

    const vectorStore = await QdrantVectorStore.fromDocuments(
      texts,
      embeddings,
      {
        url: "http://localhost:6333",
        collectionName: "pdf-docs",
      },
    );

    console.log("embeddings successfully stored in vector store!");
  },
  {
    connection: {
      host: "localhost",
      port: "6379",
    },
  },
);
