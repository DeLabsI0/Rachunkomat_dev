'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { auth } from '@/lib/firebase-auth';

export default function AuthRouter({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (pathname === '/' || pathname === '/login') {
        // Allow access to the main page and login page without authentication
        setLoading(false);
      } else if (!user) {
        console.log('AuthRouter: No authenticated user, redirecting to login');
        router.push('/login');
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router, pathname]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
}