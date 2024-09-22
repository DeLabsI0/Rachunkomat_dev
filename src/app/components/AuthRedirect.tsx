'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase-auth';
import { db } from '@/config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function AuthRedirect() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        // Check if the user has any linked accounts
        const requisitionsRef = collection(db, 'requisitions');
        const q = query(requisitionsRef, where('user_id', '==', user.uid));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          // User has linked accounts, redirect to the accounts page
          router.push('/accounts');
        } else {
          // User has no linked accounts, redirect to the link-bank page
          router.push('/link-bank');
        }
      } else {
        // User is not logged in, redirect to the main page
        router.push('/');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return null;
}