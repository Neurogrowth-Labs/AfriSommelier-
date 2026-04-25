import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {ClerkProvider} from '@clerk/clerk-react';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import {clerkPublishableKey} from './lib/clerk';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ClerkProvider publishableKey={clerkPublishableKey} afterSignOutUrl="/">
        <App />
      </ClerkProvider>
    </ErrorBoundary>
  </StrictMode>,
);
