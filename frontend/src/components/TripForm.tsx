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

const PRESET_DESTINATIONS = [
  { value: "Goa", label: "Goa, India (Beaches & Forts)" },
  { value: "Jaipur", label: "Jaipur, Rajasthan (Palaces & Forts)" },
  { value: "Kerala", label: "Kerala (Backwaters & Tea Hills)" },
  { value: "Mumbai", label: "Mumbai, Maharashtra (Coastal City)" },
  { value: "Manali", label: "Manali, Himachal (Himalayan Valley)" },
  { value: "custom", label: "✨ Custom (Enter any destination...)" },
];

export const TripForm: React.FC<TripFormProps> = ({ onGenerate, isLoading }) => {
  const [nlQuery, setNlQuery] = useState(
    "I am going to Goa for 5 days with my parents. My budget is ₹40,000. We like beaches and historical places. We don't want too much walking."
  );
  const [destinationChoice, setDestinationChoice] = useState("Goa");
  const [customDestination, setCustomDestination] = useState("");
  const [days, setDays] = useState(5);
  const [budget, setBudget] = useState(40000);
  const [travelers, setTravelers] = useState(3);
  const [walkingTolerance, setWalkingTolerance] = useState("low");
  const [travelStyle, setTravelStyle] = useState("relaxed");
  const [selectedInterests, setSelectedInterests] = useState<string[]>(["Beach", "History"]);

  const effectiveDestination = destinationChoice === "custom" ? (customDestination.trim() || "Goa") : destinationChoice;

  const handleInterestToggle = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const applyPreset = (presetType: string) => {
    if (presetType === "goa") {
      setDestinationChoice("Goa");
      setNlQuery("I am going to Goa for 5 days with my parents. My budget is ₹40,000. We like beaches and historical places. We don't want too much walking.");
      setDays(5);
      setBudget(40000);
      setTravelers(3);
      setWalkingTolerance("low");
      setTravelStyle("relaxed");
      setSelectedInterests(["Beach", "History"]);
    } else if (presetType === "jaipur") {
      setDestinationChoice("Jaipur");
      setNlQuery("3-day royal heritage trip to Jaipur exploring Amber Fort, Hawa Mahal, local handicrafts, and authentic Rajasthani dining with ₹25,000 budget.");
      setDays(3);
      setBudget(25000);
      setTravelers(2);
      setWalkingTolerance("moderate");
      setTravelStyle("relaxed");
      setSelectedInterests(["History", "Culture", "Food"]);
    } else if (presetType === "kerala") {
      setDestinationChoice("Kerala");
      setNlQuery("4-day scenic trip to Kerala covering Alleppey backwaters houseboat, Munnar tea hills, and Fort Kochi on a ₹35,000 budget.");
      setDays(4);
      setBudget(35000);
      setTravelers(2);
      setWalkingTolerance("low");
      setTravelStyle("relaxed");
      setSelectedInterests(["Nature", "Culture", "Food"]);
    } else if (presetType === "mumbai") {
      setDestinationChoice("Mumbai");
      setNlQuery("A 3-day vibrant trip in Mumbai covering Marine Drive, Gateway of India, museums, and Colaba street shopping with ₹20,000 budget.");
      setDays(3);
      setBudget(20000);
      setTravelers(2);
      setWalkingTolerance("moderate");
      setTravelStyle("relaxed");
      setSelectedInterests(["History", "Museum", "Shopping"]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate({
      destination: effectiveDestination,
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
          <span style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b" }}>Quick Destination Presets:</span>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => applyPreset("goa")}
            style={{ fontSize: "12px", background: destinationChoice === "Goa" ? "#eff6ff" : "#f1f5f9", padding: "6px 12px", color: "#334155", border: destinationChoice === "Goa" ? "1px solid #2563eb" : "none" }}
          >
            🏖️ Goa (5-Day Relaxed)
          </button>
          <button
            type="button"
            onClick={() => applyPreset("jaipur")}
            style={{ fontSize: "12px", background: destinationChoice === "Jaipur" ? "#eff6ff" : "#f1f5f9", padding: "6px 12px", color: "#334155", border: destinationChoice === "Jaipur" ? "1px solid #2563eb" : "none" }}
          >
            🏰 Jaipur (3-Day Royal Forts)
          </button>
          <button
            type="button"
            onClick={() => applyPreset("kerala")}
            style={{ fontSize: "12px", background: destinationChoice === "Kerala" ? "#eff6ff" : "#f1f5f9", padding: "6px 12px", color: "#334155", border: destinationChoice === "Kerala" ? "1px solid #2563eb" : "none" }}
          >
            🛶 Kerala (4-Day Backwaters)
          </button>
          <button
            type="button"
            onClick={() => applyPreset("mumbai")}
            style={{ fontSize: "12px", background: destinationChoice === "Mumbai" ? "#eff6ff" : "#f1f5f9", padding: "6px 12px", color: "#334155", border: destinationChoice === "Mumbai" ? "1px solid #2563eb" : "none" }}
          >
            🏙️ Mumbai (3-Day Coastal)
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
            placeholder="Tell Nexora where you want to go, who you are traveling with, your budget, and preferences..."
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
              value={destinationChoice}
              onChange={(e) => setDestinationChoice(e.target.value)}
              style={{ width: "100%", background: "white", marginBottom: destinationChoice === "custom" ? "8px" : "0" }}
            >
              {PRESET_DESTINATIONS.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
            {destinationChoice === "custom" && (
              <input
                type="text"
                placeholder="Type city name (e.g. Manali, Delhi)..."
                value={customDestination}
                onChange={(e) => setCustomDestination(e.target.value)}
                style={{ width: "100%", fontSize: "13px" }}
                autoFocus
              />
            )}
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
            {isLoading ? "Optimizing Schedule & Routes..." : `Generate ${effectiveDestination} Itinerary`}
          </button>
        </div>
      </form>
    </div>
  );
};
