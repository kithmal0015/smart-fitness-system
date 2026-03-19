import { useState } from 'react';
import './App.css';
import LodingP from './pages/LodingP';
import Login from './pages/Login';
import Home from './pages/Home';

function App() {
  const [isLoadingComplete, setIsLoadingComplete] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  if (!isLoadingComplete) {
    return <LodingP onComplete={() => setIsLoadingComplete(true)} />;
  }

  if (isLoggedIn) {
    return <Home onLogout={() => setIsLoggedIn(false)} />;
  }

  return <Login onLoginSuccess={() => setIsLoggedIn(true)} />;
}

export default App;
