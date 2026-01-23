import { GoogleGenAI } from "@google/genai";
import { Order } from "../types";

export const analyzeSalesWithAI = async (orders: Order[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const simplifiedOrders = orders.map(o => ({
    date: o.pickupDate,
    status: o.status,
    products: o.products.map(p => p.type)
  }));

  const prompt = `
    Analiza los siguientes pedidos de una pastelería y proporciona:
    1. Un resumen breve de tendencias (qué se vende más).
    2. Una sugerencia estratégica para mejorar las ventas la próxima semana.
    3. Una recomendación de inventario basada en los tipos de tarta pedidos.
    
    Datos: ${JSON.stringify(simplifiedOrders.slice(-20))}
    
    Responde en español de forma profesional y concisa.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("AI Analysis error:", error);
    return "No se pudo realizar el análisis en este momento.";
  }
};