'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function Callback() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const error = searchParams.get('error');
    const country = searchParams.get('country');

    if (error) {
      // Redirect immediately to bank selection page
      router.push(`/link-bank${country ? `?country=${country}` : ''}`);
    } else {
      const requisitionId = searchParams.get('requisition_id') || searchParams.get('id');
      if (requisitionId) {
        // Redirect to accounts page
        router.push(`/accounts/${requisitionId}`);
      } else {
        // If no requisition ID, redirect to bank selection
        router.push(`/link-bank${country ? `?country=${country}` : ''}`);
      }
    }
  }, [searchParams, router]);

  return <div>Redirecting...</div>;
}