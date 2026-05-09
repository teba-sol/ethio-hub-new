import React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hideLabel?: boolean;
}

export const Textarea: React.FC<TextareaProps> = ({ label, hideLabel, ...props }) => (
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
