export interface Place {
  id: number;
  name: string;
  destination: string;
  category: string;
  description: string;
  latitude: number;
  longitude: number;
  rating: number;
  cost: number;
  duration_minutes: number;
  opening_time: string;
  closing_time: string;
  walking_level: string;
  weather_sensitivity: string;
  tags: string;
}

export interface Activity {
  id?: number;
  day: number;
  order_index: number;
  start_time: string;
  end_time: string;
  travel_time: number;
  estimated_cost: number;
  reason: string;
  place: Place;
}

export interface DayPlan {
  day: number;
  date?: string;
  activities: Activity[];
  day_cost: number;
  day_distance_km: number;
  day_travel_minutes: number;
  weather_forecast?: {
    day: number;
    date: string;
    temp_max: number;
    temp_min: number;
    precipitation_probability: number;
    condition: string;
  };
}

export interface ValidationIssue {
  type: string;
  severity: "critical" | "warning" | "info";
  message: string;
  day?: number;
  place_name?: string;
  suggested_fix?: string;
}

export interface ValidationResult {
  valid: boolean;
  score: number;
  issues: ValidationIssue[];
  warnings: ValidationIssue[];
  summary?: {
    total_issues: number;
    total_warnings: number;
    checks_passed: {
      budget: boolean;
      opening_hours: boolean;
      no_overlaps: boolean;
      weather_resilience: boolean;
    };
  };
}

export interface Itinerary {
  id?: number;
  trip_id?: number;
  destination: string;
  days_count: number;
  total_cost: number;
  remaining_budget: number;
  budget_status: string;
  total_distance_km: number;
  total_travel_time_minutes: number;
  status: string;
  days: DayPlan[];
  validation?: ValidationResult;
  weather_summary?: any;
  metrics?: {
    budget_breakdown?: {
      activity_tickets: number;
      estimated_food: number;
      estimated_transit: number;
    };
    cost_per_day?: number;
    total_places?: number;
  };
}

export interface TripRequestParams {
  destination: string;
  days: number;
  budget: number;
  travelers: number;
  interests: string[];
  walking_tolerance: string;
  travel_style: string;
  natural_language_query?: string;
}
