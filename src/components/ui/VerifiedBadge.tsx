import React from 'react';
import { CheckCircle } from 'lucide-react';

export const VerifiedBadge: React.FC<React.HTMLAttributes<HTMLSpanElement>> = ({ className = '', ...props }) => (
  <span 
    className={`inline-flex items-center text-primary text-[10px] font-bold bg-green-50 px-3 py-1 rounded-full uppercase tracking-widest border border-green-100 ${className}`}
    {...props}
  >
    <CheckCircle className="w-3 h-3 mr-1" /> Verified
  </span>
);
