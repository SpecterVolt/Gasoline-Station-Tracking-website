import React from 'react';
import { 
  Fuel, 
  MapPin, 
  Truck, 
  KeyRound, 
  Wifi, 
  WifiOff, 
  Settings, 
  ShieldAlert,
  Globe
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'locator' | 'logistics' | 'admin';
  onChangeTab: (tab: 'locator' | 'logistics' | 'admin') => void;
  isOffline: boolean;
  onToggleOffline: () => void;
  userEmail?: string;
}

export default function Header({ 
  activeTab, 
  onChangeTab, 
  isOffline, 
  onToggleOffline,
  userEmail 
}: HeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200 text-slate-900 shadow-sm z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 flex-wrap md:flex-nowrap gap-4 py-2">
          
          {/* Logo & Brand Details */}
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 bg-blue-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-500/10">
              <Fuel className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold tracking-tight text-base sm:text-lg text-slate-900">SOLANO</span>
                <span className="text-[10px] bg-blue-50 border border-blue-200 text-blue-600 font-mono font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                  Logistics
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono select-none">
                Integrated Fuel Supply & Geolocation Portal
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex bg-slate-100 border border-slate-200 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => onChangeTab('locator')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold font-sans transition flex items-center gap-1.5 ${
                activeTab === 'locator' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-slate-600 hover:text-slate-950 hover:bg-slate-200/50'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Pumps Locator</span>
            </button>

            <button
              type="button"
              onClick={() => onChangeTab('logistics')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold font-sans transition flex items-center gap-1.5 ${
                activeTab === 'logistics' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-slate-600 hover:text-slate-950 hover:bg-slate-200/50'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Fleet Tankers</span>
            </button>

            <button
              type="button"
              onClick={() => onChangeTab('admin')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold font-sans transition flex items-center gap-1.5 ${
                activeTab === 'admin' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-slate-600 hover:text-slate-950 hover:bg-slate-200/50'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Merchant POS</span>
            </button>
          </nav>

          {/* User accounts status drawer */}
          <div className="flex items-center gap-3">
            
            {/* Offline Simulation toggle */}
            <button
              type="button"
              onClick={onToggleOffline}
              className={`px-2.5 py-1.5 text-xs font-mono font-bold rounded-lg border transition flex items-center gap-1.5 ${
                isOffline 
                  ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100' 
                  : 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
              }`}
              title={isOffline ? 'Switch to dynamic API synchronization' : 'Simulate remote offline Highway cell loss'}
            >
              {isOffline ? <WifiOff className="w-3.5 h-3.5 text-amber-600" /> : <Wifi className="w-3.5 h-3.5 text-green-600" />}
              <span>{isOffline ? 'OFFLINE' : 'ONLINE'}</span>
            </button>

            {/* Email login indicator badge */}
            {userEmail && (
              <div className="hidden lg:flex flex-col items-end text-right font-mono text-[9px]">
                <span className="text-slate-450 font-bold uppercase">Active Account:</span>
                <span className="text-blue-600 font-semibold truncate max-w-[170px]" title={userEmail}>
                  {userEmail}
                </span>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
