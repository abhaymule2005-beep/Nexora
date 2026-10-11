import React, { useState } from "react";
import {
  Calendar, DollarSign, Navigation, ShieldCheck,
  CloudSun, RefreshCw, Clock, MapPin, Tag, Star, ArrowRight, Zap
} from "lucide-react";
import { Itinerary, Activity } from "../types";
import { TripMap } from "./TripMap";
import { ValidationPanel } from "./ValidationPanel";

interface ItineraryDashboardProps {
  itinerary: Itinerary;
  onOpenReplanning: () => void;
}

export const ItineraryDashboard: React.FC<ItineraryDashboardProps> = ({
  itinerary,
  onOpenReplanning,
}) => {
  const [selectedDay, setSelectedDay] = useState(1);

  const activeDayPlan = itinerary.days.find((d) => d.day === selectedDay) || itinerary.days[0];

  return (
    <div>
      {/* Overview Stat Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "16px",
        marginBottom: "24px"
      }}>
        {/* Budget Card */}
        <div style={{
          background: "var(--bg-card)",
          borderRadius: "var(--radius)",
          padding: "20px",
          boxShadow: "var(--shadow)",
          border: "1px solid var(--border)"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600" }}>Total Estimated Cost</span>
            <DollarSign size={18} color="#2563eb" />
          </div>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a" }}>
            ₹{itinerary.total_cost.toLocaleString("en-IN")}
          </div>
          <div style={{
            fontSize: "12px",
            fontWeight: "600",
            color: itinerary.remaining_budget >= 0 ? "#16a34a" : "#dc2626",
            marginTop: "4px"
          }}>
            {itinerary.budget_status} • ₹{itinerary.remaining_budget.toLocaleString("en-IN")} buffer
          </div>
        </div>

        {/* Distance Card */}
        <div style={{
          background: "var(--bg-card)",
          borderRadius: "var(--radius)",
          padding: "20px",
          boxShadow: "var(--shadow)",
          border: "1px solid var(--border)"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600" }}>Route Transit (2-Opt)</span>
            <Navigation size={18} color="#059669" />
          </div>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a" }}>
            {itinerary.total_distance_km} km
          </div>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
            ~ {Math.round(itinerary.total_travel_time_minutes)} mins total transit
          </div>
        </div>

        {/* Duration Card */}
        <div style={{
          background: "var(--bg-card)",
          borderRadius: "var(--radius)",
          padding: "20px",
          boxShadow: "var(--shadow)",
          border: "1px solid var(--border)"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600" }}>Duration & Pacing</span>
            <Calendar size={18} color="#7c3aed" />
          </div>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a" }}>
            {itinerary.days_count} Days in {itinerary.destination}
          </div>
          <div style={{ fontSize: "12px", color: "#7c3aed", fontWeight: "600", marginTop: "4px" }}>
            OR-Tools Feasible Schedule
          </div>
        </div>

        {/* Dynamic Replan Action Card */}
        <div style={{
          background: "linear-gradient(135deg, #1e293b, #0f172a)",
          borderRadius: "var(--radius)",
          padding: "20px",
          color: "white",
          boxShadow: "var(--shadow)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between"
        }}>
          <div>
            <div style={{ fontSize: "12px", color: "#94a3b8", fontWeight: "600", marginBottom: "4px" }}>
              Signature Feature
            </div>
            <div style={{ fontSize: "16px", fontWeight: "700" }}>
              Dynamic Replanner
            </div>
          </div>
          <button
            onClick={onOpenReplanning}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              background: "#2563eb",
              color: "white",
              padding: "8px 14px",
              fontSize: "13px",
              fontWeight: "600",
              marginTop: "10px"
            }}
          >
            <Zap size={14} />
            Simulate Disruption & Replan
          </button>
        </div>
      </div>

      {/* Multi-Constraint Validation Panel */}
      <ValidationPanel
        validation={itinerary.validation}
        onFixWeather={onOpenReplanning}
      />

      {/* Main Grid: Days Timeline & Map */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        {/* Left Column: Day selector & Activities Timeline */}
        <div>
          {/* Day Tabs */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "16px", overflowX: "auto", paddingBottom: "4px" }}>
            {itinerary.days.map((dayPlan) => {
              const active = dayPlan.day === selectedDay;
              return (
                <button
                  key={dayPlan.day}
                  onClick={() => setSelectedDay(dayPlan.day)}
                  style={{
                    padding: "10px 18px",
                    borderRadius: "8px",
                    background: active ? "#2563eb" : "white",
                    color: active ? "white" : "#475569",
                    fontWeight: active ? "700" : "500",
                    border: `1px solid ${active ? "#2563eb" : "var(--border)"}`,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    gap: "2px",
                    boxShadow: active ? "0 2px 4px rgba(37,99,235,0.2)" : "none"
                  }}
                >
                  <span style={{ fontSize: "13px" }}>Day {dayPlan.day}</span>
                  <span style={{ fontSize: "11px", opacity: 0.85 }}>
                    {dayPlan.activities.length} stops
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Day Header with Weather Info */}
          {activeDayPlan && (
            <div style={{
              background: "white",
              borderRadius: "var(--radius)",
              padding: "16px 20px",
              border: "1px solid var(--border)",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}>
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a" }}>
                  Day {activeDayPlan.day} Schedule
                </h3>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                  {activeDayPlan.day_distance_km} km transit • ₹{activeDayPlan.day_cost} admissions
                </div>
              </div>

              {activeDayPlan.weather_forecast && (
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "#f0fdf4",
                  padding: "6px 12px",
                  borderRadius: "20px",
                  border: "1px solid #bbf7d0",
                  fontSize: "12px",
                  color: "#166534",
                  fontWeight: "600"
                }}>
                  <CloudSun size={16} />
                  <span>
                    {activeDayPlan.weather_forecast.condition} • {activeDayPlan.weather_forecast.temp_max}°C ({activeDayPlan.weather_forecast.precipitation_probability}% rain)
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Activities Timeline Cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {activeDayPlan?.activities.map((act, idx) => (
              <div
                key={`${act.place.id}-${idx}`}
                style={{
                  background: "white",
                  borderRadius: "var(--radius)",
                  padding: "18px",
                  border: "1px solid var(--border)",
                  boxShadow: "var(--shadow)",
                  position: "relative"
                }}
              >
                {/* Transit pill from previous activity */}
                {idx > 0 && act.travel_time > 0 && (
                  <div style={{
                    fontSize: "11px",
                    fontWeight: "600",
                    color: "#059669",
                    background: "#ecfdf5",
                    padding: "4px 10px",
                    borderRadius: "12px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    marginBottom: "10px",
                    border: "1px solid #a7f3d0"
                  }}>
                    🚗 {act.travel_time} min transit from previous stop
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      background: "#2563eb",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "700",
                      fontSize: "13px"
                    }}>
                      {idx + 1}
                    </div>
                    <div>
                      <h4 style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a", margin: 0 }}>
                        {act.place.name}
                      </h4>
                      <div style={{ fontSize: "12px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "8px", marginTop: "2px" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                          <Clock size={12} /> {act.start_time} - {act.end_time}
                        </span>
                        <span>•</span>
                        <span style={{ display: "flex", alignItems: "center", gap: "3px", color: "#f59e0b", fontWeight: "600" }}>
                          <Star size={12} fill="#f59e0b" /> {act.place.rating}
                        </span>
                        <span>•</span>
                        <span>{act.place.cost === 0 ? "Free" : `₹${act.place.cost}`}</span>
                      </div>
                    </div>
                  </div>

                  <span style={{
                    fontSize: "11px",
                    fontWeight: "600",
                    padding: "4px 8px",
                    borderRadius: "6px",
                    background: "#eff6ff",
                    color: "#2563eb"
                  }}>
                    {act.place.category}
                  </span>
                </div>

                <p style={{ fontSize: "13px", color: "#334155", margin: "8px 0 12px", lineHeight: "1.4" }}>
                  {act.place.description}
                </p>

                {/* AI / Recommendation Explanation Badge */}
                {act.reason && (
                  <div style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    padding: "6px 12px",
                    fontSize: "12px",
                    color: "#475569",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}>
                    <span style={{ color: "#2563eb", fontWeight: "700" }}>Why chosen:</span>
                    <span>{act.reason}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Interactive Map */}
        <div>
          <div style={{ position: "sticky", top: "90px" }}>
            <TripMap activities={activeDayPlan?.activities || []} />
          </div>
        </div>
      </div>
    </div>
  );
};
