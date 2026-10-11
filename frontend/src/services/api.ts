import { Itinerary, TripRequestParams } from "../types";

// When empty, calls go through the Vite reverse proxy (/trips, /places, etc.)
// which works seamlessly for both localhost and public tunnels!
const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || "";

export async function checkHealth() {
  const res = await fetch(`${API_BASE_URL}/health`);
  return res.json();
}

export async function parseTripQuery(query: string) {
  const res = await fetch(`${API_BASE_URL}/trips/parse`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error("Failed to parse query");
  return res.json();
}

export async function generateItinerary(params: TripRequestParams): Promise<Itinerary> {
  const res = await fetch(`${API_BASE_URL}/trips/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error("Failed to generate itinerary");
  return res.json();
}

export async function triggerReplan(payload: {
  itinerary: Itinerary;
  event_type: string;
  day: number;
  affected_activity: string;
  reason: string;
  new_budget?: number;
}) {
  const res = await fetch(`${API_BASE_URL}/trips/replan-live`, {
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
  const res = await fetch(`${API_BASE_URL}/trips/simulate-live`, {
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
  const res = await fetch(`${API_BASE_URL}/evaluation/benchmark`);
  if (!res.ok) throw new Error("Failed to fetch benchmark");
  return res.json();
}
