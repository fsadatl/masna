import { Vazirmatn } from 'next/font/google';
import { AuthProvider } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { Toaster } from 'react-hot-toast';
import '../styles/globals.css';

const vazirmatn = Vazirmatn({ subsets: ['arabic'], weight: ['200','300','400','500','700','800','900'] });

export const metadata = {
  title: 'پلتفرم همکاری ایده تا پروژه',
  description: 'پلتفرم همکاری سه‌جانبه بین ایده‌دهندگان، مجریان و کارفرمایان',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl">
      <body className={vazirmatn.className}>
        <AuthProvider>
          <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main className="container mx-auto px-4 py-8">
              {children}
            </main>
          </div>
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
