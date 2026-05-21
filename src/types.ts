export interface FuelPrices {
  regular: number;
  premium: number;
  diesel: number;
  lastUpdated: string;
}

export interface Amenities {
  open247: boolean;
  carWash: boolean;
  evCharging: boolean;
  convenienceStore: boolean;
  atm: boolean;
}

export interface GasStation {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  prices: FuelPrices;
  amenities: Amenities;
  competitors: {
    name: string;
    distanceMiles: number;
    prices: {
      regular: number;
      premium: number;
      diesel: number;
    };
  }[];
}

export interface LatLng {
  lat: number;
  lng: number;
}

export interface RoadSegment {
  id: string;
  name: string;
  points: LatLng[];
}

export interface LogisticsTruck {
  id: string;
  name: string;
  status: 'en-route' | 'refueling' | 'idle' | 'returning';
  destinationId: string | null;
  destinationName: string;
  cargoType: 'regular' | 'premium' | 'diesel' | 'mixed';
  cargoCapacity: number; // in gallons
  cargoCurrent: number;
  lat: number;
  lng: number;
  speedMph: number;
  routePoints: LatLng[];
  currentRouteIndex: number;
  etaMinutes: number;
  telemetryLog: string[];
}

export interface UserState {
  userLocation: LatLng;
  searchQuery: string;
  selectedStationId: string | null;
  selectedTruckId: string | null;
  activeTab: 'locator' | 'logistics' | 'analytics';
  filters: {
    open247: boolean;
    carWash: boolean;
    evCharging: boolean;
    convenienceStore: boolean;
    atm: boolean;
    fuelType: 'regular' | 'premium' | 'diesel';
    maxDistance: number;
  };
}
