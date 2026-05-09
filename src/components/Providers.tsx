"use client";
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { BookingProvider } from '@/context/BookingContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { NotificationProvider } from '@/context/NotificationContext';

const GOOGLE_CLIENT_ID = "766686842764-n7sbbot09vpc7239ll9kui0ffkgtlqtq.apps.googleusercontent.com";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <LanguageProvider>
        <NotificationProvider>
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
                <BookingProvider>
                  {children}
                </BookingProvider>
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </NotificationProvider>
      </LanguageProvider>
    </GoogleOAuthProvider>
  );
}
