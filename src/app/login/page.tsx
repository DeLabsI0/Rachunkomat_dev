'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithGoogle, auth } from '@/lib/firebase-auth';

export default function Login() {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        checkUserAccounts(user.uid);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const checkUserAccounts = async (userId: string) => {
    try {
      const response = await fetch(`/api/check-user-accounts?userId=${userId}`);
      const data = await response.json();

      if (response.ok) {
        if (data.hasAccounts) {
          router.push('/accounts');
        } else {
          router.push('/link-bank');
        }
      } else {
        throw new Error(data.error || 'Failed to check user accounts');
      }
    } catch (error) {
      console.error('Error checking user accounts:', error);
      setError('An error occurred. Please try again.');
    }
  };

  const handleGoogleSignIn = async () => {
    console.log('Login page: Google Sign-In button clicked');
    try {
      const user = await signInWithGoogle();
      checkUserAccounts(user.uid);
    } catch (error) {
      console.error('Login page: Sign-in error:', error);
      setError('Failed to sign in. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        <div>
          <button
            onClick={handleGoogleSignIn}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Sign in with Google
          </button>
        </div>
        {error && (
          <p className="mt-2 text-center text-sm text-red-600">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}