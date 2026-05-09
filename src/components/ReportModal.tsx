"use client";

import React, { useState } from 'react';
import { X, Upload, FileText, Image as ImageIcon, XCircle, AlertTriangle, Flag, CheckCircle } from 'lucide-react';
import { Button, Input, Badge } from './UI';
import { useLanguage } from '@/context/LanguageContext';

interface ReportModalProps {
  targetId: string;
  targetType: 'Event' | 'Product' | 'User' | 'Review';
  targetName: string;
  onClose: () => void;
  onSuccess?: () => void;
  userId: string;
}

const EVENT_REASONS = [
  'Spam',
  'Scam/Fraud',
  'Expired Event',
  'Wrong Location',
  'Inappropriate Content',
  'Other'
];

const PRODUCT_REASONS = [
  'Fake Image',
  'Counterfeit/Fake',
  'Overpriced',
  'Wrong Category',
  'Stolen Images',
  'Other'
];

const REVIEW_REASONS = [
  'Spam',
  'Inappropriate Language',
  'Fake/Paid Review',
  'Harassment',
  'Other'
];

const USER_REASONS = [
  'Harassment',
  'Fake Profile',
  'Scam Behavior',
  'Other'
];

export const ReportModal: React.FC<ReportModalProps> = ({
  targetId,
  targetType,
  targetName,
  onClose,
  onSuccess,
  userId
}) => {
  const { t } = useLanguage();
  const [reason, setReason] = useState('');
  const [reasonOther, setReasonOther] = useState('');
  const [description, setDescription] = useState('');
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const reasons = targetType === 'Event' ? EVENT_REASONS :
                 targetType === 'Product' ? PRODUCT_REASONS :
                 targetType === 'Review' ? REVIEW_REASONS :
                 USER_REASONS;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (evidenceFiles.length + files.length > 3) {
      setError('Maximum 3 evidence files allowed');
      return;
    }
    setEvidenceFiles([...evidenceFiles, ...files]);
    setError('');
  };

  const removeFile = (index: number) => {
    setEvidenceFiles(evidenceFiles.filter((_, i) => i !== index));
  };

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'ethio-hub');

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/dmhu32ya9/auto/upload`,
      { method: 'POST', body: formData }
    );

    const data = await response.json();
    if (!data.secure_url) throw new Error('Upload failed');
    return data.secure_url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!reason) {
      setError('Please select a reason');
      return;
    }

    if (reason === 'Other' && !reasonOther.trim()) {
      setError('Please specify the reason');
      return;
    }

    if (!description.trim()) {
      setError('Please provide a description');
      return;
    }

    setSubmitting(true);

    try {
      // Upload evidence files
      setUploading(true);
      const evidenceUrls: string[] = [];
      for (const file of evidenceFiles) {
        const url = await uploadFile(file);
        evidenceUrls.push(url);
      }
      setUploading(false);

      // Submit report
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reporterId: userId,
          targetId,
          targetType,
          reason: reason === 'Other' ? reasonOther : reason,
          reasonOther: reason === 'Other' ? reasonOther : undefined,
          description,
          evidence: evidenceUrls
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 2000);
      } else {
        setError(data.message || 'Failed to submit report');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
        <div className="bg-white rounded-[24px] p-8 max-w-md w-full shadow-2xl text-center animate-in fade-in duration-200">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Report Submitted</h3>
          <p className="text-gray-500">Thank you for your report. Our team will review it shortly.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[24px] w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Flag className="w-5 h-5 text-red-500" />
              Report {targetType}
            </h2>
            <p className="text-sm text-gray-500 mt-1">Reporting: {targetName}</p>
          </div>
          <button onClick={onClose}>
            <XCircle className="w-6 h-6 text-gray-400 hover:text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Reason */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">
              Reason for Report
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              required
            >
              <option value="">Select a reason...</option>
              {reasons.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Other Reason */}
          {reason === 'Other' && (
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">
                Specify Reason
              </label>
              <Input
                type="text"
                placeholder="Please specify..."
                value={reasonOther}
                onChange={(e) => setReasonOther(e.target.value)}
                required
                className="w-full"
              />
            </div>
          )}

          {/* Description */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">
              Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please provide details about your report..."
              required
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
            />
          </div>

          {/* Evidence Upload */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">
              Evidence (Optional) - Max 3 files
            </label>
            <div className="space-y-3">
              {evidenceFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                  {file.type.startsWith('image/') ? (
                    <ImageIcon className="w-5 h-5 text-blue-500" />
                  ) : (
                    <FileText className="w-5 h-5 text-red-500" />
                  )}
                  <span className="text-sm text-gray-700 flex-1 truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {evidenceFiles.length < 3 && (
                <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-all">
                  <Upload className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-500">Upload evidence (images, PDF, docs)</span>
                  <input
                    type="file"
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="hidden"
                    multiple
                  />
                </label>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-red-500 hover:bg-red-600 border-red-500"
              disabled={submitting || uploading}
            >
              {uploading ? 'Uploading...' : submitting ? 'Submitting...' : 'Submit Report'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
