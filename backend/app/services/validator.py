from typing import List, Dict, Any
from app.schemas.trip import DayPlan, ValidationIssue, ValidationResult
from app.services.scheduler import parse_time_str_to_minutes

class ItineraryValidator:
    """
    Dedicated multi-constraint validator inspecting:
    1. Overlaps
    2. Opening / closing hour adherence
    3. Transit buffer feasibility
    4. Budget adherence
    5. Daily schedule fatigue / pacing
    6. Weather risks
    """
    def validate(
        self,
        days: List[DayPlan],
        target_budget: float,
        total_estimated_cost: float,
        walking_tolerance: str = "moderate"
    ) -> ValidationResult:
        issues: List[ValidationIssue] = []
        warnings: List[ValidationIssue] = []

        # 1. Budget Check
        if total_estimated_cost > target_budget:
            overflow = total_estimated_cost - target_budget
            issues.append(ValidationIssue(
                type="budget",
                severity="critical",
                message=f"Total cost (₹{int(total_estimated_cost):,}) exceeds budget by ₹{int(overflow):,}.",
                suggested_fix="Swap premium activities with free beaches, heritage walks, or public museums."
            ))

        # Check each day
        for day_plan in days:
            day_num = day_plan.day
            activities = day_plan.activities

            # 2. Activity count / Fatigue check
            if len(activities) > 5 and walking_tolerance == "low":
                warnings.append(ValidationIssue(
                    type="fatigue",
                    severity="warning",
                    day=day_num,
                    message=f"Day {day_num} has {len(activities)} activities, which may be exhausting for low walking tolerance.",
                    suggested_fix="Trim day to 3-4 activities to maintain relaxed pace."
                ))

            # 3. Time sequencing, overlaps, and opening hours
            for i, act in enumerate(activities):
                s_min = parse_time_str_to_minutes(act.start_time)
                e_min = parse_time_str_to_minutes(act.end_time)
                place = act.place

                # Duration check
                if e_min <= s_min:
                    issues.append(ValidationIssue(
                        type="timing",
                        severity="critical",
                        day=day_num,
                        place_name=place.name,
                        message=f"Invalid duration: {place.name} ends ({act.end_time}) before or at start ({act.start_time})."
                    ))

                # Opening hours check
                open_min = parse_time_str_to_minutes(place.opening_time)
                close_min = parse_time_str_to_minutes(place.closing_time)

                if s_min < open_min - 5: # allow 5 min margin
                    issues.append(ValidationIssue(
                        type="opening_hours",
                        severity="critical",
                        day=day_num,
                        place_name=place.name,
                        message=f"{place.name} is scheduled at {act.start_time}, but opens at {place.opening_time}.",
                        suggested_fix=f"Reschedule after {place.opening_time}."
                    ))

                if e_min > close_min + 5:
                    issues.append(ValidationIssue(
                        type="opening_hours",
                        severity="critical",
                        day=day_num,
                        place_name=place.name,
                        message=f"{place.name} closes at {place.closing_time}, but activity ends at {act.end_time}.",
                        suggested_fix=f"Conclude activity before {place.closing_time}."
                    ))

                # Overlap with previous activity
                if i > 0:
                    prev_act = activities[i-1]
                    prev_e_min = parse_time_str_to_minutes(prev_act.end_time)
                    if s_min < prev_e_min:
                        issues.append(ValidationIssue(
                            type="overlap",
                            severity="critical",
                            day=day_num,
                            place_name=place.name,
                            message=f"Schedule clash: {place.name} starts at {act.start_time} before {prev_act.place.name} ends at {prev_act.end_time}."
                        ))
                    elif s_min < prev_e_min + act.travel_time - 5:
                        warnings.append(ValidationIssue(
                            type="travel_buffer",
                            severity="warning",
                            day=day_num,
                            place_name=place.name,
                            message=f"Tight transit window between {prev_act.place.name} and {place.name} ({act.travel_time}m travel required)."
                        ))

            # 4. Weather Risk Check for the day
            forecast = day_plan.weather_forecast
            if forecast:
                rain_prob = forecast.get("precipitation_probability", 0)
                if rain_prob >= 60:
                    for act in activities:
                        if act.place.weather_sensitivity == "high":
                            warnings.append(ValidationIssue(
                                type="weather",
                                severity="warning",
                                day=day_num,
                                place_name=act.place.name,
                                message=f"Rain risk: {act.place.name} ({act.place.category}) is sensitive to heavy rain ({rain_prob}% forecasted).",
                                suggested_fix="Consider replacing with an indoor museum, art gallery, or spice farm hall."
                            ))

        # Overall validity
        is_valid = len(issues) == 0
        penalty = (len(issues) * 0.25) + (len(warnings) * 0.05)
        score = max(0.0, round(1.0 - penalty, 2))

        return ValidationResult(
            valid=is_valid,
            score=score,
            issues=issues,
            warnings=warnings,
            summary={
                "total_issues": len(issues),
                "total_warnings": len(warnings),
                "checks_passed": {
                    "budget": not any(i.type == "budget" for i in issues),
                    "opening_hours": not any(i.type == "opening_hours" for i in issues),
                    "no_overlaps": not any(i.type == "overlap" for i in issues),
                    "weather_resilience": not any(w.type == "weather" for w in warnings)
                }
            }
        )

itinerary_validator = ItineraryValidator()
