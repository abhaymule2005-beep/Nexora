import React, { useState, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { TripForm } from "./components/TripForm";
import { ItineraryDashboard } from "./components/ItineraryDashboard";
import { ReplanningModal } from "./components/ReplanningModal";
import { BenchmarkModal } from "./components/BenchmarkModal";
import { Itinerary, TripRequestParams } from "./types";
import { checkHealth, generateItinerary } from "./services/api";
import { Sparkles, ArrowLeft } from "lucide-react";

export function App() {
  const [backendOnline, setBackendOnline] = useState(false);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isReplanningOpen, setIsReplanningOpen] = useState(false);
  const [isBenchmarkOpen, setIsBenchmarkOpen] = useState(false);

  // Probe backend on mount
  const refreshHealth = () => {
    checkHealth()
      .then((data) => setBackendOnline(data.status === "ok"))
      .catch(() => setBackendOnline(false));
  };

  useEffect(() => {
    refreshHealth();
  }, []);

  const handleGenerate = async (params: TripRequestParams) => {
    setIsLoading(true);
    try {
      const generated = await generateItinerary(params);
      setItinerary(generated);
    } catch (err: any) {
      alert("Error generating itinerary: " + (err.message || err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyUpdatedItinerary = (updated: Itinerary) => {
    setItinerary(updated);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar
        backendOnline={backendOnline}
        onOpenBenchmark={() => setIsBenchmarkOpen(true)}
        onRefreshHealth={refreshHealth}
      />

      <main style={{ flex: 1, maxWidth: "1280px", margin: "0 auto", padding: "32px 24px", width: "100%" }}>
        {!itinerary ? (
          <div>
            {/* Hero Section */}
            <div style={{ textAlign: "center", marginBottom: "36px" }}>
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 14px",
                borderRadius: "20px",
                background: "#eff6ff",
                color: "#2563eb",
                fontSize: "13px",
                fontWeight: "600",
                marginBottom: "14px"
              }}>
                <Sparkles size={14} />
                Understand → Recommend → Optimize → Validate → Replan
              </div>
              <h2 style={{ fontSize: "36px", fontWeight: "800", color: "#0f172a", letterSpacing: "-1px", marginBottom: "12px" }}>
                Intelligent Personalized Travel Planning
              </h2>
              <p style={{ fontSize: "16px", color: "var(--text-muted)", maxWidth: "650px", margin: "0 auto" }}>
                Generate constraint-optimized daily itineraries with Google OR-Tools, 2-opt route minimization,
                Open-Meteo weather integration, and dynamic minimal-change replanning.
              </p>
            </div>

            <TripForm onGenerate={handleGenerate} isLoading={isLoading} />
          </div>
        ) : (
          <div>
            {/* Controls Bar */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "24px"
            }}>
              <button
                onClick={() => setItinerary(null)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "white",
                  border: "1px solid var(--border)",
                  color: "#475569",
                  padding: "8px 16px",
                  fontSize: "13px",
                  fontWeight: "600"
                }}
              >
                <ArrowLeft size={16} /> Plan Another Trip
              </button>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => setIsReplanningOpen(true)}
                  style={{
                    background: "#2563eb",
                    color: "white",
                    padding: "8px 18px",
                    fontSize: "13px",
                    fontWeight: "600",
                    boxShadow: "0 2px 6px rgba(37,99,235,0.25)"
                  }}
                >
                  ⚡ Simulate Disruption / Replan
                </button>
              </div>
            </div>

            <ItineraryDashboard
              itinerary={itinerary}
              onOpenReplanning={() => setIsReplanningOpen(true)}
            />
          </div>
        )}
      </main>

      {/* Dynamic Replanning Modal */}
      {itinerary && (
        <ReplanningModal
          itinerary={itinerary}
          isOpen={isReplanningOpen}
          onClose={() => setIsReplanningOpen(false)}
          onApplyUpdatedItinerary={handleApplyUpdatedItinerary}
        />
      )}

      {/* Research Benchmark Modal */}
      <BenchmarkModal
        isOpen={isBenchmarkOpen}
        onClose={() => setIsBenchmarkOpen(false)}
      />

      {/* Footer */}
      <footer style={{
        textAlign: "center",
        padding: "20px",
        borderTop: "1px solid var(--border)",
        background: "white",
        fontSize: "13px",
        color: "var(--text-muted)"
      }}>
        Nexora AI Travel Planning Engine • Final-Year Research Project • 100% Offline / Zero Paid Dependency Capable
      </footer>
    </div>
  );
}

export default App;
