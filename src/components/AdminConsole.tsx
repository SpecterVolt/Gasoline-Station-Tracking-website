import React, { useState, useEffect } from 'react';
import { 
  KeyRound, 
  Send, 
  AlertCircle, 
  CheckCircle2, 
  Flame, 
  PiggyBank, 
  DollarSign, 
  Percent,
  TrendingDown
} from 'lucide-react';
import { GasStation } from '../types';

interface AdminConsoleProps {
  stations: GasStation[];
  onUpdateStationPrices: (id: string, prices: { regular: number; premium: number; diesel: number }, pin: string) => Promise<{ success: boolean; message: string }>;
}

export default function AdminConsole({ stations, onUpdateStationPrices }: AdminConsoleProps) {
  const [selectedId, setSelectedId] = useState<string>('');
  const [prices, setPrices] = useState({ regular: 0, premium: 0, diesel: 0 });
  const [securePin, setSecurePin] = useState('');
  const [loading, setLoading] = useState(false);
  const [outcome, setOutcome] = useState<{ status: 'idle' | 'success' | 'error'; msg: string }>({ status: 'idle', msg: '' });

  // Sync up default inputs whenever the selected station dropdown shifts
  useEffect(() => {
    if (selectedId) {
      const station = stations.find((s) => s.id === selectedId);
      if (station) {
        setPrices({
          regular: station.prices.regular,
          premium: station.prices.premium,
          diesel: station.prices.diesel,
        });
      }
    } else {
      setPrices({ regular: 0, premium: 0, diesel: 0 });
    }
  }, [selectedId, stations]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;

    setLoading(true);
    setOutcome({ status: 'idle', msg: '' });

    try {
      const res = await onUpdateStationPrices(selectedId, prices, securePin);
      if (res.success) {
        setOutcome({ status: 'success', msg: res.message });
        setSecurePin(''); // reset pin on success
        
        // Timeout to clear success alert
        setTimeout(() => {
          setOutcome({ status: 'idle', msg: '' });
        }, 5000);
      } else {
        setOutcome({ status: 'error', msg: res.message });
      }
    } catch {
      setOutcome({ status: 'error', msg: 'A network communication timeout occurred with the Solano POS Hub.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl grid grid-cols-1 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-slate-800">
      
      {/* Left controls form */}
      <form onSubmit={handleSubmit} className="md:col-span-3 p-5 space-y-4">
        
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <KeyRound className="w-5 h-5 text-cyan-400" />
          <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono">
            Solano Station Manager Merchant Terminal
          </h2>
        </div>

        <p className="text-slate-400 text-xs font-sans leading-relaxed">
          Authorized Solano managers can execute real-time Fuel Price updates from this console. Changes update pump indicators and telemetry trackers instantly.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-mono text-slate-500 uppercase font-semibold mb-1">
              Select Station Node:
            </label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-2 rounded-lg text-xs font-sans focus:outline-none focus:border-cyan-500 font-semibold"
              required
            >
              <option value="">-- Choose target pump --</option>
              {stations.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-mono text-slate-500 uppercase font-semibold mb-1 col-span-1">
              Authorized Security PIN:
            </label>
            <input
              type="password"
              placeholder="••••"
              value={securePin}
              onChange={(e) => setSecurePin(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-2 rounded-lg text-xs font-mono tracking-widest text-center focus:outline-none focus:border-cyan-500"
              required
            />
          </div>
        </div>

        {selectedId && (
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-850 space-y-3">
            <h4 className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest font-bold">
              Pump Fuel Price Calibrations ($ USD / Gallon)
            </h4>
            
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[9px] font-mono text-slate-500 uppercase mb-1">
                  Regular Price:
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="2.00"
                  max="7.00"
                  value={prices.regular || ''}
                  onChange={(e) => setPrices({ ...prices, regular: parseFloat(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-800 text-emerald-400 font-mono text-xs font-semibold p-2 rounded text-center focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[9px] font-mono text-slate-500 uppercase mb-1">
                  Premium Price:
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="2.00"
                  max="7.00"
                  value={prices.premium || ''}
                  onChange={(e) => setPrices({ ...prices, premium: parseFloat(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-800 text-cyan-400 font-mono text-xs font-semibold p-2 rounded text-center focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[9px] font-mono text-slate-500 uppercase mb-1">
                  Diesel Price:
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="2.00"
                  max="7.00"
                  value={prices.diesel || ''}
                  onChange={(e) => setPrices({ ...prices, diesel: parseFloat(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-800 text-yellow-400 font-mono text-xs font-semibold p-2 rounded text-center focus:outline-none focus:border-yellow-500"
                  required
                />
              </div>
            </div>
          </div>
        )}

        {/* Feedback Alert box */}
        {outcome.status === 'success' && (
          <div className="bg-emerald-950/45 border border-emerald-900/50 rounded-lg p-3 text-emerald-300 text-xs flex gap-2.5 items-center font-sans">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{outcome.msg}</span>
          </div>
        )}

        {outcome.status === 'error' && (
          <div className="bg-red-950/45 border border-red-900/50 rounded-lg p-3 text-red-300 text-xs flex gap-2.5 items-center font-sans">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <div>
              <div className="font-bold">Authorization Pin Refused:</div>
              <p className="text-[11px] mt-0.5">{outcome.msg}</p>
            </div>
          </div>
        )}

        {/* Form submit */}
        <button
          type="submit"
          disabled={loading || !selectedId}
          className={`w-full py-2.5 px-4 font-bold text-slate-50 rounded-lg text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition select-none ${
            selectedId && securePin 
              ? 'bg-cyan-600 hover:bg-cyan-500 hover:shadow-lg hover:shadow-cyan-950/50 cursor-pointer' 
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          {loading ? 'Transmitting POS broadcast...' : 'Broadcast Price Alignment'}
        </button>

        <div className="text-[10px] font-mono text-slate-500 text-center">
          Developer key for local sandbox testing: <strong className="text-cyan-400/85 bg-slate-950 px-1 py-0.5 rounded">SOLANO80</strong> or <strong className="text-cyan-400/85 bg-slate-950 px-1 py-0.5 rounded">1234</strong>
        </div>

      </form>

      {/* Right details sidebar info (Marketing details of price alignment / TomTom API savings formulas) */}
      <div className="md:col-span-2 p-5 bg-slate-950/40 flex flex-col justify-between space-y-4">
        
        <div>
          <h3 className="font-bold text-slate-200 text-xs font-mono uppercase tracking-wide flex items-center gap-1.5 mb-2">
            <Percent className="w-4 h-4 text-emerald-400" />
            Regional Competitor Spread
          </h3>
          <p className="text-slate-400 text-xs font-sans leading-relaxed">
            By syncing POS updates dynamically, Solano guarantees regular drivers saving up to <strong className="text-emerald-400">30¢/Gallon</strong> below neighboring Chevron, Shell, or Valero nodes.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-850 rounded-lg p-3 space-y-2 font-mono text-[10px]">
          <div className="text-[8px] text-slate-500 uppercase tracking-widest font-bold">POS Telemetry Statistics</div>
          <div className="flex justify-between">
            <span className="text-slate-500">API Sync State:</span>
            <span className="text-emerald-400 font-bold uppercase">Online Real-Time</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Cryptographic Key:</span>
            <span className="text-slate-400">SHA-256 POS-T1</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Last System Audit:</span>
            <span className="text-slate-400">{new Date().toLocaleDateString()}</span>
          </div>
        </div>

        <div className="border border-cyan-900/40 bg-cyan-950/15 p-3 rounded-lg flex gap-2 text-[10.5px] text-cyan-300 font-medium leading-relaxed">
          <TrendingDown className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>Our automated pricing algorithm will lower Regular/Premium prices if a Logistics Tanker arrives at that pump's coordinate destination!</span>
        </div>

      </div>

    </div>
  );
}
