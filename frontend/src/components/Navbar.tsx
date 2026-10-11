import React, { useState } from "react";
import { Compass, BarChart2, ShieldCheck, Link2, X, Check } from "lucide-react";
import { getApiBaseUrl, setApiBaseUrl } from "../services/api";

interface NavbarProps {
  onOpenBenchmark: () => void;
  backendOnline: boolean;
  onRefreshHealth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenBenchmark, backendOnline, onRefreshHealth }) => {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [urlInput, setUrlInput] = useState(getApiBaseUrl());

  const handleSaveUrl = () => {
    setApiBaseUrl(urlInput);
    setIsConfigOpen(false);
    onRefreshHealth();
  };

  return (
    <>
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

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* Backend Status / Connector Button */}
          <button
            type="button"
            onClick={() => setIsConfigOpen(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 14px",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: "600",
              backgroundColor: backendOnline ? "#ecfdf5" : "#fffbeb",
              color: backendOnline ? "#059669" : "#b45309",
              border: `1px solid ${backendOnline ? "#a7f3d0" : "#fde68a"}`
            }}
            title="Click to configure Render backend URL"
          >
            <span style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: backendOnline ? "#10b981" : "#f59e0b",
              display: "inline-block"
            }} />
            {backendOnline ? "Backend Connected" : "⚡ Connect Backend"}
          </button>

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
            OR-Tools Active
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
          >
            <BarChart2 size={16} />
            Research Benchmark
          </button>
        </div>
      </header>

      {/* Backend URL Config Modal */}
      {isConfigOpen && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(15, 23, 42, 0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "20px"
        }}>
          <div style={{
            background: "white",
            borderRadius: "12px",
            width: "100%",
            maxWidth: "500px",
            padding: "24px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.15)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Link2 size={20} color="#2563eb" />
                <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a" }}>
                  Connect Cloud Backend (Render)
                </h3>
              </div>
              <button onClick={() => setIsConfigOpen(false)} style={{ background: "transparent", color: "#64748b" }}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "14px", lineHeight: "1.5" }}>
              Paste your live <strong>Render backend URL</strong> below so the website can communicate with your cloud optimization server:
            </p>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "6px" }}>
                Backend URL (e.g. https://nexora-backend.onrender.com)
              </label>
              <input
                type="url"
                placeholder="https://nexora-backend-xxxx.onrender.com"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                style={{ width: "100%", fontSize: "13px" }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setIsConfigOpen(false)}
                style={{ background: "#f1f5f9", color: "#475569", padding: "8px 16px" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveUrl}
                style={{ background: "#2563eb", color: "white", padding: "8px 18px", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}
              >
                <Check size={16} /> Save & Connect
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
