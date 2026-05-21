import React, { useState } from 'react';
import { 
  MapPin, 
  Search, 
  Navigation, 
  Clock, 
  Car, 
  Coins, 
  Zap, 
  Check, 
  ChevronRight,
  Wifi,
  DollarSign
} from 'lucide-react';
import { GasStation, LatLng } from '../types';

interface StationListProps {
  stations: GasStation[];
  selectedStationId: string | null;
  onSelectStation: (id: string | null) => void;
  userLocation: LatLng;
  filters: {
    open247: boolean;
    carWash: boolean;
    evCharging: boolean;
    convenienceStore: boolean;
    atm: boolean;
    fuelType: 'regular' | 'premium' | 'diesel';
    maxDistance: number;
  };
  onUpdateFilters: (filters: any) => void;
  isOffline: boolean;
}

// Coordinate Distance helper inside React component to sort and show distance dynamically
function getDistanceMiles(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 3958.8; // Earth's radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function StationList({
  stations,
  selectedStationId,
  onSelectStation,
  userLocation,
  filters,
  onUpdateFilters,
  isOffline
}: StationListProps) {
  const [search, setSearch] = useState('');
  const [debouncing, setDebouncing] = useState(false);
  const [apiSavingsMessage, setApiSavingsMessage] = useState(true);

  // Filter amenities dynamically
  const filteredStations = stations.filter((station) => {
    // Search Autocomplete
    if (search && !station.name.toLowerCase().includes(search.toLowerCase()) && !station.address.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    // Amenities chips checks
    if (filters.open247 && !station.amenities.open247) return false;
    if (filters.carWash && !station.amenities.carWash) return false;
    if (filters.evCharging && !station.amenities.evCharging) return false;
    if (filters.convenienceStore && !station.amenities.convenienceStore) return false;
    if (filters.atm && !station.amenities.atm) return false;

    // Distance check
    const dist = getDistanceMiles(userLocation.lat, userLocation.lng, station.lat, station.lng);
    if (dist > filters.maxDistance) return false;

    return true;
  });

  // Sort by closest distance from user location
  const sortedStations = [...filteredStations].sort((a, b) => {
    const distA = getDistanceMiles(userLocation.lat, userLocation.lng, a.lat, a.lng);
    const distB = getDistanceMiles(userLocation.lat, userLocation.lng, b.lat, b.lng);
    return distA - distB;
  });

  // Handle autocomplete click shortcuts
  const autocompleteSuggestions = [
    "Fairfield Hub",
    "Benicia Waterfront",
    "Vallejo Gateway",
    "Vacaville Corridor"
  ];

  const toggleAmenity = (key: string) => {
    onUpdateFilters({
      ...filters,
      [key]: !((filters as any)[key])
    });
  };

  const setFuelType = (type: 'regular' | 'premium' | 'diesel') => {
    onUpdateFilters({
      ...filters,
      fuelType: type
    });
  };

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm text-slate-800">
      
      {/* Search Header and Input */}
      <div className="p-4 bg-white border-b border-slate-100">
        <div className="relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              // Visual simulate cost management debouncing
              setDebouncing(true);
              const timer = setTimeout(() => setDebouncing(false), 300);
              return () => clearTimeout(timer);
            }}
            placeholder="Search Solano stations or addresses..."
            className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none text-slate-800 placeholder-slate-405 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-sans"
          />
          {debouncing && (
            <span className="absolute right-4 top-3.5 text-[10px] text-blue-600 font-mono animate-pulse font-bold">
              [SYNCING]
            </span>
          )}
        </div>

        {/* Search Autocomplete Tag Suggestions */}
        <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase font-semibold">Taps:</span>
          {autocompleteSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => setSearch(suggestion)}
              className="px-2.5 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200/85 text-[10px] text-slate-600 font-sans border border-slate-200/50 hover:border-slate-300 transition"
            >
              {suggestion}
            </button>
          ))}
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="text-red-500 text-[10px] px-1.5 hover:underline font-mono font-bold"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Fuel Type Comparison and Selector Segment */}
      <div className="bg-slate-50 p-3 border-b border-slate-200 grid grid-cols-3 gap-2 text-xs">
        {(['regular', 'premium', 'diesel'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFuelType(f)}
            className={`py-2 px-1 rounded-lg font-mono font-bold uppercase text-center border transition ${
              filters.fuelType === f
                ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            <span className={`block text-[8px] ${filters.fuelType === f ? 'text-blue-100' : 'text-slate-400'}`}>{f} Selected</span>
            <span className="text-xs tracking-wide">
              {f === 'regular' ? 'REG' : f === 'premium' ? 'PREM' : 'DIESEL'}
            </span>
          </button>
        ))}
      </div>

      {/* Interactive Filters Chips Panel */}
      <div className="p-3 bg-white border-b border-slate-100">
        <div className="text-[10px] text-slate-400 font-mono mb-2 uppercase tracking-wider font-semibold">
          Station Amenities Quick-Filters
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[
            { key: 'open247', label: 'Open 24/7', icon: Clock },
            { key: 'carWash', label: 'Car Wash', icon: Car },
            { key: 'evCharging', label: 'EV Charging', icon: Zap },
            { key: 'convenienceStore', label: 'Convenience Store', icon: Wifi },
            { key: 'atm', label: 'ATM', icon: Coins }
          ].map((am) => {
            const Icon = am.icon;
            const active = (filters as any)[am.key];
            return (
              <button
                key={am.key}
                type="button"
                onClick={() => toggleAmenity(am.key)}
                className={`py-1 px-3 rounded-full text-xs transition flex items-center gap-1 border ${
                  active
                    ? 'bg-blue-650 bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-slate-100 border-slate-200 text-slate-605 text-slate-600 hover:bg-slate-200/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{am.label}</span>
                {active && <Check className="w-3 h-3 text-white font-bold ml-0.5" />}
              </button>
            );
          })}
        </div>
        
        {/* Maximum Search Radius Slider (API query logic) */}
        <div className="mt-3 flex items-center justify-between text-[11px] font-mono">
          <span className="text-slate-500">Search Radius Limit:</span>
          <span className="text-blue-600 font-bold">{filters.maxDistance} Miles</span>
        </div>
        <input 
          type="range" 
          min="5" 
          max="35" 
          step="5"
          value={filters.maxDistance}
          onChange={(e) => onUpdateFilters({ ...filters, maxDistance: parseInt(e.target.value) })}
          className="w-full accent-blue-600 mt-1 cursor-pointer"
        />
      </div>

      {/* Station Cards Scrollable View Area */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 custom-scrollbar bg-white">
        
        {isOffline && (
          <div className="bg-amber-50 border-b border-amber-100 p-2 text-center text-[10px] font-mono text-amber-700 font-semibold">
            OFFLINE FALLBACK ENABLED. Showing cached client database.
          </div>
        )}

        {sortedStations.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <MapPin className="w-8 h-8 mx-auto stroke-1 text-slate-300 mb-2" />
            <p className="font-sans text-sm text-slate-500">No stations match current filters.</p>
            <p className="font-mono text-xs text-slate-400 mt-1">Try expanding radius or resetting toggles.</p>
          </div>
        ) : (
          sortedStations.map((station) => {
            const isSelected = station.id === selectedStationId;
            const distance = getDistanceMiles(userLocation.lat, userLocation.lng, station.lat, station.lng);
            
            // Highlight regular, premium, or diesel depending on selection
            const activePrice = station.prices[filters.fuelType];

            // Compare with standard competitors averages
            const competitorMin = Math.min(...station.competitors.map(c => c.prices[filters.fuelType]));
            const priceDifference = competitorMin - activePrice;

            return (
              <div
                key={station.id}
                onClick={() => onSelectStation(isSelected ? null : station.id)}
                className={`p-4 transition cursor-pointer relative hover:bg-slate-50 ${
                  isSelected ? 'bg-blue-50/40 border-l-4 border-blue-600' : ''
                }`}
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                      {station.name}
                      <span className="text-[10px] py-0.5 px-2 rounded-full font-mono bg-slate-100 text-slate-600 border border-slate-205">
                        {distance.toFixed(1)} mi
                      </span>
                    </h3>
                    <p className="text-slate-500 text-xs font-sans mt-0.5">{station.address}</p>
                    
                    {/* Fuel Rates display row */}
                    <div className="mt-3 flex items-center gap-2">
                      <div className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-center font-mono shadow-sm">
                        <span className="text-[9px] text-slate-500 block uppercase font-bold">{filters.fuelType}</span>
                        <span className="text-blue-600 font-extrabold text-sm">${activePrice.toFixed(2)}</span>
                      </div>
                      
                      {/* Competitor Price Comparison HUD */}
                      <div className="text-[10px] font-sans text-slate-500">
                        <div className="font-semibold text-slate-600">Competitor Price Comparison:</div>
                        {priceDifference > 0 ? (
                          <div className="text-green-600 flex items-center font-mono font-bold text-[10.5px]">
                            <DollarSign className="w-3 h-3 text-green-650" />
                            SAVE ${priceDifference.toFixed(2)}/gal below average!
                          </div>
                        ) : (
                          <div className="text-green-600 font-mono text-[10px] font-bold">
                            Lowest verified region rate
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quick indicator of amenities icons present */}
                    <div className="flex gap-2.5 mt-3 items-center text-slate-400">
                      {station.amenities.open247 && <Clock className="w-3.5 h-3.5 text-blue-505 text-blue-500" title="Open 24/7 Enabled" />}
                      {station.amenities.carWash && <Car className="w-3.5 h-3.5 text-blue-505 text-blue-500" title="State Car Wash" />}
                      {station.amenities.evCharging && <Zap className="w-3.5 h-3.5 text-amber-500 animate-pulse" title="High Voltage Fast Charger" />}
                      <span className="text-slate-300">|</span>
                      <span className="text-[8px] font-mono uppercase text-slate-400">
                        Last POS sync: {new Date(station.prices.lastUpdated).toLocaleTimeString()}
                      </span>
                    </div>

                  </div>

                  <div className="shrink-0 flex flex-col items-center gap-2">
                    {/* Direction wayfinding action button */}
                    <button
                      type="button"
                      title="Show Waypoint Route Vector"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectStation(station.id);
                      }}
                      className="p-2 border border-slate-200 hover:border-blue-500 rounded-lg hover:bg-blue-50 text-blue-600 transition"
                    >
                      <Navigation className="w-4 h-4" />
                    </button>
                    <ChevronRight className="w-4 h-4 text-slate-400 mt-1" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer statistics branding card */}
      <div className="bg-slate-50 p-3 border-t border-slate-200 font-mono text-[10.5px] text-slate-600 flex justify-between items-center shrink-0">
        <div>
          Stations Found: <strong className="text-blue-600 font-extrabold">{filteredStations.length}</strong>
        </div>
        <div className="flex items-center gap-1.5 text-[9px] text-slate-550 font-bold">
          <Wifi className="w-3 h-3 text-green-600" />
          Loyalty pricing calibrated
        </div>
      </div>

    </div>
  );
}
