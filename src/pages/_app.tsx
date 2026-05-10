import React from 'react';
import { LanguageProvider } from '@/context/LanguageContext';
import { AuthProvider } from '@/context/AuthContext';
import { BookingProvider } from '@/context/BookingContext';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { NotificationProvider } from '@/context/NotificationContext';

const GOOGLE_CLIENT_ID = "766686842764-n7sbbot09vpc7239ll9kui0ffkgtlqtq.apps.googleusercontent.com";

export default function App({ Component, pageProps }) {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <LanguageProvider>
        <NotificationProvider>
          <AuthProvider>
            <BookingProvider>
              <CartProvider>
                <WishlistProvider>
                  <Component {...pageProps} />
                </WishlistProvider>
              </CartProvider>
            </BookingProvider>
          </AuthProvider>
        </NotificationProvider>
      </LanguageProvider>
    </GoogleOAuthProvider>
  );
}
