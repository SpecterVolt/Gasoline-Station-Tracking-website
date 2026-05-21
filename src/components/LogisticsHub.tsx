import React, { useState } from 'react';
import { 
  Truck, 
  Activity, 
  Terminal, 
  Play, 
  Check, 
  AlertCircle, 
  Navigation,
  Anchor,
  Compass,
  Gauge,
  Box,
  CornerDownRight
} from 'lucide-react';
import { LogisticsTruck, GasStation } from '../types';

interface LogisticsHubProps {
  trucks: LogisticsTruck[];
  stations: GasStation[];
  selectedTruckId: string | null;
  onSelectTruck: (id: string | null) => void;
  onDispatchTruck: (truckId: string, stationId: string, cargoType: any) => void;
}

export default function LogisticsHub({
  trucks,
  stations,
  selectedTruckId,
  onSelectTruck,
  onDispatchTruck
}: LogisticsHubProps) {
  const [targetStation, setTargetStation] = useState<string>('');
  const [cargoType, setCargoType] = useState<'regular' | 'premium' | 'diesel'>('regular');
  
  // Find which truck is currently highlighted for deep telemetry view
  const activeTruck = trucks.find(t => t.id === selectedTruckId) || trucks[0];

  const handleManualDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetStation) return;
    
    // Manual trigger for first idle/returning truck
    const idleTruck = trucks.find(t => t.status === 'idle');
    if (!idleTruck) {
      alert("All Solano Tanker fleets are currently active. Await cargo offload completion.");
      return;
    }

    onDispatchTruck(idleTruck.id, targetStation, cargoType);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Fleet Overview Panel */}
      <div className="lg:col-span-2 space-y-4">
        
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-semibold text-slate-100">Solano Regional Tanker Fleet</h2>
          </div>
          <span className="bg-amber-950 border border-amber-800 text-amber-400 font-mono text-[10px] py-1 px-2.5 rounded-full uppercase tracking-wider font-bold animate-pulse">
            Telemetry Live Sync (3s)
          </span>
        </div>

        {/* Fleet Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {trucks.map((truck) => {
            const isSelected = truck.id === selectedTruckId;
            const percentage = (truck.cargoCurrent / truck.cargoCapacity) * 100;
            
            const statusStyle = 
              truck.status === 'en-route' ? 'bg-amber-950 border-amber-800 text-amber-400' :
              truck.status === 'refueling' ? 'bg-emerald-950 border-emerald-800 text-emerald-300 animate-pulse' :
              truck.status === 'returning' ? 'bg-blue-950 border-blue-800 text-blue-300' :
              'bg-slate-900 border-slate-800 text-slate-400';

            return (
              <div
                key={truck.id}
                onClick={() => onSelectTruck(isSelected ? null : truck.id)}
                className={`p-4 rounded-xl border transition cursor-pointer hover:border-slate-700 relative flex flex-col justify-between ${
                  isSelected ? 'bg-gradient-to-br from-slate-900 to-amber-950/15 border-amber-500/80 shadow-md' : 'bg-slate-900/60 border-slate-850'
                }`}
              >
                <div>
                  
                  {/* Card Title & Status Tag */}
                  <div className="flex justify-between items-center gap-2 mb-3">
                    <span className="font-bold text-slate-200 text-sm flex items-center gap-1.5">
                      <Truck className={`w-4 h-4 ${isSelected ? "text-amber-500" : "text-slate-400"}`} />
                      {truck.name}
                    </span>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-mono font-bold uppercase ${statusStyle}`}>
                      {truck.status}
                    </span>
                  </div>

                  {/* Route progress */}
                  <div className="text-[11px] font-sans text-slate-400 space-y-1 mb-4">
                    <div className="flex justify-between">
                      <span>Dest:</span>
                      <strong className="text-slate-200">{truck.destinationName}</strong>
                    </div>
                    {truck.status !== 'idle' && (
                      <div className="flex justify-between font-mono text-[10px]">
                        <span>ETA Window:</span>
                        <strong className="text-amber-400">{truck.etaMinutes} mins</strong>
                      </div>
                    )}
                    <div className="flex justify-between font-mono text-[10px]">
                      <span>Vector speed:</span>
                      <span>{truck.speedMph} mph / 48 knots</span>
                    </div>
                  </div>

                  {/* Cargo Load meter */}
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-[10px] font-mono text-slate-500">
                      <span>CARGO: {truck.cargoType.toUpperCase()}</span>
                      <span>{truck.cargoCurrent.toLocaleString()}/{truck.cargoCapacity.toLocaleString()} GAL</span>
                    </div>
                    {/* Linear progress bar */}
                    <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-900">
                      <div 
                        className={`h-full transition-all duration-1000 ${
                          truck.cargoType === 'regular' ? 'bg-emerald-500' :
                          truck.cargoType === 'premium' ? 'bg-cyan-500' :
                          truck.cargoType === 'diesel' ? 'bg-yellow-500' :
                          'bg-indigo-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>

                </div>

                {/* Tracking Action Overlay */}
                <div className="mt-4 pt-3 border-t border-slate-850/50 flex justify-between items-center text-[10px] font-mono">
                  <span className="text-slate-500">HIGHLIGHT POSITION</span>
                  <span className="text-amber-400 flex items-center gap-0.5 hover:underline">
                    Analyze Map
                    <CornerDownRight className="w-3 h-3 text-amber-500" />
                  </span>
                </div>

              </div>
            );
          })}
        </div>

        {/* Interactive Manual Dispatch Control Board */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-950/60 shadow-lg">
          <h3 className="text-slate-200 font-semibold text-sm mb-3 flex items-center gap-2">
            <Play className="w-4 h-4 text-emerald-400 animate-pulse" />
            Sandbox Logistics Manual Dispatch Terminal
          </h3>
          
          {trucks.some(t => t.status === 'idle') ? (
            <form onSubmit={handleManualDispatch} className="grid grid-cols-1 md:grid-cols-3 gap-3">
              
              <div>
                <label className="block text-[10px] font-mono text-slate-500 uppercase font-semibold mb-1">
                  1. Target Depot Location
                </label>
                <select
                  value={targetStation}
                  onChange={(e) => setTargetStation(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-300 p-2 rounded-lg text-xs font-sans focus:outline-none focus:border-cyan-500"
                  required
                >
                  <option value="">-- Choose pump station --</option>
                  {stations.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-500 uppercase font-semibold mb-1">
                  2. Cargo Fuel Vault
                </label>
                <select
                  value={cargoType}
                  onChange={(e) => setCargoType(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-300 p-2 rounded-lg text-xs font-sans focus:outline-none focus:border-cyan-500"
                >
                  <option value="regular">Regular Unleaded</option>
                  <option value="premium">Premium Blue Grade</option>
                  <option value="diesel">Ultra-Low Sulfur Diesel</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-slate-50 p-2 text-xs font-semibold rounded-lg shadow-md hover:shadow-emerald-900/50 transition duration-150 flex items-center justify-center gap-1.5"
                >
                  <Truck className="w-3.5 h-3.5" />
                  Transmit Dispatch Wave
                </button>
              </div>

            </form>
          ) : (
            <div className="flex items-center gap-3 p-3 bg-amber-950/35 border border-amber-900/40 rounded-lg text-xs text-amber-400 font-sans">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                All Solano tankers are currently en-route. Awaiting return of a transport tanker to the depot before executing new routing vectors.
              </span>
            </div>
          )}
        </div>

      </div>

      {/* Advanced Telemetry CRT Diagnostics Stream (NMEA Strings) */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col h-full min-h-[380px]">
        {/* Terminal Header */}
        <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span className="font-mono text-[11px] font-bold text-slate-300">GPS TELEMETRY CONSOLE</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
            <span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </div>
        </div>

        {/* Diagnostic Metadata Grid */}
        <div className="p-3 bg-slate-950 border-b border-slate-850 grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-400">
          <div className="space-y-0.5">
            <div className="text-slate-600 uppercase font-semibold text-[8px]">Fleet Vessel ID:</div>
            <div className="text-cyan-400 font-bold">{activeTruck?.id.toUpperCase()}</div>
          </div>
          <div className="space-y-0.5">
            <div className="text-slate-600 uppercase font-semibold text-[8px]">GPS Latitude:</div>
            <div>{activeTruck?.lat.toFixed(5)}° N</div>
          </div>
          <div className="space-y-0.5">
            <div className="text-slate-600 uppercase font-semibold text-[8px]">GPS Longitude:</div>
            <div>{activeTruck?.lng.toFixed(5)}° W</div>
          </div>
          <div className="space-y-0.5">
            <div className="text-slate-600 uppercase font-semibold text-[8px]">Active Destination:</div>
            <div className="text-amber-400 truncate font-semibold">{activeTruck?.destinationName}</div>
          </div>
        </div>

        {/* Terminal CRT Text Box */}
        <div className="flex-1 bg-slate-950 p-3.5 overflow-y-auto font-mono text-[10.5px] text-emerald-400 space-y-2 min-h-[220px] custom-scrollbar">
          <div className="text-cyan-500 font-bold">[LOGGER COMMENCE SYNC]</div>
          
          {activeTruck?.telemetryLog && activeTruck.telemetryLog.length > 0 ? (
            activeTruck.telemetryLog.map((logStr, lIdx) => (
              <div 
                key={`telem-l-${lIdx}`} 
                className="leading-relaxed border-l border-emerald-900 pl-2 select-text"
              >
                {logStr}
              </div>
            ))
          ) : (
            <div className="text-slate-600 animate-pulse">Initializing incoming GPRMC strings...</div>
          )}

          <div className="text-[10px] text-slate-700 select-none pt-4 border-t border-slate-900 font-semibold scale-y-95">
            COMM-CHIP: SOL-RF-5.8G-G4
            <br />
            BAUD RATE: 115200 KBPS
            <br />
            HEARTBEAT: {new Date().toISOString()} ACTIVE
          </div>
        </div>

        {/* Map Focus Notification Info */}
        <div className="bg-slate-900 p-2.5 border-t border-slate-800 text-center font-mono text-[9px] text-slate-500 shrink-0">
          Showing logs for <strong className="text-emerald-400">{activeTruck?.name}</strong>. Clear to view other fleet assets.
        </div>
      </div>

    </div>
  );
}
