"use client";
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { BookingProvider } from '@/context/BookingContext';
import { LanguageProvider } from '@/context/LanguageContext';
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
    pathname.startsWith('/event/') ||
    pathname.startsWith('/hotels/') ||
     pathname.startsWith('/payment/') ||
     pathname.startsWith('/payment-success')
  );

  const showHeader = mounted && isPublicPage;

  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
                <BookingProvider>
                  <div className="flex flex-col min-h-screen">
                    {showHeader && <Header />}
                    <main className="flex-grow">{children}</main>
                    {showHeader && <Footer />}
                  </div>
                </BookingProvider>
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
