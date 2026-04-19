import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HealthCheck, Login, Register, Chat, Settings } from './pages';
import { useAuthStore } from './stores';
import { applyStoredTheme } from './utils/settings';
import ParticleBackground from './components/ParticleBackground';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { token } = useAuthStore();
  return token ? <>{children}</> : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { token } = useAuthStore();
  return !token ? <>{children}</> : <Navigate to="/chat" replace />;
};

function App() {
  const { token, fetchUser } = useAuthStore();

  useEffect(() => {
    applyStoredTheme();
  }, []);

  useEffect(() => {
    if (token) {
      fetchUser();
    }
  }, [token, fetchUser]);

  return (
    <div className="app-shell">
      <ParticleBackground />
      <div className="app-shell-front">
        <BrowserRouter>
          <Routes>
            <Route path="/health" element={<HealthCheck />} />
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              }
            />
            <Route
              path="/chat"
              element={
                <PrivateRoute>
                  <Chat />
                </PrivateRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <PrivateRoute>
                  <Settings />
                </PrivateRoute>
              }
            />
            <Route path="/" element={<Navigate to="/chat" replace />} />
          </Routes>
        </BrowserRouter>
      </div>
    </div>
  );
}

export default App;
