"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { isLoggedIn, logout, getUserData } from '../../../lib/auth'; // Adjusted path

export default function UserStatus() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const updateLoginState = () => {
      setLoggedIn(isLoggedIn());
      setUserName(getUserData().firstName);
    };
    updateLoginState();

    // Optional: Listen for storage changes to update across tabs
    window.addEventListener('storage', updateLoginState);
    return () => {
      window.removeEventListener('storage', updateLoginState);
    };
  }, []);

  // This effect will run when 'loggedIn' state changes internally (e.g. after handleLogout)
  // or if another component somehow modifies the login state and triggers a re-render here.
  useEffect(() => {
     setLoggedIn(isLoggedIn());
     setUserName(getUserData().firstName);
  }, [loggedIn]);


  const handleLogout = () => {
    logout(router);
    setLoggedIn(false); 
    setUserName(null);
  };

  const linkClassName = "text-neutral-500 underline-offset-4 hover:text-black hover:underline dark:text-neutral-400 dark:hover:text-neutral-300";
  const buttonClassName = `${linkClassName} ml-4`; // Add some margin for spacing

  if (loggedIn) {
    return (
      <>
        <li className="hidden md:list-item"> {/* Hide on mobile, will be handled by MobileMenu */}
          <Link href="/account" className={linkClassName}>
            Hi, {userName || 'Account'}
          </Link>
        </li>
        <li className="hidden md:list-item"> {/* Hide on mobile */}
          <button onClick={handleLogout} className={buttonClassName}>
            Logout
          </button>
        </li>
      </>
    );
  }

  return (
    <li className="hidden md:list-item"> {/* Hide on mobile */}
      <Link href="/login" prefetch={true} className={linkClassName}>
        Login
      </Link>
    </li>
  );
}
