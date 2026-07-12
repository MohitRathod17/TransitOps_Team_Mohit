"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in Leaflet with Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface Trip {
  id: number;
  source: string;
  destination: string;
  source_lat?: number | null;
  source_lng?: number | null;
  dest_lat?: number | null;
  dest_lng?: number | null;
  vehicle: { registration_number: string } | null;
  driver: { name: string } | null;
}

interface ActiveRoutesMapProps {
  trips: Trip[];
}

function MapUpdater({ trips }: { trips: Trip[] }) {
  const map = useMap();
  useEffect(() => {
    const validTrips = trips.filter(t => t.source_lat && t.dest_lat);
    if (validTrips.length > 0) {
      const bounds = L.latLngBounds([]);
      validTrips.forEach(t => {
        bounds.extend([Number(t.source_lat), Number(t.source_lng)]);
        bounds.extend([Number(t.dest_lat), Number(t.dest_lng)]);
      });
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  }, [map, trips]);
  return null;
}

// A single route component to fetch and draw the polyline for one trip
function RoutePolyline({ trip, color }: { trip: Trip, color: string }) {
  const [routeCoords, setRouteCoords] = useState<[number, number][] | null>(null);

  useEffect(() => {
    if (!trip.source_lat || !trip.dest_lat) return;
    
    const fetchRoute = async () => {
      try {
        const res = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${trip.source_lng},${trip.source_lat};${trip.dest_lng},${trip.dest_lat}?overview=full&geometries=geojson`
        );
        const data = await res.json();
        if (data.routes && data.routes.length > 0) {
          const coordinates = data.routes[0].geometry.coordinates;
          setRouteCoords(coordinates.map((c: number[]) => [c[1], c[0]]));
        }
      } catch (err) {
        console.error("Failed to fetch route", err);
      }
    };
    fetchRoute();
  }, [trip]);

  const sourcePos: [number, number] = [Number(trip.source_lat), Number(trip.source_lng)];
  const destPos: [number, number] = [Number(trip.dest_lat), Number(trip.dest_lng)];

  if (routeCoords) {
    return <Polyline positions={routeCoords} color={color} weight={4} opacity={0.8} />;
  }
  return <Polyline positions={[sourcePos, destPos]} color={color} weight={3} dashArray="5, 10" />;
}

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function ActiveRoutesMap({ trips }: ActiveRoutesMapProps) {
  const validTrips = trips.filter(t => t.source_lat && t.dest_lat);

  if (validTrips.length === 0) {
    return (
      <div style={{ padding: "1rem", backgroundColor: "var(--bg-card)", color: "var(--text-secondary)", textAlign: "center", borderRadius: "8px", border: "1px solid var(--border-card)" }}>
        No active routes with GPS coordinates found.
      </div>
    );
  }

  // Default center if no valid trips (though handled by return above)
  const defaultCenter: [number, number] = [20.5937, 78.9629]; // India center

  return (
    <div style={{ height: "180px", width: "100%", borderRadius: "8px", overflow: "hidden", border: "1px solid var(--border-card)" }}>
      <MapContainer center={defaultCenter} zoom={4} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; OSM'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {validTrips.map((trip, idx) => {
          const sourcePos: [number, number] = [Number(trip.source_lat), Number(trip.source_lng)];
          const destPos: [number, number] = [Number(trip.dest_lat), Number(trip.dest_lng)];
          const color = COLORS[idx % COLORS.length];

          return (
            <div key={trip.id}>
              <Marker position={sourcePos}>
                <Popup>
                  <strong>Source:</strong> {trip.source}<br />
                  <small>Trip #{trip.id}</small>
                </Popup>
              </Marker>
              <Marker position={destPos}>
                <Popup>
                  <strong>Destination:</strong> {trip.destination}<br />
                  <strong>Driver:</strong> {trip.driver?.name}<br />
                  <strong>Vehicle:</strong> {trip.vehicle?.registration_number}
                </Popup>
              </Marker>
              <RoutePolyline trip={trip} color={color} />
            </div>
          );
        })}
        
        <MapUpdater trips={validTrips} />
      </MapContainer>
    </div>
  );
}
