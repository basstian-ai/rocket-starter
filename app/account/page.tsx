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

  // Main content display
  return (
    <div className="min-h-screen bg-gray-100 py-8 dark:bg-gray-900">
      <div className="container mx-auto max-w-3xl rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
        <h1 className="mb-6 border-b border-gray-300 pb-4 text-center text-3xl font-bold text-gray-900 dark:border-gray-700 dark:text-white">
          My Account
        </h1>
        
        <div className="mb-8 flex flex-col items-center md:flex-row md:items-start">
          {userData?.image && (
            <img 
              src={userData.image} 
              alt={`${userData.firstName || 'User'}'s avatar`} 
              className="mb-4 h-32 w-32 rounded-full border-4 border-blue-500 object-cover shadow-md md:mb-0 md:mr-8" 
            />
          )}
          <div className="text-center md:text-left">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
              Welcome, {userData?.firstName || 'User'}!
            </h2>
            {userData?.username && <p className="mt-1 text-gray-600 dark:text-gray-400">@{userData.username}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-md bg-gray-50 p-4 shadow dark:bg-gray-700">
            <h3 className="mb-3 text-lg font-semibold text-gray-700 dark:text-gray-200">Personal Information</h3>
            <p><strong className="text-gray-600 dark:text-gray-300">Full Name:</strong> {userData?.firstName} {userData?.lastName}</p>
            <p><strong className="text-gray-600 dark:text-gray-300">Email:</strong> {userData?.email}</p>
            {userData?.phone && <p><strong className="text-gray-600 dark:text-gray-300">Phone:</strong> {userData.phone}</p>}
            {userData?.birthDate && <p><strong className="text-gray-600 dark:text-gray-300">Birth Date:</strong> {userData.birthDate}</p>}
            {userData?.age && <p><strong className="text-gray-600 dark:text-gray-300">Age:</strong> {userData.age}</p>}
            {userData?.gender && <p><strong className="text-gray-600 dark:text-gray-300">Gender:</strong> {userData.gender}</p>}
          </div>

          {/* Address & Academic Section Commented Out 
          <div className="rounded-md bg-gray-50 p-4 shadow dark:bg-gray-700">
            <h3 className="mb-3 text-lg font-semibold text-gray-700 dark:text-gray-200">Address & Academic</h3>
            {userData?.address && (
              <p>
                <strong className="text-gray-600 dark:text-gray-300">Address:</strong> 
                {userData.address.address ? ` ${userData.address.address},` : ''}
                {userData.address.city ? ` ${userData.address.city},` : ''}
                {userData.address.state ? ` ${userData.address.state}` : ''}
                {userData.address.postalCode ? ` ${userData.address.postalCode}` : ''}
              </p>
            )}
            {userData?.university && <p><strong className="text-gray-600 dark:text-gray-300">University:</strong> {userData.university}</p>}
          </div>
          */}
          
          {/* Technical Details Section Commented Out
          <div className="rounded-md bg-gray-50 p-4 shadow dark:bg-gray-700 md:col-span-2">
             <h3 className="mb-3 text-lg font-semibold text-gray-700 dark:text-gray-200">Technical Details</h3>
            {userData?.ip && <p><strong className="text-gray-600 dark:text-gray-300">IP Address:</strong> {userData.ip}</p>}
            {userData?.macAddress && <p><strong className="text-gray-600 dark:text-gray-300">MAC Address:</strong> {userData.macAddress}</p>}
          </div>
          */}
        </div>

        <div className="mt-8 text-center">
          <Link href="/orders">
            <span className="inline-block cursor-pointer rounded-lg bg-green-600 px-6 py-3 text-center text-lg font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-300 dark:bg-green-500 dark:hover:bg-green-600 dark:focus:ring-green-800">
              View Order History
            </span>
          </Link>
          <button
            onClick={handleLogout}
            className="mt-4 inline-block cursor-pointer rounded-lg bg-red-600 px-6 py-3 text-center text-lg font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-300 disabled:opacity-50 dark:bg-red-500 dark:hover:bg-red-600 dark:focus:ring-red-800 sm:ml-4 sm:mt-0"
          >
            Logout
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
}
