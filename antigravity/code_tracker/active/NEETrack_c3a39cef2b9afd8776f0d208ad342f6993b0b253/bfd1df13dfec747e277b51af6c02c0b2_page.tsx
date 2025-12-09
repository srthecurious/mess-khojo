™'use client';

import ExamCountdown from '@/components/exam-countdown';
import MockTestCountdown from '@/components/mock-test-countdown';
import CountdownTimer from '@/components/countdown-timer';
import { DashboardBackground } from '@/components/ui/dashboard-background';
import DailyQuote from '@/components/daily-quote';
import Script from 'next/script';

export default function DashboardPage() {
  return (
    <div className="-m-8 flex-1 p-8 flex flex-col items-center justify-center relative overflow-hidden min-h-[calc(100vh-4rem)]">
      <DashboardBackground />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-7xl z-10">
        <ExamCountdown />
        <CountdownTimer />
        <MockTestCountdown />
        <DailyQuote />
      </div>
      <Script async={true} data-cfasync="false" src="//pl28085801.effectivegatecpm.com/48a2c7d50ab69852baf22279c014a0b5/invoke.js" />
      <div id="container-48a2c7d50ab69852baf22279c014a0b5" className="mt-8"></div>
    </div>
  );
}
™"(c3a39cef2b9afd8776f0d208ad342f6993b0b2532Ffile:///c:/Apps/NEETrack/NEETrack/src/app/%28app%29/dashboard/page.tsx:!file:///c:/Apps/NEETrack/NEETrack