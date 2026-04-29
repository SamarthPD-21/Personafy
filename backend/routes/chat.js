import express from "express";
import { personas } from "../personas.js";
import dotenv from "dotenv";
import path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config({ path: path.resolve(process.cwd(), "..", ".env") });

const router = express.Router();

if (!process.env.GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY is not set. Set it in .env or environment variables.");
}

router.post("/", async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY is not set. Set it in .env or environment variables.");
      return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
    }

    const client = new GoogleGenerativeAI(apiKey);
    const { persona, message } = req.body;

    console.log("[chat] incoming request", { persona, message: typeof message === 'string' ? message.slice(0,120) : message });

    const systemPrompt = personas[persona];
    if (!systemPrompt) {
      return res.status(400).json({ error: "Unknown persona" });
    }

    const model = client.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      systemInstruction: systemPrompt,
    });

    const result = await model.generateContentStream({
      generationConfig: {
        maxOutputTokens: 2048,
      },
      contents: [
        {
          role: "user",
          parts: [{ text: message }],
        },
      ],
    });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      for (const char of chunkText) {
        res.write(`data: ${JSON.stringify({ text: char })}\n\n`);
        await new Promise(r => setTimeout(r, 15));
      }
    }
    res.write('data: [DONE]\n\n');
    res.end();

  } catch (err) {
    console.error(err);
    if (!res.headersSent) {
      res.status(500).json({
        error: "Something went wrong. Try again.",
      });
    } else {
      res.write(`data: ${JSON.stringify({ error: "Something went wrong. Try again." })}\n\n`);
      res.end();
    }
  }
});

export default router;
