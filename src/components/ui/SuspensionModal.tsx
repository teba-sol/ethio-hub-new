import React from 'react';
import { AlertTriangle } from 'lucide-react';

export interface SuspensionModalProps {
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
