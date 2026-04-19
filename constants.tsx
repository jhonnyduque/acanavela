import React from 'react';

export const ORDER_STATUSES: { label: string; value: string; color: string }[] = [
  { label: 'Recibido', value: 'Recibido', color: 'bg-indigo-400' },
  { label: 'En elaboración', value: 'En elaboración', color: 'bg-amber-500' },
  { label: 'Elaborado', value: 'Elaborado', color: 'bg-emerald-500' },
  { label: 'Entregado', value: 'Entregado', color: 'bg-indigo-900' },
];

export const PRODUCT_TYPES = [
  'Tarta de hojaldre',
  'Tarta de bizcocho',
  'Tarta de queso',
  'Napolitanas',
  'Croissant'
];

export const EDGE_TYPES = [
  'Nata',
  'Hojaldre triturado',
  'Chocolate',
  'Sin contorno'
];

export const FILLING_TYPES = [
  'Nata',
  'Crema',
  'Mousse chocolate',
  'Frutas',
  'Sin relleno'
];

export const PICKUP_HOURS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00'
];

export const PROMPT_TEMPLATES = [
  { category: "Artistic", label: "Cyberpunk Cityscape", prompt: "A hyper-detailed cyberpunk city at night, rain-slicked streets reflecting neon signs in magenta and teal, cinematic lighting, 8k resolution, volumetric fog." },
  { category: "Artistic", label: "Surreal Floating Islands", prompt: "Surreal oil painting of floating islands with waterfalls falling into the void, cosmic nebula background, whimsical atmosphere, Salvador Dali style." },
  { category: "Minimalist", label: "Geometric Still Life", prompt: "Minimalist geometric still life, soft pastel colors, clean lines, brutalist architecture influence, soft studio lighting, high-end photography." },
  { category: "Nature", label: "Bioluminescent Forest", prompt: "Mystical bioluminescent forest at twilight, glowing plants and fungi, ethereal light beams, macro photography, shallow depth of field." },
  { category: "Abstract", label: "Liquid Gold Flow", prompt: "Macro abstract of liquid gold and iridescent ink swirling together, luxurious textures, glossy finish, intricate details, high contrast." },
  { category: "Character", label: "Cybernetic Samurai", prompt: "Portrait of a cybernetic samurai, ornate armor with glowing circuitry, dramatic rim lighting, traditional Japanese aesthetic meets futuristic tech." },
];