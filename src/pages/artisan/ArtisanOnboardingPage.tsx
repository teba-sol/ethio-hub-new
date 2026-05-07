import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Upload, MapPin, Briefcase, User as UserIcon, CheckCircle, AlertCircle, ShieldCheck, CreditCard, Loader2 } from 'lucide-react';
import { Button, Input } from '../../components/UI';
import { useAuth } from '../../context/AuthContext';
import { ArtisanStatus } from '../../types';

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
  const [uploading, setUploading] = useState({ profile: false, id: false, workshop: false, craft: false, product: false });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (name === 'phone') {
      const cleaned = value.replace(/\D/g, '');
      const startsWith09 = value.startsWith('09');
      const startsWithPlus = value.startsWith('+251');
      if (value === '' || (startsWith09 && cleaned.length <= 10) || (startsWithPlus && cleaned.length <= 13)) {
        setPhoneError('');
      } else if (startsWith09 && cleaned.length !== 10) {
        setPhoneError('Phone must be 10 digits starting with 09');
      } else if (startsWithPlus && cleaned.length !== 13) {
        setPhoneError('Phone must be +251 followed by 9 digits');
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

  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image must be less than 5MB');
      return;
    }
    
    setUploading(prev => ({ ...prev, profile: true }));
    setUploadError('');
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'avatars');
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (data.success) {
        setProfileImage(data.url);
      } else {
        setUploadError(data.message || 'Failed to upload profile image');
      }
    } catch (error) {
      setUploadError('Failed to upload profile image');
    } finally {
      setUploading(prev => ({ ...prev, profile: false }));
    }
  };

  const handleIdDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File must be less than 5MB');
      return;
    }
    
    setUploading(prev => ({ ...prev, id: true }));
    setUploadError('');
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'artisan-docs');
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (data.success) {
        setIdDocument(data.url);
      } else {
        setUploadError(data.message || 'Failed to upload ID document');
      }
    } catch (error) {
      setUploadError('Failed to upload ID document');
    } finally {
      setUploading(prev => ({ ...prev, id: false }));
    }
  };

  const handleWorkshopPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image must be less than 5MB');
      return;
    }
    
    setUploading(prev => ({ ...prev, workshop: true }));
    setUploadError('');
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'artisan-docs');
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (data.success) {
        setWorkshopPhoto(data.url);
      } else {
        setUploadError(data.message || 'Failed to upload workshop photo');
      }
    } catch (error) {
      setUploadError('Failed to upload workshop photo');
    } finally {
      setUploading(prev => ({ ...prev, workshop: false }));
    }
  };

  const handleCraftProcessPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image must be less than 5MB');
      return;
    }
    
    setUploading(prev => ({ ...prev, craft: true }));
    setUploadError('');
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'artisan-docs');
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (data.success) {
        setCraftProcessPhoto(data.url);
      } else {
        setUploadError(data.message || 'Failed to upload craft process photo');
      }
    } catch (error) {
      setUploadError('Failed to upload craft process photo');
    } finally {
      setUploading(prev => ({ ...prev, craft: false }));
    }
  };

  const handleProductSampleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const newFiles = Array.from(files);
    if (newFiles.length + productSamplePhotos.length > 5) {
      setUploadError('Maximum 5 images allowed');
      return;
    }
    
    setUploading(prev => ({ ...prev, product: true }));
    setUploadError('');
    
    try {
      const uploadPromises = newFiles.map(async (file) => {
        if (file.size > 5 * 1024 * 1024) {
          throw new Error('Each image must be less than 5MB');
        }
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'artisan-docs');
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        const data = await response.json();
        
        if (data.success) {
          return data.url;
        } else {
          throw new Error(data.message || 'Failed to upload product sample');
        }
      });
      
      const urls = await Promise.all(uploadPromises);
      setProductSamplePhotos(prev => [...prev, ...urls]);
    } catch (error: any) {
      setUploadError(error.message || 'Failed to upload product samples');
    } finally {
      setUploading(prev => ({ ...prev, product: false }));
    }
  };

  const removeProductSample = (index: number) => {
    setProductSamplePhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 4) {
      if (step === 1) {
        const phone = formData.phone.trim();
        const cleaned = phone.replace(/\D/g, '');
        const startsWith09 = phone.startsWith('09') && cleaned.length === 10;
        const startsWithPlus = phone.startsWith('+251') && cleaned.length === 13;
        if (!startsWith09 && !startsWithPlus) {
          setPhoneError('Phone must start with +251 (13 digits) or 09 (10 digits)');
          return;
        }
        setPhoneError('');
      }
      if (step === 2) {
        const exp = parseInt(formData.experience);
        if (isNaN(exp) || exp < 0) {
          setExperienceError('Experience cannot be negative');
          return;
        }
        setExperienceError('');
      }
      setStep(step + 1);
    } else {
      const phone = formData.phone.trim();
      const cleaned = phone.replace(/\D/g, '');
      const startsWith09 = phone.startsWith('09') && cleaned.length === 10;
      const startsWithPlus = phone.startsWith('+251') && cleaned.length === 13;
      if (!startsWith09 && !startsWithPlus) {
        setPhoneError('Phone must start with +251 (13 digits) or 09 (10 digits)');
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
          alert('Application submitted successfully!');
          router.push('/artisan/waiting');
        } else {
          alert(data.message || 'Failed to submit application');
        }
      } catch (error: any) {
        console.error('Error submitting application:', error);
        alert('An error occurred while submitting your application');
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
                      ) : (
                        <Camera className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <label className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full shadow-lg hover:bg-primary-dark transition-colors cursor-pointer">
                      <Upload className="w-4 h-4" />
                      <input type="file" accept="image/*" className="hidden" onChange={handleProfileImageUpload} />
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
                  <Input label="Exact Address" name="address" value={formData.address} onChange={handleChange} placeholder="Street, Kebele, House No." required />
                </div>
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
                  
                   <label className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-primary transition-colors cursor-pointer bg-gray-50 block">
                     {uploading.id ? (
                       <Loader2 className="w-8 h-8 text-gray-400 mx-auto mb-2 animate-spin" />
                     ) : idDocument ? (
                       <div>
                         <img src={idDocument} alt="ID Document" className="w-32 h-32 object-cover rounded-xl mx-auto mb-2" />
                         <p className="font-bold text-green-600">ID Uploaded ✓</p>
                         <p className="text-xs text-gray-500 mt-1">Click to change</p>
                       </div>
                     ) : (
                       <>
                         <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                         <p className="font-bold text-gray-700">Upload National ID / Passport</p>
                         <p className="text-xs text-gray-500 mt-1">JPG, PNG or PDF (Max 5MB)</p>
                       </>
                     )}
                     <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleIdDocumentUpload} />
                   </label>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-800 border-b pb-2 mb-4">Shop Verification</h3>
                  <p className="text-sm text-gray-500 mb-4">Proof that you actually produce items. This increases authenticity.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <label className="border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center hover:border-primary transition-colors cursor-pointer bg-gray-50 block">
                       {uploading.workshop ? (
                         <Loader2 className="w-6 h-6 text-gray-400 mx-auto mb-2 animate-spin" />
                       ) : workshopPhoto ? (
                         <>
                           <img src={workshopPhoto} alt="Workshop" className="w-20 h-20 object-cover rounded-xl mx-auto mb-2" />
                           <p className="text-xs font-bold text-green-600">Uploaded ✓</p>
                         </>
                       ) : (
                         <>
                           <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                           <p className="text-sm font-bold text-gray-700">Workshop Photo</p>
                         </>
                       )}
                       <input type="file" accept="image/*" className="hidden" onChange={handleWorkshopPhotoUpload} />
                     </label>
                     <label className="border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center hover:border-primary transition-colors cursor-pointer bg-gray-50 block">
                       {uploading.craft ? (
                         <Loader2 className="w-6 h-6 text-gray-400 mx-auto mb-2 animate-spin" />
                       ) : craftProcessPhoto ? (
                         <>
                           <img src={craftProcessPhoto} alt="Craft Process" className="w-20 h-20 object-cover rounded-xl mx-auto mb-2" />
                           <p className="text-xs font-bold text-green-600">Uploaded ✓</p>
                         </>
                       ) : (
                         <>
                           <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                           <p className="text-sm font-bold text-gray-700">Craft Process</p>
                         </>
                       )}
                       <input type="file" accept="image/*" className="hidden" onChange={handleCraftProcessPhotoUpload} />
                     </label>
                     <div>
                       <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center bg-gray-50">
                         <p className="text-sm font-bold text-gray-700 mb-2">Product Samples</p>
                         <p className="text-[10px] text-gray-500 mb-2">(3-5 images)</p>
                         {uploading.product && (
                           <div className="flex justify-center mb-2">
                             <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                             <span className="text-xs text-gray-500 ml-2">Uploading...</span>
                           </div>
                         )}
                         <div className="flex flex-wrap gap-2 justify-center">
                           {productSamplePhotos.map((img, idx) => (
                             <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden">
                               <img src={img} alt={`Sample ${idx + 1}`} className="w-full h-full object-cover" />
                               <button type="button" onClick={() => removeProductSample(idx)} className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">&times;</button>
                             </div>
                           ))}
                           {productSamplePhotos.length < 5 && !uploading.product && (
                             <label className="w-16 h-16 rounded-lg border border-gray-300 flex items-center justify-center cursor-pointer hover:border-primary">
                               <Upload className="w-4 h-4 text-gray-400" />
                               <input type="file" accept="image/*" multiple className="hidden" onChange={handleProductSampleUpload} />
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
    </div>
  );
};

export default ArtisanOnboardingPage;
