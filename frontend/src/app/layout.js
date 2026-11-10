'use client'; // Required because we are using React hooks for state
<<<<<<< HEAD

import { useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import "./globals.css";

=======

import { useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import './globals.css';

>>>>>>> cca901717d100a28975b9ab331e81d376a761836
export default function RootLayout({ children }) {
  const initAuth = useAuthStore((state) => state.initAuth);

  // Check localStorage for an existing session on mount
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <html lang="en">
      <body>
        {/* We will add <Navbar /> here in the next step */}
        <main className="min-h-screen">
          {children}
        </main>
        {/* We will add <Footer /> here in the next step */}
      </body>
    </html>
  );
}