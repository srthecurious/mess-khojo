# Implement Serenity (Dark & Gold) Pomodoro Design

## Goal Description
Refactor the `PomodoroTimer` component to match the user's provided reference image. The new design features a "Serenity" aesthetic: a deep dark blue background, bright gold/orange accents, and a clean, minimal layout.

## User Review Required
> [!NOTE]
> I am pivoting from the "Glassmorphism" design to this specific "Serenity" look based on your feedback and the uploaded image.

## Proposed Changes
### Components
#### [MODIFY] [CircularProgress](file:///c:/Apps/NEETrack/NEETrack/src/components/ui/circular-progress.tsx)
- Add a `timer-gradient-gold` definition to `defs`.
- Colors: Bright Gold to Soft Orange.

#### [MODIFY] [PomodoroTimer](file:///c:/Apps/NEETrack/NEETrack/src/components/pomodoro-timer.tsx)
- **Container**: Remove glass effects. Use a solid dark blue/black background (or `bg-card` if updated).
- **Theme**: Apply specific colors matching the image (Deep Navy background, Gold primary).
- **Layout**:
    - Header: "Focus Time" title, Session count.
    - Center: Large timer ring with Gold progress.
    - Bottom: Large Gold Play button.
    - Footer: Pill-shaped mode selectors (Focus, Short Break, Long Break).
- **Typography**: Clean sans-serif, white/off-white text.

## Verification Plan
### Manual Verification
- [ ] Verify the timer looks like the uploaded image.
- [ ] Check the Gold/Orange gradient on the ring.
- [ ] Ensure the Play button is Gold and prominent.
- [ ] Verify mode selectors match the "pill" style in the image.
