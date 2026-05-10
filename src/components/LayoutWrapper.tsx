"use client";
import { Header, Footer } from '@/components/Layout';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else if (savedTheme === "light") {
      document.documentElement.classList.remove("dark");
    }
    setMounted(true);
  }, []);

  const isPublicPage = mounted && (
    pathname === '/' || 
    pathname === '/products' || 
    pathname === '/festivals' || 
    pathname === '/about' ||
    pathname.startsWith('/products/') ||
    pathname.startsWith('/festivals/') ||
    (pathname.startsWith('/event/') && !pathname.endsWith('/tickets') && !pathname.includes('/tickets/') && !pathname.endsWith('/package') && !pathname.endsWith('/hotels') && !pathname.endsWith('/transport')) ||
    pathname.startsWith('/hotels/') ||
    pathname.startsWith('/payment/') ||
    pathname.startsWith('/payment-success')
  );

  const showHeader = mounted && isPublicPage;

  return (
    <div className="flex flex-col min-h-screen">
      {showHeader && <Header />}
      <main className="flex-grow">{children}</main>
      {showHeader && <Footer />}
    </div>
  );
}
