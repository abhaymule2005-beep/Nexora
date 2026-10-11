import React, { useState } from "react";
import { Sparkles, Calendar, DollarSign, Users, Footprints, Clock, Compass } from "lucide-react";
import { TripRequestParams } from "../types";

interface TripFormProps {
  onGenerate: (params: TripRequestParams) => void;
  isLoading: boolean;
}

const INTERESTS_LIST = [
  "Beach", "History", "Nature", "Museum", "Food", "Shopping", "Culture", "Entertainment"
];

export const TripForm: React.FC<TripFormProps> = ({ onGenerate, isLoading }) => {
  const [nlQuery, setNlQuery] = useState(
    "I am going to Goa for 5 days with my parents. My budget is ₹40,000. We like beaches and historical places. We don't want too much walking."
  );
  const [destination, setDestination] = useState("Goa");
  const [days, setDays] = useState(5);
  const [budget, setBudget] = useState(40000);
  const [travelers, setTravelers] = useState(3);
  const [walkingTolerance, setWalkingTolerance] = useState("low");
  const [travelStyle, setTravelStyle] = useState("relaxed");
  const [selectedInterests, setSelectedInterests] = useState<string[]>(["Beach", "History"]);

  const handleInterestToggle = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const applyPreset = (presetType: string) => {
    if (presetType === "demo1") {
      setNlQuery("I am going to Goa for 5 days with my parents. My budget is ₹40,000. We like beaches and historical places. We don't want too much walking.");
      setDays(5);
      setBudget(40000);
      setTravelers(3);
      setWalkingTolerance("low");
      setTravelStyle("relaxed");
      setSelectedInterests(["Beach", "History"]);
    } else if (presetType === "demo2") {
      setNlQuery("A 3-day cultural and museum trip in Goa on a ₹20,000 budget exploring Portuguese heritage and art.");
      setDays(3);
      setBudget(20000);
      setTravelers(2);
      setWalkingTolerance("moderate");
      setTravelStyle("relaxed");
      setSelectedInterests(["Museum", "Culture", "History"]);
    } else if (presetType === "demo3") {
      setNlQuery("4-day nature and spice plantation getaway in Goa with ₹35,000 budget, relaxed pace.");
      setDays(4);
      setBudget(35000);
      setTravelers(2);
      setWalkingTolerance("moderate");
      setTravelStyle("relaxed");
      setSelectedInterests(["Nature", "Food", "Beach"]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate({
      destination,
      days,
      budget,
      travelers,
      interests: selectedInterests.map((i) => i.toLowerCase()),
      walking_tolerance: walkingTolerance,
      travel_style: travelStyle,
      natural_language_query: nlQuery.trim() || undefined,
    });
  };

  return (
    <div style={{
      background: "var(--bg-card)",
      borderRadius: "var(--radius)",
      padding: "28px",
      boxShadow: "var(--shadow)",
      border: "1px solid var(--border)",
      marginBottom: "24px"
    }}>
      {/* Quick Demo Presets */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Sparkles size={18} color="#2563eb" />
          <span style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b" }}>Quick Demo Scenarios:</span>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => applyPreset("demo1")}
            style={{ fontSize: "12px", background: "#f1f5f9", padding: "6px 12px", color: "#334155" }}
          >
            🏖️ Demo 1: Goa 5-Day (Family Relaxed)
          </button>
          <button
            type="button"
            onClick={() => applyPreset("demo2")}
            style={{ fontSize: "12px", background: "#f1f5f9", padding: "6px 12px", color: "#334155" }}
          >
            🏛️ Demo 2: 3-Day Culture & Heritage
          </button>
          <button
            type="button"
            onClick={() => applyPreset("demo3")}
            style={{ fontSize: "12px", background: "#f1f5f9", padding: "6px 12px", color: "#334155" }}
          >
            🌿 Demo 3: Nature & Spice Farms
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Natural Language Prompt */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "6px" }}>
            Natural-Language Travel Request
          </label>
          <textarea
            rows={3}
            value={nlQuery}
            onChange={(e) => setNlQuery(e.target.value)}
            placeholder="E.g. I am going to Goa for 5 days with my parents. My budget is ₹40,000. We like beaches and historical places. We don't want too much walking..."
            style={{ width: "100%", resize: "vertical", fontSize: "14px", padding: "10px 14px", lineHeight: "1.5" }}
          />
        </div>

        {/* Structured Grid Parameters */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          marginBottom: "20px"
        }}>
          <div>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: "600", color: "#64748b", marginBottom: "6px" }}>
              <Compass size={14} /> Destination
            </label>
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              style={{ width: "100%", background: "white" }}
            >
              <option value="Goa">Goa, India</option>
            </select>
          </div>

          <div>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: "600", color: "#64748b", marginBottom: "6px" }}>
              <Calendar size={14} /> Duration: {days} Days
            </label>
            <input
              type="range"
              min={1}
              max={7}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              style={{ width: "100%" }}
            />
          </div>

          <div>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: "600", color: "#64748b", marginBottom: "6px" }}>
              <DollarSign size={14} /> Budget: ₹{budget.toLocaleString("en-IN")}
            </label>
            <input
              type="range"
              min={10000}
              max={80000}
              step={5000}
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              style={{ width: "100%" }}
            />
          </div>

          <div>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: "600", color: "#64748b", marginBottom: "6px" }}>
              <Users size={14} /> Travelers
            </label>
            <select
              value={travelers}
              onChange={(e) => setTravelers(Number(e.target.value))}
              style={{ width: "100%", background: "white" }}
            >
              <option value={1}>1 Traveler (Solo)</option>
              <option value={2}>2 Travelers (Couple)</option>
              <option value={3}>3 Travelers (Family / Parents)</option>
              <option value={4}>4 Travelers (Family / Group)</option>
            </select>
          </div>

          <div>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: "600", color: "#64748b", marginBottom: "6px" }}>
              <Footprints size={14} /> Walking Tolerance
            </label>
            <select
              value={walkingTolerance}
              onChange={(e) => setWalkingTolerance(e.target.value)}
              style={{ width: "100%", background: "white" }}
            >
              <option value="low">Low (Minimal walking, relaxed)</option>
              <option value="moderate">Moderate (Standard walking)</option>
              <option value="high">High (Active treks & climbs)</option>
            </select>
          </div>

          <div>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: "600", color: "#64748b", marginBottom: "6px" }}>
              <Clock size={14} /> Travel Pace
            </label>
            <select
              value={travelStyle}
              onChange={(e) => setTravelStyle(e.target.value)}
              style={{ width: "100%", background: "white" }}
            >
              <option value="relaxed">Relaxed (3 places / day)</option>
              <option value="packed">Packed (4 places / day)</option>
            </select>
          </div>
        </div>

        {/* Interests Pills */}
        <div style={{ marginBottom: "22px" }}>
          <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#64748b", marginBottom: "8px" }}>
            Select Preferred Interests:
          </label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {INTERESTS_LIST.map((interest) => {
              const active = selectedInterests.includes(interest);
              return (
                <button
                  key={interest}
                  type="button"
                  onClick={() => handleInterestToggle(interest)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "20px",
                    fontSize: "13px",
                    background: active ? "#2563eb" : "#f1f5f9",
                    color: active ? "white" : "#475569",
                    fontWeight: active ? "600" : "500",
                    border: `1px solid ${active ? "#2563eb" : "#e2e8f0"}`
                  }}
                >
                  {interest}
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit Button */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            type="submit"
            disabled={isLoading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: isLoading ? "#94a3b8" : "linear-gradient(135deg, #2563eb, #1d4ed8)",
              color: "white",
              padding: "12px 28px",
              fontSize: "15px",
              fontWeight: "600",
              boxShadow: "0 4px 12px rgba(37,99,235,0.3)"
            }}
          >
            <Sparkles size={18} />
            {isLoading ? "Optimizing Schedule & Routes..." : "Generate Optimized Itinerary"}
          </button>
        </div>
      </form>
    </div>
  );
};
