ç''use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FireballTimer } from '@/components/ui/fireball-timer';
import { Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePomodoro } from '@/context/pomodoro-context';

const PomodoroTimer = () => {
  const {
    mode,
    setMode,
    time,
    isActive,
    timerModes,
    toggleTimer,
    settings,
    handleSettingsChange,
    handleSaveSettings,
  } = usePomodoro();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div className="w-full max-w-sm h-[600px] rounded-[3rem] overflow-hidden shadow-2xl relative flex flex-col">
      {/* Top Section */}
      <div className="flex-[0.65] bg-[#0f2040] relative flex flex-col items-center p-6">
        {/* Settings */}
        <div className="w-full flex justify-end mb-4">
          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white/50 hover:text-white hover:bg-white/10 rounded-full">
                <Settings className="size-6" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-[#0f2040] border-white/10 text-slate-100">
              <DialogHeader>
                <DialogTitle className="text-white">Timer Settings</DialogTitle>
                <DialogDescription className="text-slate-400">
                  Adjust session lengths.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="focus" className="text-right text-slate-300">Focus</Label>
                  <Input id="focus" name="focus" type="number" value={settings.focus} onChange={handleSettingsChange} className="col-span-3 bg-[#0a152b] border-white/10 text-white" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="shortBreak" className="text-right text-slate-300">Short</Label>
                  <Input id="shortBreak" name="shortBreak" type="number" value={settings.shortBreak} onChange={handleSettingsChange} className="col-span-3 bg-[#0a152b] border-white/10 text-white" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="longBreak" className="text-right text-slate-300">Long</Label>
                  <Input id="longBreak" name="longBreak" type="number" value={settings.longBreak} onChange={handleSettingsChange} className="col-span-3 bg-[#0a152b] border-white/10 text-white" />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => { handleSaveSettings(); setIsSettingsOpen(false); }} className="bg-[#cbb08a] text-[#0f2040] hover:bg-[#dcc39e]">Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        {/* Mode Text */}
        <div className="text-sm uppercase text-white/70 mb-2 tracking-wider">{timerModes[mode].label}</div>
        {/* Timer */}
        <div className="flex-1 w-full flex items-center justify-center">
          <FireballTimer timeLeft={time} maxTime={timerModes[mode].time} isActive={isActive} mode={mode} />
        </div>
      </div>

      {/* Bottom Section */}
      <div className="flex-[0.35] bg-[#cbb08a] flex flex-col items-center justify-center relative">
        {/* GO Button */}
        <Button onClick={toggleTimer} className="w-48 h-14 rounded-full bg-[#0f2040] text-white text-lg font-medium tracking-widest border-2 border-white shadow-lg hover:bg-[#1a2f55] hover:scale-105 transition-all duration-300">
          {isActive ? 'PAUSE' : 'GO'}
        </Button>
        {/* Mode Selectors */}
        {/* Mode Selectors (Text) */}
        <div className="mt-8 flex gap-6 z-10">
          {(['focus', 'shortBreak', 'longBreak'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                "text-xs font-bold tracking-widest uppercase transition-all duration-300",
                mode === m
                  ? "text-[#0f2040] border-b-2 border-[#0f2040]"
                  : "text-[#0f2040]/40 hover:text-[#0f2040]/70 border-b-2 border-transparent"
              )}
            >
              {timerModes[m].label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PomodoroTimer;
ç'"(c3a39cef2b9afd8776f0d208ad342f6993b0b2532Cfile:///c:/Apps/NEETrack/NEETrack/src/components/pomodoro-timer.tsx:!file:///c:/Apps/NEETrack/NEETrack