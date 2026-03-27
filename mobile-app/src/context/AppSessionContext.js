import React, { createContext, useContext, useMemo, useState } from 'react';

const DARK_COLORS = {
  background: '#0A0A0A',
  surface: '#141414',
  surfaceAlt: '#1A1A1A',
  border: '#2A2A2A',
  borderFocused: '#C8F135',
  accent: '#C8F135',
  accentDark: '#9DC000',
  white: '#FFFFFF',
  textPrimary: '#FFFFFF',
  textSecondary: '#9A9A9A',
  textMuted: '#555555',
  error: '#FF4D4D',
  overlay: 'rgba(0,0,0,0.55)',
  overlayDark: 'rgba(0,0,0,0.75)',
  cardBg: 'rgba(20,20,20,0.92)',
  inputBg: 'rgba(255,255,255,0.06)',
};

const LIGHT_COLORS = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceAlt: '#F1F5F9',
  border: '#D8DEE9',
  borderFocused: '#84A20D',
  accent: '#A8C42A',
  accentDark: '#7D9600',
  white: '#FFFFFF',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#64748B',
  error: '#DC2626',
  overlay: 'rgba(15,23,42,0.35)',
  overlayDark: 'rgba(15,23,42,0.6)',
  cardBg: '#FFFFFF',
  inputBg: '#FFFFFF',
};

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [themeMode, setThemeMode] = useState('dark');
  const [authToken, setAuthToken] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  const value = useMemo(() => {
    const colors = themeMode === 'light' ? LIGHT_COLORS : DARK_COLORS;

    return {
      themeMode,
      setThemeMode,
      colors,
      authToken,
      currentUser,
      signIn: ({ token, user }) => {
        setAuthToken(String(token || ''));
        setCurrentUser(user || null);
      },
      signOut: () => {
        setAuthToken('');
        setCurrentUser(null);
      },
      updateProfile: (changes) => {
        setCurrentUser((prev) => ({
          ...(prev || {}),
          ...(changes || {}),
        }));
      },
    };
  }, [authToken, currentUser, themeMode]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useAppSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useAppSession must be used inside SessionProvider');
  }

  return context;
}
