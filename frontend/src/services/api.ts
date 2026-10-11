import { Itinerary, TripRequestParams } from "../types";

export function getApiBaseUrl(): string {
  const custom = typeof window !== "undefined" ? localStorage.getItem("nexora_api_url") : null;
  if (custom && custom.trim()) {
    return custom.trim().replace(/\/$/, "");
  }
  const envUrl = (import.meta as any).env?.VITE_API_BASE_URL || "";
  return envUrl.trim().replace(/\/$/, "");
}

export function setApiBaseUrl(url: string) {
  if (typeof window !== "undefined") {
    if (url && url.trim()) {
      localStorage.setItem("nexora_api_url", url.trim().replace(/\/$/, ""));
    } else {
      localStorage.removeItem("nexora_api_url");
    }
  }
}

export async function checkHealth() {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/health`, { signal: AbortSignal.timeout(6000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function parseTripQuery(query: string) {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/trips/parse`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error("Failed to parse query");
  return res.json();
}

export async function generateItinerary(params: TripRequestParams): Promise<Itinerary> {
  const baseUrl = getApiBaseUrl();
  try {
    const res = await fetch(`${baseUrl}/trips/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const errorText = await res.text().catch(() => "");
      throw new Error(`Server returned HTTP ${res.status}: ${errorText.slice(0, 100)}`);
    }
    return await res.json();
  } catch (err: any) {
    if (!baseUrl && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
      throw new Error(
        "Backend cloud URL is not set yet! Click the '⚡ Connect Backend' button in the top navigation bar and paste your Render URL (e.g. https://nexora-backend.onrender.com)."
      );
    }
    throw err;
  }
}

export async function triggerReplan(payload: {
  itinerary: Itinerary;
  event_type: string;
  day: number;
  affected_activity: string;
  reason: string;
  new_budget?: number;
}) {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/trips/replan-live`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      itinerary: payload.itinerary,
      request: {
        event_type: payload.event_type,
        day: payload.day,
        affected_activity: payload.affected_activity,
        reason: payload.reason,
        new_budget: payload.new_budget,
      },
    }),
  });
  if (!res.ok) throw new Error("Replanning failed");
  return res.json();
}

export async function triggerSimulation(payload: {
  itinerary: Itinerary;
  scenario_type: string;
  day: number;
  affected_activity?: string;
  budget_delta?: number;
  weather_condition?: string;
}) {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/trips/simulate-live`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      itinerary: payload.itinerary,
      request: {
        scenario_type: payload.scenario_type,
        day: payload.day,
        affected_activity: payload.affected_activity,
        budget_delta: payload.budget_delta,
        weather_condition: payload.weather_condition,
      },
    }),
  });
  if (!res.ok) throw new Error("Simulation failed");
  return res.json();
}

export async function fetchResearchBenchmark() {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/evaluation/benchmark`);
  if (!res.ok) throw new Error("Failed to fetch benchmark");
  return res.json();
}
