import React, { useRef, useState, useEffect } from 'react';
import { 
  MapPin, 
  Truck, 
  Compass, 
  Maximize2, 
  Plus, 
  Minus, 
  RotateCcw, 
  Layers, 
  Navigation,
  Activity
} from 'lucide-react';
import { GasStation, LogisticsTruck, LatLng } from '../types';

interface InteractiveMapProps {
  stations: GasStation[];
  trucks: LogisticsTruck[];
  selectedStationId: string | null;
  selectedTruckId: string | null;
  userLocation: LatLng;
  onSelectStation: (id: string | null) => void;
  onSelectTruck: (id: string | null) => void;
  onUpdateUserLocation: (location: LatLng) => void;
}

// Fixed coordinates bounds representing Solano County region around Fairfield, CA
const MAP_BOUNDS = {
  latMin: 38.0000,
  latMax: 38.4000,
  lngMin: -122.3000,
  lngMax: -121.9000
};

export default function InteractiveMap({
  stations,
  trucks,
  selectedStationId,
  selectedTruckId,
  userLocation,
  onSelectStation,
  onSelectTruck,
  onUpdateUserLocation
}: InteractiveMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  
  // Custom pan and zoom states
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isDraggingUser, setIsDraggingUser] = useState(false);
  const [showSatelliteOverlay, setShowSatelliteOverlay] = useState(false);

  // Conversion helpers: geography coordinates to SVG plane coordinates (1000 x 750)
  const toXY = (lat: number, lng: number) => {
    const x = ((lng - MAP_BOUNDS.lngMin) / (MAP_BOUNDS.lngMax - MAP_BOUNDS.lngMin)) * 1000;
    const y = (1 - (lat - MAP_BOUNDS.latMin) / (MAP_BOUNDS.latMax - MAP_BOUNDS.latMin)) * 750;
    return { x, y };
  };

  const toLatLng = (x: number, y: number) => {
    const lng = MAP_BOUNDS.lngMin + (x / 1000) * (MAP_BOUNDS.lngMax - MAP_BOUNDS.lngMin);
    const lat = MAP_BOUNDS.latMin + (1 - y / 750) * (MAP_BOUNDS.latMax - MAP_BOUNDS.latMin);
    return { lat, lng };
  };

  // Convert client coordinate mouse events to our relative SVG grid
  const getRelativeSVGCoords = (clientX: number, clientY: number) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    
    // Convert click position to SVG viewBox coordinate system (taking into account pan and zoom)
    const rawX = ((clientX - rect.left) / rect.width) * 1000;
    const rawY = ((clientY - rect.top) / rect.height) * 750;
    
    // Factor in actual SVG Zoom and offset panning
    const svgX = (rawX - pan.x) / zoom;
    const svgY = (rawY - pan.y) / zoom;
    
    return { x: svgX, y: svgY };
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    // Check if clicking inside user location handler
    const target = e.target as SVGElement;
    if (target.getAttribute('id') === 'user-location-handle') {
      setIsDraggingUser(true);
      return;
    }

    // Default container dragging
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isDraggingUser) {
      const coords = getRelativeSVGCoords(e.clientX, e.clientY);
      // Bound the dragging inside our mapped region
      const boundedX = Math.max(20, Math.min(980, coords.x));
      const boundedY = Math.max(20, Math.min(730, coords.y));
      const latLng = toLatLng(boundedX, boundedY);
      onUpdateUserLocation(latLng);
    } else if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsDraggingUser(false);
  };

  const resetMap = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Define our roads visually
  const localHighways = [
    {
      id: "i-80",
      name: "Interstate 80 Corridor",
      points: [
        { lat: 38.1250, lng: -122.2280 }, // Vallejo Gateway
        { lat: 38.1550, lng: -122.1750 },
        { lat: 38.2000, lng: -122.1200 }, // Central Depot Junction
        { lat: 38.2250, lng: -122.0950 },
        { lat: 38.2520, lng: -122.0430 }, // Fairfield Station
        { lat: 38.2850, lng: -122.0250 },
        { lat: 38.3300, lng: -122.0010 },
        { lat: 38.3650, lng: -121.9820 }  // Vacaville
      ]
    },
    {
      name: "Highway 12 Gateway",
      points: [
        { lat: 38.0535, lng: -122.1480 }, // Benicia Waterfront
        { lat: 38.1020, lng: -122.1600 },
        { lat: 38.1500, lng: -122.1350 },
        { lat: 38.2000, lng: -122.1200 }, // Central Depot Junction
        { lat: 38.2430, lng: -122.0620 },
        { lat: 38.2520, lng: -122.0430 }  // Fairfield
      ]
    }
  ];

  // Draw optimized wayfinding route from current simulated user GPS pointer to selected station
  const activeStation = stations.find(s => s.id === selectedStationId);
  const userXY = toXY(userLocation.lat, userLocation.lng);
  const stationXY = activeStation ? toXY(activeStation.lat, activeStation.lng) : null;

  // Render water graphics for Solano Bay and Carquinez Strait to look premium
  const waterShorePoints = [
    { lat: 38.0000, lng: -122.3000 },
    { lat: 38.0200, lng: -122.2500 },
    { lat: 38.0400, lng: -122.1800 },
    { lat: 38.0300, lng: -122.1200 },
    { lat: 38.0100, lng: -122.0600 },
    { lat: 38.0200, lng: -121.9000 },
    { lat: 38.0000, lng: -121.9000 }
  ];

  const waterPolygonD = "M 0 750 " + 
    waterShorePoints.map(p => {
      const xy = toXY(p.lat, p.lng);
      return `L ${xy.x.toFixed(1)} ${xy.y.toFixed(1)}`;
    }).join(" ") + " L 1000 750 Z";

  return (
    <div className="relative bg-[#e2e8f0] border border-slate-200 rounded-xl overflow-hidden shadow-sm h-full flex flex-col group min-h-[480px]">
      
      {/* Top Map Action Bar */}
      <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap justify-between items-center gap-2 pointer-events-none">
        
        {/* Active Telemetry Overlay */}
        <div className="bg-white/95 backdrop-blur border border-slate-200 rounded-lg px-3 py-1.5 flex items-center gap-3 shadow-sm pointer-events-auto">
          <Activity className="w-4 h-4 text-blue-600 animate-pulse shrink-0" />
          <div className="font-mono text-[10px] text-slate-700">
            <span className="text-slate-400 font-bold">BOUNDS:</span> CA-SOL-GRID-4326
          </div>
          <div className="h-3 w-[1px] bg-slate-200" />
          <div className="font-mono text-[10px] text-slate-700 hidden sm:block">
            <span className="text-blue-600 font-bold">FPS:</span> 60 TELEM
          </div>
        </div>

        {/* Map View Selectors */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button 
            type="button"
            onClick={() => setShowSatelliteOverlay(!showSatelliteOverlay)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold font-sans shadow-sm transition flex items-center gap-1.5 ${
              showSatelliteOverlay 
                ? 'bg-blue-600 border-blue-600 text-white shadow-sm' 
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            {showSatelliteOverlay ? 'HUD Vector Grid' : 'Standard Map'}
          </button>

          <div className="flex bg-white border border-slate-200 rounded-lg p-0.5 shadow-sm">
            <button 
              type="button"
              onClick={() => setZoom(z => Math.min(4, z + 0.3))}
              className="p-1.5 text-slate-500 hover:text-slate-850 hover:bg-slate-100 rounded transition"
              title="Zoom In"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button 
              type="button"
              onClick={() => setZoom(z => Math.max(0.8, z - 0.3))}
              className="p-1.5 text-slate-500 hover:text-slate-850 hover:bg-slate-100 rounded transition"
              title="Zoom Out"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button 
              type="button"
              onClick={resetMap}
              className="p-1.5 text-slate-500 hover:text-slate-850 hover:bg-slate-100 rounded transition border-l border-slate-100"
              title="Recenter Map"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Embedded Instructions Guide */}
      <div className="absolute bottom-4 left-4 z-10 bg-white/95 backdrop-blur border border-slate-200 rounded-lg px-3 py-1.5 text-[9px] font-mono text-slate-600 shadow-sm">
        <span className="text-blue-600 font-bold mr-1">TIPS:</span> 
        <span>Drag map to pan. Drag the <span className="text-blue-600 font-bold">● pulsing blue dot</span> to live-test path routes!</span>
      </div>

      {/* Main SVG Map canvas */}
      <svg
        id="solano-regional-telemetry-map"
        ref={svgRef}
        viewBox="0 0 1000 750"
        className={`w-full h-full cursor-grab select-none select-none select-none select-none select-none ${isDragging ? 'cursor-grabbing' : ''}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        referrerPolicy="no-referrer"
      >
        {/* Background Render Element Container featuring pan/zoom transforms */}
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          
          {/* Map Base Surface Visual Representation */}
          {showSatelliteOverlay ? (
            // Immersing Slate Grid Design Layout
            <rect width="1000" height="750" fill="#f1f5f9" />
          ) : (
            // Standard CAD Clean Visual Design Layout
            <rect width="1000" height="750" fill="#e2e8f0" />
          )}

          {/* Grid Overlay for high-end technical design */}
          <defs>
            <pattern id="inner-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#cbd5e1" strokeWidth="0.5" opacity="0.4" />
            </pattern>
            <pattern id="major-grid" width="200" height="200" patternUnits="userSpaceOnUse">
              <path d="M 200 0 L 0 0 0 200" fill="none" stroke="#cbd5e1" strokeWidth="1" opacity="0.15" />
            </pattern>
          </defs>
          <rect width="1000" height="750" fill="url(#inner-grid)" />
          <rect width="1000" height="750" fill="url(#major-grid)" />

          {/* Render Coastal water feature representation (Solano Bay) */}
          <path 
            d={waterPolygonD} 
            fill={showSatelliteOverlay ? "#e0f2fe" : "#bfdbfe"} 
            stroke="#93c5fd" 
            strokeWidth="2" 
            opacity="0.9" 
          />
          <text 
            x="480" 
            y="720" 
            fill="#475569" 
            className="font-mono text-[10px] tracking-wider font-semibold select-none pointer-events-none"
          >
            CARQUINEZ STRAIT / SAN PABLO BAY
          </text>

          {/* Draw Roads/Highways from local networks with glowing tech paths */}
          {localHighways.map((road, rIdx) => {
            const pathPoints = road.points.map(p => toXY(p.lat, p.lng));
            const pathD = "M " + pathPoints.map(p => `${p.x} ${p.y}`).join(" L ");
            return (
              <g key={`road-grp-${rIdx}`}>
                {/* Outliner glow for roads */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="#cbd5e1"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.6"
                />
                <path
                  d={pathD}
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="1"
                />
                {/* Center dividing dashed line */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="1"
                  strokeDasharray="4,6"
                  strokeLinecap="round"
                  opacity="0.8"
                />
              </g>
            );
          })}

          {/* Render Route Markers labels helper */}
          <text x="730" y="240" fill="#64748b" transform="rotate(7, 730, 240)" className="font-mono text-[8px] tracking-widest pointer-events-none">
            I-80 EXPRESSWAY
          </text>
          <text x="320" y="550" fill="#64748b" transform="rotate(-33, 320, 550)" className="font-mono text-[8px] tracking-widest pointer-events-none">
            CA-12 ROUTE
          </text>

          {/* Central Depot Render representation */}
          {(() => {
            const depotXY = toXY(38.2000, -122.1200);
            return (
              <g key="depot-marker" className="pointer-events-auto">
                {/* Glowing ring */}
                <circle 
                  cx={depotXY.x} 
                  cy={depotXY.y} 
                  r="24" 
                  fill="none" 
                  stroke="#3b82f6" 
                  strokeWidth="1" 
                  strokeDasharray="4,4" 
                  className="animate-spin" 
                  style={{ transformOrigin: `${depotXY.x}px ${depotXY.y}px`, animationDuration: '30s' }}
                />
                <circle cx={depotXY.x} cy={depotXY.y} r="14" fill="#ffffff" stroke="#2563eb" strokeWidth="2" opacity="0.9" />
                <circle cx={depotXY.x} cy={depotXY.y} r="4" fill="#2563eb" />
                
                {/* Marker label */}
                <rect x={depotXY.x - 55} y={depotXY.y - 32} width="110" height="15" rx="4" fill="#ffffff" stroke="#93c5fd" strokeWidth="0.5" />
                <text x={depotXY.x} y={depotXY.y - 22} fill="#1e3a8a" textAnchor="middle" className="font-mono text-[8px] font-bold">
                  SOLANO DEPOT HQ
                </text>
              </g>
            );
          })()}

          {/* Render Wayfinding Route Overlay Vector Path (Dynamic Routing Layer) */}
          {stationXY && (
            <g key="active-routing-layer">
              {/* Outer Cyan Route Glow */}
              <line
                x1={userXY.x}
                y1={userXY.y}
                x2={stationXY.x}
                y2={stationXY.y}
                stroke="#3b82f6"
                strokeWidth="5"
                strokeLinecap="round"
                opacity="0.32"
                className="animate-pulse"
              />
              {/* Inner glowing core line */}
              <line
                x1={userXY.x}
                y1={userXY.y}
                x2={stationXY.x}
                y2={stationXY.y}
                stroke="#1d4ed8"
                strokeWidth="2.5"
                strokeDasharray="6,4"
                strokeLinecap="round"
              />
              
              {/* Distance HUD Flag midpoint popover */}
              {(() => {
                const midX = (userXY.x + stationXY.x) / 2;
                const midY = (userXY.y + stationXY.y) / 2;
                // Calculate distance in miles using coordinate scales
                const flatDistLng = userLocation.lng - activeStation!.lng;
                const flatDistLat = userLocation.lat - activeStation!.lat;
                const miles = Math.sqrt(flatDistLng * flatDistLng + flatDistLat * flatDistLat) * 69;
                return (
                  <g transform={`translate(${midX}, ${midY})`}>
                    <rect x="-35" y="-18" width="70" height="13" rx="2" fill="#2563eb" stroke="#1d4ed8" strokeWidth="1" />
                    <text x="0" y="-9" fill="#ffffff" textAnchor="middle" className="font-mono text-[7px] font-bold">
                      {miles.toFixed(1)} MILES (OPTIMIZED)
                    </text>
                  </g>
                );
              })()}
            </g>
          )}

          {/* Render Gas Station Markers */}
          {stations.map((station) => {
            const xy = toXY(station.lat, station.lng);
            const isSelected = station.id === selectedStationId;
            return (
              <g 
                key={station.id} 
                className="cursor-pointer group/marker pointer-events-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectStation(isSelected ? null : station.id);
                }}
              >
                {/* Neon pulsating ring under marker if selected */}
                {isSelected && (
                  <circle
                    cx={xy.x}
                    cy={xy.y}
                    r="20"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="1.5"
                    className="animate-ping"
                    style={{ transformOrigin: `${xy.x}px ${xy.y}px` }}
                  />
                )}
                
                {/* Station Node Core visual element */}
                <circle 
                  cx={xy.x} 
                  cy={xy.y} 
                  r={isSelected ? "11" : "8"} 
                  fill={isSelected ? "#3b82f6" : "#ffffff"} 
                  stroke={isSelected ? "#2563eb" : "#3b82f6"} 
                  strokeWidth="2.5" 
                  className="transition-all duration-300 hover:scale-125 shadow-sm"
                />

                <circle cx={xy.x} cy={xy.y} r="3.5" fill={isSelected ? "#ffffff" : "#3b82f6"} />

                {/* Pin labels displaying station name and regular price */}
                <g transform={`translate(${xy.x}, ${xy.y - (isSelected ? 20 : 15)})`}>
                  {/* Backdrop flag */}
                  <rect
                    x="-45"
                    y="-13"
                    width="90"
                    height="19"
                    rx="4"
                    fill="#ffffff"
                    stroke={isSelected ? "#2563eb" : "#93c5fd"}
                    strokeWidth="1.5"
                    className="shadow-sm"
                  />
                  {/* Station brand name initials */}
                  <text
                    x="0"
                    y="-4.5"
                    fill={isSelected ? "#1e3a8a" : "#475569"}
                    textAnchor="middle"
                    className="font-sans font-bold text-[7.5px] tracking-tight uppercase"
                  >
                    {station.id.slice(0, 3).toUpperCase()} PUMP
                  </text>
                  {/* Cost display value */}
                  <text
                    x="0"
                    y="4.5"
                    fill="#2563eb"
                    textAnchor="middle"
                    className="font-mono text-[8.5px] font-bold"
                  >
                    REG: ${station.prices.regular.toFixed(2)}
                  </text>
                </g>
              </g>
            );
          })}

          {/* Render Logistics Fuel Tankers Trucks */}
          {trucks.map((truck) => {
            const xy = toXY(truck.lat, truck.lng);
            const isSelected = truck.id === selectedTruckId;
            const statusColor = 
              truck.status === 'en-route' ? '#f59e0b' : 
              truck.status === 'refueling' ? '#10b981' : 
              truck.status === 'returning' ? '#3b82f6' : '#64748b';

            return (
              <g 
                key={truck.id}
                className="cursor-pointer pointer-events-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectTruck(isSelected ? null : truck.id);
                }}
              >
                {/* Ping ring for en-route tankers */}
                {truck.status === 'en-route' && (
                  <circle
                    cx={xy.x}
                    cy={xy.y}
                    r="16"
                    fill="none"
                    stroke={statusColor}
                    strokeWidth="1"
                    className="animate-pulse"
                    style={{ transformOrigin: `${xy.x}px ${xy.y}px` }}
                  />
                )}

                {/* Large refueling splash pulse ring */}
                {truck.status === 'refueling' && (
                  <circle
                    cx={xy.x}
                    cy={xy.y}
                    r="24"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="1.5"
                    className="animate-ping"
                    style={{ transformOrigin: `${xy.x}px ${xy.y}px` }}
                  />
                )}

                {/* Selected truck marker indicator outline shield */}
                {isSelected && (
                  <rect
                    x={xy.x - 14}
                    y={xy.y - 14}
                    width="28"
                    height="28"
                    rx="6"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="2"
                    strokeDasharray="4,2"
                  />
                )}

                {/* Truck Node Icon Base representing vehicle */}
                <g transform={`translate(${xy.x}, ${xy.y})`}>
                  <rect
                    x="-7"
                    y="-7"
                    width="14"
                    height="14"
                    rx="3.5"
                    fill="#18181b"
                    stroke={statusColor}
                    strokeWidth="2"
                  />
                  {/* Mini visual indicator based on status cargo type */}
                  <polygon
                    points="0,-4 3,2 -3,2"
                    fill={
                      truck.cargoType === 'regular' ? '#10b981' : 
                      truck.cargoType === 'premium' ? '#06b6d4' : 
                      truck.cargoType === 'diesel' ? '#eab308' : '#e2e8f0'
                    }
                  />
                </g>

                {/* Visual Label flag for speed and cargo load percentage */}
                <g transform={`translate(${xy.x}, ${xy.y + 16})`}>
                  <rect
                    x="-32"
                    y="-7"
                    width="64"
                    height="12"
                    rx="2"
                    fill="#ffffff"
                    stroke={statusColor}
                    strokeWidth="0.5"
                    className="shadow-sm"
                  />
                  <text
                    x="0"
                    y="1.5"
                    fill="#475569"
                    textAnchor="middle"
                    className="font-mono text-[6.5px] font-extrabold select-none"
                  >
                    {truck.name.split(" ")[2]} | {truck.speedMph}MPH
                  </text>
                </g>
              </g>
            );
          })}

          {/* Draggable user locator helper dot */}
          <g key="draggable-user-node" className="pointer-events-auto">
            {/* Outer locator guide rings */}
            <circle 
              cx={userXY.x} 
              cy={userXY.y} 
              r="22" 
              fill="none" 
              stroke="#2563eb" 
              strokeWidth="0.5" 
              opacity="0.2" 
            />
            <circle 
              cx={userXY.x} 
              cy={userXY.y} 
              r="12" 
              fill="none" 
              stroke="#2563eb" 
              strokeWidth="1.5" 
              className="animate-pulse" 
              style={{ transformOrigin: `${userXY.x}px ${userXY.y}px` }}
            />
            {/* Draggable sensor target */}
            <circle
              id="user-location-handle"
              cx={userXY.x}
              cy={userXY.y}
              r="10"
              fill="#2563eb"
              stroke="#ffffff"
              strokeWidth="2.5"
              className="cursor-move hover:scale-125 transition-transform"
            />
            <circle cx={userXY.x} cy={userXY.y} r="2.5" fill="#ffffff" pointerEvents="none" />
            
            {/* Label flag describing current simulated coordinate pointer */}
            <g transform={`translate(${userXY.x}, ${userXY.y - 18})`} pointerEvents="none">
              <rect x="-35" y="-10" width="70" height="13" rx="3" fill="#ffffff" stroke="#2563eb" strokeWidth="0.5" />
              <text x="0" y="-1.5" fill="#1e3a8a" textAnchor="middle" className="font-mono text-[7px] font-bold">
                MY GPS VEHICLE
              </text>
            </g>
          </g>

        </g>
      </svg>

      {/* Map Information / Legend Overlay Bar */}
      <div className="bg-slate-50 border-t border-slate-200 p-3 flex flex-wrap items-center justify-between gap-4 font-mono text-[10px] text-slate-600">
        
        {/* Active Legends */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-white border border-blue-600 border-2" />
            <span className="text-slate-500 font-semibold">Solano Fuel Station</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-white border border-amber-500 block" />
            <span className="text-slate-500 font-semibold">Fuel Tanker (Moving)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-[#2563eb] border-2 border-white inline-block align-middle" />
            <span className="text-slate-500 font-semibold">Your Vehicle (Draggable)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 border-t border-blue-600 border-dashed inline-block" />
            <span className="text-slate-500 font-semibold">Optimized Safe Route</span>
          </div>
        </div>

        {/* Selected Highlight Overlay Info */}
        <div className="text-right text-slate-500 text-[9px] font-bold font-mono">
          {selectedStationId ? (
            <span className="text-blue-600 uppercase blinking">Station Selected: Draw Waypoint Tracing</span>
          ) : selectedTruckId ? (
            <span className="text-amber-600 uppercase text-[9px]">Tanker Selected: Reading Active Telemetry</span>
          ) : (
            <span>Map fully functional in local sandbox mode</span>
          )}
        </div>
      </div>
    </div>
  );
}
