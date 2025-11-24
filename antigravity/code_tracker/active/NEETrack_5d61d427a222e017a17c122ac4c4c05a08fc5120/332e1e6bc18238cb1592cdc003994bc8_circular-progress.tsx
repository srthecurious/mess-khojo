∑'use client';
import * as React from 'react';
import { cn } from '@/lib/utils';

interface CircularProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  gradientId?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  size = 100,
  strokeWidth = 10,
  className,
  gradientId = 'progress-gradient'
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // Ensure offset doesn't go below 0
  const offset = Math.max(0, circumference - (value / 100) * circumference);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={cn('transform -rotate-90', className)}
    >
      <defs>
        <linearGradient id="timer-gradient-serenity" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="hsl(var(--accent))" />
          <stop offset="100%" stopColor="hsl(var(--primary))" />
        </linearGradient>
        <linearGradient id={gradientId} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="hsl(var(--accent))" />
          <stop offset="100%" stopColor="hsl(var(--primary))" />
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
      />
          <circle
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeLinecap="round"
            r={radius}
            cx={size / 2}
            cy={size / 2}
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: offset,
              transition: 'stroke-dashoffset 0.5s ease-in-out',
            }}
          />
        </svg>
        );
};
Ì	 *cascade08Ì	Ó	*cascade08Ó	¸	 *cascade08¸	˝	*cascade08˝	∞
 *cascade08∞
≤
*cascade08≤
”
 *cascade08”
◊
*cascade08◊
Ó
 *cascade08Ó
Ú
*cascade08Ú
ö *cascade08öû*cascade08ûπ *cascade08πΩ*cascade08Ω· *cascade08·Â*cascade08Â¸ *cascade08¸ˇ*cascade08ˇá *cascade08áà*cascade08àî *cascade08îò*cascade08òØ *cascade08Ø∞*cascade08∞∏ *cascade08∏ª*cascade08ª  *cascade08 Õ*cascade08Õ’ *cascade08’÷*cascade08÷‡ *cascade08‡‰*cascade08‰è *cascade08èê*cascade08êö *cascade08öù*cascade08ù∏ *cascade08∏º*cascade08ºÅ *cascade08ÅÖ*cascade08Öâ *cascade08âã*cascade08ãë *cascade08ëì*cascade08ìó *cascade08óõ*cascade08õß *cascade08ß≠*cascade08≠∑ *cascade08"(5d61d427a222e017a17c122ac4c4c05a08fc51202Ifile:///c:/Apps/NEETrack/NEETrack/src/components/ui/circular-progress.tsx:!file:///c:/Apps/NEETrack/NEETrack