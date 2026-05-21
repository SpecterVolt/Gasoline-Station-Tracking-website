import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GasStation, LogisticsTruck, LatLng } from "./src/types";

// In-Memory Database State
const stations: GasStation[] = [
  {
    id: "fairfield",
    name: "Solano Hub Fairfield",
    address: "1450 Gateway Blvd, Fairfield, CA 94533",
    lat: 38.2520,
    lng: -122.0430,
    prices: {
      regular: 3.85,
      premium: 4.25,
      diesel: 4.10,
      lastUpdated: new Date().toISOString()
    },
    amenities: {
      open247: true,
      carWash: true,
      evCharging: true,
      convenienceStore: true,
      atm: true
    },
    competitors: [
      { name: "Chevron Gateway", distanceMiles: 0.4, prices: { regular: 4.05, premium: 4.49, diesel: 4.29 } },
      { name: "Shell Auto Plaza", distanceMiles: 1.1, prices: { regular: 3.99, premium: 4.39, diesel: 4.19 } }
    ]
  },
  {
    id: "benicia",
    name: "Benicia Waterfront Express",
    address: "400 East L St, Benicia, CA 94510",
    lat: 38.0535,
    lng: -122.1480,
    prices: {
      regular: 3.92,
      premium: 4.35,
      diesel: 4.15,
      lastUpdated: new Date().toISOString()
    },
    amenities: {
      open247: true,
      carWash: false,
      evCharging: true,
      convenienceStore: true,
      atm: true
    },
    competitors: [
      { name: "Valero Port", distanceMiles: 0.8, prices: { regular: 3.95, premium: 4.39, diesel: 4.10 } },
      { name: "Safeway Fuel Benicia", distanceMiles: 2.3, prices: { regular: 3.89, premium: 4.29, diesel: 4.05 } }
    ]
  },
  {
    id: "vallejo",
    name: "Vallejo Gateway Plaza",
    address: "900 Admiral Callaghan Ln, Vallejo, CA 94591",
    lat: 38.1250,
    lng: -122.2280,
    prices: {
      regular: 3.79,
      premium: 4.19,
      diesel: 4.05,
      lastUpdated: new Date().toISOString()
    },
    amenities: {
      open247: true,
      carWash: true,
      evCharging: false,
      convenienceStore: true,
      atm: false
    },
    competitors: [
      { name: "7-Eleven Auto Vallejo", distanceMiles: 0.5, prices: { regular: 3.82, premium: 4.25, diesel: 4.15 } },
      { name: "ARCO Admiral Plaza", distanceMiles: 0.9, prices: { regular: 3.72, premium: 4.12, diesel: 3.99 } }
    ]
  },
  {
    id: "vacaville",
    name: "Vacaville Corridor Station",
    address: "2000 Harbison Dr, Vacaville, CA 95687",
    lat: 38.3650,
    lng: -121.9820,
    prices: {
      regular: 3.82,
      premium: 4.22,
      diesel: 4.08,
      lastUpdated: new Date().toISOString()
    },
    amenities: {
      open247: false,
      carWash: true,
      evCharging: true,
      convenienceStore: true,
      atm: true
    },
    competitors: [
      { name: "Costco Vacaville", distanceMiles: 1.5, prices: { regular: 3.69, premium: 4.09, diesel: 3.95 } },
      { name: "Chevron Premium Exit", distanceMiles: 0.7, prices: { regular: 3.95, premium: 4.39, diesel: 4.19 } }
    ]
  }
];

// Central Solano Logistics Depot (Starting hub)
const depotLocation: LatLng = { lat: 38.2000, lng: -122.1200 };

// Road network points for simulation matching realistic Solano layouts
const routesMap: Record<string, LatLng[]> = {
  vacaville: [
    depotLocation,
    { lat: 38.2250, lng: -122.0950 },
    { lat: 38.2430, lng: -122.0620 },
    { lat: 38.2520, lng: -122.0430 }, // Fairfield Station
    { lat: 38.2850, lng: -122.0250 },
    { lat: 38.3300, lng: -122.0010 },
    { lat: 38.3650, lng: -121.9820 }  // Vacaville
  ],
  vallejo: [
    depotLocation,
    { lat: 38.1800, lng: -122.1400 },
    { lat: 38.1550, lng: -122.1750 },
    { lat: 38.1400, lng: -122.2050 },
    { lat: 38.1250, lng: -122.2280 }  // Vallejo
  ],
  benicia: [
    depotLocation,
    { lat: 38.1500, lng: -122.1350 },
    { lat: 38.1020, lng: -122.1600 },
    { lat: 38.0750, lng: -122.1520 },
    { lat: 38.0535, lng: -122.1480 }  // Benicia
  ],
  fairfield: [
    depotLocation,
    { lat: 38.2250, lng: -122.0950 },
    { lat: 38.2430, lng: -122.0620 },
    { lat: 38.2520, lng: -122.0430 }  // Fairfield
  ]
};

