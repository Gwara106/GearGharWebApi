import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { CartProvider } from '@/lib/cart-context';
import { AuthProvider } from '@/src/contexts/AuthContext';

export const metadata: Metadata = {
  title: 'GearGhar - Premium Motorcycle Parts',
  description: 'Find the best motorcycle parts, accessories, and gear at GearGhar. Shop helmets, handlebars, gloves, tyres, exhausts and more.',
  keywords: ['motorcycle', 'parts', 'accessories', 'helmet', 'gloves', 'tyres', 'exhausts'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <CartProvider>
            <Header />
            <main className="min-h-screen">
              {children}
            </main>
            <Footer />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
