import React, { useEffect, useState } from 'react';
import { Flame, TrendingDown, TrendingUp, RefreshCw } from 'lucide-react';
import { GasStation } from '../types';

interface PricingTickerProps {
  stations: GasStation[];
}

export default function PricingTicker({ stations }: PricingTickerProps) {
  const [tickerOffset, setTickerOffset] = useState(0);

  // Compute average prices across Solano stations
  const avgSolano = {
    regular: stations.reduce((acc, s) => acc + s.prices.regular, 0) / (stations.length || 1),
    premium: stations.reduce((acc, s) => acc + s.prices.premium, 0) / (stations.length || 1),
    diesel: stations.reduce((acc, s) => acc + s.prices.diesel, 0) / (stations.length || 1),
  };

  // Static/dynamic national comparison to highlight Solano discount
  const marketAverages = {
    regular: 4.15,
    premium: 4.58,
    diesel: 4.35,
  };

  // Animate scrolling ticker (simulated text scrolling)
  useEffect(() => {
    const timer = setInterval(() => {
      setTickerOffset((prev) => (prev + 1) % 3);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-slate-900 border-y border-slate-800 py-2.5 px-4 overflow-hidden relative shadow-sm text-slate-100">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        {/* Live Indicator */}
        <div className="flex items-center gap-2 font-mono shrink-0">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          <span className="text-blue-400 font-bold tracking-wider uppercase text-[10px]">SOLANO Price Feed</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400 flex items-center gap-1">
            <RefreshCw className="w-3 h-3 animate-spin text-blue-400" style={{ animationDuration: '8s' }} />
            POS Real-Time Broadcast
          </span>
        </div>

        {/* Ticker values */}
        <div className="flex items-center gap-6 overflow-hidden w-full md:w-auto font-mono text-[11px] select-none justify-center">
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-800/80 border border-slate-705/50 rounded-lg shadow-sm">
            <span className="text-slate-400 text-[10px]">REGULAR:</span>
            <span className="text-emerald-400 font-extrabold">${avgSolano.regular.toFixed(2)}/G</span>
            <span className="text-green-400 flex items-center text-[10px] font-semibold">
              <TrendingDown className="w-3 h-3 text-green-400 inline mr-0.5" />
              -${(marketAverages.regular - avgSolano.regular).toFixed(2)} vs Market
            </span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 bg-slate-800/80 border border-slate-705/50 rounded-lg shadow-sm">
            <span className="text-slate-400 text-[10px]">PREMIUM:</span>
            <span className="text-cyan-400 font-extrabold">${avgSolano.premium.toFixed(2)}/G</span>
            <span className="text-green-400 flex items-center text-[10px] font-semibold">
              <TrendingDown className="w-3 h-3 text-green-400 inline mr-0.5" />
              -${(marketAverages.premium - avgSolano.premium).toFixed(2)} vs Market
            </span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 bg-slate-800/80 border border-slate-705/50 rounded-lg shadow-sm">
            <span className="text-slate-400 text-[10px]">ULTRA DIESEL:</span>
            <span className="text-yellow-400 font-extrabold">${avgSolano.diesel.toFixed(2)}/G</span>
            <span className="text-green-400 flex items-center text-[10px] font-semibold">
              <TrendingDown className="w-3 h-3 text-green-400 inline mr-0.5" />
              -${(marketAverages.diesel - avgSolano.diesel).toFixed(2)} vs Market
            </span>
          </div>
        </div>

        {/* Dynamic dispatch summary */}
        <div className="hidden lg:flex items-center gap-1 text-slate-350 font-sans text-[11px]">
          <Flame className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
          <span>Average Solano loyalty savings: <strong className="text-green-400 font-semibold">12.5%</strong> today.</span>
        </div>
      </div>
    </div>
  );
}
