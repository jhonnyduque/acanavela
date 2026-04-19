import './style.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import PwaUpdatePrompt from './components/PwaUpdatePrompt';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

const root = createRoot(rootElement);

root.render(
  <React.StrictMode>
    <App />
    <PwaUpdatePrompt />
  </React.StrictMode>
);