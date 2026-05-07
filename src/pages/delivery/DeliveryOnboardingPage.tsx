import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Upload, User as UserIcon, CheckCircle, AlertCircle, ShieldCheck, Loader2, CreditCard, Wallet, FileText } from 'lucide-react';
import { Button, Input } from '../../components/UI';
import { useAuth } from '../../context/AuthContext';

export const DeliveryOnboardingPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;

    if (user.deliveryStatus !== 'Not Submitted' && user.deliveryStatus !== 'Rejected' && user.deliveryStatus !== 'Modification Requested') {
      router.replace('/delivery/waiting');
      return;
    }
  }, [user, router]);

  if (user?.deliveryStatus !== 'Not Submitted' && user?.deliveryStatus !== 'Rejected' && user?.deliveryStatus !== 'Modification Requested') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center">
          <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Application {user?.deliveryStatus}</h2>
          <p className="text-gray-600 mb-8">
            Your delivery guy application is currently {user?.deliveryStatus?.toLowerCase()}.
            You will be notified once the admin reviews your profile.
          </p>
          <Button onClick={() => router.push('/')} variant="outline" className="w-full">Return Home</Button>
        </div>
      </div>
    );
  }

  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const showNotify = (message: string, type: 'success' | 'error' = 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const [formData, setFormData] = useState({
    bankName: '',
    accountNumber: '',
    telebirrNumber: '',
  });

  const [profileImage, setProfileImage] = useState<string | null>(user?.profileImage || null);
  const [idDocument, setIdDocument] = useState<string | null>(null);

  useEffect(() => {
    if (user?.deliveryProfile) {
      setFormData({
        bankName: user.deliveryProfile.bankName || '',
        accountNumber: user.deliveryProfile.accountNumber || '',
        telebirrNumber: user.deliveryProfile.telebirrNumber || '',
      });
      setProfileImage(user.deliveryProfile.profileImage || user.profileImage || null);
      setIdDocument(user.deliveryProfile.idDocument || null);
    }
  }, [user]);

  const uploadToCloudinary = async (file: File, folder: string = 'delivery') => {
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);
    formDataUpload.append('folder', folder);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      });
      const data = await response.json();
      if (data.success) {
        return data.url;
      } else {
        showNotify(data.message || 'Failed to upload image');
        return null;
      }
    } catch (error) {
      console.error('Upload error:', error);
      showNotify('An error occurred during upload');
      return null;
    }
  };

  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        showNotify('Image must be less than 5MB');
        return;
      }
      setUploading('profile');
      const url = await uploadToCloudinary(file, 'delivery_profiles');
      if (url) setProfileImage(url);
      setUploading(null);
    }
  };

  const handleIdDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        showNotify('File must be less than 5MB');
        return;
      }
      setUploading('id');
      const url = await uploadToCloudinary(file, 'delivery_docs');
      if (url) setIdDocument(url);
      setUploading(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileImage) return showNotify('Profile image is required');
    if (!idDocument) return showNotify('National ID document is required');
    if (!formData.bankName) return showNotify('Bank name is required');
    if (!formData.accountNumber) return showNotify('Account number is required');

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        profileImage,
        idDocument,
      };

      const response = await fetch('/api/delivery/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        updateUser({ deliveryStatus: 'Pending' });
        router.push('/delivery/waiting');
      } else {
        showNotify(data.message || 'Onboarding failed');
      }
    } catch (error) {
      console.error('Onboarding error:', error);
      showNotify('An error occurred during onboarding');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-4">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-gray-900">Delivery Guy Onboarding</h1>
          <p className="mt-2 text-gray-600 italic">Complete your profile to start delivering with us.</p>
        </div>

        {notification && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${
            notification.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-red-50 text-red-800 border border-red-100'
          }`}>
            {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <p className="text-sm font-bold">{notification.message}</p>
          </div>
        )}

        {user?.deliveryStatus === 'Rejected' && user && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm font-bold text-red-700 mb-1">Previous application was rejected</p>
            <p className="text-xs text-red-600 italic">{user && 'rejectionReason' in user ? (user as any).rejectionReason : 'Please update your information and resubmit.'}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-primary" /> Personal Profile
            </h2>
            
            <div className="flex flex-col items-center mb-4">
              <div className="relative group">
                <div className="w-32 h-32 rounded-full bg-gray-100 border-4 border-white shadow-md overflow-hidden flex items-center justify-center">
                  {profileImage ? (
                    <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-10 h-10 text-gray-300" />
                  )}
                  {uploading === 'profile' && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    </div>
                  )}
                </div>
                <label className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full cursor-pointer shadow-lg hover:bg-primary-dark transition-colors">
                  <Upload className="w-4 h-4" />
                  <input type="file" className="hidden" accept="image/*" onChange={handleProfileImageUpload} disabled={!!uploading} />
                </label>
              </div>
              <p className="mt-3 text-xs text-gray-500 font-bold uppercase tracking-widest">Upload Profile Photo</p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" /> Payment Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name</label>
                <select
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  required
                >
                  <option value="">Select Bank</option>
                  <option value="Commercial Bank of Ethiopia">CBE</option>
                  <option value="Abyssinia Bank">Abyssinia</option>
                  <option value="Dashen Bank">Dashen</option>
                  <option value="Awash Bank">Awash</option>
                  <option value="COOP Bank">COOP</option>
                </select>
              </div>
              <Input
                label="Account Number"
                placeholder="1000..."
                leftIcon={CreditCard}
                value={formData.accountNumber}
                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                required
              />
              <div className="md:col-span-2">
                <Input
                  label="Telebirr Number (Optional)"
                  placeholder="09..."
                  leftIcon={Wallet}
                  value={formData.telebirrNumber}
                  onChange={(e) => setFormData({ ...formData, telebirrNumber: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" /> Identity Verification
            </h2>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Please upload a clear photo of your National ID or Passport.</p>
               
              <div 
                className={`relative border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center transition-all ${
                  idDocument ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200 bg-gray-50 hover:border-primary/50'
                }`}
              >
                {idDocument ? (
                  <div className="text-center">
                    <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                    <p className="text-sm font-bold text-emerald-800 uppercase tracking-widest">Document Uploaded</p>
                    <button type="button" onClick={() => setIdDocument(null)} className="mt-2 text-xs text-red-500 hover:underline">Remove and replace</button>
                  </div>
                ) : (
                  <>
                    <FileText className="w-12 h-12 text-gray-300 mb-3" />
                    <label className="cursor-pointer">
                      <span className="px-6 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 shadow-sm">
                        Select Document
                      </span>
                      <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleIdDocumentUpload} disabled={!!uploading} />
                    </label>
                  </>
                )}
                {uploading === 'id' && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-2xl">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              type="submit"
              className="w-full py-4 rounded-2xl text-lg font-bold"
              isLoading={submitting}
              disabled={!!uploading}
            >
              Submit Application
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
