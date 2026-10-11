import React, { useState } from "react";
import { CloudRain, DollarSign, X, RefreshCw, CheckCircle, ArrowRight } from "lucide-react";
import { Itinerary } from "../types";
import { triggerSimulation, triggerReplan } from "../services/api";

interface ReplanningModalProps {
  itinerary: Itinerary;
  isOpen: boolean;
  onClose: () => void;
  onApplyUpdatedItinerary: (updated: Itinerary) => void;
}

export const ReplanningModal: React.FC<ReplanningModalProps> = ({
  itinerary,
  isOpen,
  onClose,
  onApplyUpdatedItinerary,
}) => {
  const [selectedScenario, setSelectedScenario] = useState<"weather_change" | "budget_cut" | "closure">("weather_change");
  const [targetDay, setTargetDay] = useState(2);
  const [budgetDelta, setBudgetDelta] = useState(5000);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any | null>(null);

  if (!isOpen) return null;

  const handleRunSimulation = async () => {
    setIsSimulating(true);
    try {
      const res = await triggerSimulation({
        itinerary,
        scenario_type: selectedScenario,
        day: targetDay,
        budget_delta: budgetDelta,
        weather_condition: selectedScenario === "weather_change" ? "Heavy rainstorm" : undefined,
      });
      setSimulationResult(res);
    } catch (err) {
      alert("Simulation failed: " + err);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleApplyReplan = () => {
    if (simulationResult && simulationResult.updated_itinerary) {
      onApplyUpdatedItinerary(simulationResult.updated_itinerary);
      onClose();
    }
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(15, 23, 42, 0.65)",
      backdropFilter: "blur(4px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      padding: "20px"
    }}>
      <div style={{
        background: "white",
        borderRadius: "var(--radius)",
        width: "100%",
        maxWidth: "700px",
        maxHeight: "90vh",
        overflowY: "auto",
        boxShadow: "var(--shadow-lg)",
        padding: "24px"
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <RefreshCw size={20} color="#2563eb" />
            <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#0f172a" }}>
              Dynamic Minimal-Change Replanning & Simulation
            </h3>
          </div>
          <button onClick={onClose} style={{ background: "transparent", color: "#64748b" }}>
            <X size={20} />
          </button>
        </div>

        {/* Scenario Selection */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "18px" }}>
          <button
            type="button"
            onClick={() => { setSelectedScenario("weather_change"); setSimulationResult(null); }}
            style={{
              padding: "14px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: selectedScenario === "weather_change" ? "#eff6ff" : "#f8fafc",
              border: `2px solid ${selectedScenario === "weather_change" ? "#2563eb" : "#e2e8f0"}`,
              color: selectedScenario === "weather_change" ? "#1e40af" : "#475569",
              textAlign: "left"
            }}
          >
            <CloudRain size={22} color={selectedScenario === "weather_change" ? "#2563eb" : "#64748b"} />
            <div>
              <div style={{ fontWeight: "700", fontSize: "14px" }}>Weather Disruption</div>
              <div style={{ fontSize: "12px", color: "#64748b" }}>Simulate heavy rain on beach/outdoor spot</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => { setSelectedScenario("budget_cut"); setSimulationResult(null); }}
            style={{
              padding: "14px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: selectedScenario === "budget_cut" ? "#eff6ff" : "#f8fafc",
              border: `2px solid ${selectedScenario === "budget_cut" ? "#2563eb" : "#e2e8f0"}`,
              color: selectedScenario === "budget_cut" ? "#1e40af" : "#475569",
              textAlign: "left"
            }}
          >
            <DollarSign size={22} color={selectedScenario === "budget_cut" ? "#2563eb" : "#64748b"} />
            <div>
              <div style={{ fontWeight: "700", fontSize: "14px" }}>Budget Reduction</div>
              <div style={{ fontSize: "12px", color: "#64748b" }}>Simulate budget cut of ₹{budgetDelta.toLocaleString()}</div>
            </div>
          </button>
        </div>

        {/* Configuration */}
        <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "8px", marginBottom: "20px" }}>
          {selectedScenario === "weather_change" && (
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "#475569" }}>
                Select Day Experiencing Heavy Rain:
              </label>
              <select
                value={targetDay}
                onChange={(e) => { setTargetDay(Number(e.target.value)); setSimulationResult(null); }}
                style={{ background: "white", padding: "6px 12px" }}
              >
                {itinerary.days.map((d) => (
                  <option key={d.day} value={d.day}>
                    Day {d.day} ({d.activities.length} activities)
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedScenario === "budget_cut" && (
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "#475569" }}>
                Budget Reduction Amount:
              </label>
              <select
                value={budgetDelta}
                onChange={(e) => { setBudgetDelta(Number(e.target.value)); setSimulationResult(null); }}
                style={{ background: "white", padding: "6px 12px" }}
              >
                <option value={3000}>- ₹3,000</option>
                <option value={5000}>- ₹5,000</option>
                <option value={8000}>- ₹8,000</option>
              </select>
            </div>
          )}
        </div>

        {/* Trigger button */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "20px" }}>
          <button
            onClick={handleRunSimulation}
            disabled={isSimulating}
            style={{
              background: "#2563eb",
              color: "white",
              padding: "10px 20px",
              fontSize: "14px",
              fontWeight: "600"
            }}
          >
            {isSimulating ? "Simulating Minimal-Change Replan..." : "Run What-If Simulation"}
          </button>
        </div>

        {/* Simulation Diff Preview */}
        {simulationResult && (
          <div style={{
            border: "1px solid #bfdbfe",
            background: "#f0f9ff",
            borderRadius: "8px",
            padding: "16px",
            marginBottom: "20px"
          }}>
            <h4 style={{ fontSize: "15px", fontWeight: "700", color: "#1e3a8a", marginBottom: "8px" }}>
              Simulation Result: Minimal-Change Plan Formulated
            </h4>
            <p style={{ fontSize: "13px", color: "#1e40af", marginBottom: "14px", lineHeight: "1.5" }}>
              {simulationResult.impact_description}
            </p>

            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "10px",
              marginBottom: "16px",
              background: "white",
              padding: "12px",
              borderRadius: "6px"
            }}>
              <div>
                <div style={{ fontSize: "11px", color: "#64748b" }}>Activities Preserved</div>
                <div style={{ fontSize: "16px", fontWeight: "700", color: "#16a34a" }}>
                  {simulationResult.activities_preserved_count} (Untouched)
                </div>
              </div>
              <div>
                <div style={{ fontSize: "11px", color: "#64748b" }}>Activities Changed</div>
                <div style={{ fontSize: "16px", fontWeight: "700", color: "#2563eb" }}>
                  {simulationResult.activities_changed_count} (Repaired)
                </div>
              </div>
              <div>
                <div style={{ fontSize: "11px", color: "#64748b" }}>Cost Delta</div>
                <div style={{ fontSize: "16px", fontWeight: "700", color: simulationResult.cost_difference <= 0 ? "#16a34a" : "#dc2626" }}>
                  {simulationResult.cost_difference > 0 ? "+" : ""}₹{simulationResult.cost_difference.toLocaleString()}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                onClick={onClose}
                style={{ background: "#e2e8f0", color: "#475569", padding: "8px 16px" }}
              >
                Dismiss
              </button>
              <button
                onClick={handleApplyReplan}
                style={{
                  background: "#16a34a",
                  color: "white",
                  padding: "8px 20px",
                  fontWeight: "700",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <CheckCircle size={16} />
                Apply Minimal-Change Replan
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
