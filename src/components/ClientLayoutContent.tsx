'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { ReactNode, useEffect } from 'react';

const publicPaths = ['/', '/tailwind-example', '/login', '/register'];

export default function ClientLayoutContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const isPublicPath = publicPaths.includes(pathname);

  useEffect(() => {
    console.log('ClientLayoutContent rendered');
    console.log('Current path:', pathname);
    console.log('Is public path:', isPublicPath);
    console.log('User:', user);
  }, [pathname, isPublicPath, user]);

  if (isPublicPath || user) {
    return <>{children}</>;
  }

  if (typeof window !== 'undefined') {
    console.log('Redirecting to login...');
    window.location.href = '/login';
  }

  return null;
}