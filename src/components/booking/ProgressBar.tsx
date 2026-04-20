"use client";

import React from 'react';
import { Check } from 'lucide-react';
import Link from 'next/link';

interface ProgressBarProps {
  eventId: string;
  currentStep: number;
}

const STEPS = [
  { step: 1, label: 'Hotel', href: (id: string) => `/event/${id}/hotels` },
  { step: 2, label: 'Transport', href: (id: string) => `/event/${id}/transport` },
  { step: 3, label: 'Tickets', href: (id: string) => `/event/${id}/tickets` },
  { step: 4, label: 'Checkout', href: (id: string) => `/event/${id}/checkout` },
];

export const ProgressBar: React.FC<ProgressBarProps> = ({ eventId, currentStep }) => {
  return (
    <div className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <nav className="flex items-center justify-between">
          {STEPS.map((s, idx) => {
            const isActive = s.step === currentStep;
            const isCompleted = s.step < currentStep;
            const isPending = s.step > currentStep;
            
            return (
              <React.Fragment key={s.step}>
                <Link 
                  href={s.href(eventId)}
                  className={`flex items-center gap-2 ${
                    isActive 
                      ? 'text-primary font-bold' 
                      : isCompleted 
                        ? 'text-green-600' 
                        : 'text-gray-400'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    isActive 
                      ? 'bg-primary text-white' 
                      : isCompleted 
                        ? 'bg-green-600 text-white' 
                        : 'bg-gray-100 text-gray-400'
                  }`}>
                    {isCompleted ? <Check className="w-4 h-4" /> : s.step}
                  </div>
                  <span className="hidden md:inline">{s.label}</span>
                </Link>
                
                {idx < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 ${
                    isCompleted ? 'bg-green-600' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            );
          })}
        </nav>
      </div>
    </div>
  );
};