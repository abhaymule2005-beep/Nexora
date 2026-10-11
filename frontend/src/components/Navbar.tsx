import React from "react";
import { Compass, BarChart2, ShieldCheck, Zap } from "lucide-react";

interface NavbarProps {
  onOpenBenchmark: () => void;
  backendOnline: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenBenchmark, backendOnline }) => {
  return (
    <header style={{
      background: "#ffffff",
      borderBottom: "1px solid var(--border)",
      padding: "16px 32px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      position: "sticky",
      top: 0,
      zIndex: 100,
      boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{
          background: "linear-gradient(135deg, #2563eb, #0ea5e9)",
          color: "white",
          padding: "10px",
          borderRadius: "12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 2px 8px rgba(37,99,235,0.3)"
        }}>
          <Compass size={26} />
        </div>
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: "700", color: "#0f172a", letterSpacing: "-0.5px" }}>
            NEXORA
          </h1>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "500" }}>
            AI Travel Planner & Dynamic Replanning System
          </p>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "6px 12px",
          borderRadius: "20px",
          fontSize: "12px",
          fontWeight: "600",
          backgroundColor: backendOnline ? "#ecfdf5" : "#fef2f2",
          color: backendOnline ? "#059669" : "#dc2626",
          border: `1px solid ${backendOnline ? "#a7f3d0" : "#fecaca"}`
        }}>
          <span style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            backgroundColor: backendOnline ? "#10b981" : "#ef4444",
            display: "inline-block"
          }} />
          {backendOnline ? "Core Engine Ready" : "Connecting..."}
        </div>

        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
          padding: "6px 12px",
          borderRadius: "20px",
          fontSize: "12px",
          fontWeight: "600",
          backgroundColor: "#f0fdf4",
          color: "#166534",
          border: "1px solid #bbf7d0"
        }}>
          <ShieldCheck size={14} />
          OR-Tools + Open-Meteo
        </div>

        <button
          onClick={onOpenBenchmark}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "#1e293b",
            color: "white",
            padding: "8px 16px",
            fontSize: "13px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = "#334155")}
          onMouseOut={(e) => (e.currentTarget.style.background = "#1e293b")}
        >
          <BarChart2 size={16} />
          Research Benchmark
        </button>
      </div>
    </header>
  );
};
