import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize Gemini
  const genAI = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // Add JSON parsing middleware
  app.use(express.json());

  // AI Parsing Endpoint
  app.post("/api/ai/parse", async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt) return res.status(400).json({ error: "Prompt is required" });

      const response = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze the following lost and found command: "${prompt}". Identify the intent (lost/found), the category of the item, keywords for searching, and any mentioned location. Categories: Electronics, Books, Bags, Clothing, Keys, ID Cards/Wallets, Jewelry, Others. Intent: lost, found, none.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              intent: { type: Type.STRING, description: "One of: lost, found, none" },
              category: { type: Type.STRING, description: "One of the provided categories" },
              keywords: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Search keywords (e.g., 'wallet', 'iphone', 'keys')" },
              location: { type: Type.STRING, description: "Specific location if mentioned, or empty string" },
              confidence: { type: Type.NUMBER, description: "Confidence score from 0 to 100" }
            },
            required: ["intent", "category", "keywords", "confidence"]
          }
        }
      });

      const data = JSON.parse(response.text);
      res.json(data);
    } catch (error) {
      console.error("AI Parsing Error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // API placeholders
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Handle Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
