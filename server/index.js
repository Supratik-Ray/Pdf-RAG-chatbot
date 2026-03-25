import express from "express";
import cors from "cors";
import multer from "multer";
import "dotenv/config";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { ChatGoogle } from "@langchain/google";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

import { Queue } from "bullmq";
const queue = new Queue("file-upload-queue", {
  connection: {
    host: "localhost",
    port: "6379",
  },
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniquePrefix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${uniquePrefix}-${file.originalname}`);
  },
});

const upload = multer({ storage: storage });

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ mssg: "All good!" });
});

app.post("/upload/pdf", upload.single("pdf"), async (req, res) => {
  queue.add(
    "file-ready",
    JSON.stringify({
      filename: req.file.originalname,
      destination: req.file.destination,
      path: req.file.path,
    }),
  );
  res.json({ message: "file uploaded!" });
});

app.post("/chat", async (req, res) => {
  const userQuery = req.body.userQuery;
  const embeddings = new GoogleGenerativeAIEmbeddings({
    model: "models/gemini-embedding-001",
  });

  const vectorStore = await QdrantVectorStore.fromExistingCollection(
    embeddings,
    {
      url: "http://localhost:6333",
      collectionName: "pdf-docs",
    },
  );

  const retriever = vectorStore.asRetriever({
    k: 2,
  });

  //retrieve relevant documents
  const result = await retriever.invoke(userQuery);

  const context = result.map((r) => r.pageContent).join(".");

  const systemMessage = `You are an helpful assistant who is going to answer user query based on relevant context from a pdf. The context is: ${context}.`;

  const model = new ChatGoogle("gemini-2.5-flash");

  // send prompt to ai model

  const aiMsg = await model.invoke([
    new SystemMessage(systemMessage),
    new HumanMessage(userQuery),
  ]);

  console.log(aiMsg);
  return res.json({ message: aiMsg.content });
});

const PORT = 8000;

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
