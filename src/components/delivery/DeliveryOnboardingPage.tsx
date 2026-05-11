import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Upload, User as UserIcon, CheckCircle, AlertCircle, ShieldCheck, Loader2, CreditCard, Wallet, FileText } from 'lucide-react';
import { Button, Input } from '@/components/UI';
import { useAuth } from '@/context/AuthContext';

export const DeliveryOnboardingPage: React.FC = () => {
  const router = useRouter();
  const { user, updateUser, loading: authLoading } = useAuth();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const [formData, setFormData] = useState({
    bankName: '',
    accountNumber: '',
    telebirrNumber: '',
  });

  const [profileImage, setProfileImage] = useState<string | null>(user?.profileImage || null);
  const [idDocument, setIdDocument] = useState<string | null>(null);

  useEffect(() => {
    if (!user && !authLoading) {
      router.replace('/auth/login');
      return;
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;

    if (user.deliveryStatus !== 'Not Submitted' && user.deliveryStatus !== 'Rejected' && user.deliveryStatus !== 'Modification Requested') {
      router.replace('/delivery/waiting');
      return;
    }
  }, [user, router]);

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

  const showNotify = (message: string, type: 'success' | 'error' = 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Restriction for telebirrNumber
    if (name === 'telebirrNumber') {
      const sanitized = value.replace(/\D/g, '').slice(0, 10);
      setFormData(prev => ({ ...prev, [name]: sanitized }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  if (user && user.deliveryStatus !== 'Not Submitted' && user.deliveryStatus !== 'Rejected' && user.deliveryStatus !== 'Modification Requested') {
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
          <Button onClick={() => router.push('/auth/login')} variant="outline" className="w-full">Return Home</Button>
        </div>
      </div>
    );
  }

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
    
    if (step < 3) {
      if (step === 1 && !profileImage) return showNotify('Profile photo is required');
      if (step === 2 && !idDocument) return showNotify('Identity document is required');
      setStep(step + 1);
      return;
    }

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
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">Delivery Registration</h1>
          <p className="text-gray-500">Join our delivery fleet and start earning</p>
        </div>

        <div className="bg-white rounded-[40px] shadow-2xl overflow-hidden border border-gray-100">
          {/* Progress Bar */}
          <div className="flex justify-between mb-0 relative">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex-1 text-center relative z-10 py-6">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 transition-all duration-300 ${
                  step === s ? 'bg-primary text-white scale-110 shadow-lg' : 
                  step > s ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'
                }`}>
                  {step > s ? <CheckCircle className="w-6 h-6" /> : s}
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-widest ${step === s ? 'text-primary' : 'text-gray-400'}`}>
                  {s === 1 ? 'Personal' : s === 2 ? 'Verification' : 'Payout'}
                </span>
              </div>
            ))}
            <div className="absolute top-[44px] left-[15%] right-[15%] h-[2px] bg-gray-100 -z-0">
              <div 
                className="h-full bg-primary transition-all duration-500" 
                style={{ width: `${((step - 1) / 2) * 100}%` }}
              />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-10 pt-4">
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <h3 className="text-xl font-bold text-gray-800 border-b pb-2">Personal Details</h3>
                
                <div className="flex flex-col items-center mb-8">
                  <label className="relative group cursor-pointer">
                    <div className="w-32 h-32 rounded-[32px] overflow-hidden bg-gray-100 border-4 border-white shadow-xl">
                      {profileImage ? (
                        <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <UserIcon className="w-12 h-12" />
                        </div>
                      )}
                      {uploading === 'profile' && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <Loader2 className="w-8 h-8 text-white animate-spin" />
                        </div>
                      )}
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-primary text-white p-2.5 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                      <Camera className="w-5 h-5" />
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={handleProfileImageUpload} disabled={!!uploading} />
                  </label>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-4">Profile Photo</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input label="Full Name" value={user?.name || ''} readOnly />
                  <Input label="Email Address" value={user?.email || ''} readOnly />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 border-b pb-2 mb-4">Identity Verification</h3>
                  <p className="text-sm text-gray-500 mb-6">Please upload a clear photo of your National ID or Passport.</p>
                  
                  <label className={`border-2 border-dashed border-gray-200 rounded-[32px] p-12 text-center hover:border-primary transition-all cursor-pointer bg-gray-50 block ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    {idDocument ? (
                      <div className="space-y-4">
                        <div className="w-48 h-32 bg-white rounded-2xl shadow-md mx-auto overflow-hidden border border-gray-100">
                          <img src={idDocument} alt="ID Document" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex items-center justify-center gap-2 text-green-600">
                          <CheckCircle className="w-5 h-5" />
                          <span className="font-bold">Document Uploaded</span>
                        </div>
                        <p className="text-xs text-gray-400 uppercase tracking-widest">Click to change file</p>
                      </div>
                    ) : uploading === 'id' ? (
                      <div className="py-8">
                        <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
                        <p className="text-sm font-bold text-primary uppercase tracking-widest">Uploading...</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto shadow-sm">
                          <FileText className="w-10 h-10 text-gray-300" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-700 text-lg">National ID / Passport</p>
                          <p className="text-sm text-gray-400 mt-1">PNG, JPG or PDF (Max 5MB)</p>
                        </div>
                        <div className="inline-flex items-center gap-2 px-6 py-2 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-widest">
                          <Upload className="w-4 h-4" /> Select File
                        </div>
                      </div>
                    )}
                    <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleIdDocumentUpload} disabled={!!uploading} />
                  </label>
                </div>

                <div className="bg-blue-50 p-6 rounded-[32px] flex gap-4">
                  <ShieldCheck className="w-6 h-6 text-blue-600 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-blue-900 mb-1">Secure Verification</p>
                    <p className="text-xs text-blue-700 leading-relaxed">
                      Your documents are encrypted and only used for identity verification. We never share your personal data with third parties.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <h3 className="text-xl font-bold text-gray-800 border-b pb-2">Payout Information</h3>
                <p className="text-sm text-gray-500 mb-6">Choose how you want to receive your earnings.</p>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Bank Name</label>
                    <select 
                      name="bankName" 
                      value={formData.bankName} 
                      onChange={handleChange}
                      className="w-full px-6 py-4 rounded-2xl border border-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all bg-gray-50 hover:bg-white"
                      required
                    >
                      <option value="">Select Bank</option>
                      <option value="Commercial Bank of Ethiopia">Commercial Bank of Ethiopia (CBE)</option>
                      <option value="Dashen Bank">Dashen Bank</option>
                      <option value="Awash Bank">Awash Bank</option>
                      <option value="Bank of Abyssinia">Bank of Abyssinia</option>
                      <option value="Hibret Bank">Hibret Bank</option>
                      <option value="Zemen Bank">Zemen Bank</option>
                      <option value="Cooperative Bank of Oromia">Cooperative Bank of Oromia</option>
                    </select>
                  </div>

                  <Input 
                    label="Account Number" 
                    name="accountNumber" 
                    value={formData.accountNumber} 
                    onChange={handleChange} 
                    placeholder="Enter your 13-digit account number" 
                    required 
                  />

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                      <div className="w-full border-t border-gray-100"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-white text-gray-400 font-bold uppercase tracking-widest text-[10px]">Or mobile money</span>
                    </div>
                  </div>

                  <Input 
                    label="Telebirr Number" 
                    name="telebirrNumber" 
                    value={formData.telebirrNumber} 
                    onChange={handleChange} 
                    placeholder="0911..." 
                  />
                </div>
                
                <div className="bg-amber-50 p-6 rounded-[32px] flex gap-4 mt-8">
                  <CreditCard className="w-6 h-6 text-amber-600 shrink-0" />
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Please ensure your payout details are correct. Ethio Hub is not responsible for funds sent to incorrect accounts.
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-between pt-10 mt-6 border-t border-gray-50">
              {step > 1 ? (
                <Button type="button" variant="outline" onClick={() => setStep(step - 1)} className="rounded-2xl px-8 py-4">Back</Button>
              ) : (
                <div></div>
              )}
              <Button type="submit" isLoading={submitting} className="rounded-2xl px-10 py-4 shadow-xl shadow-primary/20">
                {step < 3 ? 'Continue' : 'Submit Application'}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Centered Notification UI */}
      {notification && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 pointer-events-none">
          <div className={`bg-white border-2 p-8 rounded-[40px] shadow-2xl max-w-sm w-full text-center pointer-events-auto animate-in zoom-in-95 duration-200 ${
            notification.type === 'error' ? 'border-red-100' : 'border-green-100'
          }`}>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${
              notification.type === 'error' ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'
            }`}>
              {notification.type === 'error' ? <AlertCircle className="w-8 h-8" /> : <CheckCircle className="w-8 h-8" />}
            </div>
            <h4 className="text-xl font-bold text-gray-800 mb-2">
              {notification.type === 'error' ? 'Attention' : 'Success'}
            </h4>
            <p className="text-gray-600 font-medium leading-relaxed">
              {notification.message}
            </p>
            <button 
              type="button"
              className="mt-8 w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition-colors shadow-lg"
              onClick={() => setNotification(null)}
            >
              Okay
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryOnboardingPage;
