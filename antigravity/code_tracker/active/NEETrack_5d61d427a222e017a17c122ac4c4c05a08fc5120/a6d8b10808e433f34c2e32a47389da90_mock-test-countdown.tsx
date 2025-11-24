˜&'use client';

import { useState, useEffect } from 'react';
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

const MockTestCountdown = () => {
  const [targetDate, setTargetDate] = useState<Date | null>(null);
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  // Load the saved date from localStorage on initial client render
  useEffect(() => {
    const savedDate = localStorage.getItem('mockTestTargetDate');
    if (savedDate) {
      const date = new Date(savedDate);
      setTargetDate(date);
      setSelectedDate(date);
    }
  }, []);

  // Recalculate days left whenever the target date changes
  useEffect(() => {
    if (!targetDate) {
      setDaysLeft(null);
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
        setDaysLeft(Math.ceil(difference / (1000 * 60 * 60 * 24)));
      } else {
        setDaysLeft(null); // Or show a "past due" message
      }
    };

    calculateDaysLeft();
    // Update once a day
    const interval = setInterval(calculateDaysLeft, 1000 * 60 * 60 * 24);
    return () => clearInterval(interval);
  }, [targetDate]);

  const handleSaveDate = () => {
    if (selectedDate) {
      setTargetDate(selectedDate);
      localStorage.setItem('mockTestTargetDate', selectedDate.toISOString());
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
          <DialogContent aria-describedby="set-date-desc" aria-labelledby="set-date-title">
            <DialogHeader>
              <DialogTitle id="set-date-title">Set Mock Test Date</DialogTitle>
              <DialogDescription id="set-date-desc">
                Select the date of your next mock test to start the countdown.
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
          <>
            <p className="text-9xl font-bold text-primary">
              {daysLeft}
            </p>
            <p className="text-sm text-muted-foreground uppercase tracking-widest">
              Days Until Mock
            </p>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-28">
            <p className="text-muted-foreground">No date set.</p>
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
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <CalendarIcon className="h-4 w-4" />
        <span>{targetDate ? format(targetDate, 'PPP') : 'Not Set'}</span>
      </div>
    </div>
  );
};

export default MockTestCountdown;
˜&*cascade08"(5d61d427a222e017a17c122ac4c4c05a08fc51202Hfile:///c:/Apps/NEETrack/NEETrack/src/components/mock-test-countdown.tsx:!file:///c:/Apps/NEETrack/NEETrack