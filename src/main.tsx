import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import { SiteDataProvider } from './lib/store';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* VITE_ROUTER=hash builds a preview that works from any sub-path */}
    {import.meta.env.VITE_ROUTER === 'hash' ? (
      <HashRouter>
        <SiteDataProvider>
          <App />
        </SiteDataProvider>
      </HashRouter>
    ) : (
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <SiteDataProvider>
          <App />
        </SiteDataProvider>
      </BrowserRouter>
    )}
  </StrictMode>,
);