// Initial state of delivery tankers
let trucks: LogisticsTruck[] = [
  {
    id: "truck-alpha",
    name: "Solano Tanker Alpha",
    status: "en-route",
    destinationId: "vacaville",
    destinationName: "Vacaville Corridor",
    cargoType: "regular",
    cargoCapacity: 12000,
    cargoCurrent: 12000,
    lat: depotLocation.lat,
    lng: depotLocation.lng,
    speedMph: 55,
    routePoints: routesMap.vacaville,
    currentRouteIndex: 0,
    etaMinutes: 18,
    telemetryLog: ["Telemetry initiated. Vehicle starting loading at Central Depot."]
  },
  {
    id: "truck-beta",
    name: "Solano Tanker Beta",
    status: "en-route",
    destinationId: "vallejo",
    destinationName: "Vallejo Gateway Plaza",
    cargoType: "diesel",
    cargoCapacity: 10000,
    cargoCurrent: 9500,
    lat: depotLocation.lat,
    lng: depotLocation.lng,
    speedMph: 48,
    routePoints: routesMap.vallejo,
    currentRouteIndex: 0,
    etaMinutes: 14,
    telemetryLog: ["Telemetry active. Fleet tracking engaged. Transport of clean diesel secured."]
  },
  {
    id: "truck-gamma",
    name: "Solano Tanker Gamma",
    status: "idle",
    destinationId: null,
    destinationName: "Awaiting Dispatch",
    cargoType: "mixed",
    cargoCapacity: 15000,
    cargoCurrent: 0,
    lat: depotLocation.lat,
    lng: depotLocation.lng,
    speedMph: 0,
    routePoints: [],
    currentRouteIndex: 0,
    etaMinutes: 0,
    telemetryLog: ["System online. Standby mode active. Awaiting loading protocols."]
  }
];

// Helper to generate a realistic mock NMEA-0183 GPS string ($GPRMC)
function generateNmeaSentence(truck: LogisticsTruck) {
  const timestamp = new Date().toISOString().replace(/[:\-TZ]/g, "").slice(8, 14);
  const latDeg = Math.floor(truck.lat);
  const latMin = ((truck.lat - latDeg) * 60).toFixed(4);
  const latStr = `${latDeg.toString().padStart(2, "0")}${latMin.padStart(7, "0")},N`;
  
  const lngAbs = Math.abs(truck.lng);
  const lngDeg = Math.floor(lngAbs);
  const lngMin = ((lngAbs - lngDeg) * 60).toFixed(4);
  const lngStr = `${lngDeg.toString().padStart(3, "0")}${lngMin.padStart(7, "0")},W`;
  
  const speedKnots = (truck.speedMph * 0.868976).toFixed(1);
  const dateStr = new Date().toISOString().replace(/[:\-TZ]/g, "").slice(2, 8); // YYMMDD
  
  return `$GPRMC,${timestamp},A,${latStr},${lngStr},${speedKnots},0.0,${dateStr},,,A*3F`;
}

// Haversine Distance Helper to calculate real-world mileage on server side
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

