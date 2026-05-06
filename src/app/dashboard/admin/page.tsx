"use client";
import { useEffect, useState } from 'react';

export default function AdminPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    window.location.href = '/dashboard/admin/overview';
  }, [mounted]);

  return null;
}