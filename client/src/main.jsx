import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import './i18n';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#10101E',
              color: '#EFEFEF',
              border: '1px solid #1E1E32',
              borderRadius: '10px',
              fontFamily: 'Inter, sans-serif',
            },
            success: { iconTheme: { primary: '#00E5A0', secondary: '#080810' } },
            error: { iconTheme: { primary: '#FF4D4F', secondary: '#080810' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
