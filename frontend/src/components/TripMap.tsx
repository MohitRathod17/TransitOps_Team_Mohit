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

interface TripMapProps {
  trip: any;
}

function MapUpdater({ source, dest }: { source: [number, number]; dest: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (source && dest) {
      const bounds = L.latLngBounds([source, dest]);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, source, dest]);
  return null;
}

export default function TripMap({ trip }: TripMapProps) {
  const [routeCoords, setRouteCoords] = useState<[number, number][] | null>(null);

  useEffect(() => {
    if (!trip || !trip.source_lat || !trip.dest_lat) return;

    const fetchRoute = async () => {
      try {
        const res = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${trip.source_lng},${trip.source_lat};${trip.dest_lng},${trip.dest_lat}?overview=full&geometries=geojson`
        );
        const data = await res.json();
        if (data.routes && data.routes.length > 0) {
          const coordinates = data.routes[0].geometry.coordinates;
          // OSRM returns [lng, lat], Leaflet wants [lat, lng]
          setRouteCoords(coordinates.map((c: number[]) => [c[1], c[0]]));
        }
      } catch (err) {
        console.error("Failed to fetch route from OSRM", err);
        setRouteCoords(null); // Fallback to straight line
      }
    };

    fetchRoute();
  }, [trip]);

  if (!trip) return null;

  if (!trip.source_lat || !trip.dest_lat) {
    return (
      <div style={{ padding: "1rem", backgroundColor: "#fff3cd", color: "#856404", borderRadius: "4px" }}>
        Coordinates unavailable for this trip. Geocoding may have failed or was not run.
      </div>
    );
  }

  const sourcePos: [number, number] = [Number(trip.source_lat), Number(trip.source_lng)];
  const destPos: [number, number] = [Number(trip.dest_lat), Number(trip.dest_lng)];

  return (
    <div style={{ height: "400px", width: "100%", borderRadius: "8px", overflow: "hidden", border: "1px solid #ddd" }}>
      <MapContainer center={sourcePos} zoom={13} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={sourcePos}>
          <Popup>
            <strong>Source:</strong> {trip.source}
          </Popup>
        </Marker>
        <Marker position={destPos}>
          <Popup>
            <strong>Destination:</strong> {trip.destination}<br />
            <strong>Driver:</strong> {trip.driver?.name || "N/A"}<br />
            <strong>Vehicle:</strong> {trip.vehicle?.registration_number || "N/A"}
          </Popup>
        </Marker>
        
        {routeCoords ? (
          <Polyline positions={routeCoords} color="blue" weight={5} opacity={0.7} />
        ) : (
          <Polyline positions={[sourcePos, destPos]} color="gray" weight={4} dashArray="5, 10" />
        )}
        
        <MapUpdater source={sourcePos} dest={destPos} />
      </MapContainer>
    </div>
  );
}
