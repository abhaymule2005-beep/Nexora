import React from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, ShieldAlert } from "lucide-react";
import { ValidationResult } from "../types";

interface ValidationPanelProps {
  validation?: ValidationResult;
  onFixWeather?: () => void;
}

export const ValidationPanel: React.FC<ValidationPanelProps> = ({ validation, onFixWeather }) => {
  if (!validation) return null;

  const passed = validation.summary?.checks_passed || {
    budget: true,
    opening_hours: true,
    no_overlaps: true,
    weather_resilience: true,
  };

  return (
    <div style={{
      background: "var(--bg-card)",
      borderRadius: "var(--radius)",
      padding: "20px",
      boxShadow: "var(--shadow)",
      border: "1px solid var(--border)",
      marginBottom: "24px"
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <ShieldAlert size={20} color="#2563eb" />
          <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a" }}>
            Multi-Constraint Feasibility Validation
          </h3>
        </div>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "4px 10px",
          borderRadius: "20px",
          fontSize: "12px",
          fontWeight: "600",
          backgroundColor: validation.valid ? "#ecfdf5" : "#fef2f2",
          color: validation.valid ? "#059669" : "#dc2626"
        }}>
          {validation.valid ? "All Constraints Feasible" : "Issues Detected"} • Score: {validation.score * 100}%
        </div>
      </div>

      {/* Checklist grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "12px",
        marginBottom: "16px"
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "10px 14px",
          borderRadius: "8px",
          background: passed.budget ? "#f0fdf4" : "#fef2f2",
          border: `1px solid ${passed.budget ? "#bbf7d0" : "#fecaca"}`
        }}>
          {passed.budget ? <CheckCircle2 size={16} color="#16a34a" /> : <AlertCircle size={16} color="#dc2626" />}
          <span style={{ fontSize: "13px", fontWeight: "600", color: passed.budget ? "#166534" : "#991b1b" }}>
            Budget Adherence
          </span>
        </div>

        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "10px 14px",
          borderRadius: "8px",
          background: passed.opening_hours ? "#f0fdf4" : "#fef2f2",
          border: `1px solid ${passed.opening_hours ? "#bbf7d0" : "#fecaca"}`
        }}>
          {passed.opening_hours ? <CheckCircle2 size={16} color="#16a34a" /> : <AlertCircle size={16} color="#dc2626" />}
          <span style={{ fontSize: "13px", fontWeight: "600", color: passed.opening_hours ? "#166534" : "#991b1b" }}>
            Operating Hours
          </span>
        </div>

        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "10px 14px",
          borderRadius: "8px",
          background: passed.no_overlaps ? "#f0fdf4" : "#fef2f2",
          border: `1px solid ${passed.no_overlaps ? "#bbf7d0" : "#fecaca"}`
        }}>
          {passed.no_overlaps ? <CheckCircle2 size={16} color="#16a34a" /> : <AlertCircle size={16} color="#dc2626" />}
          <span style={{ fontSize: "13px", fontWeight: "600", color: passed.no_overlaps ? "#166534" : "#991b1b" }}>
            No Schedule Overlaps
          </span>
        </div>

        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "10px 14px",
          borderRadius: "8px",
          background: passed.weather_resilience ? "#f0fdf4" : "#fffbeb",
          border: `1px solid ${passed.weather_resilience ? "#bbf7d0" : "#fde68a"}`
        }}>
          {passed.weather_resilience ? <CheckCircle2 size={16} color="#16a34a" /> : <AlertTriangle size={16} color="#d97706" />}
          <span style={{ fontSize: "13px", fontWeight: "600", color: passed.weather_resilience ? "#166534" : "#92400e" }}>
            Weather Feasibility
          </span>
        </div>
      </div>

      {/* Issues and warnings list */}
      {(validation.issues.length > 0 || validation.warnings.length > 0) && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {validation.issues.map((issue, idx) => (
            <div
              key={`issue-${idx}`}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                padding: "10px 14px",
                borderRadius: "8px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                fontSize: "13px",
                color: "#991b1b"
              }}
            >
              <AlertCircle size={16} style={{ marginTop: "2px", flexShrink: 0 }} />
              <div>
                <strong>{issue.type.toUpperCase()}:</strong> {issue.message}
                {issue.suggested_fix && (
                  <div style={{ marginTop: "4px", fontSize: "12px", color: "#b91c1c" }}>
                    💡 Fix: {issue.suggested_fix}
                  </div>
                )}
              </div>
            </div>
          ))}

          {validation.warnings.map((warning, idx) => (
            <div
              key={`warn-${idx}`}
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: "10px",
                padding: "10px 14px",
                borderRadius: "8px",
                background: "#fffbeb",
                border: "1px solid #fde68a",
                fontSize: "13px",
                color: "#92400e"
              }}
            >
              <div style={{ display: "flex", gap: "10px" }}>
                <AlertTriangle size={16} style={{ marginTop: "2px", flexShrink: 0 }} />
                <div>
                  <strong>{warning.type.toUpperCase()}:</strong> {warning.message}
                  {warning.suggested_fix && (
                    <div style={{ marginTop: "4px", fontSize: "12px", color: "#b45309" }}>
                      💡 Fix: {warning.suggested_fix}
                    </div>
                  )}
                </div>
              </div>
              {warning.type === "weather" && onFixWeather && (
                <button
                  type="button"
                  onClick={onFixWeather}
                  style={{
                    background: "#d97706",
                    color: "white",
                    padding: "4px 10px",
                    fontSize: "11px",
                    fontWeight: "600",
                    whiteSpace: "nowrap"
                  }}
                >
                  Replan Weather Risk
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
