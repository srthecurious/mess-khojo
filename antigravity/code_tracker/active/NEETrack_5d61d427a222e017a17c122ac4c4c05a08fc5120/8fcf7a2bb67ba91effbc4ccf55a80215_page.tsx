¶'use client';

import { useEffect } from 'react';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import '@/app/loader.css';

export default function RootPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading) {
      if (user) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    }
  }, [user, isUserLoading, router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-background">
      <div className="loader">
        <div className="truckWrapper">
          <div className="truckBody">
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 130 60"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M104.24,59.37H14.78a4,4,0,0,1-4-4V16.89a4,4,0,0,1,4-4H91.56a13.7,13.7,0,0,1,12.68,8.22L116,47.45V55.37a4,4,0,0,1-4,4ZM18.78,51.37H99.19v-26H18.78Z"
                fill="currentColor"
              ></path>
              <path
                d="M91.56,12.89h-76.78a4,4,0,0,0-4,4V29.11H99.19V21.11A8.22,8.22,0,0,0,91.56,12.89Z"
                fill="currentColor"
              ></path>
            </svg>
          </div>
          <div className="truckTires">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="12" cy="12" r="10" fill="currentColor"></circle>
              <circle cx="12" cy="12" r="4" fill="var(--background)"></circle>
            </svg>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="12" cy="12" r="10" fill="currentColor"></circle>
              <circle cx="12" cy="12" r="4" fill="var(--background)"></circle>
            </svg>
          </div>
          <div className="road"></div>
          <svg
            className="lampPost"
            width="40"
            height="90"
            viewBox="0 0 40 90"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M5 90V10H35V0L25 10H5" stroke="currentColor" strokeWidth="3" />
          </svg>
        </div>
      </div>
    </main>
  );
}
¶*cascade08"(5d61d427a222e017a17c122ac4c4c05a08fc512022file:///c:/Apps/NEETrack/NEETrack/src/app/page.tsx:!file:///c:/Apps/NEETrack/NEETrack