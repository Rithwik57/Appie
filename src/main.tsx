import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { StoreProvider } from './app/store';
import './styles/global.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode><StoreProvider><RouterProvider router={router} /></StoreProvider></StrictMode>,
);
