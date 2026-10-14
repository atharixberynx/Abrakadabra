import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ConfirmHost, Toaster } from './components/ui/Overlays.jsx';
import { StoreInfoProvider } from './context/StoreInfoContext.jsx';
import { router } from './router.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <StoreInfoProvider>
        <RouterProvider router={router} />
        <Toaster />
        <ConfirmHost />
      </StoreInfoProvider>
    </AuthProvider>
  </StrictMode>,
);
