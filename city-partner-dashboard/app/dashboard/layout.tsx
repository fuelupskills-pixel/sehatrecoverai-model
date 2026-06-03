"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Squares2X2Icon, 
  UserPlusIcon, 
  TruckIcon, 
  BeakerIcon, 
  CircleStackIcon, 
  ArrowLeftOnRectangleIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';

const menuItems = [
  { name: 'Overview & Earnings', href: '/dashboard', icon: Squares2X2Icon },
  { name: 'Provider CRM', href: '/dashboard/onboarding', icon: UserPlusIcon },
  { name: 'Pharmacy Deliveries', href: '/dashboard/pharmacy', icon: TruckIcon },
  { name: 'Sample Collection', href: '/dashboard/diagnostics', icon: BeakerIcon },
  { name: 'Financial Ledger', href: '/dashboard/ledger', icon: CircleStackIcon },
  { name: 'Admin Commissions', href: '/admin/commissions', icon: AdjustmentsHorizontalIcon },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans">
      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 transition-transform duration-300 transform lg:translate-x-0 lg:static lg:inset-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-20 flex items-center justify-center border-b border-slate-800 px-6">
          <span className="text-xl font-bold tracking-wider bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            SEHATRECOVER
          </span>
          <span className="ml-2 px-2 py-0.5 text-xs font-semibold text-emerald-400 bg-emerald-950/50 border border-emerald-900/50 rounded-full">
            Partner
          </span>
        </div>
        
        <nav className="mt-6 px-4 space-y-1.5">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 text-emerald-400 border border-emerald-500/20' 
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-6 left-0 right-0 px-4">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-950/20 transition-all">
            <ArrowLeftOnRectangleIcon className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-20 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-40">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden text-slate-400 hover:text-slate-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
          </button>

          <div className="flex items-center gap-4 ml-auto">
            <div className="text-right">
              <span className="block text-sm font-semibold text-slate-200">Anna Smith</span>
              <span className="block text-xs text-slate-500">Zone: Delhi NCR</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
              AS
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto bg-slate-950">
          {children}
        </main>
      </div>
    </div>
  );
}
