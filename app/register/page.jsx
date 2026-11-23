'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-8 h-8 border-3 border-blue-900 border-t-transparent rounded-full animate-spin mb-3"></div>
      <p className="text-xs text-slate-500 font-semibold">Mengalihkan ke Katalog Seragam...</p>
    </div>
  );
}
