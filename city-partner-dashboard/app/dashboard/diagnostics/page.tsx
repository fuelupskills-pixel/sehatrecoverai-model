"use client";

import React, { useState, useEffect } from 'react';
import { 
  BeakerIcon, 
  CloudArrowUpIcon, 
  MapPinIcon, 
  QrCodeIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  EnvelopeIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

interface DiagnosticsTask {
  id: string;
  patientName: string;
  testName: string;
  address: string;
  scheduledTime: string;
  status: 'ASSIGNED' | 'COLLECTING' | 'IN_TRANSIT' | 'DROPPED_OFF' | 'FAILED';
  vialBarcode: string;
  temperatures: number[]; // Temperature readings log
  agentName: string;
  agentPhone: string;
}

const initialTasks: DiagnosticsTask[] = [
  {
    id: 'DX-1001',
    patientName: 'Anna Smith',
    testName: 'Diabetes Screening (HbA1c + Fasting Blood Sugar)',
    address: 'Block C, Sector 45, Noida',
    scheduledTime: 'Today at 09:30 AM',
    status: 'ASSIGNED',
    vialBarcode: '',
    temperatures: [4.2, 4.5, 4.8],
    agentName: 'Agent Amit Sharma',
    agentPhone: '+91 96543-98765'
  },
  {
    id: 'DX-1002',
    patientName: 'John Doe',
    testName: 'Complete Blood Count (CBC) & Liver Panel',
    address: 'Chanakyapuri, New Delhi',
    scheduledTime: 'Today at 11:00 AM',
    status: 'IN_TRANSIT',
    vialBarcode: 'V-901128',
    temperatures: [5.1, 6.2, 8.4, 7.9], // Will trigger warning if >8
    agentName: 'Agent Rajesh Kumar',
    agentPhone: '+91 91234-56789'
  }
];

export default function DiagnosticsPage() {
  const [tasks, setTasks] = useState<DiagnosticsTask[]>(initialTasks);
  const [barcodeInputs, setBarcodeInputs] = useState<{ [key: string]: string }>({});
  const [tempInputs, setTempInputs] = useState<{ [key: string]: string }>({});
  const [logs, setLogs] = useState<any[]>([]);

  // Load existing notifications
  useEffect(() => {
    const storedLogs = localStorage.getItem('sehatrecover_partner_notifications');
    if (storedLogs) {
      setLogs(JSON.parse(storedLogs));
    }
  }, []);

  const addNotificationLog = (channel: 'email' | 'whatsapp' | 'sms', recipient: string, msg: string) => {
    const newLog = {
      id: Date.now() + Math.random(),
      type: channel,
      recipient,
      message: msg,
      time: 'Just now'
    };
    const updated = [newLog, ...logs];
    setLogs(updated);
    localStorage.setItem('sehatrecover_partner_notifications', JSON.stringify(updated));
  };

  const handleBarcodeChange = (taskId: string, val: string) => {
    setBarcodeInputs({ ...barcodeInputs, [taskId]: val });
  };

  const syncBarcode = (taskId: string) => {
    const val = barcodeInputs[taskId];
    if (!val || val.trim() === '') {
      alert('Please enter a valid barcode to sync.');
      return;
    }

    setTasks(tasks.map(t => {
      if (t.id === taskId) {
        addNotificationLog('whatsapp', t.agentPhone, `[BARCODE SYNCED] Vial barcode ${val} successfully mapped to Task ${taskId} (Patient: ${t.patientName})`);
        addNotificationLog('email', 'lab-supervisor@sehatrecover.com', `[SYSTEM AUDIT] Barcode mapping locked: Task ${taskId} -> Vial ID ${val}`);
        return { ...t, vialBarcode: val, status: 'COLLECTING' };
      }
      return t;
    }));
    alert(`Barcode ${val} mapped to task ${taskId} successfully! Status updated to Collecting.`);
  };

  const handleTempChange = (taskId: string, val: string) => {
    setTempInputs({ ...tempInputs, [taskId]: val });
  };

  const addTemperatureLog = (taskId: string) => {
    const val = parseFloat(tempInputs[taskId]);
    if (isNaN(val)) {
      alert('Please enter a valid numeric temperature (e.g. 5.6)');
      return;
    }

    setTasks(tasks.map(t => {
      if (t.id === taskId) {
        const updatedTemps = [...t.temperatures, val];
        
        // Check for cold-chain violation (>8°C)
        if (val > 8.0) {
          addNotificationLog('email', 'supervisor@maxlabs.com', `🚨 [CRITICAL ALERT] Cold-chain violation! Vial barcode ${t.vialBarcode || 'unmapped'} (Task ${taskId}) temperature spiked to ${val}°C (Threshold: 8.0°C).`);
          addNotificationLog('sms', t.agentPhone, `⚠️ [CORESYNC WARNING] Temperature alert! Cold chain temperature for task ${taskId} is at ${val}°C. Please verify insulation pack.`);
          alert(`Warning: Temperature of ${val}°C exceeds cold chain safety threshold of 8.0°C! Alert notifications dispatched.`);
        } else {
          addNotificationLog('email', 'supervisor@maxlabs.com', `[COLD CHAIN] Temperature update for Task ${taskId}: ${val}°C (Status: OK)`);
        }

        return { ...t, temperatures: updatedTemps };
      }
      return t;
    }));
    setTempInputs({ ...tempInputs, [taskId]: '' });
  };

  const advanceTaskStatus = (taskId: string, currentStatus: string) => {
    setTasks(tasks.map(t => {
      if (t.id === taskId) {
        let nextStatus: 'ASSIGNED' | 'COLLECTING' | 'IN_TRANSIT' | 'DROPPED_OFF' | 'FAILED' = 'ASSIGNED';
        if (currentStatus === 'ASSIGNED') {
          nextStatus = 'COLLECTING';
          addNotificationLog('sms', '+91 98765-01234', `Your health collection agent is preparing your samples for Task ${taskId}.`);
        } else if (currentStatus === 'COLLECTING') {
          nextStatus = 'IN_TRANSIT';
          addNotificationLog('whatsapp', t.agentPhone, `Routing dispatch confirmed. Diagnostic hub set to Max Labs.`);
        } else if (currentStatus === 'IN_TRANSIT') {
          nextStatus = 'DROPPED_OFF';
          addNotificationLog('email', 'lab-supervisor@sehatrecover.com', `Sample vial ${t.vialBarcode} successfully dropped off and signed for at the Diagnostic Lab repository.`);
          addNotificationLog('whatsapp', '+91 98765-01234', `Your diagnostic sample (Task ${taskId}) has been safely delivered to Max Labs. Testing is now in progress.`);
          
          // Ledger update logic
          const existingLedger = localStorage.getItem('sehatrecover_partner_ledger') || '[]';
          const ledgerList = JSON.parse(existingLedger);
          const newLedgerTxn = {
            id: 'TXN-' + Math.floor(1000 + Math.random() * 9000),
            partnerName: 'Max Labs (Diagnostics)',
            amount: 450.00,
            commissionRate: 'Flat Rs. 150',
            commissionEarned: 150.00,
            status: 'escrow',
            created_at: new Date().toISOString()
          };
          localStorage.setItem('sehatrecover_partner_ledger', JSON.stringify([newLedgerTxn, ...ledgerList]));
          addNotificationLog('whatsapp', '+91 96543-98765', `Payout release approval added to Partner Escrow Account: Earned Rs. 150.`);
        }
        return { ...t, status: nextStatus };
      }
      return t;
    }));
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <BeakerIcon className="w-7 h-7 text-emerald-400" />
          Diagnostics Cold-Chain Logistics
        </h1>
        <p className="text-sm text-slate-400">Track dynamic home sample collection, vial barcode mapping, and real-time cold-chain temperature telemetry.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Active Collection queue */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Ongoing Sample Collections</h3>
            
            <div className="space-y-6">
              {tasks.map((t) => {
                const latestTemp = t.temperatures[t.temperatures.length - 1];
                const hasTempAlert = latestTemp > 8.0;

                return (
                  <div key={t.id} className="bg-slate-950 border border-slate-800/80 rounded-xl p-5 space-y-4 relative overflow-hidden">
                    {/* Header */}
                    <div className="flex justify-between items-start border-b border-slate-800/80 pb-3 flex-wrap gap-2">
                      <div>
                        <span className="text-xs text-cyan-400 font-mono font-semibold block">{t.id}</span>
                        <strong className="text-sm text-white mt-1 block">{t.patientName}</strong>
                        <span className="text-xs text-slate-500">{t.testName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md border ${
                          t.status === 'ASSIGNED' ? 'bg-slate-950 text-slate-400 border-slate-800' :
                          t.status === 'COLLECTING' ? 'bg-amber-950/40 text-amber-400 border-amber-900/50' :
                          t.status === 'IN_TRANSIT' ? 'bg-cyan-950/40 text-cyan-400 border-cyan-900/50' :
                          'bg-emerald-950/40 text-emerald-400 border-emerald-900/50'
                        }`}>
                          {t.status}
                        </span>
                      </div>
                    </div>

                    {/* Meta info & Barcode */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      <div>
                        <span className="text-slate-500 block uppercase font-bold tracking-wider mb-1">Scheduled Time</span>
                        <p className="text-slate-300 font-medium">{t.scheduledTime}</p>
                        <span className="text-slate-500 block uppercase font-bold tracking-wider mb-1 mt-2">Collector Agent</span>
                        <p className="text-slate-300 font-medium">{t.agentName} ({t.agentPhone})</p>
                      </div>

                      <div>
                        <span className="text-slate-500 block uppercase font-bold tracking-wider mb-1">Vial Barcode Sync</span>
                        {t.vialBarcode ? (
                          <div className="flex items-center gap-1.5 text-emerald-400 font-mono font-semibold mt-1">
                            <QrCodeIcon className="w-4 h-4" />
                            {t.vialBarcode}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 mt-1">
                            <input 
                              type="text" 
                              placeholder="Barcode ID" 
                              value={barcodeInputs[t.id] || ''}
                              onChange={(e) => handleBarcodeChange(t.id, e.target.value)}
                              className="bg-slate-900 border border-slate-800 rounded-lg text-xs py-1.5 px-3 text-white outline-none w-28"
                            />
                            <button 
                              onClick={() => syncBarcode(t.id)}
                              className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-600 text-black font-semibold rounded-lg transition-all"
                            >
                              Sync
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Cold Chain Data Logger */}
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 block uppercase font-bold tracking-wider">Cold Chain Temperature</span>
                          <span className="text-[10px] text-slate-500">Threshold &le; 8°C</span>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 bg-slate-900/60 border border-slate-800 rounded-lg p-2 flex justify-between items-center">
                            <span className="text-slate-400">Current:</span>
                            <span className={`font-mono font-bold ${hasTempAlert ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
                              {latestTemp !== undefined ? `${latestTemp}°C` : 'N/A'}
                            </span>
                          </div>
                          
                          {t.status !== 'DROPPED_OFF' && (
                            <div className="flex items-center gap-1.5">
                              <input 
                                type="text" 
                                placeholder="Temp" 
                                value={tempInputs[t.id] || ''}
                                onChange={(e) => handleTempChange(t.id, e.target.value)}
                                className="bg-slate-900 border border-slate-800 rounded-lg text-xs py-1.5 px-1.5 text-white outline-none w-14 text-center"
                              />
                              <button 
                                onClick={() => addTemperatureLog(t.id)}
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all"
                                title="Log Temperature"
                              >
                                Log
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Temperature History Line */}
                        <div className="mt-2 flex gap-1 items-center flex-wrap">
                          <span className="text-[10px] text-slate-500 uppercase">Log:</span>
                          {t.temperatures.map((temp, i) => (
                            <span 
                              key={i} 
                              className={`text-[10px] font-mono px-1 rounded-sm border ${
                                temp > 8.0 
                                  ? 'bg-rose-950/20 text-rose-400 border-rose-900/50 font-bold' 
                                  : 'bg-slate-900/40 text-slate-400 border-slate-800'
                              }`}
                            >
                              {temp}°
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Warnings & Alerts banner */}
                    {hasTempAlert && (
                      <div className="bg-rose-950/25 border border-rose-900/50 rounded-xl p-3 flex items-start gap-3 mt-2">
                        <ExclamationTriangleIcon className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-xs font-semibold text-rose-400 block">Critical Cold-Chain Temperature Warning</strong>
                          <p className="text-[11px] text-rose-300/80 mt-0.5">Temperature detected at {latestTemp}°C, exceeding the 8.0°C bio-safety limit. Alert emails and SMS instructions have been dispatched to supervisors and the collection agent.</p>
                        </div>
                      </div>
                    )}

                    {/* Progress controller bar */}
                    <div className="pt-3 border-t border-slate-900 flex justify-between items-center gap-3">
                      <span className="text-[10px] text-slate-500 font-medium">
                        Patient Address: <strong className="text-slate-400">{t.address}</strong>
                      </span>

                      {t.status === 'ASSIGNED' && (
                        <button 
                          onClick={() => advanceTaskStatus(t.id, t.status)}
                          className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all"
                        >
                          Step 1: Check-in at Patient Site
                          <ChevronRightIcon className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {t.status === 'COLLECTING' && (
                        <button 
                          onClick={() => advanceTaskStatus(t.id, t.status)}
                          className="px-4 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all"
                        >
                          Step 2: Dispatch Samples (In Transit)
                          <ChevronRightIcon className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {t.status === 'IN_TRANSIT' && (
                        <button 
                          onClick={() => advanceTaskStatus(t.id, t.status)}
                          className="px-4 py-1.5 bg-emerald-400 hover:bg-emerald-500 text-black text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all"
                        >
                          Step 3: Drop-off and Handover to Lab
                          <CheckCircleIcon className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {t.status === 'DROPPED_OFF' && (
                        <div className="text-emerald-400 font-semibold text-xs flex items-center gap-1.5">
                          <CheckCircleIcon className="w-4 h-4" />
                          Samples Drop-off Verified. Payout Credited to Ledger.
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Live Simulation Webhook Alerts panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Live Alerts Console</h3>
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 bg-emerald-950/40 border border-emerald-900/50 px-2 py-0.5 rounded-md flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span> Sync Active
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-6">Real-time status logs of simulated SMS, Email, and WhatsApp dispatches on diagnostics operations.</p>
          
          <div className="space-y-4 max-h-[480px] overflow-y-auto pr-2">
            {logs.filter(log => log.message.includes('[BARCODE') || log.message.includes('[SYSTEM') || log.message.includes('[COLD') || log.message.includes('violation') || log.message.includes('Temperature alert') || log.message.includes('health collection') || log.message.includes('Diagnostic hub') || log.message.includes('diagnostic sample') || log.message.includes('Ledger') || log.message.includes('Escrow')).length === 0 ? (
              <p className="text-xs text-slate-500 italic text-center py-10">No diagnostic operations logged yet. Perform syncs and updates above to trigger events.</p>
            ) : (
              logs.filter(log => log.message.includes('[BARCODE') || log.message.includes('[SYSTEM') || log.message.includes('[COLD') || log.message.includes('violation') || log.message.includes('Temperature alert') || log.message.includes('health collection') || log.message.includes('Diagnostic hub') || log.message.includes('diagnostic sample') || log.message.includes('Ledger') || log.message.includes('Escrow')).map((log) => (
                <div key={log.id} className="bg-slate-950 border border-slate-800/80 p-3 rounded-lg font-mono text-[10px] space-y-1">
                  <div className="flex justify-between items-center">
                    <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-md ${
                      log.type === 'whatsapp' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/50' :
                      log.type === 'email' ? 'bg-cyan-950/40 text-cyan-400 border border-cyan-900/50' :
                      'bg-amber-950/40 text-amber-400 border border-amber-900/50'
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
