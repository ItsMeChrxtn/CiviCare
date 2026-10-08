import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { ThemeProvider } from './contexts/ThemeContext.jsx';
import { SocketProvider } from './contexts/SocketContext.jsx';
import { NotificationProvider } from './contexts/NotificationContext.jsx';
import { PreferencesProvider } from './contexts/PreferencesContext.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <PreferencesProvider>
          <AuthProvider>
            <SocketProvider>
              <NotificationProvider>
                <App />
              </NotificationProvider>
            </SocketProvider>
          </AuthProvider>
        </PreferencesProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);
