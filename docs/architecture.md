# Nexora System Architecture

## Architectural Principles
1. **Separation of Concerns**:
   - **LLM / NLP Parser**: Extracts unstructured requests into verified parameters. Does not bypass constraints or hallucinate schedules.
   - **Recommendation Engine**: Content-based and semantic hybrid ranking.
   - **OR-Tools Constraint Scheduler**: Guarantees no overlaps, valid opening hours, and lunch breaks.
   - **Route Optimizer**: Employs 2-Opt local search TSP to eliminate geographic backtracking.
   - **Validator**: Multi-constraint feasibility inspector.
   - **Replanner**: Minimal-change repair freezing unaffected days.

## Data Flow Diagram

```text
Natural Language Query ("5 days in Goa with parents...")
               │
               ▼
   [NLP Extraction Layer]
  (LLM or Regex/Heuristic Fallback)
               │
               ▼
     [Parsed Trip Schema]
 (Destination, Days, Budget, Pace, Interests)
               │
               ▼
   [Hybrid Recommender]
 (RuleBasedRanker + Semantic TF-IDF Ranker)
               │
               ▼
   [OR-Tools CP-SAT Scheduler]
  (Opening hours, lunch buffer, durations)
               │
               ▼
   [2-Opt Route Optimizer]
 (Haversine geodesic distance minimization)
               │
               ▼
   [Open-Meteo Weather & Risk]
               │
               ▼
    [Itinerary Validator]
               │
               ▼
     [Generated Itinerary]
               │
        (Disruption Occurs)
               ▼
  [Dynamic Minimal-Change Replanner]
 (Freeze Days 1, 3, 4, 5 -> Repair Day 2 -> Re-validate)
```
