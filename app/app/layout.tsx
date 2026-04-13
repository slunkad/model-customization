import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/layout/Sidebar';
import { Toaster } from '@/components/ui/sonner';
import { ExperimentsProvider } from '@/context/ExperimentsContext';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ModelForge — Model Customization Platform',
  description: 'End-to-end LLM customization for application developers',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="h-full bg-slate-50 antialiased">
        <ExperimentsProvider>
          <Sidebar />
          <main className="ml-[240px] min-h-screen">
            {children}
          </main>
          <Toaster position="bottom-right" />
        </ExperimentsProvider>
      </body>
    </html>
  );
}