// Background simulation ticker to advance tankers every 3 seconds
setInterval(() => {
  trucks = trucks.map((truck) => {
    if (truck.status === "idle") {
      // Chance to start a new route automatically
      if (Math.random() < 0.15) {
        const destinationOptions = ["fairfield", "benicia", "vallejo", "vacaville"];
        const chosenId = destinationOptions[Math.floor(Math.random() * destinationOptions.length)];
        const station = stations.find((s) => s.id === chosenId);
        if (station) {
          const cargoTypes: ('regular' | 'premium' | 'diesel' | 'mixed')[] = ["regular", "premium", "diesel", "mixed"];
          const newCargo = cargoTypes[Math.floor(Math.random() * cargoTypes.length)];
          const route = routesMap[chosenId] || [depotLocation, { lat: station.lat, lng: station.lng }];
          return {
            ...truck,
            status: "en-route",
            destinationId: chosenId,
            destinationName: station.name,
            cargoType: newCargo,
            cargoCurrent: truck.cargoCapacity,
            routePoints: route,
            currentRouteIndex: 0,
            lat: depotLocation.lat,
            lng: depotLocation.lng,
            speedMph: 45 + Math.floor(Math.random() * 15),
            etaMinutes: Math.round(route.length * 3.5),
            telemetryLog: [
              `[DISPATCH] Tanker dispatched to ${station.name}. Cargo loaded.`,
              `[GPS] Base telemetry initial lock established at Central Depot.`
            ]
          };
        }
      }
      return truck;
    }

    if (truck.status === "en-route") {
      const { routePoints, currentRouteIndex } = truck;
      if (!routePoints || routePoints.length === 0) {
        return { ...truck, status: "idle" };
      }

      // Progress along routePoints
      const nextIndex = currentRouteIndex + 1;
      if (nextIndex >= routePoints.length) {
        // Arrived at station! Switch to refueling
        const log = [
          ...truck.telemetryLog,
          `[ARRIVAL] Tanker reached destination: ${truck.destinationName}. Connection established to station storage tanks.`,
          `[LOGISTICS] Initiating dynamic pump offload sequence.`
        ].slice(-6);
        return {
          ...truck,
          status: "refueling",
          lat: routePoints[routePoints.length - 1].lat,
          lng: routePoints[routePoints.length - 1].lng,
          speedMph: 0,
          etaMinutes: 0,
          telemetryLog: log
        };
      }

      // Linear interpolation to animate nicely over ticks
      const currentPoint = routePoints[currentRouteIndex];
      const targetPoint = routePoints[nextIndex];
      
      // Advance coordinates by 30% of the stretch distance per tick
      const dx = targetPoint.lat - truck.lat;
      const dy = targetPoint.lng - truck.lng;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      let nextLat = truck.lat + dx * 0.4;
      let nextLng = truck.lng + dy * 0.4;
      let newIndex = currentRouteIndex;

      // Close enough to the next waypoint - lock onto it
      if (dist < 0.008) {
        nextLat = targetPoint.lat;
        nextLng = targetPoint.lng;
        newIndex = nextIndex;
      }

      const nmea = generateNmeaSentence({ ...truck, lat: nextLat, lng: nextLng });
      const speedVariation = truck.speedMph + (Math.random() * 6 - 3);
      const updatedSpeed = Math.max(35, Math.min(65, Math.round(speedVariation)));

      const eta = Math.max(1, Math.round((routePoints.length - newIndex) * 2.8));

      const log = [
        ...truck.telemetryLog,
        `[NMEA] ${nmea}`,
        `[TELEM] Speed: ${updatedSpeed}mph | Heading: ${Math.round(Math.atan2(dy, dx) * 57.3)}° | Alt: 45m`
      ].slice(-6);

      return {
        ...truck,
        lat: nextLat,
        lng: nextLng,
        currentRouteIndex: newIndex,
        speedMph: updatedSpeed,
        etaMinutes: eta,
        telemetryLog: log
      };
    }

    if (truck.status === "refueling") {
      // Complete offload, return to depot idle state
      const nextCargo = Math.max(0, truck.cargoCurrent - 4000);
      if (nextCargo <= 0) {
        // Price adjustments when tanker refuels a station
        if (truck.destinationId) {
          const station = stations.find((s) => s.id === truck.destinationId);
          if (station) {
            // Drop prices slightly to reflect tanker arrival inventory adjustments! Dynamic and beautiful logic
            const discount = parseFloat((Math.random() * 0.08 + 0.02).toFixed(2));
            const fuelType = truck.cargoType === 'mixed' ? 'regular' : truck.cargoType;
            station.prices[fuelType] = parseFloat(Math.max(3.10, station.prices[fuelType] - discount).toFixed(2));
            station.prices.lastUpdated = new Date().toISOString();
          }
        }

        const log = [
          ...truck.telemetryLog,
          `[COMPLETE] Offload sequence finished. 100% cargo transferred.`,
          `[DISPATCH] Tanker returned to central fleet depot queue.`
        ].slice(-6);

        return {
          ...truck,
          status: "returning",
          destinationId: "depot",
          destinationName: "Central Logistics Depot",
          cargoCurrent: 0,
          routePoints: (routesMap[truck.destinationId || ""] || []).slice().reverse(),
          currentRouteIndex: 0,
          speedMph: 52,
          etaMinutes: 10,
          telemetryLog: log
        };
      }

      return {
        ...truck,
        cargoCurrent: nextCargo,
        telemetryLog: [...truck.telemetryLog, `[PULSE] Offloading cargo... Remaining volume: ${nextCargo} Gal`].slice(-6)
      };
    }

    if (truck.status === "returning") {
      const { routePoints, currentRouteIndex } = truck;
      const nextIndex = currentRouteIndex + 1;
      if (!routePoints || routePoints.length === 0 || nextIndex >= routePoints.length) {
        return {
          ...truck,
          status: "idle",
          destinationId: null,
          destinationName: "Awaiting Dispatch",
          lat: depotLocation.lat,
          lng: depotLocation.lng,
          speedMph: 0,
          etaMinutes: 0,
          telemetryLog: [`[DEPOT] Standby initialized. Tanker prepped for reload.`]
        };
      }

      const currentPoint = routePoints[currentRouteIndex];
      const targetPoint = routePoints[nextIndex];
      
      const dx = targetPoint.lat - truck.lat;
      const dy = targetPoint.lng - truck.lng;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      let nextLat = truck.lat + dx * 0.4;
      let nextLng = truck.lng + dy * 0.4;
      let newIndex = currentRouteIndex;

      if (dist < 0.008) {
        nextLat = targetPoint.lat;
        nextLng = targetPoint.lng;
        newIndex = nextIndex;
      }

      const nmea = generateNmeaSentence({ ...truck, lat: nextLat, lng: nextLng });
      const log = [
        ...truck.telemetryLog,
        `[NMEA] ${nmea}`,
        `[RETURN] Moving to central depot.`
      ].slice(-6);

      return {
        ...truck,
        lat: nextLat,
        lng: nextLng,
        currentRouteIndex: newIndex,
        etaMinutes: Math.max(1, Math.round((routePoints.length - newIndex) * 2.5)),
        telemetryLog: log
      };
    }

    return truck;
  });
}, 3000);

