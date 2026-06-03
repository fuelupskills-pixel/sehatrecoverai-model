"use client";

import React, { useState, useEffect } from 'react';
import { 
  TruckIcon, 
  MapPinIcon, 
  CheckCircleIcon,
  PhoneIcon
} from '@heroicons/react/24/outline';

interface DeliveryOrder {
  id: string;
  pharmacyName: string;
  items: string;
  destAddress: string;
  destLat: number;
  destLng: number;
  pharmLat: number;
  pharmLng: number;
  distance: number;
  status: 'ASSIGNED' | 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED';
  riderName: string;
  riderPhone: string;
  otpCode: string;
}

const initialOrders: DeliveryOrder[] = [
  { 
    id: 'ORD-8931', 
    pharmacyName: 'Wellness Pharmacy Inc.', 
    items: 'Metformin 500mg x 60 tabs, Vitamin C 500mg x 30 tabs',
    destAddress: 'Block C, Sector 45, Noida',
    destLat: 28.5910, destLng: 77.3421,
    pharmLat: 28.5831, pharmLng: 77.3210,
    distance: 2.3, // pre-calculated km
    status: 'ASSIGNED',
    riderName: '',
    riderPhone: '',
    otpCode: '4821'
  },
  { 
    id: 'ORD-7742', 
    pharmacyName: 'Apex Chemist', 
    items: 'Amoxicillin 500mg x 15 caps',
    destAddress: 'Chanakyapuri, New Delhi',
    destLat: 28.5982, destLng: 77.1820,
    pharmLat: 28.6110, pharmLng: 77.2023,
    distance: 2.6,
    status: 'IN_TRANSIT',
    riderName: 'Rajesh Kumar',
    riderPhone: '+91 91234-56789',
    otpCode: '8910'
  }
];

