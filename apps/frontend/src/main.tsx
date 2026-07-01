import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { HelmetProvider } from 'react-helmet-async';
import { store, persistor } from '@/store';
import { setCredentials, setLoading, logout } from '@/store/authSlice';
import api from '@/lib/axios';
import type { User } from '@/types';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { AppRouter } from '@/router';
import './globals.css';

function AuthBootstrap({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const token = store.getState().auth.accessToken;
    if (!token) {
      store.dispatch(setLoading(false));
      return;
    }
    api
      .get<User>('/auth/me')
      .then((res) => {
        const user = res.data as unknown as User;
        store.dispatch(
          setCredentials({
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              avatar: user.avatar,
            },
            accessToken: token,
          })
        );
      })
      .catch(() => store.dispatch(logout()))
      .finally(() => store.dispatch(setLoading(false)));
  }, []);

  return <>{children}</>;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <HelmetProvider>
            <AuthBootstrap>
              <AppRouter />
            </AuthBootstrap>
          </HelmetProvider>
        </PersistGate>
      </Provider>
    </ErrorBoundary>
  </StrictMode>
);
