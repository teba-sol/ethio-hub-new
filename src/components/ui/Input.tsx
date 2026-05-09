import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hideLabel?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  error?: boolean | string;
}

export const Input: React.FC<InputProps> = ({ label, hideLabel, icon: Icon, error, ...props }) => (
  <div className="flex flex-col w-full group">
    {label && !hideLabel && (
      <label className={`text-[10px] font-bold ${error ? 'text-red-500' : 'text-gray-400'} uppercase tracking-widest ml-1 mb-2 transition-colors group-focus-within:text-primary`} htmlFor={props.id}>
        {label} {props.required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
    )}
    <div className="relative">
      {Icon && (
        <div className={`absolute left-4 top-1/2 -translate-y-1/2 ${error ? 'text-red-400' : 'text-gray-400'} group-focus-within:text-primary transition-colors z-10`}>
          <Icon className="w-4 h-4" />
        </div>
      )}
      <input 
        className={`
          block w-full rounded-[16px] border ${error ? 'border-red-500 bg-red-50/30' : 'border-gray-200 bg-gray-50/30'} px-4 py-4 text-sm transition-all duration-300
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
