import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { SocketProvider } from './context/SocketContext';

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <SocketProvider>
      <App />
    </SocketProvider>
  </QueryClientProvider>
);
