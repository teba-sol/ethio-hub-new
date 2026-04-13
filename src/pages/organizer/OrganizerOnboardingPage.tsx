import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { OrganizerStatus } from '../../types';
import { Button, Input } from '../../components/UI';
import { Upload, CheckCircle, Store, MapPin, ShieldCheck, CreditCard, Calendar, Loader2, AlertCircle } from 'lucide-react';

interface FormData {
  organizerName: string;
  contactPersonName: string;
  phoneNumber: string;
  organizerType: string;
  description: string;
  experienceYears: string;
  website: string;
  socialMedia: string;
  country: string;
  region: string;
  city: string;
  address: string;
  paymentMethod: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  agreement: boolean;
}

export const OrganizerOnboardingPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [error, setError] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const logoInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<FormData>({
    organizerName: '',
    contactPersonName: '',
    phoneNumber: '',
    organizerType: 'Individual Organizer',
    description: '',
    experienceYears: '',
    website: '',
    socialMedia: '',
    country: 'Ethiopia',
    region: '',
    city: '',
    address: '',
    paymentMethod: 'Bank Account',
    bankName: '',
    accountName: '',
    accountNumber: '',
    agreement: false
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'avatars');
      const response = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await response.json();
      if (data.success) {
        setAvatarUrl(data.url);
      } else {
        setError(data.message || 'Failed to upload logo');
      }
    } catch (err) {
      setError('Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step < 4) {
      setStep(step + 1);
      return;
    }

    if (!formData.agreement) {
      setError('Please agree to the terms and conditions');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/organizer/onboarding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, avatar: avatarUrl })
      });

      const data = await res.json();

      if (data.success) {
        updateUser({ organizerStatus: 'Pending' as OrganizerStatus });
        router.push('/organizer/waiting');
      } else {
        setError(data.message || 'Failed to submit application');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-12">
      {[1, 2, 3, 4].map((i) => (
        <React.Fragment key={i}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
            step >= i ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'
          }`}>
            {step > i ? <CheckCircle className="w-5 h-5" /> : i}
          </div>
          {i < 4 && (
            <div className={`w-16 h-1 ${step > i ? 'bg-primary' : 'bg-gray-100'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  if (user?.organizerStatus === 'Pending' || user?.organizerStatus === 'Under Review') {
    return (
      <div className="max-w-3xl mx-auto mt-20 text-center">
        <div className="bg-white p-12 rounded-3xl shadow-sm border border-gray-100">
          <div className="w-24 h-24 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-12 h-12" />
          </div>
          <h2 className="text-3xl font-bold font-serif text-primary mb-4">Application Under Review</h2>
          <p className="text-gray-500 mb-8 max-w-lg mx-auto">
            Thank you for registering as an Event Organizer. Our team is currently reviewing your application and verification documents. This usually takes 24-48 hours.
          </p>
          <Button variant="outline" onClick={() => router.push('/')}>Return to Homepage</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-10">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold font-serif text-primary mb-4">Event Organizer Verification</h1>
        <p className="text-gray-500 max-w-2xl mx-auto">
          This verifies companies or individuals who organize festivals, tours, or cultural events.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2 text-red-700">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 md:p-12">
          {renderStepIndicator()}

          <form onSubmit={handleSubmit} className="space-y-8">
            {step === 1 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                <div>
                  <h3 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
                    <Store className="w-5 h-5 text-secondary" />
                    1. Organizer Profile
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input 
                      label="Organizer Name / Company Name" 
                      name="organizerName" 
                      value={formData.organizerName} 
                      onChange={handleInputChange} 
                      required 
                    />
                    <Input 
                      label="Contact Person Name" 
                      name="contactPersonName" 
                      value={formData.contactPersonName} 
                      onChange={handleInputChange} 
                      required 
                    />
                    <Input 
                      label="Phone Number" 
                      name="phoneNumber" 
                      type="tel" 
                      value={formData.phoneNumber} 
                      onChange={handleInputChange} 
                      required 
                    />
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-primary">Profile Logo</label>
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      <div
                        onClick={() => logoInputRef.current?.click()}
                        className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        {avatarUrl ? (
                          <div className="flex flex-col items-center gap-2">
                            <img src={avatarUrl} alt="Logo" className="w-16 h-16 rounded-full object-cover" />
                            <span className="text-sm text-green-600 font-medium">Logo uploaded</span>
                          </div>
                        ) : uploadingLogo ? (
                          <Loader2 className="w-8 h-8 text-gray-400 mx-auto mb-2 animate-spin" />
                        ) : (
                          <>
                            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <span className="text-sm text-gray-500">Click to upload logo</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
                    <Store className="w-5 h-5 text-secondary" />
                    2. Organizer Type
                  </h3>
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-primary">Select Type</label>
                    <select 
                      name="organizerType"
                      value={formData.organizerType}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                      required
                    >
                      <option value="Individual Organizer">Individual Organizer</option>
                      <option value="Tourism Company">Tourism Company</option>
                      <option value="Cultural Organization">Cultural Organization</option>
                      <option value="Event Agency">Event Agency</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                <div>
                  <h3 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
                    <Store className="w-5 h-5 text-secondary" />
                    3. Business Information
                  </h3>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-primary">Organization Description</label>
                      <textarea 
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={4}
                        className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                        placeholder="Tell us about your organization and the types of events you organize..."
                        required
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Input 
                        label="Years of Experience" 
                        name="experienceYears" 
                        type="number" 
                        value={formData.experienceYears} 
                        onChange={handleInputChange} 
                        required 
                      />
                      <Input 
                        label="Website (optional)" 
                        name="website" 
                        type="url" 
                        value={formData.website} 
                        onChange={handleInputChange} 
                      />
                      <Input 
                        label="Social Media Links (optional)" 
                        name="socialMedia" 
                        value={formData.socialMedia} 
                        onChange={handleInputChange} 
                        className="md:col-span-2"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-secondary" />
                    4. Location
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input 
                      label="Country" 
                      name="country" 
                      value={formData.country} 
                      onChange={handleInputChange} 
                      required 
                    />
                    <Input 
                      label="Region" 
                      name="region" 
                      value={formData.region} 
                      onChange={handleInputChange} 
                      required 
                    />
                    <Input 
                      label="City" 
                      name="city" 
                      value={formData.city} 
                      onChange={handleInputChange} 
                      required 
                    />
                    <Input 
                      label="Office Address" 
                      name="address" 
                      value={formData.address} 
                      onChange={handleInputChange} 
                      required 
                    />
                    <div className="md:col-span-2 space-y-2">
                      <label className="block text-sm font-bold text-primary">Map Location</label>
                      <div className="h-48 bg-gray-100 rounded-2xl flex items-center justify-center border border-gray-200">
                        <span className="text-gray-400 flex items-center gap-2">
                          <MapPin className="w-5 h-5" />
                          Click to pin location on map
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                <div>
                  <h3 className="text-xl font-bold text-primary mb-2 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-secondary" />
                    5. Business Verification Documents
                  </h3>
                  <p className="text-sm text-gray-500 mb-6">This protects your platform legally.</p>
                  
                  <div className="space-y-4">
                    <div className="border border-gray-200 rounded-2xl p-4 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-primary">Business License</p>
                        <p className="text-xs text-gray-500">Required</p>
                      </div>
                      <Button type="button" variant="outline" size="sm">Upload</Button>
                    </div>
                    {formData.organizerType === 'Tourism Company' && (
                      <div className="border border-gray-200 rounded-2xl p-4 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-primary">Tourism License</p>
                          <p className="text-xs text-gray-500">Required for Tourism Companies</p>
                        </div>
                        <Button type="button" variant="outline" size="sm">Upload</Button>
                      </div>
                    )}
                    <div className="border border-gray-200 rounded-2xl p-4 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-primary">Tax Registration Certificate</p>
                        <p className="text-xs text-gray-500">Optional</p>
                      </div>
                      <Button type="button" variant="outline" size="sm">Upload</Button>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-primary mb-2 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-secondary" />
                    6. Previous Event Evidence
                  </h3>
                  <p className="text-sm text-gray-500 mb-6">This proves you are a real organizer.</p>
                  
                  <div className="space-y-4">
                    <div className="border border-gray-200 rounded-2xl p-4 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-primary">Photos of Past Events</p>
                        <p className="text-xs text-gray-500">Required</p>
                      </div>
                      <Button type="button" variant="outline" size="sm">Upload</Button>
                    </div>
                    <div className="border border-gray-200 rounded-2xl p-4 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-primary">Event Poster</p>
                        <p className="text-xs text-gray-500">Required</p>
                      </div>
                      <Button type="button" variant="outline" size="sm">Upload</Button>
                    </div>
                    <div className="border border-gray-200 rounded-2xl p-4 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-primary">Event Videos</p>
                        <p className="text-xs text-gray-500">Optional</p>
                      </div>
                      <Button type="button" variant="outline" size="sm">Upload</Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                <div>
                  <h3 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-secondary" />
                    7. Payment / Payout Details
                  </h3>
                  
                  <div className="space-y-6">
                    <div className="flex gap-4 mb-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="radio" 
                          name="paymentMethod" 
                          value="Bank Account" 
                          checked={formData.paymentMethod === 'Bank Account'}
                          onChange={handleInputChange}
                          className="text-primary focus:ring-primary"
                        />
                        <span className="text-sm font-bold text-primary">Bank Account</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="radio" 
                          name="paymentMethod" 
                          value="Mobile Wallet" 
                          checked={formData.paymentMethod === 'Mobile Wallet'}
                          onChange={handleInputChange}
                          className="text-primary focus:ring-primary"
                        />
                        <span className="text-sm font-bold text-primary">Mobile Wallet</span>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {formData.paymentMethod === 'Bank Account' ? (
                        <>
                          <Input 
                            label="Bank Name" 
                            name="bankName" 
                            value={formData.bankName} 
                            onChange={handleInputChange} 
                            required 
                          />
                          <Input 
                            label="Bank Account Name" 
                            name="accountName" 
                            value={formData.accountName} 
                            onChange={handleInputChange} 
                            required 
                          />
                          <Input 
                            label="Account Number" 
                            name="accountNumber" 
                            value={formData.accountNumber} 
                            onChange={handleInputChange} 
                            required 
                            className="md:col-span-2"
                          />
                        </>
                      ) : (
                        <>
                          <Input 
                            label="Wallet Provider (e.g., Telebirr)" 
                            name="bankName" 
                            value={formData.bankName} 
                            onChange={handleInputChange} 
                            required 
                          />
                          <Input 
                            label="Registered Name" 
                            name="accountName" 
                            value={formData.accountName} 
                            onChange={handleInputChange} 
                            required 
                          />
                          <Input 
                            label="Phone Number" 
                            name="accountNumber" 
                            value={formData.accountNumber} 
                            onChange={handleInputChange} 
                            required 
                            className="md:col-span-2"
                          />
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-secondary" />
                    8. Agreement
                  </h3>
                  <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        name="agreement"
                        checked={formData.agreement}
                        onChange={handleInputChange}
                        className="mt-1 text-primary focus:ring-primary rounded"
                        required
                      />
                      <span className="text-sm text-gray-600 leading-relaxed">
                        I confirm that events posted are legitimate. I understand that posting fraudulent events will result in immediate account termination and potential legal action.
                      </span>
                    </label>
                  </div>
                </div>

                <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                  <h4 className="font-bold text-blue-800 mb-2">What happens next?</h4>
                  <p className="text-sm text-blue-600">
                    By submitting this application, you confirm that all provided information is accurate. 
                    Your application will be reviewed by our team within 24-48 hours.
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-between pt-6 border-t border-gray-100">
              {step > 1 ? (
                <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>Back</Button>
              ) : (
                <div></div>
              )}
              <div className="flex gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={async () => {
                    setLoading(true);
                    try {
                      const res = await fetch('/api/organizer/onboarding', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          organizerName: formData.organizerName || 'My Company',
                          phoneNumber: formData.phoneNumber || '+251000000000',
                          description: formData.description || 'Event organizer',
                          address: formData.address || 'Ethiopia',
                          paymentMethod: formData.paymentMethod,
                          bankName: formData.bankName || 'Bank',
                          accountName: formData.accountName || 'Account',
                          accountNumber: formData.accountNumber || '000000'
                        })
                      });
                      const data = await res.json();
                      if (data.success) {
                        updateUser({ organizerStatus: 'Pending' as OrganizerStatus });
                        router.push('/organizer/waiting');
                      }
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                >
                  Skip
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {step < 4 ? 'Continue' : 'Submit Application'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