export default function PharmacyDeliveryPage() {
  const [orders, setOrders] = useState<DeliveryOrder[]>(initialOrders);
  const [selectedRider, setSelectedRider] = useState('Vikram Rathore');
  const [otpInput, setOtpInput] = useState<{ [key: string]: string }>({});
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('sehatrecover_partner_notifications');
    if (stored) {
      const parsed = JSON.parse(stored);
      const filtered = parsed
        ? parsed
            .filter((l: any) => l.message.includes('Order') || l.message.includes('order') || l.message.includes('Rider') || l.message.includes('escrow') || l.message.includes('invoice'))
            .map((l: any) => l.message)
        : [];
      setLogs(filtered);
    }
  }, []);

  const riders = ['Vikram Rathore', 'Amit Sharma', 'Rohan Sharma'];

  const dispatchRider = (orderId: string) => {
    setOrders(orders.map(o => {
      if (o.id === orderId) {
        const phone = selectedRider === 'Vikram Rathore' ? '+91 98765-01234' : '+91 96543-98765';
        
        // Push notification simulation logs
        addLog(`[WHATSAPP DISPATCH] Pushed routing payload to rider ${selectedRider} (${phone}) for order ${orderId}`);
        addLog(`[SMS ALERT] SMS confirmation sent to customer for order ${orderId}: "Rider ${selectedRider} dispatched."`);
        
        return { ...o, riderName: selectedRider, status: 'PICKED_UP', riderPhone: phone };
      }
      return o;
    }));
  };

  const advanceStatus = (orderId: string, currentStatus: string) => {
    setOrders(orders.map(o => {
      if (o.id === orderId) {
        let nextStatus: 'ASSIGNED' | 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED' = 'IN_TRANSIT';
        if (currentStatus === 'PICKED_UP') {
          nextStatus = 'IN_TRANSIT';
          addLog(`[WHATSAPP ALERT] WhatsApp sent to patient: "Your order ${orderId} is out for delivery."`);
        }
        return { ...o, status: nextStatus };
      }
      return o;
    }));
  };

  const verifyOTP = (orderId: string, trueOtp: string) => {
    const input = otpInput[orderId];
    if (input === trueOtp) {
      setOrders(orders.map(o => {
        if (o.id === orderId) {
          addLog(`[EMAIL RECEIPT] Emailed transactional invoice to patient for completed order ${orderId}.`);
          addLog(`[WHATSAPP DISPATCH] Released escrow funds payout approval for partner transaction.`);
          
          // Ledger update logic
          const existingLedger = localStorage.getItem('sehatrecover_partner_ledger') || '[]';
          const ledgerList = JSON.parse(existingLedger);
          const newLedgerTxn = {
            id: 'TXN-' + Math.floor(1000 + Math.random() * 9000),
            partnerName: 'Apex Wellness Pharmacy (Pharmacy)',
            amount: 850.00,
            commissionRate: '8.50%',
            commissionEarned: 72.25,
            status: 'escrow',
            created_at: new Date().toISOString()
          };
          localStorage.setItem('sehatrecover_partner_ledger', JSON.stringify([newLedgerTxn, ...ledgerList]));
          addLog(`[SYSTEM AUDIT] Escrow transaction generated for Order ${orderId}: Payout amount Rs. 72.25`);

          return { ...o, status: 'DELIVERED' };
        }
        return o;
      }));
      alert(`Order ${orderId} delivered and verified successfully! Release transaction escrow.`);
    } else {
      alert("Invalid OTP code! Delivery verification failed.");
    }
  };

  const handleOtpChange = (orderId: string, val: string) => {
    setOtpInput({ ...otpInput, [orderId]: val });
  };

  const addLog = (msg: string) => {
    setLogs(prev => [msg, ...prev]);

    // Parse channel and recipient from msg
    let channel: 'email' | 'whatsapp' | 'sms' = 'whatsapp';
    let recipient = '+91 98765-01234';
    if (msg.includes('SMS')) {
      channel = 'sms';
      recipient = '+91 99887-76655';
    } else if (msg.includes('EMAIL') || msg.includes('Emailed') || msg.includes('RECEIPT')) {
      channel = 'email';
      recipient = 'patient@example.com';
    }

    const storedLogs = localStorage.getItem('sehatrecover_partner_notifications') || '[]';
    const parsed = JSON.parse(storedLogs);
    const newLog = {
      id: Date.now() + Math.random(),
      type: channel,
      recipient,
      message: msg,
      time: 'Just now'
    };
    localStorage.setItem('sehatrecover_partner_notifications', JSON.stringify([newLog, ...parsed]));
  };


  // Math Haversine Formula calculation helper display
  const haversineText = `d = 2R * arcsin(sqrt(sin²(Δφ/2) + cos(φ₁)cos(φ₂)sin²(Δλ/2)))`;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Last-Mile Pharmacy Delivery</h1>
          <p className="text-sm text-slate-400">Manage prescription drug logistics dispatch, match riders, and confirm handoff OTPs.</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-right">
          <span className="block text-[10px] text-slate-500 font-semibold uppercase">Haversine Distance Metric</span>
          <code className="text-xs text-emerald-400 font-mono font-semibold">{haversineText}</code>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Active Deliveries Queue */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Live Order Deliveries</h3>
            
            <div className="space-y-6">
              {orders.map((o) => (
                <div key={o.id} className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
                  <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                    <div>
                      <span className="text-xs text-emerald-400 font-mono font-semibold block">{o.id}</span>
                      <strong className="text-sm text-white mt-1 block">{o.pharmacyName}</strong>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                      o.status === 'ASSIGNED' ? 'bg-amber-950/40 text-amber-400 border-amber-900/50' :
                      o.status === 'PICKED_UP' ? 'bg-cyan-950/40 text-cyan-400 border-cyan-900/50' :
                      o.status === 'IN_TRANSIT' ? 'bg-indigo-950/40 text-indigo-400 border-indigo-900/50' :
                      'bg-emerald-950/40 text-emerald-400 border-emerald-900/50'
                    }`}>
                      {o.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-500 block uppercase font-bold tracking-wider mb-1">Prescription Items</span>
                      <p className="text-slate-300 font-medium">{o.items}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 block uppercase font-bold tracking-wider mb-1">Delivery Destination</span>
                      <p className="text-slate-300 font-medium flex items-center gap-1">
                        <MapPinIcon className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        {o.destAddress}
                      </p>
                    </div>
                  </div>

                  {/* Dynamic Action Area depending on status */}
                  <div className="pt-3 border-t border-slate-800/80 flex flex-wrap justify-between items-center gap-3">
                    <span className="text-xs text-slate-500">
                      Hyperlocal Routing: <strong className="text-slate-300">{o.distance} km</strong>
                    </span>

                    {o.status === 'ASSIGNED' && (
                      <div className="flex items-center gap-3">
                        <select 
                          value={selectedRider} 
                          onChange={(e) => setSelectedRider(e.target.value)} 
                          className="bg-slate-900 border border-slate-800 rounded-lg text-xs py-1.5 px-3 text-white outline-none cursor-pointer"
                        >
                          {riders.map(r => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                        <button 
                          onClick={() => dispatchRider(o.id)}
                          className="btn btn-primary px-4 py-1.5 rounded-lg text-xs font-semibold"
                          style={{ background: 'var(--primary, #00ccb4)', color: '#000' }}
                        >
                          Dispatch Rider
                        </button>
                      </div>
                    )}

                    {o.status === 'PICKED_UP' && (
                      <button 
                        onClick={() => advanceStatus(o.id, o.status)}
                        className="btn btn-primary px-4 py-1.5 rounded-lg text-xs font-semibold bg-indigo-500 hover:bg-indigo-600 text-white"
                      >
                        Set Out for Delivery (In Transit)
                      </button>
                    )}

                    {o.status === 'IN_TRANSIT' && (
                      <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400" title={`Call rider ${o.riderName}`}>
                            <PhoneIcon className="w-4 h-4" />
                          </div>
                          <span className="text-xs text-slate-400 font-semibold">{o.riderName}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <input 
                            type="text" 
                            placeholder="Enter 4-Digit OTP" 
                            maxLength={4}
                            onChange={(e) => handleOtpChange(o.id, e.target.value)}
                            className="bg-slate-900 border border-slate-800 rounded-lg text-xs py-1.5 px-3 text-white w-28 text-center outline-none" 
                          />
                          <button 
                            onClick={() => verifyOTP(o.id, o.otpCode)}
                            className="btn btn-primary px-4 py-1.5 rounded-lg text-xs font-semibold text-black bg-emerald-400 hover:bg-emerald-500"
                            style={{ background: '#00ccb4' }}
                          >
                            Verify & Complete
                          </button>
                        </div>
                      </div>
                    )}

                    {o.status === 'DELIVERED' && (
                      <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircleIcon className="w-4 h-4" /> Order complete. Handoff verified.
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Real-time Web Hook Alert Log Outputs */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-2">Simulation webhook dispatch logs</h3>
          <p className="text-xs text-slate-500 mb-6">Pushes simulated payloads dynamically upon dispatch routing states.</p>
          
          <div className="space-y-3 max-h-[360px] overflow-y-auto pr-2">
            {logs.length === 0 ? (
              <p className="text-xs text-slate-500 italic text-center py-10">Waiting for actions to trigger webhook logs...</p>
            ) : (
              logs.map((log, idx) => (
                <div key={idx} className="bg-slate-950 border border-slate-800/80 p-3 rounded-lg font-mono text-[10px] space-y-1">
                  <div className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider">
                    {log.split("]")[0].replace("[", "")}
                  </div>
                  <p className="text-slate-300 break-words font-medium">"{log.split("]")[1]?.trim()}"</p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
