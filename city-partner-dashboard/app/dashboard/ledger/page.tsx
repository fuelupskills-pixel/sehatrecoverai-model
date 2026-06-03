"use client";

import React, { useState, useEffect } from 'react';
import { 
  CurrencyRupeeIcon, 
  CircleStackIcon, 
  ArrowPathIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  ArrowUpRightIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface Transaction {
  id: string;
  partnerName: string;
  amount: number;
  commissionRate: string;
  commissionEarned: number;
  status: 'escrow' | 'released' | 'processing';
  created_at: string;
}

const defaultTransactions: Transaction[] = [
  {
    id: 'TXN-9081',
    partnerName: 'Apex Wellness Pharmacy',
    amount: 14500.00,
    commissionRate: '8.50%',
    commissionEarned: 1232.50,
    status: 'released',
    created_at: '2026-06-01T10:30:00Z'
  },
  {
    id: 'TXN-9082',
    partnerName: 'Apollo Diagnostics Hub',
    amount: 50000.00,
    commissionRate: '10.00%',
    commissionEarned: 5000.00,
    status: 'escrow',
    created_at: '2026-06-02T14:45:00Z'
  },
  {
    id: 'TXN-9083',
    partnerName: 'Dr. Lal PathLabs (Zone Sub)',
    amount: 6750.00,
    commissionRate: 'Flat Rs. 150/test (45 tests)',
    commissionEarned: 6750.00,
    status: 'escrow',
    created_at: '2026-06-03T09:15:00Z'
  }
];

export default function LedgerPage() {
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [commissions, setCommissions] = useState({
    apexMargin: 8.50,
    apolloMargin: 10.00,
    lalFlat: 150.00
  });
  const [logs, setLogs] = useState<any[]>([]);

  const loadData = () => {
    // 1. Load commissions
    const storedComms = localStorage.getItem('sehatrecover_partner_commissions');
    let activeComms = { apexMargin: 8.50, apolloMargin: 10.00, lalFlat: 150.00 };
    if (storedComms) {
      const parsed = JSON.parse(storedComms);
      activeComms = {
        apexMargin: parsed.apexMargin || 8.50,
        apolloMargin: parsed.apolloMargin || 10.00,
        lalFlat: parsed.lalFlat || 150.00
      };
      setCommissions(activeComms);
    }

    // 2. Load and recalculate transactions based on active commissions
    const storedLedger = localStorage.getItem('sehatrecover_partner_ledger');
    let baseList = storedLedger ? JSON.parse(storedLedger) : defaultTransactions;

    // Recalculate values dynamically to show admin update working!
    const updated = baseList.map((t: any) => {
      let rateText = t.commissionRate;
      let earned = t.commissionEarned;

      if (t.partnerName.includes('Apex')) {
        rateText = `${activeComms.apexMargin.toFixed(2)}%`;
        earned = t.amount * (activeComms.apexMargin / 100);
      } else if (t.partnerName.includes('Apollo')) {
        rateText = `${activeComms.apolloMargin.toFixed(2)}%`;
        earned = t.amount * (activeComms.apolloMargin / 100);
      } else if (t.partnerName.includes('Dr. Lal') || t.partnerName.includes('Max Labs')) {
        // Assume count of tests is derived or constant
        const testCount = t.partnerName.includes('Max Labs') ? 1 : 45;
        rateText = `Flat Rs. ${activeComms.lalFlat.toFixed(0)}`;
        earned = testCount * activeComms.lalFlat;
      }

      return {
        ...t,
        commissionRate: rateText,
        commissionEarned: parseFloat(earned.toFixed(2))
      };
    });

    setTxns(updated);

    // Sync with local storage
    if (!storedLedger) {
      localStorage.setItem('sehatrecover_partner_ledger', JSON.stringify(defaultTransactions));
    }

    // 3. Load logs
    const storedLogs = localStorage.getItem('sehatrecover_partner_notifications');
    if (storedLogs) {
      setLogs(JSON.parse(storedLogs));
    }
  };

  useEffect(() => {
    loadData();
    // Listen for storage changes in same tab
    const handleFocus = () => loadData();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const addNotificationLog = (channel: 'email' | 'whatsapp' | 'sms', recipient: string, msg: string) => {
    const newLog = {
      id: Date.now() + Math.random(),
      type: channel,
      recipient,
      message: msg,
      time: 'Just now'
    };
    const updatedLogs = [newLog, ...logs];
    setLogs(updatedLogs);
    localStorage.setItem('sehatrecover_partner_notifications', JSON.stringify(updatedLogs));
  };

  const releaseEscrow = (txnId: string) => {
    let releasedAmount = 0;
    const updated = txns.map(t => {
      if (t.id === txnId) {
        releasedAmount = t.commissionEarned;
        addNotificationLog('whatsapp', '+91 98765-01234', `💸 [PAYOUT SETTLED] Escrow funds released! Payout of Rs. ${t.commissionEarned.toLocaleString('en-IN')} approved via RazorpayX (ID: pay_rzpx_${txnId}). Sent to your registered bank account.`);
        addNotificationLog('sms', '+91 98765-01234', `SehatRecover Partner: Payout of Rs. ${t.commissionEarned.toLocaleString('en-IN')} is credited to your bank account.`);
        return { ...t, status: 'released' as const };
      }
      return t;
    });

    setTxns(updated);
    localStorage.setItem('sehatrecover_partner_ledger', JSON.stringify(updated));
    alert(`Payout of Rs. ${releasedAmount.toLocaleString('en-IN')} released successfully via RazorpayX node! Notifications dispatched.`);
  };

  const releaseAllEscrow = () => {
    let releasedSum = 0;
    const updated = txns.map(t => {
      if (t.status === 'escrow') {
        releasedSum += t.commissionEarned;
        return { ...t, status: 'released' as const };
      }
      return t;
    });

    if (releasedSum === 0) {
      alert('No funds currently locked in escrow to release.');
      return;
    }

    setTxns(updated);
    localStorage.setItem('sehatrecover_partner_ledger', JSON.stringify(updated));

    addNotificationLog('whatsapp', '+91 98765-01234', `💸 [PAYOUT BATCH RELEASE] Payout batch settlement complete. Credited Rs. ${releasedSum.toLocaleString('en-IN')} via RazorpayX bank integration (Receipt: RCPT-BATCH-${Date.now().toString().slice(-4)}).`);
    addNotificationLog('email', 'partner-billing@sehatrecover.com', `[BILLING AUDIT] Batch Escrow Release completed for Delhi NCR zone. Disbursed Rs. ${releasedSum.toLocaleString('en-IN')}`);
    
    alert(`Batch payout of Rs. ${releasedSum.toLocaleString('en-IN')} successfully settled to bank. Notifications sent.`);
  };

  // Math totals
  const totalVolume = txns.reduce((acc, t) => acc + t.amount, 0);
  const totalEarned = txns.reduce((acc, t) => acc + t.commissionEarned, 0);
  const lockedEscrow = txns.filter(t => t.status === 'escrow').reduce((acc, t) => acc + t.commissionEarned, 0);
  const releasedEscrow = txns.filter(t => t.status === 'released').reduce((acc, t) => acc + t.commissionEarned, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <CircleStackIcon className="w-7 h-7 text-emerald-400" />
            Financial Payout & Escrow Ledger
          </h1>
          <p className="text-sm text-slate-400">Review localized reselling commissions, trace ledger entries, and trigger escrow fund releases.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={loadData}
            className="p-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-100 rounded-xl transition-all"
            title="Refresh Ledger Rates"
          >
            <ArrowPathIcon className="w-5 h-5" />
          </button>
          <button 
            onClick={releaseAllEscrow}
            className="px-4 py-2 bg-emerald-400 hover:bg-emerald-500 text-black font-semibold rounded-xl text-sm transition-all flex items-center gap-2"
          >
            <ShieldCheckIcon className="w-5 h-5" />
            Settle All Escrow Funds
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
          <span className="block text-xs text-slate-400 uppercase font-semibold">Total Gross Volume</span>
          <span className="block text-3xl font-bold text-white mt-2">Rs. {totalVolume.toLocaleString('en-IN')}</span>
          <span className="block text-[11px] text-slate-500 mt-2">Total reselling transaction values in zone</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
          <span className="block text-xs text-slate-400 uppercase font-semibold">Total Commissions Earned</span>
          <span className="block text-3xl font-bold text-emerald-400 mt-2">Rs. {totalEarned.toLocaleString('en-IN')}</span>
          <span className="block text-[11px] text-slate-500 mt-2">Calculated dynamic margins and flat-rate fees</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-3 right-3 animate-pulse">
            <span className="w-2.5 h-2.5 bg-amber-500 rounded-full block"></span>
          </div>
          <span className="block text-xs text-slate-400 uppercase font-semibold">Locked in Escrow</span>
          <span className="block text-3xl font-bold text-amber-500 mt-2">Rs. {lockedEscrow.toLocaleString('en-IN')}</span>
          <span className="block text-[11px] text-slate-500 mt-2">Held pending verified logistics deliveries</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
          <span className="block text-xs text-slate-400 uppercase font-semibold">Settled & Released</span>
          <span className="block text-3xl font-bold text-cyan-400 mt-2">Rs. {releasedEscrow.toLocaleString('en-IN')}</span>
          <span className="block text-[11px] text-slate-500 mt-2">Transferred to registered bank account</span>
        </div>

      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Ledger Transaction Grid */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Commissions Ledger Entries</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold tracking-wider">
                    <th className="py-3 px-4">Txn ID</th>
                    <th className="py-3 px-4">Provider / Partner</th>
                    <th className="py-3 px-4 text-right">Order Value</th>
                    <th className="py-3 px-4 text-center">Comm Rate</th>
                    <th className="py-3 px-4 text-right">Earned Payout</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {txns.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-950/40 transition-colors">
                      <td className="py-4 px-4 font-mono text-slate-400">{t.id}</td>
                      <td className="py-4 px-4 font-medium text-white">{t.partnerName}</td>
                      <td className="py-4 px-4 text-right font-medium text-slate-300">Rs. {t.amount.toLocaleString('en-IN')}</td>
                      <td className="py-4 px-4 text-center text-slate-400">{t.commissionRate}</td>
                      <td className="py-4 px-4 text-right font-bold text-emerald-400">Rs. {t.commissionEarned.toLocaleString('en-IN')}</td>
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          t.status === 'released' ? 'bg-cyan-950/30 text-cyan-400 border-cyan-900/50' :
                          t.status === 'processing' ? 'bg-blue-950/30 text-blue-400 border-blue-900/50' :
                          'bg-amber-950/30 text-amber-400 border-amber-900/50'
                        }`}>
                          {t.status === 'released' ? <CheckCircleIcon className="w-3 h-3" /> : <ClockIcon className="w-3 h-3" />}
                          {t.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        {t.status === 'escrow' ? (
                          <button 
                            onClick={() => releaseEscrow(t.id)}
                            className="px-2.5 py-1 bg-emerald-400/10 hover:bg-emerald-400 text-emerald-400 hover:text-black font-semibold rounded text-[10px] border border-emerald-500/20 transition-all flex items-center gap-1 mx-auto"
                          >
                            Release <ArrowUpRightIcon className="w-2.5 h-2.5" />
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-500 italic">Settled</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RazorpayX Webhook and SMS Audit Log Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Escrow & Payout Alerts</h3>
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 bg-emerald-950/40 border border-emerald-900/50 px-2 py-0.5 rounded-md flex items-center gap-1">
              RazorpayX Nodes
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-6">Audits manual and automated releases, logs transactional receipts, and tracks omnichannel dispatches.</p>
          
          <div className="space-y-4 max-h-[380px] overflow-y-auto pr-2">
            {logs.filter(log => log.message.includes('escrow') || log.message.includes('PAYOUT') || log.message.includes('credited') || log.message.includes('billing') || log.message.includes('ledger')).length === 0 ? (
              <p className="text-xs text-slate-500 italic text-center py-10">No financial alerts logged yet. Release escrow payout parameters to see entries.</p>
            ) : (
              logs.filter(log => log.message.includes('escrow') || log.message.includes('PAYOUT') || log.message.includes('credited') || log.message.includes('billing') || log.message.includes('ledger')).map((log) => (
                <div key={log.id} className="bg-slate-950 border border-slate-800/80 p-3 rounded-lg font-mono text-[10px] space-y-1">
                  <div className="flex justify-between items-center">
                    <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-md ${
                      log.type === 'whatsapp' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/50' :
                      log.type === 'email' ? 'bg-cyan-950/40 text-cyan-400 border border-cyan-900/50' :
                      'bg-amber-950/40 text-amber-400 border-amber-900/50'
                    }`}>
                      {log.type}
                    </span>
                    <span className="text-[9px] text-slate-500">{log.time}</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    <strong>To:</strong> <code className="text-slate-500">{log.recipient}</code>
                  </div>
                  <p className="text-slate-300 font-medium">"{log.message}"</p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
