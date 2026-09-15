import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { AlertProvider } from './context/AlertContext.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AlertProvider>
      <App />
    </AlertProvider>
  </StrictMode>
);