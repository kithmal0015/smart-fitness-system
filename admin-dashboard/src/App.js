import { useEffect, useState } from 'react';
import './App.css';
import LodingP from './pages/LodingP';
import Login from './pages/Login';
import Home from './pages/Home';

const AUTH_TOKEN_KEY = 'ff_admin_token';
const AUTH_USER_KEY = 'ff_admin_user';
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

function App() {
  const [isLoadingComplete, setIsLoadingComplete] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    if (!isLoadingComplete) {
      return;
    }

    const verifySession = async () => {
      const token =
        localStorage.getItem(AUTH_TOKEN_KEY) || sessionStorage.getItem(AUTH_TOKEN_KEY);

      if (!token) {
        setIsLoggedIn(false);
        setIsCheckingAuth(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Session invalid');
        }

        setIsLoggedIn(true);
      } catch (_error) {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(AUTH_USER_KEY);
        sessionStorage.removeItem(AUTH_TOKEN_KEY);
        sessionStorage.removeItem(AUTH_USER_KEY);
        setIsLoggedIn(false);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    verifySession();
  }, [isLoadingComplete]);

  const handleLoginSuccess = (token, admin, remember = true) => {
    const storage = remember ? localStorage : sessionStorage;
    const otherStorage = remember ? sessionStorage : localStorage;

    storage.setItem(AUTH_TOKEN_KEY, token);
    storage.setItem(AUTH_USER_KEY, JSON.stringify(admin || {}));

    otherStorage.removeItem(AUTH_TOKEN_KEY);
    otherStorage.removeItem(AUTH_USER_KEY);

    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
    sessionStorage.removeItem(AUTH_USER_KEY);
    setIsLoggedIn(false);
  };

  if (!isLoadingComplete) {
    return <LodingP onComplete={() => setIsLoadingComplete(true)} />;
  }

  if (isCheckingAuth) {
    return <div style={{ padding: 24, fontFamily: 'sans-serif' }}>Checking admin session...</div>;
  }

  if (isLoggedIn) {
    return <Home onLogout={handleLogout} />;
  }

  return <Login onLoginSuccess={handleLoginSuccess} />;
}

export default App;
