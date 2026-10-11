import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Activity } from "../types";

// Fix Leaflet's default icon missing in bundled assets
const customIcon = (orderIndex: number) => {
  return L.divIcon({
    className: "custom-marker-icon",
    html: `
      <div style="
        background-color: #2563eb;
        color: white;
        border: 2px solid white;
        border-radius: 50%;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 13px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      ">
        ${orderIndex + 1}
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
};

interface TripMapProps {
  activities: Activity[];
}

function MapUpdater({ activities }: { activities: Activity[] }) {
  const map = useMap();
  useEffect(() => {
    if (activities.length > 0) {
      const bounds = L.latLngBounds(
        activities.map((a) => [a.place.latitude, a.place.longitude])
      );
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    }
  }, [activities, map]);
  return null;
}

export const TripMap: React.FC<TripMapProps> = ({ activities }) => {
  const defaultCenter: [number, number] = activities.length > 0
    ? [activities[0].place.latitude, activities[0].place.longitude]
    : [15.4989, 73.8315];
  const polylineCoords: [number, number][] = activities.map((a) => [
    a.place.latitude,
    a.place.longitude,
  ]);

  return (
    <div style={{
      borderRadius: "var(--radius)",
      overflow: "hidden",
      boxShadow: "var(--shadow)",
      border: "1px solid var(--border)",
      background: "white"
    }}>
      <div style={{
        padding: "12px 18px",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "#f8fafc"
      }}>
        <span style={{ fontSize: "13px", fontWeight: "600", color: "#334155" }}>
          📍 Geographic Itinerary Route ({activities.length} Waypoints)
        </span>
        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
          2-Opt Optimized Sequence
        </span>
      </div>

      <MapContainer
        center={defaultCenter}
        zoom={11}
        scrollWheelZoom={false}
        style={{ width: "100%", height: "420px" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapUpdater activities={activities} />

        {activities.map((act, idx) => (
          <Marker
            key={`${act.place.id}-${idx}`}
            position={[act.place.latitude, act.place.longitude]}
            icon={customIcon(idx)}
          >
            <Popup>
              <div style={{ padding: "4px" }}>
                <h4 style={{ margin: "0 0 4px", fontSize: "14px", color: "#0f172a" }}>
                  #{idx + 1} {act.place.name}
                </h4>
                <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "6px" }}>
                  {act.start_time} - {act.end_time} • {act.place.category}
                </div>
                <p style={{ margin: "0 0 6px", fontSize: "12px", color: "#334155" }}>
                  {act.place.description}
                </p>
                <div style={{ fontSize: "11px", color: "#2563eb", fontWeight: "600" }}>
                  ⭐ {act.place.rating}/5 • Cost: {act.place.cost === 0 ? "Free" : `₹${act.place.cost}`}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {polylineCoords.length > 1 && (
          <Polyline
            positions={polylineCoords}
            color="#2563eb"
            weight={3.5}
            opacity={0.8}
            dashArray="6, 8"
          />
        )}
      </MapContainer>
    </div>
  );
};
