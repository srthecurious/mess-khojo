Û)'use client';

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface FireballTimerProps {
    timeLeft: number;
    maxTime: number;
    isActive: boolean;
    mode: 'focus' | 'shortBreak' | 'longBreak';
}

export function FireballTimer({ timeLeft, maxTime, isActive, mode }: FireballTimerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const progress = timeLeft / maxTime;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;

        const resizeCanvas = () => {
            if (containerRef.current && canvas) {
                const { width, height } = containerRef.current.getBoundingClientRect();
                const dpr = window.devicePixelRatio || 1;
                canvas.width = width * dpr;
                canvas.height = height * dpr;
                ctx.scale(dpr, dpr);
                canvas.style.width = `${width}px`;
                canvas.style.height = `${height}px`;
            }
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        const animate = () => {
            if (!ctx || !canvas) return;

            const width = canvas.width / (window.devicePixelRatio || 1);
            const height = canvas.height / (window.devicePixelRatio || 1);
            ctx.clearRect(0, 0, width, height);

            const centerX = width / 2;
            const centerY = height / 2;
            const maxRadius = Math.min(width, height) * 0.40;
            const strokeWidth = 6; // Thicker stroke for the nature look

            // 1. Background Ring (Track)
            // Very subtle white track
            ctx.beginPath();
            ctx.arc(centerX, centerY, maxRadius, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = strokeWidth;
            ctx.stroke();

            // 2. Progress Ring
            const startAngle = -Math.PI / 2;
            const endAngle = startAngle + (Math.PI * 2 * progress);

            ctx.beginPath();
            ctx.arc(centerX, centerY, maxRadius, startAngle, endAngle);
            ctx.strokeStyle = '#ffffff'; // Pure White
            ctx.lineWidth = strokeWidth;
            ctx.lineCap = 'round';

            // Soft outer glow
            ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
            ctx.shadowBlur = 15;
            ctx.stroke();

            // Reset shadow
            ctx.shadowBlur = 0;

            // 3. Leaf Icon Tip
            if (progress > 0) {
                const tipX = centerX + Math.cos(endAngle) * maxRadius;
                const tipY = centerY + Math.sin(endAngle) * maxRadius;

                ctx.save();
                ctx.translate(tipX, tipY);
                // Rotate leaf to follow the arc + 90 degrees to point outward/tangent
                ctx.rotate(endAngle + Math.PI / 2);

                // Draw Leaf Shape
                ctx.beginPath();
                // Simple leaf shape using bezier curves
                ctx.moveTo(0, 0);
                ctx.bezierCurveTo(5, -5, 10, -10, 0, -15); // Right side
                ctx.bezierCurveTo(-10, -10, -5, -5, 0, 0); // Left side

                // Second smaller leaf (sprout)
                ctx.moveTo(0, -5);
                ctx.bezierCurveTo(3, -8, 5, -12, 2, -12);
                ctx.bezierCurveTo(0, -10, 0, -8, 0, -5);

                ctx.fillStyle = '#ffffff';
                ctx.fill();

                // Leaf Glow
                ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
                ctx.shadowBlur = 10;
                ctx.fill();

                ctx.restore();
            }

            animationFrameId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            cancelAnimationFrame(animationFrameId);
        };
    }, [isActive, progress]);

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    return (
        <div ref={containerRef} className="relative w-full h-full flex items-center justify-center">
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
            />

            <div className="relative z-10 flex flex-col items-center justify-center">
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-7xl font-light tracking-tight font-sans" // Changed to sans for clean look
                    style={{
                        color: '#ffffff',
                        textShadow: '0 0 20px rgba(255, 255, 255, 0.2)',
                    }}
                >
                    {formattedTime}
                </motion.div>
            </div>
        </div>
    );
}
Û)"(c3a39cef2b9afd8776f0d208ad342f6993b0b2532Ffile:///c:/Apps/NEETrack/NEETrack/src/components/ui/fireball-timer.tsx:!file:///c:/Apps/NEETrack/NEETrack