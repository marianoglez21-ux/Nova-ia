import express from "express";
import OpenAI from "openai";

const app = express();
const port = process.env.PORT || 3000;
const apiKey = process.env.OPENAI_API_KEY;
const ai = apiKey ? new OpenAI({ apiKey }) : null;

app.use(express.json({ limit: "2mb" }));
app.use(express.static("public"));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, apiConfigured: Boolean(ai) });
});

app.post("/api/chat", async (req, res) => {
  try {
    if (!ai) {
      return res.status(503).json({
        error: "Falta configurar OPENAI_API_KEY en las variables de entorno del servidor."
      });
    }

    const message = req.body?.message;
    if (typeof message !== "string" || !message.trim() || message.length > 4000) {
      return res.status(400).json({ error: "Escribe un mensaje de hasta 4000 caracteres." });
    }

    const result = await ai.responses.create({
      model: process.env.OPENAI_TEXT_MODEL || "gpt-4.1-mini",
      instructions: "Te llamas Nova AI. Responde en español de forma clara, amable y útil.",
      input: message.trim()
    });

    res.json({ reply: result.output_text || "No pude generar una respuesta esta vez." });
  } catch (error) {
    console.error("Chat API error:", error?.message || error);
    res.status(500).json({ error: "No pude obtener una respuesta. Revisa la configuración del servidor." });
  }
});

app.post("/api/images", async (req, res) => {
  try {
    if (!ai) {
      return res.status(503).json({
        error: "Falta configurar OPENAI_API_KEY en las variables de entorno del servidor."
      });
    }

    const prompt = req.body?.prompt;
    if (typeof prompt !== "string" || !prompt.trim() || prompt.length > 1000) {
      return res.status(400).json({ error: "Escribe una descripción de imagen de hasta 1000 caracteres." });
    }

    const result = await ai.images.generate({
      model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-1",
      prompt: prompt.trim(),
      size: "1024x1024"
    });

    const imageData = result.data?.[0]?.b64_json;
    if (!imageData) {
      return res.status(502).json({ error: "El modelo no devolvió una imagen." });
    }

    res.json({ image: `data:image/png;base64,${imageData}` });
  } catch (error) {
    console.error("Image API error:", error?.message || error);
    res.status(500).json({
      error: "No pude generar la imagen. Verifica que tu cuenta tenga acceso al modelo de imágenes y facturación configurada."
    });
  }
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Nova AI escuchando en el puerto ${port}`);
});
