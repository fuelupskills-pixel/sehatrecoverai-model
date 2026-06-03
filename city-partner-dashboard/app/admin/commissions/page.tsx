"use client";

import React, { useState, useEffect } from 'react';
import { 
  AdjustmentsHorizontalIcon, 
  ArrowPathIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  BellIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface AuditTrailLog {
  timestamp: string;
  adminUser: string;
  partnerName: string;
  changeType: 'percentage' | 'flat_fee';
  oldValue: string;
  newValue: string;
}

const initialAuditTrail: AuditTrailLog[] = [
  {
    timestamp: '2026-06-01T08:00:00Z',
    adminUser: 'SuperAdmin (Rahul M.)',
    partnerName: 'Apex Wellness Pharmacy',
    changeType: 'percentage',
    oldValue: '8.00%',
    newValue: '8.50%'
  },
  {
    timestamp: '2026-05-15T14:30:00Z',
    adminUser: 'Operations Mgr (Neha S.)',
    partnerName: 'Dr. Lal PathLabs (Zone Sub)',
    changeType: 'flat_fee',
    oldValue: 'Rs. 120/test',
    newValue: 'Rs. 150/test'
  }
];

export default function AdminCommissionsPage() {
  const [apexMargin, setApexMargin] = useState(8.50);
  const [apolloMargin, setApolloMargin] = useState(10.00);
  const [lalFlat, setLalFlat] = useState(150.00);
  
  const [auditTrail, setAuditTrail] = useState<AuditTrailLog[]>(initialAuditTrail);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    // Read from localStorage if existing
    const storedComms = localStorage.getItem('sehatrecover_partner_commissions');
    if (storedComms) {
      const parsed = JSON.parse(storedComms);
      if (parsed.apexMargin) setApexMargin(parsed.apexMargin);
      if (parsed.apolloMargin) setApolloMargin(parsed.apolloMargin);
      if (parsed.lalFlat) setLalFlat(parsed.lalFlat);
    }
  }, []);

  const saveCommissionChanges = (e: React.FormEvent) => {
    e.preventDefault();

    // Fetch old values for audit
    const storedComms = localStorage.getItem('sehatrecover_partner_commissions');
    const oldComms = storedComms ? JSON.parse(storedComms) : { apexMargin: 8.50, apolloMargin: 10.00, lalFlat: 150.00 };

    const newComms = {
      apexMargin: parseFloat(apexMargin.toFixed(2)),
      apolloMargin: parseFloat(apolloMargin.toFixed(2)),
      lalFlat: parseFloat(lalFlat.toFixed(2))
    };

    localStorage.setItem('sehatrecover_partner_commissions', JSON.stringify(newComms));

    // Construct new audit entries
    const newAudits: AuditTrailLog[] = [];
    const timestamp = new Date().toISOString();

    if (oldComms.apexMargin !== newComms.apexMargin) {
      newAudits.push({
        timestamp,
        adminUser: 'SuperAdmin (Rahul M.)',
        partnerName: 'Apex Wellness Pharmacy',
        changeType: 'percentage',
        oldValue: `${oldComms.apexMargin.toFixed(2)}%`,
        newValue: `${newComms.apexMargin.toFixed(2)}%`
      });
      triggerCommissionNotification('Apex Wellness Pharmacy', `${oldComms.apexMargin.toFixed(2)}%`, `${newComms.apexMargin.toFixed(2)}%`);
    }

    if (oldComms.apolloMargin !== newComms.apolloMargin) {
      newAudits.push({
        timestamp,
        adminUser: 'SuperAdmin (Rahul M.)',
        partnerName: 'Apollo Diagnostics Hub',
        changeType: 'percentage',
        oldValue: `${oldComms.apolloMargin.toFixed(2)}%`,
        newValue: `${newComms.apolloMargin.toFixed(2)}%`
      });
      triggerCommissionNotification('Apollo Diagnostics Hub', `${oldComms.apolloMargin.toFixed(2)}%`, `${newComms.apolloMargin.toFixed(2)}%`);
    }

    if (oldComms.lalFlat !== newComms.lalFlat) {
      newAudits.push({
        timestamp,
        adminUser: 'SuperAdmin (Rahul M.)',
        partnerName: 'Dr. Lal PathLabs (Zone Sub)',
        changeType: 'flat_fee',
        oldValue: `Rs. ${oldComms.lalFlat.toFixed(0)}/test`,
        newValue: `Rs. ${newComms.lalFlat.toFixed(0)}/test`
      });
      triggerCommissionNotification('Dr. Lal PathLabs (Zone Sub)', `Rs. ${oldComms.lalFlat.toFixed(0)}/test`, `Rs. ${newComms.lalFlat.toFixed(0)}/test`);
    }

    if (newAudits.length > 0) {
      setAuditTrail([...newAudits, ...auditTrail]);
    }

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
    alert('Commission structure updated successfully! Partner ledger payouts will immediately recalculate with the new margins.');
  };

  const triggerCommissionNotification = (partner: string, oldVal: string, newVal: string) => {
    // Push notifications into the central dispatcher feed
    const storedLogs = localStorage.getItem('sehatrecover_partner_notifications') || '[]';
    const logs = JSON.parse(storedLogs);

    const whatsappLog = {
      id: Date.now() + Math.random(),
      type: 'whatsapp',
      recipient: '+91 98765-01234', // Partner phone
      message: `🔔 [COMMISSION RATE OVERRIDE] Your payout structure for ${partner} has been updated by admin. Old Rate: ${oldVal} ➡️ New Rate: ${newVal}. Payout calculations have refreshed.`,
      time: 'Just now'
    };

    const emailLog = {
      id: Date.now() + Math.random() + 1,
      type: 'email',
      recipient: 'compliance-audits@sehatrecover.com',
      message: `[ADMIN COMPLIANCE AUDIT] Rahul M. successfully altered contract rate for ${partner}. Old: ${oldVal} to New: ${newVal}.`,
      time: 'Just now'
    };

    localStorage.setItem('sehatrecover_partner_notifications', JSON.stringify([whatsappLog, emailLog, ...logs]));
  };

  const resetToDefault = () => {
    setApexMargin(8.50);
    setApolloMargin(10.00);
    setLalFlat(150.00);
    localStorage.setItem('sehatrecover_partner_commissions', JSON.stringify({
      apexMargin: 8.50,
      apolloMargin: 10.00,
      lalFlat: 150.00
    }));
    alert('Commissions reset to default base contract rates.');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Navigation & Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-6 flex-wrap gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold tracking-wider uppercase">
              <ShieldCheckIcon className="w-4.5 h-4.5 text-rose-500" />
              Administrative Security Control Node
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2 mt-1">
              <AdjustmentsHorizontalIcon className="w-8 h-8 text-rose-500" />
              B2B Partner Commissions Control Panel
            </h1>
            <p className="text-sm text-slate-400">Configure global margin overrides, flat payout rates, and dynamic ledger calculations for onboarded partners.</p>
          </div>
          
          <Link 
            href="/dashboard" 
            className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-semibold rounded-xl text-sm transition-all flex items-center gap-2"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Partner Dashboard
          </Link>
        </div>

        {/* Dashboard Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Editor Form Card */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl"></div>
              
              <h3 className="text-lg font-bold text-white mb-4">Edit Commission Structures</h3>
              
              <form onSubmit={saveCommissionChanges} className="space-y-6">
                
                {/* Apex Pharmacy Percentage */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <strong className="text-sm text-white block">Apex Wellness Pharmacy</strong>
                      <span className="text-xs text-slate-500">Logistics Segment: Pharmacy Hyperlocal Deliveries</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 bg-rose-950/40 border border-rose-900/50 px-2 py-0.5 rounded">
                      Percentage Margin
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <input 
                        type="number" 
                        step="0.01"
                        min="0"
                        max="100"
                        value={apexMargin}
                        onChange={(e) => setApexMargin(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2.5 pl-4 pr-10 text-white font-mono text-sm outline-none focus:border-rose-500 transition-all"
                      />
                      <span className="absolute right-3 top-3 text-slate-500 font-bold text-sm">%</span>
                    </div>
                  </div>
                </div>

                {/* Apollo Diagnostics Percentage */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <strong className="text-sm text-white block">Apollo Diagnostics Hub</strong>
                      <span className="text-xs text-slate-500">Logistics Segment: Sample Reselling Channel</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 bg-rose-950/40 border border-rose-900/50 px-2 py-0.5 rounded">
                      Percentage Margin
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <input 
                        type="number" 
                        step="0.01"
                        min="0"
                        max="100"
                        value={apolloMargin}
                        onChange={(e) => setApolloMargin(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2.5 pl-4 pr-10 text-white font-mono text-sm outline-none focus:border-rose-500 transition-all"
                      />
                      <span className="absolute right-3 top-3 text-slate-500 font-bold text-sm">%</span>
                    </div>
                  </div>
                </div>

                {/* Dr. Lal PathLabs Flat Fee */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <strong className="text-sm text-white block">Dr. Lal PathLabs & Max Labs</strong>
                      <span className="text-xs text-slate-500">Logistics Segment: Phlebotomist Drop-off Courier Payout</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 bg-rose-950/40 border border-rose-900/50 px-2 py-0.5 rounded">
                      Flat Fee / Test
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <span className="absolute left-4 top-3 text-slate-500 font-bold text-sm">Rs.</span>
                      <input 
                        type="number" 
                        step="1"
                        min="0"
                        value={lalFlat}
                        onChange={(e) => setLalFlat(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-white font-mono text-sm outline-none focus:border-rose-500 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit & Reset actions */}
                <div className="flex justify-between items-center pt-2">
                  <button 
                    type="button" 
                    onClick={resetToDefault}
                    className="text-xs text-slate-400 hover:text-white border-b border-slate-800 hover:border-white transition-all py-1"
                  >
                    Reset to defaults
                  </button>

                  <div className="flex items-center gap-3">
                    {isSaved && (
                      <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                        <ShieldCheckIcon className="w-4 h-4 animate-bounce" /> Configuration saved!
                      </span>
                    )}
                    <button 
                      type="submit" 
                      className="px-6 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl text-sm transition-all"
                    >
                      Save Commission overrides
                    </button>
                  </div>
                </div>

              </form>
            </div>
          </div>

          {/* Audit Trail Sidebar */}
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <DocumentTextIcon className="w-5 h-5 text-slate-400" />
                Audit Trail Log
              </h3>
              <p className="text-xs text-slate-500 mt-1">Immutable trace history of contract commission rate changes.</p>
            </div>

            <div className="space-y-4 max-h-[480px] overflow-y-auto pr-2">
              {auditTrail.map((log, idx) => (
                <div key={idx} className="bg-slate-950 border border-slate-800/60 p-4 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between items-center text-[10px] text-slate-500 border-b border-slate-900 pb-1.5">
                    <span className="font-semibold text-rose-400">{log.adminUser}</span>
                    <span>{new Date(log.timestamp).toLocaleDateString()}</span>
                  </div>
                  <strong className="block text-white text-[13px]">{log.partnerName}</strong>
                  <div className="flex justify-between items-center text-[11px] text-slate-400 pt-0.5">
                    <span>Change:</span>
                    <span className="font-mono">
                      {log.oldValue} ➡️ <strong className="text-emerald-400 font-bold">{log.newValue}</strong>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
