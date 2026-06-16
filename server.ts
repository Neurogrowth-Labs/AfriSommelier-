import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for AI Chat (Supports OpenRouter or falls back to Gemini)
  app.post("/api/chat", async (req, res) => {
    try {
      const payload = req.body;
      const openRouterKey = process.env.OPENROUTER_API_KEY || "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";

      if (openRouterKey) {
        const apiPayload = {
          ...payload,
          model: payload.model || "google/gemini-2.5-flash"
        };
        // Use OpenRouter if key is available
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${openRouterKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
            "X-Title": "AI Studio Application"
          },
          body: JSON.stringify(apiPayload)
        });

        if (response.ok) {
          const data = await response.json();
          return res.json(data);
        }
        
        console.warn(`OpenRouter failed with status ${response.status}. Falling back to Gemini.`);
      }

      // Fallback to Gemini API
      const geminiKey = process.env.GEMINI_API_KEY;
      if (!geminiKey) {
        return res.status(500).json({ error: "Both OPENROUTER_API_KEY and GEMINI_API_KEY environment variables are missing." });
      }

      // Use the imported GoogleGenAI SDK
      const ai = new GoogleGenAI({ apiKey: geminiKey });

      // Convert OpenAI-style messages to Gemini style
      const messages = payload.messages || [];
      
      // Separate system prompt from messages
      let systemInstruction = undefined;
      const contents = [];
      
      for (const msg of messages) {
        if (msg.role === 'system') {
          systemInstruction = systemInstruction ? systemInstruction + "\n" + msg.content : msg.content;
        } else if (msg.role === 'user') {
          // Handle multimodal content (like images)
          if (Array.isArray(msg.content)) {
            const parts = msg.content.map((c: any) => {
              if (c.type === 'text') return { text: c.text };
              if (c.type === 'image_url') {
                const match = c.image_url.url.match(/^data:(image\/[a-z]+);base64,(.*)$/);
                if (match) {
                  return { inlineData: { mimeType: match[1], data: match[2] } };
                }
              }
              return { text: JSON.stringify(c) };
            });
            contents.push({ role: 'user', parts });
          } else {
            contents.push({ role: 'user', parts: [{ text: msg.content }] });
          }
        } else if (msg.role === 'assistant') {
          contents.push({ role: 'model', parts: [{ text: msg.content }] });
        }
      }

      const config: any = {};
      if (systemInstruction) {
        config.systemInstruction = systemInstruction;
      }
      
      if (payload.response_format?.type === 'json_object') {
        config.responseMimeType = "application/json";
      }

      if (payload.temperature !== undefined) {
        config.temperature = payload.temperature;
      }

      // Route based on requested model family if specified, otherwise default to flash
      const model = payload.model && payload.model.includes('opus') ? 'gemini-3.1-pro-preview' : 'gemini-2.5-flash';

      const response = await ai.models.generateContent({
        model,
        contents,
        config
      });

      // Format response to match OpenAI style (which frontend expects)
      const formattedResponse = {
        choices: [
          {
            message: {
              content: response.text || "{}"
            }
          }
        ]
      };

      res.json(formattedResponse);
    } catch (error: any) {
      console.error("API Chat Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Support Express v4 & v5 fallback
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
