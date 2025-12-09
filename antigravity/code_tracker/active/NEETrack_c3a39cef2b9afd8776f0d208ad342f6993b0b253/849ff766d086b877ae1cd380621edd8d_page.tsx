„'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MessageSquare, ArrowLeft, Sparkles } from 'lucide-react';

export default function FeedbackPage() {
    return (
        <div className="min-h-screen bg-[#0f2040] flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Elements (Subtle) */}
            <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

            <div className="w-full max-w-md relative z-10">
                {/* Back Link */}
                <Link
                    href="/dashboard"
                    className="inline-flex items-center text-[#cbb08a] hover:text-white transition-colors mb-8 group"
                >
                    <ArrowLeft className="size-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-medium tracking-widest uppercase">Back to Dashboard</span>
                </Link>

                {/* Main Card */}
                <div className="bg-[#1a2f55] rounded-[2rem] p-8 shadow-2xl border border-white/5 text-center">

                    {/* Icon */}
                    <div className="mx-auto w-16 h-16 rounded-full bg-[#cbb08a]/10 flex items-center justify-center mb-6 border border-[#cbb08a]/20">
                        <Sparkles className="size-8 text-[#cbb08a]" />
                    </div>

                    {/* Headline */}
                    <h1 className="text-3xl font-light text-white mb-4 tracking-tight">
                        Shape the Future
                    </h1>

                    {/* Body Copy */}
                    <p className="text-slate-300 mb-8 leading-relaxed">
                        Your insights drive our innovation. Tell us what you love, what you need, and how we can help you achieve your goals.
                    </p>

                    {/* CTA Button */}
                    <Button
                        asChild
                        className="w-full h-14 rounded-full bg-[#cbb08a] text-[#0f2040] text-lg font-medium tracking-wide hover:bg-[#dcc39e] hover:scale-[1.02] transition-all duration-300 shadow-lg shadow-[#cbb08a]/10"
                    >
                        <a
                            href="https://docs.google.com/forms/d/e/1FAIpQLSd5Vqx4hqKgaAVP29_L_-aF_f-OtXACs2FOoeRCgC8IsaXB6Q/viewform?usp=publish-editor"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center"
                        >
                            <MessageSquare className="size-5 mr-2" />
                            Share Your Thoughts
                        </a>
                    </Button>

                    {/* Subtext */}
                    <p className="mt-6 text-xs text-white/30 uppercase tracking-widest">
                        Takes less than 2 minutes
                    </p>
                </div>
            </div>
        </div>
    );
}
„"(c3a39cef2b9afd8776f0d208ad342f6993b0b2532;file:///c:/Apps/NEETrack/NEETrack/src/app/feedback/page.tsx:!file:///c:/Apps/NEETrack/NEETrack