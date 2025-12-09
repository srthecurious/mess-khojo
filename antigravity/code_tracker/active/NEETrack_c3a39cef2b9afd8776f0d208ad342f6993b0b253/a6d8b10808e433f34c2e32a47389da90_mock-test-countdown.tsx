ÌD'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Settings } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { CircularProgress } from '@/components/ui/circular-progress';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';

type MockTest = {
  id: string;
  testName: string;
  examDate: {
    toDate: () => Date;
  } | Date;
};

const MockTestCountdown = () => {
  const { user } = useUser();
  const firestore = useFirestore();
  const [targetDate, setTargetDate] = useState<Date | null>(null);
  const [testName, setTestName] = useState<string>('');
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [progress, setProgress] = useState(100);
  const [totalDays, setTotalDays] = useState<number>(30); // Default 30 days

  // Fetch mock tests from Firestore
  const mockTestsQuery = useMemoFirebase(
    () => (user ? collection(firestore, 'users', user.uid, 'mockTests') : null),
    [firestore, user]
  );
  const { data: mockTests } = useCollection<MockTest>(mockTestsQuery);

  // Find the next upcoming exam
  const nextExam = useMemo(() => {
    if (!mockTests || mockTests.length === 0) return null;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const upcomingTests = mockTests
      .map(test => {
        const examDate = test.examDate instanceof Date
          ? test.examDate
          : test.examDate?.toDate?.();
        return { ...test, examDateObj: examDate };
      })
      .filter(test => {
        if (!test.examDateObj) return false;
        const testDate = new Date(
          test.examDateObj.getFullYear(),
          test.examDateObj.getMonth(),
          test.examDateObj.getDate()
        );
        return testDate >= today;
      })
      .sort((a, b) => {
        const dateA = a.examDateObj!.getTime();
        const dateB = b.examDateObj!.getTime();
        return dateA - dateB;
      });

    return upcomingTests.length > 0 ? upcomingTests[0] : null;
  }, [mockTests]);

  // Update target date when next exam changes
  useEffect(() => {
    if (nextExam && nextExam.examDateObj) {
      setTargetDate(nextExam.examDateObj);
      setTestName(nextExam.testName);
      setSelectedDate(nextExam.examDateObj);

      // Calculate total days from today
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const total = Math.ceil((nextExam.examDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      setTotalDays(total > 0 ? total : 30);
    } else {
      // Fall back to localStorage if no upcoming exams
      const savedDate = localStorage.getItem('mockTestTargetDate');
      const savedStartDate = localStorage.getItem('mockTestStartDate');

      if (savedDate) {
        const date = new Date(savedDate);
        setTargetDate(date);
        setSelectedDate(date);
        setTestName('Manual Override');

        if (savedStartDate) {
          const start = new Date(savedStartDate);
          const total = Math.ceil((date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
          setTotalDays(total > 0 ? total : 30);
        }
      }
    }
  }, [nextExam]);

  // Recalculate days left whenever the target date changes
  useEffect(() => {
    if (!targetDate) {
      setDaysLeft(null);
      setProgress(0);
      return;
    }

    const calculateDaysLeft = () => {
      const now = new Date();
      // Set both dates to midnight to compare just the day part
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const target = new Date(
        targetDate.getFullYear(),
        targetDate.getMonth(),
        targetDate.getDate()
      );

      const difference = target.getTime() - today.getTime();

      if (difference >= 0) {
        const remaining = Math.ceil(difference / (1000 * 60 * 60 * 24));
        setDaysLeft(remaining);

        // Calculate progress (reducing effect: progress decreases as days decrease)
        const progressPercentage = (remaining / totalDays) * 100;
        setProgress(Math.min(100, Math.max(0, progressPercentage)));
      } else {
        setDaysLeft(null);
        setProgress(0);
      }
    };

    calculateDaysLeft();
    // Update once a day
    const interval = setInterval(calculateDaysLeft, 1000 * 60 * 60 * 24);
    return () => clearInterval(interval);
  }, [targetDate, totalDays]);

  const handleSaveDate = () => {
    if (selectedDate) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // Calculate total days from today to selected date
      const total = Math.ceil((selectedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      setTotalDays(total > 0 ? total : 30);

      setTargetDate(selectedDate);
      setTestName('Manual Override');
      localStorage.setItem('mockTestTargetDate', selectedDate.toISOString());
      localStorage.setItem('mockTestStartDate', today.toISOString());
      setIsDialogOpen(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col justify-between rounded-2xl bg-card/80 p-6 shadow-lg backdrop-blur-md border border-border/30">
      <div className="flex items-center justify-between text-card-foreground/80">
        <h2 className="font-semibold text-lg">Next Mock Test</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-card-foreground/70 hover:bg-transparent hover:text-foreground -mr-2 -mt-2"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Set Mock Test Date</DialogTitle>
              <DialogDescription>
                Select a date to manually override the countdown. The countdown will automatically use the next exam from your logged tests.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                initialFocus
              />
            </div>
            <DialogFooter>
              <Button onClick={handleSaveDate}>Save Date</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="my-6 text-center flex-grow flex flex-col items-center justify-center">
        {daysLeft !== null ? (
          <div className="relative flex size-48 items-center justify-center">
            <CircularProgress value={progress} size={192} strokeWidth={8} gradientId="mock-test-gradient" />
            <div className="absolute flex flex-col items-center">
              <p className="text-7xl font-bold text-foreground">
                {daysLeft}
              </p>
              <p className="text-sm text-muted-foreground">Days Until Mock</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-48">
            <p className="text-muted-foreground">No upcoming exams.</p>
            <Button
              variant="link"
              className="text-primary"
              onClick={() => setIsDialogOpen(true)}
            >
              Set Mock Test Date
            </Button>
          </div>
        )}
      </div>
      <div className="flex flex-col items-center gap-1">
        {testName && (
          <p className="text-xs text-muted-foreground font-medium">{testName}</p>
        )}
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <CalendarIcon className="h-4 w-4" />
          <span>{targetDate ? format(targetDate, 'PPP') : 'Not Set'}</span>
        </div>
      </div>
    </div>
  );
};

export default MockTestCountdown;

ÌD"(c3a39cef2b9afd8776f0d208ad342f6993b0b2532Hfile:///c:/Apps/NEETrack/NEETrack/src/components/mock-test-countdown.tsx:!file:///c:/Apps/NEETrack/NEETrack