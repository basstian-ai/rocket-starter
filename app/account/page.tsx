"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Footer from '../../components/layout/footer'; // Target import path
import { logout } from '../../lib/auth'; // Import logout

interface UserData {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  image: string;
  age?: number;
  gender?: string;
  phone?: string;
  birthDate?: string;
  university?: string;
  address?: {
    address?: string;
    city?: string;
    postalCode?: string;
    state?: string;
  };
  macAddress?: string;
  ip?: string;
}

export default function AccountPage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const handleLogout = () => {
    logout(router);
  };

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (!storedUserId) {
      router.push('/login');
      setIsLoading(false); // Set loading to false before early return
      return;
    }

    const fetchAccountDetails = async () => {
      console.log('AccountPage: userId:', storedUserId); // Log userId
      setIsLoading(true); // Ensure loading is true at the start of fetch
      setError(''); // Clear previous errors

      try {
        const response = await fetch(`/api/account?userId=${storedUserId}`);

        if (!response.ok) {
          // Attempt to parse error message from API, or use status text
          const errorData = await response.json().catch(() => ({})); // Catch if response.json() itself fails
          console.warn('AccountPage: API error response:', errorData, 'Status:', response.status); // Log API error
          setError(errorData.message || `Error: ${response.status} ${response.statusText || 'Failed to load account details.'}`);
        } else {
          const data = await response.json(); // This could still fail if body is not JSON despite response.ok
          console.log('AccountPage: Raw data from API:', data); // Log raw data
                                          // The outer catch block will handle such a failure.
          if (data && typeof data === 'object') {
            setUserData(data);
          } else {
            setError('Received invalid user data format.');
          }
        }
      } catch (err) { // This catch handles network errors for fetch, or if response.json() in the 'else' block fails
        console.error('AccountPage: Error during fetch/processing:', err); // Log caught error
        // Check if err is an instance of Error to safely access message property
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(`An unexpected error occurred: ${errorMessage}. Please try refreshing the page.`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAccountDetails();
  }, [router]); // router is a dependency of useEffect

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p className="text-lg text-gray-700 dark:text-gray-300">Loading account details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-md dark:bg-gray-800">
          <h2 className="mb-4 text-xl font-semibold text-red-600 dark:text-red-500">Error</h2>
          <p className="mb-6 text-gray-700 dark:text-gray-300">{error}</p>
          <Link href="/login">
            <span className="cursor-pointer rounded-lg bg-blue-600 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-800">
              Go to Login
            </span>
          </Link>
        </div>
      </div>
    );
  }

  if (!userData) {
    // This case might happen if loading finished, no error, but userData is still null
    // (e.g. API returned success but empty data unexpectedly)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 dark:bg-gray-900">
         <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-md dark:bg-gray-800">
          <p className="mb-6 text-gray-700 dark:text-gray-300">No account details found. You might need to log in again.</p>
          <Link href="/login">
            <span className="cursor-pointer rounded-lg bg-blue-600 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-800">
              Go to Login
            </span>
          </Link>
        </div>
      </div>
    );
  }

  // Main content display for Iteration 4 diagnostics
  return (
    <div className="container mx-auto p-4"> {/* Simplified outer container */}
      <h1 className="text-2xl font-bold mb-4">My Account</h1>
      <p>Account page rendered with minimal content for diagnostics.</p>
      {/* Still display something minimal from userData to ensure it's processed, and it is not null */}
      <p>User ID: {userData?.id}</p> 
      
      {/* 
        All previous detailed display of userData (name, email, address, etc.),
        Link to orders, Logout button are effectively commented out by replacing the return block.
        The Footer component previously here is also now outside this minimal return.
        The main layout (app/layout.tsx) will provide its own Footer if this page doesn't.
      */}
    </div>
  );
}
