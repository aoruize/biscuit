import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { AuthProvider } from 'react-oidc-context';
import { AuthGate } from './components/AuthGate';

const oidcConfig = {
  authority: 'https://auth.spacetimedb.com/oidc',
  client_id: import.meta.env.VITE_SPACETIMEAUTH_CLIENT_ID,
  redirect_uri: window.location.origin,
  post_logout_redirect_uri: window.location.origin,
  scope: 'openid profile email',
  response_type: 'code',
  automaticSilentRenew: true,
};

function onSigninCallback() {
  window.history.replaceState({}, document.title, window.location.pathname);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider {...oidcConfig} onSigninCallback={onSigninCallback}>
      <AuthGate />
    </AuthProvider>
  </StrictMode>
);
