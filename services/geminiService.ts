import { GoogleGenAI } from "@google/genai";
import { Order } from "../types";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-3-flash-preview";

type SimplifiedOrder = {
  date: string;
  status: Order["status"];
  products: string[];
};

const buildSimplifiedOrders = (orders: Order[]): SimplifiedOrder[] => {
  return orders.slice(-20).map((order) => ({
    date: order.pickupDate,
    status: order.status,
    products: order.products.map((product) => product.type),
  }));
};

const buildPrompt = (orders: SimplifiedOrder[]): string => {
  return `
Analiza los siguientes pedidos de una pastelería y proporciona:

1. Un resumen breve de tendencias: qué se vende más y qué patrones observas.
2. Una sugerencia estratégica para mejorar las ventas la próxima semana.
3. Una recomendación de inventario basada en los tipos de tarta pedidos.

Datos recientes:
${JSON.stringify(orders, null, 2)}

Responde en español, con tono profesional, claro y conciso.
Evita inventar datos que no estén en la información entregada.
  `.trim();
};

const getReadableGeminiError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return "Error desconocido";
  }
};

export const analyzeSalesWithAI = async (orders: Order[]): Promise<string> => {
  if (!GEMINI_API_KEY) {
    console.error(
      "Gemini API key is missing. Expected VITE_GEMINI_API_KEY in environment variables."
    );

    return "No se pudo realizar el análisis porque falta la configuración de Gemini.";
  }

  if (!Array.isArray(orders) || orders.length === 0) {
    return "Todavía no hay pedidos suficientes para generar un análisis de ventas.";
  }

  const simplifiedOrders = buildSimplifiedOrders(orders);
  const prompt = buildPrompt(simplifiedOrders);

  try {
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
    });

    const text = response.text?.trim();

    if (!text) {
      return "Gemini respondió, pero no generó un análisis válido en este momento.";
    }

    return text;
  } catch (error) {
    const readableError = getReadableGeminiError(error);

    console.error("AI Analysis error:", readableError);

    return "No se pudo realizar el análisis en este momento. Revisa la configuración de Gemini o intenta nuevamente.";
  }
};