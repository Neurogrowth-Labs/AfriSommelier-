import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);

  app.use(express.json({ limit: "10mb" }));

  // API Route for AI Chat (Supports OpenRouter or falls back to Gemini)
  app.post("/api/chat", async (req, res) => {
    try {
      const payload = req.body;
      if (!payload || !Array.isArray(payload.messages)) {
        return res.status(400).json({ error: "Request body must include a messages array." });
      }

      const openRouterKey = process.env.OPENROUTER_API_KEY;

      if (openRouterKey) {
        const apiPayload = {
          ...payload,
          model: payload.model || process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini"
        };
        // Use OpenRouter if key is available
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${openRouterKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
            "X-Title": process.env.APP_NAME || "AfriSommelier"
          },
          body: JSON.stringify(apiPayload)
        });

        if (response.ok) {
          const data = await response.json();
          return res.json(data);
        }
        
        const body = await response.text();
        console.warn(`OpenRouter failed with status ${response.status}. Falling back to Gemini. ${body.slice(0, 500)}`);
      }

      // Fallback to Gemini API
      const geminiKey = process.env.GEMINI_API_KEY;
      if (!geminiKey) {
        return res.status(500).json({ error: "Both OPENROUTER_API_KEY and GEMINI_API_KEY environment variables are missing." });
      }

      // Use the imported GoogleGenAI SDK
      const ai = new GoogleGenAI({ 
        apiKey: geminiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

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
      const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

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
      res.status(500).json({ error: error.message || "AI service request failed." });
    }
  });


  const createCupidoReceipt = (provider: string, body: any = {}) => ({
    subscriptionId: `cupido_${provider}_${Date.now()}`,
    provider,
    planName: body.planName || "Cupido Gold — Monthly AI Access",
    amountZAR: Number(body.amountZAR || 20),
    interval: "month",
    payerEmail: body.payerEmail,
    receiptUrl: `/receipts/cupido-${provider}-${Date.now()}`
  });

  // Cupido Gold subscription endpoints. Wire these to live PayPal/Stripe SDKs in production;
  // the sandbox response keeps the client flow testable without exposing secret keys.
  app.post("/api/cupido/subscriptions/google-pay", async (req, res) => {
    try {
      const { googlePayToken } = req.body || {};
      if (!googlePayToken) {
        return res.status(400).json({ message: "Google Pay token is required." });
      }
      res.json({ receipt: createCupidoReceipt("google_pay", req.body) });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Google Pay subscription failed." });
    }
  });

  app.post("/api/cupido/subscriptions/paypal", async (req, res) => {
    try {
      res.json({
        approvalUrl: process.env.PAYPAL_CUPIDO_PLAN_URL || null,
        receipt: createCupidoReceipt("paypal", req.body)
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "PayPal subscription failed." });
    }
  });

  app.post("/api/cupido/subscriptions/stripe", async (req, res) => {
    try {
      res.json({
        checkoutUrl: process.env.STRIPE_CUPIDO_PRICE_URL || null,
        receipt: createCupidoReceipt("stripe", req.body)
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Stripe subscription failed." });
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
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
