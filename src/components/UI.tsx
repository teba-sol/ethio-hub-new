import React from 'react';
import { LucideIcon, CheckCircle, Loader2, X, AlertTriangle } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: LucideIcon;
  rightIcon?: LucideIcon;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  isLoading, 
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  className = '',
  ...props 
}) => {
  const base = "inline-flex items-center justify-center font-medium transition-all duration-200 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-primary text-white hover:bg-ethio-dark focus:ring-primary shadow-sm",
    secondary: "bg-secondary text-primary hover:bg-[#B88B25] focus:ring-secondary",
    outline: "border-2 border-primary text-primary hover:bg-ethio-light focus:ring-primary",
    ghost: "text-primary hover:bg-ethio-light",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  return (
    <button 
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
      ) : LeftIcon ? (
        <LeftIcon className="w-5 h-5 mr-2" />
      ) : null}
      {children}
      {RightIcon && <RightIcon className="w-5 h-5 ml-2" />}
    </button>
  );
};

export const Badge: React.FC<{ 
  children: React.ReactNode; 
  variant?: 'success' | 'warning' | 'error' | 'info' | 'outline' | 'secondary'; 
  size?: 'sm' | 'md' | 'lg';
  className?: string 
}> = ({ children, variant = 'info', size = 'md', className = '' }) => {
  const variants = {
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    error: "bg-red-100 text-red-800",
    info: "bg-blue-100 text-blue-800",
    outline: "border border-gray-200 text-gray-600",
    secondary: "bg-gray-100 text-gray-800",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-2.5 py-0.5 text-xs",
    lg: "px-3 py-1 text-sm",
  };

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  );
};

interface SuspensionModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: string | null;
}

export const SuspensionModal: React.FC<SuspensionModalProps> = ({ isOpen, onClose, reason }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            Account Suspended
          </h2>
          
          <p className="text-gray-600 mb-4">
            Your account has been suspended. You can still log in and access your dashboard, but certain features may be limited.
          </p>
          
          {reason && (
            <div className="bg-red-50 rounded-xl p-4 mb-6">
              <p className="text-xs font-medium text-red-600 uppercase tracking-wide mb-1">
                Reason
              </p>
              <p className="text-sm text-gray-700">
                {reason}
              </p>
            </div>
          )}
          
          <button
            onClick={onClose}
            className="w-full py-3 px-6 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors duration-200"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};

export const VerifiedBadge: React.FC<React.HTMLAttributes<HTMLSpanElement>> = ({ className = '', ...props }) => (
  <span 
    className={`inline-flex items-center text-primary text-[10px] font-bold bg-green-50 px-3 py-1 rounded-full uppercase tracking-widest border border-green-100 ${className}`}
    {...props}
  >
    <CheckCircle className="w-3 h-3 mr-1" /> Verified
  </span>
);

interface EventStatusBadgeProps {
  startDate: string | Date;
  endDate: string | Date;
  verificationStatus: string;
  className?: string;
}

export const EventStatusBadge: React.FC<EventStatusBadgeProps> = ({ 
  startDate, 
  endDate, 
  verificationStatus,
  className = '' 
}) => {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  const daysUntilStart = Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  let status: 'Draft' | 'Pending Review' | 'Under Review' | 'Approved' | 'Live' | 'Upcoming' | 'Completed' | 'Rejected' = 'Draft';
  let variant: 'success' | 'warning' | 'error' | 'info' | 'secondary' = 'secondary';
  
  if (verificationStatus === 'Not Submitted') {
    status = 'Draft';
    variant = 'secondary';
  } else if (verificationStatus === 'Pending Review') {
    status = 'Pending Review';
    variant = 'warning';
  } else if (verificationStatus === 'Under Review') {
    status = 'Under Review';
    variant = 'info';
  } else if (verificationStatus === 'Rejected') {
    status = 'Rejected';
    variant = 'error';
  } else if (verificationStatus === 'Approved') {
    if (now > end) {
      status = 'Completed';
      variant = 'secondary';
    } else if (daysUntilStart <= 1) {
      status = 'Live';
      variant = 'success';
    } else if (daysUntilStart <= 7) {
      status = 'Upcoming';
      variant = 'info';
    } else {
      status = 'Upcoming';
      variant = 'success';
    }
  }
  
  const labels: Record<string, string> = {
    'Draft': 'Draft',
    'Pending Review': 'Pending Review',
    'Under Review': 'Under Review',
    'Approved': 'Published',
    'Live': 'Live',
    'Upcoming': 'Upcoming',
    'Completed': 'Completed',
    'Rejected': 'Rejected',
  };
  
  return (
    <Badge variant={variant} size="sm" className={className}>
      {labels[status] || status}
    </Badge>
  );
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string; hideLabel?: boolean; icon?: any }> = ({ label, hideLabel, icon: Icon, ...props }) => (
  <div className="flex flex-col w-full group">
    {label && !hideLabel && (
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 mb-2 transition-colors group-focus-within:text-primary" htmlFor={props.id}>
        {label} {props.required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
    )}
    <div className="relative">
      {Icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors z-10">
          {typeof Icon === 'function' ? <Icon className="w-4 h-4" /> : Icon}
        </div>
      )}
      <input 
        className={`
          block w-full rounded-[16px] border border-gray-200 bg-gray-50/30 px-4 py-4 text-sm transition-all duration-300
          placeholder:text-gray-400 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none
          shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:border-gray-300 hover:bg-white hover:shadow-md
          ${Icon ? 'pl-12' : 'px-4'}
          ${props.type === 'number' ? '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none' : ''}
          ${props.className || ''}
        `}
        {...props}
      />
    </div>
  </div>
);

export const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; hideLabel?: boolean }> = ({ label, hideLabel, ...props }) => (
  <div className="flex flex-col w-full group">
    {label && !hideLabel && (
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 mb-2 transition-colors group-focus-within:text-primary" htmlFor={props.id}>
        {label}
      </label>
    )}
    <textarea 
      className={`
        block w-full rounded-[16px] border border-gray-200 bg-gray-50/30 px-4 py-4 text-sm transition-all duration-300
        placeholder:text-gray-400 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none
        shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:border-gray-300 hover:bg-white hover:shadow-md resize-none
        ${props.className || ''}
      `}
      {...props}
    />
  </div>
);

export const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-ethio-dark/50 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-[40px] w-full max-w-2xl shadow-3xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="flex justify-between items-center p-8 border-b border-gray-50">
          <h3 className="text-2xl font-serif font-bold text-primary">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-ethio-bg rounded-full transition-colors">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>
        <div className="p-8">
          {children}
        </div>
      </div>
    </div>
  );
};
