'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/slots');
  }, [router]);

  return <div style={{ padding: 40, textAlign: 'center' }}>Cargando panel...</div>;
}
