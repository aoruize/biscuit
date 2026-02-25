import { useMemo } from 'react';
import { useAuth } from 'react-oidc-context';
import { Identity } from 'spacetimedb';
import { SpacetimeDBProvider } from 'spacetimedb/react';
import { DbConnection, ErrorContext } from '../module_bindings/index.ts';
import App from '../App';

const HOST = import.meta.env.VITE_SPACETIMEDB_HOST ?? 'ws://localhost:3000';
const DB_NAME = import.meta.env.VITE_SPACETIMEDB_DB_NAME ?? 'biscuitdb';

export function AuthGate() {
  const auth = useAuth();

  const connectionBuilder = useMemo(() => {
    if (!auth.user?.id_token) return null;

    return DbConnection.builder()
      .withUri(HOST)
      .withDatabaseName(DB_NAME)
      .withToken(auth.user.id_token)
      .onConnect((_conn: DbConnection, _identity: Identity, _token: string) => {})
      .onDisconnect(() => {})
      .onConnectError((_ctx: ErrorContext, err: Error) => {
        console.error('SpacetimeDB connection error:', err);
      });
  }, [auth.user?.id_token]);

  if (auth.isLoading) {
    return (
      <div className="flex h-screen items-center justify-center p-6">
        <div className="rounded-3xl border border-discord-active bg-discord-sidebar/80 px-12 py-10 text-center shadow-2xl shadow-black/50 backdrop-blur">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-discord-brand border-t-transparent" />
          <p className="text-lg text-discord-muted">Loading...</p>
        </div>
      </div>
    );
  }

  if (auth.error) {
    return (
      <div className="flex h-screen items-center justify-center p-6">
        <div className="flex max-w-md flex-col items-center gap-4 rounded-3xl border border-discord-active bg-discord-sidebar/80 px-12 py-10 text-center shadow-2xl shadow-black/50 backdrop-blur">
          <p className="text-lg font-semibold text-discord-red">Authentication Error</p>
          <p className="text-sm text-discord-muted">{auth.error.message}</p>
          <button
            onClick={() => auth.signinRedirect()}
            className="cursor-pointer rounded-xl bg-discord-brand px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-discord-brand-hover"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!auth.isAuthenticated || !connectionBuilder) {
    return (
      <div className="flex h-screen items-center justify-center p-6">
        <div className="flex w-full max-w-sm flex-col items-center gap-6 rounded-3xl border border-discord-active bg-discord-sidebar/80 px-10 py-10 shadow-2xl shadow-black/50 backdrop-blur">
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-discord-brand text-3xl font-bold text-white shadow-lg">
              B
            </div>
            <h1 className="text-2xl font-bold text-discord-text">Biscuit</h1>
            <p className="text-sm text-discord-muted">Sign in to start chatting</p>
          </div>

          <button
            onClick={() => auth.signinRedirect()}
            className="w-full cursor-pointer rounded-xl bg-discord-brand px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-discord-brand-hover"
          >
            Sign In
          </button>

          <p className="text-xs text-discord-muted">
            Sign in with email or Google
          </p>
        </div>
      </div>
    );
  }

  return (
    <SpacetimeDBProvider connectionBuilder={connectionBuilder}>
      <App />
    </SpacetimeDBProvider>
  );
}
