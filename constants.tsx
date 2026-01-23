
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

export const ADMIN_PASSWORD = "acanavela2025";
