// lib/auth.ts
// Using AppRouterInstance as per suggestion for Next.js 13+ App Router
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

// Helper to check if running in browser
const isBrowser = () => typeof window !== 'undefined';

export const getUserId = (): string | null => {
  if (isBrowser()) {
    return localStorage.getItem('userId');
  }
  return null;
};

interface UserSessionData {
  id: string | null;
  firstName: string | null;
  username: string | null; // Changed from userUsername to username to match localStorage key
}

export const getUserData = (): UserSessionData => {
  if (isBrowser()) {
    return {
      id: localStorage.getItem('userId'),
      firstName: localStorage.getItem('userFirstName'),
      username: localStorage.getItem('username'), // Changed from userUsername
    };
  }
  return { id: null, firstName: null, username: null };
};

export const isLoggedIn = (): boolean => {
  if (isBrowser()) {
    const userId = localStorage.getItem('userId');
    return !!userId; // Returns true if userId exists and is not an empty string
  }
  return false;
};

export const logout = (router: AppRouterInstance) => {
  if (isBrowser()) {
    localStorage.removeItem('userId');
    localStorage.removeItem('userFirstName');
    localStorage.removeItem('username'); // Changed from userUsername
    router.push('/login');
  }
};
