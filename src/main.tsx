/**
 * AI Learning Playground - Entry Point
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';

// Restore route from GitHub Pages fallback redirect before router bootstraps.
const params = new URLSearchParams(window.location.search);
const route = params.get('route');
if (route) {
  const baseUrl = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL.slice(0, -1)
    : import.meta.env.BASE_URL;
  window.history.replaceState(null, '', `${baseUrl}${route}${window.location.hash}`);
}

// Verify root element exists
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

// Verify BASE_URL is set
const appBaseUrl = import.meta.env.BASE_URL;
console.log('BASE_URL:', appBaseUrl);

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
