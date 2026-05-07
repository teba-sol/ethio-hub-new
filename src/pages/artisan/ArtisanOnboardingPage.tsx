import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Upload, MapPin, Briefcase, User as UserIcon, CheckCircle, AlertCircle, ShieldCheck, CreditCard, Loader2 } from 'lucide-react';
import { Button, Input } from '../../components/UI';
import { useAuth } from '../../context/AuthContext';
import { ArtisanStatus } from '../../types';
import { LocationPicker } from '../../components/checkout/LocationPicker';

// Chapa Bank IDs - Replace these placeholder UUIDs with actual IDs from GET /api/chapa.co/v1/banks
const BANK_ID_MAP: Record<string, string> = {
  'Commercial Bank of Ethiopia': 'placeholder-uuid-cbe',
  'Dashen Bank': 'placeholder-uuid-dashen',
  'Awash Bank': 'placeholder-uuid-awash',
  'Bank of Abyssinia': 'placeholder-uuid-boa',
  'Telebirr': 'placeholder-uuid-telebirr',
  'CBE Birr': 'placeholder-uuid-cbe-birr',
};

export const ArtisanOnboardingPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const showNotify = (message: string, type: 'success' | 'error' = 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const [formData, setFormData] = useState({
    phone: '',
    gender: '',
    businessName: '',
    category: '',
    experience: '',
    bio: '',
    country: 'Ethiopia',
    region: '',
    city: '',
    address: '',
    latitude: 9.032,
    longitude: 38.746,
    bankName: '',
    accountName: '',
    accountNumber: '',
  });

  const [profileImage, setProfileImage] = useState<string | null>(user?.profileImage || null);
  const [idDocument, setIdDocument] = useState<string | null>(null);
  const [workshopPhoto, setWorkshopPhoto] = useState<string | null>(null);
  const [craftProcessPhoto, setCraftProcessPhoto] = useState<string | null>(null);
  const [productSamplePhotos, setProductSamplePhotos] = useState<string[]>([]);
  const [phoneError, setPhoneError] = useState('');
  const [experienceError, setExperienceError] = useState('');
  const [uploadError, setUploadError] = useState('');
  // const [uploading, setUploading] = useState({ profile: false, id: false, workshop: false, craft: false, product: false });

  const uploadToCloudinary = async (file: File, folder: string = 'artisans') => {
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
      const url = await uploadToCloudinary(file, 'profile_images');
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
      const url = await uploadToCloudinary(file, 'documents');
      if (url) setIdDocument(url);
      setUploading(null);
    }
  };

  const handleWorkshopPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        showNotify('Image must be less than 5MB');
        return;
      }
      setUploading('workshop');
      const url = await uploadToCloudinary(file, 'workshop_photos');
      if (url) setWorkshopPhoto(url);
      setUploading(null);
    }
  };

  const handleCraftProcessPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        showNotify('Image must be less than 5MB');
        return;
      }
      setUploading('craft');
      const url = await uploadToCloudinary(file, 'craft_process_photos');
      if (url) setCraftProcessPhoto(url);
      setUploading(null);
    }
  };

  const handleProductSampleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (files.length + productSamplePhotos.length > 5) {
        showNotify('Maximum 5 images allowed');
        return;
      }
      
      setUploading('samples');
      for (const file of files) {
        if (file.size > 5 * 1024 * 1024) {
          showNotify(`File ${file.name} is too large. Max 5MB.`);
          continue;
        }
        const url = await uploadToCloudinary(file, 'product_samples');
        if (url) setProductSamplePhotos(prev => [...prev, url]);
      }
      setUploading(null);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (name === 'phone') {
      const cleaned = value.replace(/\D/g, '');
      const startsWith09 = value.startsWith('09');
      const startsWithPlus = value.startsWith('+251');
      
      if (value === '') {
        setPhoneError('');
      } else if (startsWith09) {
        if (cleaned.length > 10) {
          setPhoneError('Phone must be 10 digits starting with 09');
        } else if (cleaned.length === 10) {
          setPhoneError('');
        } else {
          setPhoneError('Phone must be 10 digits starting with 09');
        }
      } else if (startsWithPlus) {
        if (cleaned.length > 12) {
          setPhoneError('Phone must be +251 followed by 9 digits');
        } else if (cleaned.length === 12) {
          setPhoneError('');
        } else {
          setPhoneError('Phone must be +251 followed by 9 digits');
        }
      } else {
        setPhoneError('Phone must start with +251 or 09');
      }
    }
    if (name === 'experience') {
      const num = parseInt(value);
      if (value === '' || num >= 0) {
        setExperienceError('');
      } else {
        setExperienceError('Experience cannot be negative');
      }
    }
  };

  const removeProductSample = (index: number) => {
    setProductSamplePhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 4) {
      if (step === 1) {
        // Mandatory fields check for Step 1
        if (!formData.phone || !formData.gender || !formData.region || !formData.city || !formData.address) {
          showNotify('All personal information fields are mandatory');
          return;
        }

        const phone = formData.phone.trim();
        const cleaned = phone.replace(/\D/g, '');
        const startsWith09 = phone.startsWith('09') && cleaned.length === 10;
        const startsWithPlus = phone.startsWith('+251') && cleaned.length === 12;
        
        if (!startsWith09 && !startsWithPlus) {
          setPhoneError('Phone must start with +251 (12 digits total) or 09 (10 digits)');
          return;
        }
        setPhoneError('');
        
        if (!profileImage) {
          showNotify('Profile image is mandatory');
          return;
        }
      }
      if (step === 2) {
        // Step 2 validation
        if (!formData.businessName || !formData.category || !formData.experience || !formData.bio) {
          showNotify('All business information fields are mandatory');
          return;
        }

        const exp = parseInt(formData.experience);
        if (isNaN(exp) || exp < 0) {
          setExperienceError('Experience cannot be negative');
          return;
        }
        setExperienceError('');
      }
      if (step === 3) {
        // Step 3 validation (Identity & Shop Verification)
        if (!idDocument) {
          showNotify('National ID / Passport document is mandatory');
          return;
        }
        if (!workshopPhoto) {
          showNotify('Workshop photo is mandatory');
          return;
        }
        if (!craftProcessPhoto) {
          showNotify('Craft process photo is mandatory');
          return;
        }
        if (productSamplePhotos.length < 3) {
          showNotify('Please upload at least 3 product sample images');
          return;
        }
      }
      setStep(step + 1);
    } else {
      // Step 4 validation (Payment Information)
      if (!formData.bankName || !formData.accountName || !formData.accountNumber) {
        showNotify('All payment information fields are mandatory');
        return;
      }

      const phone = formData.phone.trim();
      const cleaned = phone.replace(/\D/g, '');
      const startsWith09 = phone.startsWith('09') && cleaned.length === 10;
      const startsWithPlus = phone.startsWith('+251') && cleaned.length === 12;
      
      if (!startsWith09 && !startsWithPlus) {
        setPhoneError('Phone must start with +251 (12 digits total) or 09 (10 digits)');
        return;
      }
      const exp = parseInt(formData.experience);
      if (isNaN(exp) || exp < 0) {
        setExperienceError('Experience cannot be negative');
        return;
      }
      try {
        setSubmitting(true);
        const response = await fetch('/api/artisan/onboarding', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            profileImage,
            idDocument,
            workshopPhoto,
            craftProcessPhoto,
            productSamplePhotos,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          updateUser({ artisanStatus: 'Pending' as ArtisanStatus });
          showNotify('Application submitted successfully!', 'success');
          setTimeout(() => router.push('/artisan/waiting'), 2000);
        } else {
          showNotify(data.message || 'Failed to submit application');
        }
      } catch (error: any) {
        console.error('Error submitting application:', error);
        showNotify('An error occurred while submitting your application');
      } finally {
        setSubmitting(false);
      }
    }
  };

  if (user?.artisanStatus !== 'Not Submitted' && user?.artisanStatus !== 'Rejected' && user?.artisanStatus !== 'Modification Requested') {
    return (
      <div className="min-h-screen bg-ethio-bg flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center">
          <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Application {user?.artisanStatus}</h2>
          <p className="text-gray-600 mb-8">
            Your artisan application is currently {user?.artisanStatus?.toLowerCase()}. 
            You will be notified once the admin reviews your profile.
          </p>
          <Button onClick={() => router.push('/')} variant="outline" className="w-full">Return Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ethio-bg py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-serif font-bold text-primary mb-2">Artisan Registration</h1>
          <p className="text-gray-500">Complete your profile to start selling your crafts</p>
        </div>

        <div className="flex justify-between mb-8 relative">
          <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -translate-y-1/2 z-0"></div>
          <div 
            className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 z-0 transition-all duration-300"
            style={{ width: `${((step - 1) / 3) * 100}%` }}
          ></div>
          
          {[
            { num: 1, label: 'Personal', icon: UserIcon },
            { num: 2, label: 'Business', icon: Briefcase },
            { num: 3, label: 'Verification', icon: ShieldCheck },
            { num: 4, label: 'Payment', icon: CreditCard }
          ].map((s) => (
            <div key={s.num} className="relative z-10 flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 transition-colors ${
                step >= s.num ? 'bg-primary border-primary text-white' : 'bg-white border-gray-300 text-gray-400'
              }`}>
                {step > s.num ? <CheckCircle className="w-5 h-5" /> : s.num}
              </div>
              <span className={`text-xs font-bold mt-2 ${step >= s.num ? 'text-primary' : 'text-gray-400'}`}>{s.label}</span>
            </div>
          ))}
         </div>
        
        {uploadError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="text-sm">{uploadError}</span>
          </div>
        )}
        
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <h3 className="text-xl font-bold text-gray-800 border-b pb-2">Personal Information</h3>
                
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className="w-24 h-24 bg-gray-100 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                      {profileImage ? (
                        <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                      ) : uploading === 'profile' ? (
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                      ) : (
                        <Camera className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <label className={`absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full shadow-lg hover:bg-primary-dark transition-colors cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <Upload className="w-4 h-4" />
                      <input type="file" accept="image/*" className="hidden" onChange={handleProfileImageUpload} disabled={!!uploading} />
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <Input label="Phone Number" name="phone" value={formData.phone} onChange={handleChange} placeholder="+251 or 09..." required />
                    {phoneError && <p className="text-red-500 text-xs ml-1">{phoneError}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Gender</label>
                    <select name="gender" value={formData.gender} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-gray-50 hover:bg-white" required>
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-gray-800 border-b pb-2 mt-8">Location Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input label="Country" name="country" value={formData.country} onChange={handleChange} readOnly />
                  <Input label="Region" name="region" value={formData.region} onChange={handleChange} placeholder="Amhara, Oromia, Addis Ababa..." required />
                  <Input label="City" name="city" value={formData.city} onChange={handleChange} placeholder="Gondar, Lalibela..." required />
                </div>
                
                <div className="space-y-2 mt-4">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Location on Map (Click to mark accurately)</label>
                  <LocationPicker 
                    value={{ latitude: formData.latitude, longitude: formData.longitude }} 
                    onChange={(loc) => setFormData({ ...formData, latitude: loc.latitude, longitude: loc.longitude })}
                    height="300px"
                  />
                </div>
                <Input label="Exact Address / Building / House No." name="address" value={formData.address} onChange={handleChange} placeholder="E.g. Bole, Kebele 03, House 123" required />
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <h3 className="text-xl font-bold text-gray-800 border-b pb-2">Business Information</h3>
                
                <Input label="Business Name / Shop Name" name="businessName" value={formData.businessName} onChange={handleChange} placeholder="E.g. Lalibela Pottery" required />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Artisan Category</label>
                    <select name="category" value={formData.category} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-gray-50 hover:bg-white" required>
                      <option value="">Select Category</option>
                      <option value="Textiles">Textiles</option>
                      <option value="Pottery">Pottery</option>
                      <option value="Jewelry">Jewelry</option>
                      <option value="Woodwork">Woodwork</option>
                      <option value="Traditional Clothing">Traditional Clothing</option>
                      <option value="Coffee Items">Coffee Items</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Input label="Years of Experience" name="experience" type="number" value={formData.experience} onChange={handleChange} placeholder="E.g. 5" required min="0" />
                    {experienceError && <p className="text-red-500 text-xs ml-1">{experienceError}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Short Bio / Story</label>
                  <textarea 
                    name="bio" 
                    value={formData.bio} 
                    onChange={handleChange} 
                    placeholder="Tell us about your craft, your inspiration, and your story..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-gray-50 hover:bg-white min-h-[120px]"
                    required
                  ></textarea>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 border-b pb-2 mb-4">Identity Verification</h3>
                  <p className="text-sm text-gray-500 mb-4">To avoid fake sellers, please upload a valid ID.</p>
                  
                  <label className={`border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-primary transition-colors cursor-pointer bg-gray-50 block ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    {idDocument ? (
                      <div>
                        <img src={idDocument} alt="ID Document" className="w-32 h-32 object-cover rounded-xl mx-auto mb-2" />
                        <p className="font-bold text-green-600">ID Uploaded ✓</p>
                        <p className="text-xs text-gray-500 mt-1">Click to change</p>
                      </div>
                    ) : uploading === 'id' ? (
                      <div className="py-4">
                        <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-2" />
                        <p className="text-sm font-bold text-primary">Uploading...</p>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="font-bold text-gray-700">Upload National ID / Passport</p>
                        <p className="text-xs text-gray-500 mt-1">JPG, PNG or PDF (Max 5MB)</p>
                      </>
                    )}
                    <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleIdDocumentUpload} disabled={!!uploading} />
                  </label>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-800 border-b pb-2 mb-4">Shop Verification</h3>
                  <p className="text-sm text-gray-500 mb-4">Proof that you actually produce items. This increases authenticity.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <label className={`border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center hover:border-primary transition-colors cursor-pointer bg-gray-50 block ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      {workshopPhoto ? (
                        <>
                          <img src={workshopPhoto} alt="Workshop" className="w-20 h-20 object-cover rounded-xl mx-auto mb-2" />
                          <p className="text-xs font-bold text-green-600">Uploaded ✓</p>
                        </>
                      ) : uploading === 'workshop' ? (
                        <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto mb-2" />
                      ) : (
                        <>
                          <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm font-bold text-gray-700">Workshop Photo</p>
                        </>
                      )}
                      <input type="file" accept="image/*" className="hidden" onChange={handleWorkshopPhotoUpload} disabled={!!uploading} />
                    </label>
                    <label className={`border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center hover:border-primary transition-colors cursor-pointer bg-gray-50 block ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      {craftProcessPhoto ? (
                        <>
                          <img src={craftProcessPhoto} alt="Craft Process" className="w-20 h-20 object-cover rounded-xl mx-auto mb-2" />
                          <p className="text-xs font-bold text-green-600">Uploaded ✓</p>
                        </>
                      ) : uploading === 'craft' ? (
                        <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto mb-2" />
                      ) : (
                        <>
                          <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm font-bold text-gray-700">Craft Process</p>
                        </>
                      )}
                      <input type="file" accept="image/*" className="hidden" onChange={handleCraftProcessPhotoUpload} disabled={!!uploading} />
                    </label>
                    <div>
                      <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center bg-gray-50">
                        <p className="text-sm font-bold text-gray-700 mb-2">Product Samples</p>
                        <p className="text-[10px] text-gray-500 mb-2">(3-5 images)</p>
                        <div className="flex flex-wrap gap-2 justify-center">
                          {productSamplePhotos.map((img, idx) => (
                            <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden">
                              <img src={img} alt={`Sample ${idx + 1}`} className="w-full h-full object-cover" />
                              <button type="button" onClick={() => removeProductSample(idx)} className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs" disabled={!!uploading}>&times;</button>
                            </div>
                          ))}
                          {productSamplePhotos.length < 5 && (
                            <label className={`w-16 h-16 rounded-lg border border-gray-300 flex items-center justify-center cursor-pointer hover:border-primary ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                              {uploading === 'samples' ? (
                                <Loader2 className="w-4 h-4 text-primary animate-spin" />
                              ) : (
                                <Upload className="w-4 h-4 text-gray-400" />
                              )}
                              <input type="file" accept="image/*" multiple className="hidden" onChange={handleProductSampleUpload} disabled={!!uploading} />
                            </label>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <h3 className="text-xl font-bold text-gray-800 border-b pb-2">Payment Information</h3>
                <p className="text-sm text-gray-500 mb-4">Needed for your payouts.</p>
                
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Bank or Mobile Wallet</label>
                  <select name="bankName" value={formData.bankName} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-gray-50 hover:bg-white" required>
                    <option value="">Select Bank / Wallet</option>
                    <option value={BANK_ID_MAP['Commercial Bank of Ethiopia']}>Commercial Bank of Ethiopia</option>
                    <option value={BANK_ID_MAP['Dashen Bank']}>Dashen Bank</option>
                    <option value={BANK_ID_MAP['Awash Bank']}>Awash Bank</option>
                    <option value={BANK_ID_MAP['Bank of Abyssinia']}>Bank of Abyssinia</option>
                    <option value={BANK_ID_MAP['Telebirr']}>Telebirr</option>
                    <option value={BANK_ID_MAP['CBE Birr']}>CBE Birr</option>
                  </select>
                </div>

                <Input label="Account Name" name="accountName" value={formData.accountName} onChange={handleChange} placeholder="Full name on account" required />
                <Input label="Account Number / Phone Number" name="accountNumber" value={formData.accountNumber} onChange={handleChange} placeholder="1000..." required />
                
                <div className="bg-blue-50 p-4 rounded-xl flex gap-3 mt-6">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <p className="text-sm text-blue-800">
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
              <Button type="submit" isLoading={submitting}>
                {step < 4 ? 'Continue' : 'Submit Application'}
              </Button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Centered Notification UI */}
      {notification && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 pointer-events-none">
          <div className={`bg-white border-2 p-8 rounded-[32px] shadow-2xl max-w-sm w-full text-center pointer-events-auto animate-in zoom-in-95 duration-200 ${
            notification.type === 'error' ? 'border-red-100' : 'border-green-100'
          }`}>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
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
              className="mt-6 w-full py-3 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition-colors"
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

export default ArtisanOnboardingPage;
