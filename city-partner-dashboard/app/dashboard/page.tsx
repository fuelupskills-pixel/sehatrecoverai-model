"use client";

import React, { useState, useEffect } from 'react';
import { 
  BuildingOffice2Icon, 
  TruckIcon, 
  BeakerIcon, 
  CurrencyRupeeIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface AlertLog {
  id: number;
  type: 'whatsapp' | 'email' | 'sms';
  recipient: string;
  message: string;
  time: string;
}

const defaultAlerts: AlertLog[] = [
  { id: 1, type: 'whatsapp', recipient: '+91 98765-01234', message: 'Rider Vikram assigned to Order #ORD-8931. Pickup: Wellness Pharmacy.', time: '2 mins ago' },
  { id: 2, type: 'email', recipient: 'supervisor@maxlabs.com', message: 'Cold-chain ALERT: Sample vial #V-9011 temperature logged at 4.5°C.', time: '10 mins ago' },
  { id: 3, type: 'sms', recipient: '+91 99887-76655', message: 'Your sample collection is scheduled for today at 09:30 AM with Agent Amit.', time: '25 mins ago' }
];

export default function OverviewPage() {
  const [alerts, setAlerts] = useState<AlertLog[]>(defaultAlerts);
  const [commissions, setCommissions] = useState({
    apexMargin: 8.50,
    apolloMargin: 10.00,
    lalFlat: 150.00
  });
  const [totals, setTotals] = useState({
    totalEarned: 24150,
    apexEarned: 12400,
    lalEarned: 6750,
    apolloEarned: 5000
  });

  const loadLocalState = () => {
    // 1. Load alerts
    const storedLogs = localStorage.getItem('sehatrecover_partner_notifications');
    if (storedLogs) {
      const parsed = JSON.parse(storedLogs);
      // Merge with default alerts for mock density
      const merged = [...parsed.slice(0, 10), ...defaultAlerts];
      setAlerts(merged);
    } else {
      localStorage.setItem('sehatrecover_partner_notifications', JSON.stringify([]));
    }

    // 2. Load commissions
    const storedComms = localStorage.getItem('sehatrecover_partner_commissions');
    let activeComms = { apexMargin: 8.50, apolloMargin: 10.00, lalFlat: 150.00 };
    if (storedComms) {
      activeComms = JSON.parse(storedComms);
      setCommissions(activeComms);
    } else {
      localStorage.setItem('sehatrecover_partner_commissions', JSON.stringify(activeComms));
    }

    // 3. Load ledger transactions to calculate total earnings
    const storedLedger = localStorage.getItem('sehatrecover_partner_ledger');
    let baseList = storedLedger ? JSON.parse(storedLedger) : [
      { id: 'TXN-9081', partnerName: 'Apex Wellness Pharmacy', amount: 145000.00, commissionRate: '8.50%', commissionEarned: 12325.00, status: 'released' },
      { id: 'TXN-9082', partnerName: 'Apollo Diagnostics Hub', amount: 50000.00, commissionRate: '10.00%', commissionEarned: 5000.00, status: 'escrow' },
      { id: 'TXN-9083', partnerName: 'Dr. Lal PathLabs (Zone Sub)', amount: 6750.00, commissionRate: 'Flat Rs. 150/test', commissionEarned: 6750.00, status: 'escrow' }
    ];

    let apexVal = 0;
    let apolloVal = 0;
    let lalVal = 0;

    baseList.forEach((t: any) => {
      let earned = t.commissionEarned;
      if (t.partnerName.includes('Apex')) {
        earned = t.amount * (activeComms.apexMargin / 100);
        apexVal += earned;
      } else if (t.partnerName.includes('Apollo')) {
        earned = t.amount * (activeComms.apolloMargin / 100);
        apolloVal += earned;
      } else if (t.partnerName.includes('Dr. Lal') || t.partnerName.includes('Max Labs')) {
        const testCount = t.partnerName.includes('Max Labs') ? 1 : 45;
        earned = testCount * activeComms.lalFlat;
        lalVal += earned;
      }
    });

    setTotals({
      totalEarned: Math.round(apexVal + apolloVal + lalVal),
      apexEarned: Math.round(apexVal),
      apolloEarned: Math.round(apolloVal),
      lalEarned: Math.round(lalVal)
    });
  };

  useEffect(() => {
    loadLocalState();
    // Listen for focus updates to sync changes from administrative override page
    window.addEventListener('focus', loadLocalState);
    return () => window.removeEventListener('focus', loadLocalState);
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center border-b border-slate-900 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Partner Overview Hub</h1>
          <p className="text-sm text-slate-400">Real-time hyperlocal logistics, provider integrations, and escrow earnings metrics.</p>
        </div>
        <Link 
          href="/admin/commissions" 
          className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white font-semibold rounded-xl text-xs border border-rose-500/20 transition-all flex items-center gap-1.5"
        >
          <AdjustmentsHorizontalIcon className="w-4.5 h-4.5" />
          Admin Config
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-all"></div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <BuildingOffice2Icon className="w-6 h-6" />
            </div>
            <div>
              <span className="block text-sm text-slate-400">Onboarded Partners</span>
              <span className="block text-2xl font-bold text-white mt-1">12</span>
            </div>
          </div>
          <span className="block text-xs text-slate-500 mt-4">8 Pharmacies &bull; 4 Labs</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl group-hover:bg-cyan-500/10 transition-all"></div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <TruckIcon className="w-6 h-6" />
            </div>
            <div>
              <span className="block text-sm text-slate-400">Active Deliveries</span>
              <span className="block text-2xl font-bold text-white mt-1">8</span>
            </div>
          </div>
          <span className="block text-xs text-emerald-400 mt-4 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span> 5 In Transit
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl group-hover:bg-amber-500/10 transition-all"></div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <BeakerIcon className="w-6 h-6" />
            </div>
            <div>
              <span className="block text-sm text-slate-400">Sample Collections</span>
              <span className="block text-2xl font-bold text-white mt-1">14</span>
            </div>
          </div>
          <span className="block text-xs text-slate-500 mt-4">12 Dropped-off &bull; 2 Pending</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-all"></div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CurrencyRupeeIcon className="w-6 h-6" />
            </div>
            <div>
              <span className="block text-sm text-slate-400">Escrow Earnings</span>
              <span className="block text-2xl font-bold text-white mt-1">Rs. {totals.totalEarned.toLocaleString('en-IN')}</span>
            </div>
          </div>
          <span className="block text-xs text-emerald-400 mt-4 flex items-center gap-1">
            Payout Scheduled: June 7, 2026
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Earnings & Targets */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:col-span-2">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold text-white">Commissions & Revenue Metrics</h3>
            <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded uppercase font-bold tracking-wider">Dynamic Ledgers</span>
          </div>
          <p className="text-xs text-slate-500 mb-6">Overview of percentage margins and flat fee items processed in your zone.</p>
          
          <div className="space-y-4">
            <div className="bg-slate-950 border border-slate-800/60 rounded-xl p-4 flex justify-between items-center">
              <div>
                <strong className="text-sm text-white block">Apex Wellness Pharmacy</strong>
                <span className="text-xs text-slate-500">Margin: {commissions.apexMargin.toFixed(2)}% &bull; Type: Pharmacy reselling</span>
              </div>
              <span className="text-emerald-400 font-bold">Rs. {totals.apexEarned.toLocaleString('en-IN')}</span>
            </div>

            <div className="bg-slate-950 border border-slate-800/60 rounded-xl p-4 flex justify-between items-center">
              <div>
                <strong className="text-sm text-white block">Dr. Lal PathLabs (Zone Sub)</strong>
                <span className="text-xs text-slate-500">Flat: Rs. {commissions.lalFlat.toFixed(0)}/test &bull; Type: Lab drop-off</span>
              </div>
              <span className="text-emerald-400 font-bold">Rs. {totals.lalEarned.toLocaleString('en-IN')}</span>
            </div>

            <div className="bg-slate-950 border border-slate-800/60 rounded-xl p-4 flex justify-between items-center">
              <div>
                <strong className="text-sm text-white block">Apollo Diagnostics Hub</strong>
                <span className="text-xs text-slate-500">Margin: {commissions.apolloMargin.toFixed(2)}% &bull; Type: Lab reselling</span>
              </div>
              <span className="text-emerald-400 font-bold">Rs. {totals.apolloEarned.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Omnichannel Dispatch Log Feed */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Dispatch Console</h3>
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 bg-emerald-950/40 border border-emerald-900/50 px-2 py-0.5 rounded-md flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span> Live Logs
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-6">Real-time audit trails of triggered SMS, Email, and WhatsApp logs.</p>

          <div className="space-y-4 max-h-[380px] overflow-y-auto pr-2">
            {alerts.map((alert, idx) => (
              <div key={alert.id || idx} className="bg-slate-950 border border-slate-800/60 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${
                    alert.type === 'whatsapp' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/50' :
                    alert.type === 'email' ? 'bg-cyan-950/40 text-cyan-400 border border-cyan-900/50' :
                    'bg-amber-950/40 text-amber-400 border border-amber-900/50'
                  }`}>
                    {alert.type}
                  </span>
                  <span className="text-[10px] text-slate-500">{alert.time}</span>
                </div>
                <div className="text-xs text-slate-300">
                  <strong>To:</strong> <code className="text-slate-400">{alert.recipient}</code>
                </div>
                <p className="text-xs text-slate-400 italic">"{alert.message}"</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}





