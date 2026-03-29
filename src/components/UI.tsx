import React from 'react';
import { LucideIcon, CheckCircle, Loader2, X } from 'lucide-react';

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

export const Badge: React.FC<{ children: React.ReactNode; variant?: 'success' | 'warning' | 'error' | 'info' | 'outline'; className?: string }> = ({ children, variant = 'info', className = '' }) => {
  const variants = {
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    error: "bg-red-100 text-red-800",
    info: "bg-blue-100 text-blue-800",
    outline: "border border-gray-200 text-gray-600",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

export const VerifiedBadge: React.FC = () => (
  <span className="inline-flex items-center text-primary text-[10px] font-bold bg-green-50 px-3 py-1 rounded-full uppercase tracking-widest border border-green-100">
    <CheckCircle className="w-3 h-3 mr-1" /> Verified
  </span>
);

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string }> = ({ label, ...props }) => (
  <div className="flex flex-col space-y-1 w-full">
    {label && <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1" htmlFor={props.id}>{label}</label>}
    <input 
      className="block w-full px-4 py-3 rounded-[12px] border border-gray-200 focus:ring-1 focus:ring-primary focus:border-primary transition-all bg-white text-sm"
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
