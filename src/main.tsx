/**
 * AI Learning Playground - Entry Point
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';

// Verify root element exists
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

// Verify BASE_URL is set
const baseUrl = import.meta.env.BASE_URL;
console.log('BASE_URL:', baseUrl);

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
