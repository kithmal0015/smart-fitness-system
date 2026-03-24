import { Platform } from 'react-native';

const apiFromEnv = String(process.env.EXPO_PUBLIC_API_BASE_URL || '').trim();

function trimTrailingSlash(url) {
  return String(url || '').replace(/\/+$/, '');
}

export function getApiBaseUrl() {
  if (apiFromEnv) {
    return trimTrailingSlash(apiFromEnv);
  }

  // Android emulator cannot resolve localhost of the host machine directly.
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000';
  }

  return 'http://localhost:5000';
}

export const API_BASE_URL = getApiBaseUrl();
