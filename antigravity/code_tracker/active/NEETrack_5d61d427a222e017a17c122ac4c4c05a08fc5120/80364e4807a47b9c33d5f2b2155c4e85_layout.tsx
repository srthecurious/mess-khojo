êimport type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from '@/firebase';

export const metadata: Metadata = {
  title: 'NEETrack',
  description: 'Track your progress, ace the exam.',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="theme-neon-glass dark">
      <body>
        <FirebaseClientProvider>
          {children}
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
ê*cascade08"(5d61d427a222e017a17c122ac4c4c05a08fc512024file:///c:/Apps/NEETrack/NEETrack/src/app/layout.tsx:!file:///c:/Apps/NEETrack/NEETrack