// Gradually simulate small ambient competitor pricing changes every 12 seconds
setInterval(() => {
  stations.forEach((station) => {
    station.competitors.forEach((comp) => {
      const key: ('regular' | 'premium' | 'diesel') = ["regular", "premium", "diesel"][Math.floor(Math.random() * 3)] as any;
      const shift = parseFloat((Math.random() * 0.04 - 0.02).toFixed(2));
      comp.prices[key] = parseFloat(Math.max(3.20, comp.prices[key] + shift).toFixed(2));
    });
  });
}, 12000);

async function startServer() {
  const app = express();
  app.use(express.json());

  // API Endpoints for interactive Solano Stations
  app.get("/api/stations", (req, res) => {
    // Optional radius filter in miles
    const { lat, lng, radius, fuelType } = req.query;
    
    let filtered = [...stations];
    
    if (lat && lng && radius) {
      const uLat = parseFloat(lat as string);
      const uLng = parseFloat(lng as string);
      const rMiles = parseFloat(radius as string);
      
      filtered = filtered.filter((station) => {
        const dist = getDistanceMiles(uLat, uLng, station.lat, station.lng);
        return dist <= rMiles;
      });
    }

    res.json(filtered);
  });

  // Fetch Logistics fleet telemetry
  app.get("/api/telemetry", (req, res) => {
    res.json({
      depot: depotLocation,
      trucks: trucks,
      timestamp: new Date().toISOString()
    });
  });

  // Fetch route lines
  app.get("/api/routes", (req, res) => {
    res.json({
      routes: routesMap,
      depot: depotLocation
    });
  });

  // Update specific station fuel price (Admin controller)
  app.post("/api/stations/:id/price", (req, res) => {
    const { id } = req.params;
    const { regular, premium, diesel, securePin } = req.body;

    // Secure pin checks for authorized manager validation
    if (securePin !== "SOLANO80" && securePin !== "1234") {
      return res.status(401).json({ error: "Invalid manager key. Access denied." });
    }

    const station = stations.find((s) => s.id === id);
    if (!station) {
      return res.status(404).json({ error: "Gas station profile not found." });
    }

    if (typeof regular === "number") station.prices.regular = regular;
    if (typeof premium === "number") station.prices.premium = premium;
    if (typeof diesel === "number") station.prices.diesel = diesel;
    station.prices.lastUpdated = new Date().toISOString();

    res.json({ success: true, message: `Prices for ${station.name} updated successfully.`, station });
  });

  // Vite Integration in Development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Solano Logistics Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
