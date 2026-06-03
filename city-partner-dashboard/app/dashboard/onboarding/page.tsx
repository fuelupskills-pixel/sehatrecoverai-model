"use client";

import React, { useState } from 'react';
import { 
  BuildingStorefrontIcon, 
  BeakerIcon, 
  AcademicCapIcon, 
  MapPinIcon, 
  CloudArrowUpIcon, 
  CheckCircleIcon 
} from '@heroicons/react/24/outline';

export default function OnboardingPage() {
  const [providerType, setProviderType] = useState<'pharmacy' | 'lab' | 'hospital'>('pharmacy');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [docsUploaded, setDocsUploaded] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    gstin: '',
    drugLicense: '',
    nablCert: '',
    bedCapacity: '',
    doctorsCount: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const generateCoords = () => {
    // Mock mapping drop pin
    const randomLat = 28.6139 + (Math.random() - 0.5) * 0.05;
    const randomLng = 77.2090 + (Math.random() - 0.5) * 0.05;
    setCoords({ lat: parseFloat(randomLat.toFixed(6)), lng: parseFloat(randomLng.toFixed(6)) });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    if (e.target.files && e.target.files[0]) {
      setDocsUploaded([...docsUploaded, `${fieldName}: ${e.target.files[0].name} (OCR: Ready)`]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSuccess(true);
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">B2B Provider Onboarding Funnel</h1>
        <p className="text-sm text-slate-400">Onboard localized pharmacies, diagnostic centers, and hospital network nodes into the platform.</p>
      </div>

      {success ? (
        <div className="bg-slate-900 border border-emerald-500/20 rounded-2xl p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
            <CheckCircleIcon className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold text-white">Application Submitted Successfully!</h2>
          <p className="text-slate-400 max-w-md mx-auto text-sm">
            The onboarding files are queued in Supabase Storage. The compliance department will verify registration documents and audit geotag coordinates.
          </p>
          <button 
            onClick={() => {
              setSuccess(false);
              setFormData({ name: '', phone: '', address: '', gstin: '', drugLicense: '', nablCert: '', bedCapacity: '', doctorsCount: '' });
              setCoords(null);
              setDocsUploaded([]);
            }}
            className="btn btn-primary px-6 py-2 rounded-xl text-sm font-semibold"
            style={{ background: 'var(--primary, #00ccb4)', color: '#000' }}
          >
            Onboard Another Provider
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Form Wizard Controls */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:col-span-2 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">1. Select Provider Type</h3>
              <div className="grid grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => setProviderType('pharmacy')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all text-xs font-semibold ${
                    providerType === 'pharmacy' 
                      ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-400' 
                      : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <BuildingStorefrontIcon className="w-6 h-6" />
                  Pharmacy
                </button>

                <button
                  type="button"
                  onClick={() => setProviderType('lab')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all text-xs font-semibold ${
                    providerType === 'lab' 
                      ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-400' 
                      : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <BeakerIcon className="w-6 h-6" />
                  Diagnostic Lab
                </button>

                <button
                  type="button"
                  onClick={() => setProviderType('hospital')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all text-xs font-semibold ${
                    providerType === 'hospital' 
                      ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-400' 
                      : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <AcademicCapIcon className="w-6 h-6" />
                  Hospital/Clinic
                </button>
              </div>
            </div>

            <div className="border-t border-slate-800/80 pt-6 space-y-4">
              <h3 className="text-lg font-semibold text-white">2. Basic Partner Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Provider Name</label>
                  <input required type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 outline-none" placeholder="e.g. Apex Biotech" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Contact Mobile</label>
                  <input required type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 outline-none" placeholder="+91 98765-XXXXX" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Facility Address</label>
                  <textarea required name="address" value={formData.address} onChange={handleInputChange} rows={3} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 outline-none resize-none" placeholder="Enter physical street address..." />
                </div>
              </div>
            </div>

            {/* Dynamic Specific Section */}
            <div className="border-t border-slate-800/80 pt-6 space-y-4">
              <h3 className="text-lg font-semibold text-white capitalize">3. {providerType} Credentials</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {providerType === 'pharmacy' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">GSTIN</label>
                      <input required type="text" name="gstin" value={formData.gstin} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 outline-none" placeholder="22AAAAA1111A1Z1" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Drug License Number</label>
                      <input required type="text" name="drugLicense" value={formData.drugLicense} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 outline-none" placeholder="Form 20/21 No..." />
                    </div>
                  </>
                )}

                {providerType === 'lab' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">NABL Certification ID</label>
                      <input required type="text" name="nablCert" value={formData.nablCert} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 outline-none" placeholder="NABL-10928" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Registered Doctor Pathologists</label>
                      <input required type="number" name="doctorsCount" value={formData.doctorsCount} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 outline-none" placeholder="e.g. 4" />
                    </div>
                  </>
                )}

                {providerType === 'hospital' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Clinical Est. Act Reg No</label>
                      <input required type="text" name="gstin" value={formData.gstin} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 outline-none" placeholder="CEA-88931" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Inpatient Bed Capacity</label>
                      <input required type="number" name="bedCapacity" value={formData.bedCapacity} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 outline-none" placeholder="e.g. 150" />
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button 
                type="submit" 
                disabled={isSubmitting || !coords}
                className="btn btn-primary px-8 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 hover:opacity-90 disabled:opacity-50"
                style={{ background: 'var(--primary, #00ccb4)', color: '#000' }}
              >
                {isSubmitting ? 'Onboarding Partner...' : 'Submit Application'}
              </button>
            </div>
          </div>

          {/* Right Sidebar: Geotagging & Documents */}
          <div className="space-y-6">
            
            {/* Geotagging Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-base font-semibold text-white"><i className="fa-solid fa-map-location-dot text-emerald-400"></i> Hyperlocal Geotagging</h3>
              <p className="text-xs text-slate-500">Coordinate pinning verifies delivery distances and triggers regional routing rules.</p>
              
              {coords ? (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">LATITUDE:</span>
                    <strong className="text-white">{coords.lat}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">LONGITUDE:</span>
                    <strong className="text-white">{coords.lng}</strong>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-950 border border-dashed border-slate-800 rounded-xl p-6 text-center text-xs text-slate-500">
                  <MapPinIcon className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                  No GPS coordinates pinned. Drop location pin below.
                </div>
              )}
              
              <button
                type="button"
                onClick={generateCoords}
                className="w-full btn btn-outline flex items-center justify-center gap-2 py-2.5 rounded-xl border-slate-800 hover:bg-slate-800/50 text-xs font-semibold text-white"
              >
                <MapPinIcon className="w-4 h-4 text-emerald-400" />
                Capture Geotag Coordinates
              </button>
            </div>

            {/* Document Uploader */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-base font-semibold text-white"><i className="fa-solid fa-file-shield text-emerald-400"></i> Verification S3 Store</h3>
              <p className="text-xs text-slate-500">Upload PDF documents or images. Form 20/21 drug licenses undergo automated OCR verification.</p>

              <div className="space-y-3">
                <div className="border border-dashed border-slate-800 rounded-xl p-4 text-center cursor-pointer hover:border-slate-700 transition-all bg-slate-950 relative">
                  <input 
                    type="file" 
                    onChange={(e) => handleFileUpload(e, 'Drug License')}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                  />
                  <CloudArrowUpIcon className="w-6 h-6 text-slate-500 mx-auto mb-1" />
                  <span className="block text-xs font-semibold text-slate-300">License PDF Upload</span>
                  <span className="block text-[10px] text-slate-600 mt-1">Form 20/21 &bull; Max 5MB</span>
                </div>

                <div className="border border-dashed border-slate-800 rounded-xl p-4 text-center cursor-pointer hover:border-slate-700 transition-all bg-slate-950 relative">
                  <input 
                    type="file" 
                    onChange={(e) => handleFileUpload(e, 'GST Certificate')}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                  />
                  <CloudArrowUpIcon className="w-6 h-6 text-slate-500 mx-auto mb-1" />
                  <span className="block text-xs font-semibold text-slate-300">GST Registration Store</span>
                  <span className="block text-[10px] text-slate-600 mt-1">Cert-06 Proof &bull; Max 5MB</span>
                </div>
              </div>

              {docsUploaded.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Queue uploads:</span>
                  {docsUploaded.map((doc, idx) => (
                    <div key={idx} className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between text-xs">
                      <span className="text-slate-300 overflow-hidden text-ellipsis whitespace-nowrap max-w-[180px]">{doc}</span>
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/30 px-1.5 py-0.5 rounded border border-emerald-900/40">READY</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </form>
      )}
    </div>
  );
}
