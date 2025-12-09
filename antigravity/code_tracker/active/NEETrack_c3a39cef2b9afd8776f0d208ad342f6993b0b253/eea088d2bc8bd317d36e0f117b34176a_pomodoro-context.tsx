®*'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  Dispatch,
  SetStateAction,
  useRef,
} from 'react';
import { BrainCircuit, Coffee } from 'lucide-react';
import { SoundManager } from '@/lib/soundManager';

type TimerMode = 'focus' | 'shortBreak' | 'longBreak';

interface TimerModeDetails {
  time: number;
  label: string;
  icon: JSX.Element;
}

interface PomodoroContextType {
  mode: TimerMode;
  setMode: Dispatch<SetStateAction<TimerMode>>;
  time: number;
  isActive: boolean;
  sessionCount: number;
  timerModes: Record<TimerMode, TimerModeDetails>;
  toggleTimer: () => void;
  resetTimer: () => void;
  settings: {
    focus: number;
    shortBreak: number;
    longBreak: number;
  };
  handleSettingsChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSaveSettings: () => void;
}

const PomodoroContext = createContext<PomodoroContextType | undefined>(
  undefined
);

export const PomodoroProvider = ({ children }: { children: ReactNode }) => {
  const [timerModes, setTimerModes] = useState<Record<TimerMode, TimerModeDetails>>({
    focus: { time: 25 * 60, label: 'Focus Time', icon: <BrainCircuit className="size-5" /> },
    shortBreak: { time: 5 * 60, label: 'Short Break', icon: <Coffee className="size-5" /> },
    longBreak: { time: 15 * 60, label: 'Long Break', icon: <Coffee className="size-5" /> },
  });

  const [mode, setMode] = useState<TimerMode>('focus');
  const [time, setTime] = useState(timerModes[mode].time);
  const [isActive, setIsActive] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);

  // Refs to handle background timing issues
  const timerEndDate = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const [settings, setSettings] = useState({
    focus: timerModes.focus.time / 60,
    shortBreak: timerModes.shortBreak.time / 60,
    longBreak: timerModes.longBreak.time / 60,
  });

  // This effect resets the timer when the mode or settings change
  useEffect(() => {
    setIsActive(false);
    setTime(timerModes[mode].time);
  }, [mode, timerModes]);

  // This is the main timer effect
  useEffect(() => {
    // Clear any existing interval when the effect re-runs or component unmounts
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (isActive) {
      // If the timer is starting, set the end date, unless it's already set
      if (timerEndDate.current === null) {
        timerEndDate.current = Date.now() + time * 1000;
      }

      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const newRemainingTime = Math.round((timerEndDate.current! - now) / 1000);

        if (newRemainingTime > 0) {
          setTime(newRemainingTime);
        } else {
          setTime(0);
          // Timer finished logic
          if (mode === 'focus') {
            setSessionCount((prev) => prev + 1);
            if ((sessionCount + 1) % 4 === 0) {
              setMode('longBreak');
            } else {
              setMode('shortBreak');
            }
          } else {
            setMode('focus');
          }
          setIsActive(false); // This will trigger the effect to clean up
          SoundManager.playComplete();
        }
      }, 500); // Check every 500ms for better responsiveness
    } else {
      // If timer is paused or reset, clear the end date
      timerEndDate.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, mode, sessionCount, timerModes]); // Rerun when activity state or mode changes

  const toggleTimer = () => {
    const newState = !isActive;
    setIsActive(newState);
    if (newState) {
      SoundManager.playStart();
    } else {
      SoundManager.playPause();
    }
  };

  const resetTimer = () => {
    setIsActive(false);
    setTime(timerModes[mode].time);
    // sessionCount is not reset here intentionally
  };

  const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: Number(value) }));
  };

  const handleSaveSettings = () => {
    const newTimerModes = {
      focus: { ...timerModes.focus, time: settings.focus * 60 },
      shortBreak: { ...timerModes.shortBreak, time: settings.shortBreak * 60 },
      longBreak: { ...timerModes.longBreak, time: settings.longBreak * 60 },
    };
    setTimerModes(newTimerModes);
    // If the currently active mode's time was changed, update the timer
    if (!isActive) {
      setTime(newTimerModes[mode].time);
    }
  };

  return (
    <PomodoroContext.Provider
      value={{
        mode,
        setMode,
        time,
        isActive,
        sessionCount,
        timerModes,
        toggleTimer,
        resetTimer,
        settings,
        handleSettingsChange,
        handleSaveSettings,
      }}
    >
      {children}
    </PomodoroContext.Provider>
  );
};

export const usePomodoro = () => {
  const context = useContext(PomodoroContext);
  if (context === undefined) {
    throw new Error('usePomodoro must be used within a PomodoroProvider');
  }
  return context;
};
®*"(c3a39cef2b9afd8776f0d208ad342f6993b0b2532Bfile:///c:/Apps/NEETrack/NEETrack/src/context/pomodoro-context.tsx:!file:///c:/Apps/NEETrack/NEETrack