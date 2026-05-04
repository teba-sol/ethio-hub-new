import React, { useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { OrganizerStatus } from '../../types';
import { Button, Input } from '../../components/UI';
import { Upload, CheckCircle, Store, MapPin, ShieldCheck, CreditCard, Calendar, Loader2, AlertCircle } from 'lucide-react';

const MapPickerModal = dynamic(() => import('../../components/MapPickerModal'), { ssr: false });

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
  latitude: number | null;
  longitude: number | null;
  paymentMethod: string;
  bankName: string;
  accountName: string;
  bankAccountNumber: string;
  walletPhoneNumber: string;
  agreement: boolean;
}

interface DocState {
  businessLicense: string;
  tourismLicense: string;
  taxCert: string;
  eventPhotos: string;
  eventPoster: string;
  eventVideos: string;
}

export const OrganizerOnboardingPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

  const businessLicenseRef = useRef<HTMLInputElement>(null);
  const tourismLicenseRef = useRef<HTMLInputElement>(null);
  const taxCertRef = useRef<HTMLInputElement>(null);
  const eventPhotosRef = useRef<HTMLInputElement>(null);
  const eventPosterRef = useRef<HTMLInputElement>(null);
  const eventVideosRef = useRef<HTMLInputElement>(null);
  
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
    latitude: null,
    longitude: null,
    paymentMethod: 'Bank Account',
    bankName: '',
    accountName: '',
    bankAccountNumber: '',
    walletPhoneNumber: '',
    agreement: false
  });

  const [docs, setDocs] = useState<DocState>({
    businessLicense: '',
    tourismLicense: '',
    taxCert: '',
    eventPhotos: '',
    eventPoster: '',
    eventVideos: ''
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
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('folder', 'avatars');
      const response = await fetch('/api/upload', { method: 'POST', body: formDataUpload });
      const data = await response.json();
      if (data.success) {
        setAvatarUrl(data.url);
      } else {
        setError(data.message || 'Failed to upload logo');
      }
    } catch (err: any) {
      console.error('Logo upload error:', err);
      setError(err.message || 'Failed to upload logo. Please try again.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleDocUpload = async (docType: keyof DocState, file: File) => {
    setUploadingDoc(docType);
    setError('');
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('folder', 'organizer-docs');
      const response = await fetch('/api/upload', { method: 'POST', body: formDataUpload });
      const data = await response.json();
      if (data.success) {
        setDocs(prev => ({ ...prev, [docType]: data.url }));
      } else {
        setError(data.message || 'Upload failed');
      }
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploadingDoc(null);
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
        body: JSON.stringify({ 
          ...formData, 
          avatar: avatarUrl,
          documents: docs
        })
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
                      <label className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer block">
                        <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
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
                      </label>
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
                      <div 
                        className="h-48 bg-gray-100 rounded-2xl flex items-center justify-center border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => setIsMapModalOpen(true)}
                      >
                        {formData.latitude && formData.longitude ? (
                          <span className="text-gray-600 flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-primary" />
                            Selected: {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
                          </span>
                        ) : (
                          <span className="text-gray-400 flex items-center gap-2">
                            <MapPin className="w-5 h-5" />
                            Click to pin location on map
                          </span>
                        )}
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
                        {docs.businessLicense && (
                          <a href={docs.businessLicense} target="_blank" className="text-xs text-green-600 mt-1 block">
                            View Uploaded
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {uploadingDoc === 'businessLicense' ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : docs.businessLicense ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : null}
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          className="hidden"
                          ref={businessLicenseRef}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleDocUpload('businessLicense', file);
                          }}
                        />
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => businessLicenseRef.current?.click()}
                        >
                          {docs.businessLicense ? 'Re-upload' : 'Upload'}
                        </Button>
                      </div>
                    </div>
                    {formData.organizerType === 'Tourism Company' && (
                      <div className="border border-gray-200 rounded-2xl p-4 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-primary">Tourism License</p>
                          <p className="text-xs text-gray-500">Required for Tourism Companies</p>
                          {docs.tourismLicense && (
                            <a href={docs.tourismLicense} target="_blank" className="text-xs text-green-600 mt-1 block">
                              View Uploaded
                            </a>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {uploadingDoc === 'tourismLicense' ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : docs.tourismLicense ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : null}
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            className="hidden"
                            ref={tourismLicenseRef}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleDocUpload('tourismLicense', file);
                            }}
                          />
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={() => tourismLicenseRef.current?.click()}
                          >
                            {docs.tourismLicense ? 'Re-upload' : 'Upload'}
                          </Button>
                        </div>
                      </div>
                    )}
                    <div className="border border-gray-200 rounded-2xl p-4 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-primary">Tax Registration Certificate</p>
                        <p className="text-xs text-gray-500">Optional</p>
                        {docs.taxCert && (
                          <a href={docs.taxCert} target="_blank" className="text-xs text-green-600 mt-1 block">
                            View Uploaded
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {uploadingDoc === 'taxCert' ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : docs.taxCert ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : null}
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          className="hidden"
                          ref={taxCertRef}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleDocUpload('taxCert', file);
                          }}
                        />
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => taxCertRef.current?.click()}
                        >
                          {docs.taxCert ? 'Re-upload' : 'Upload'}
                        </Button>
                      </div>
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
                        {docs.eventPhotos && (
                          <a href={docs.eventPhotos} target="_blank" className="text-xs text-green-600 mt-1 block">
                            View Uploaded
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {uploadingDoc === 'eventPhotos' ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : docs.eventPhotos ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : null}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          ref={eventPhotosRef}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleDocUpload('eventPhotos', file);
                          }}
                        />
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => eventPhotosRef.current?.click()}
                        >
                          {docs.eventPhotos ? 'Re-upload' : 'Upload'}
                        </Button>
                      </div>
                    </div>
                    <div className="border border-gray-200 rounded-2xl p-4 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-primary">Event Poster</p>
                        <p className="text-xs text-gray-500">Required</p>
                        {docs.eventPoster && (
                          <a href={docs.eventPoster} target="_blank" className="text-xs text-green-600 mt-1 block">
                            View Uploaded
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {uploadingDoc === 'eventPoster' ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : docs.eventPoster ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : null}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          ref={eventPosterRef}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleDocUpload('eventPoster', file);
                          }}
                        />
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => eventPosterRef.current?.click()}
                        >
                          {docs.eventPoster ? 'Re-upload' : 'Upload'}
                        </Button>
                      </div>
                    </div>
                    <div className="border border-gray-200 rounded-2xl p-4 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-primary">Event Videos</p>
                        <p className="text-xs text-gray-500">Optional</p>
                        {docs.eventVideos && (
                          <a href={docs.eventVideos} target="_blank" className="text-xs text-green-600 mt-1 block">
                            View Uploaded
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {uploadingDoc === 'eventVideos' ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : docs.eventVideos ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : null}
                        <input
                          type="file"
                          accept="image/*,video/*"
                          className="hidden"
                          ref={eventVideosRef}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleDocUpload('eventVideos', file);
                          }}
                        />
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => eventVideosRef.current?.click()}
                        >
                          {docs.eventVideos ? 'Re-upload' : 'Upload'}
                        </Button>
                      </div>
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
                            name="bankAccountNumber" 
                            value={formData.bankAccountNumber} 
                            onChange={handleInputChange} 
                            required 
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
                            name="walletPhoneNumber" 
                            value={formData.walletPhoneNumber} 
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
                <Button type="submit" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {step < 4 ? 'Continue' : 'Submit Application'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <MapPickerModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        onLocationSelect={(coords) => {
          setFormData(prev => ({
            ...prev,
            latitude: coords.lat,
            longitude: coords.lng
          }));
        }}
        initialPosition={
          formData.latitude && formData.longitude 
            ? { lat: formData.latitude, lng: formData.longitude } 
            : { lat: 9.03, lng: 38.75 }
        }
      />
    </div>
  );
};
