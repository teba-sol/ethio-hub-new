"use client";
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { Header, Footer } from '@/components/Layout';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import '@/index.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isPublicPage = mounted && (
    pathname === '/' || 
    pathname === '/products' || 
    pathname === '/festivals' || 
    pathname === '/about' ||
    pathname.startsWith('/products/') ||
    pathname.startsWith('/festivals/') ||
    pathname.startsWith('/payment/')
  );

  const showHeader = mounted && isPublicPage;

  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <div className="flex flex-col min-h-screen">
                {showHeader && <Header />}
                <main className="flex-grow">{children}</main>
                {showHeader && <Footer />}
              </div>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
