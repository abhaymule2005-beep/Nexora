from typing import List, Dict, Any, Tuple
from app.models.entities import Place

class BudgetEngine:
    """
    Tracks and validates travel expenses:
    - Activity ticket costs
    - Meal expenses (₹500 - ₹800 per person per day)
    - Transit fuel / cab costs (approx ₹25 per km)
    """
    def calculate_budget(
        self,
        places: List[Place],
        total_distance_km: float,
        days: int,
        travelers: int,
        target_budget: float
    ) -> Dict[str, Any]:
        activity_cost = sum(p.cost for p in places) * travelers
        
        # Estimate meal cost
        daily_meal_per_person = 650.0
        food_cost = daily_meal_per_person * travelers * days
        
        # Transit cost estimate
        transit_cost = total_distance_km * 25.0 # cab / fuel estimate
        
        total_estimated_cost = round(activity_cost + food_cost + transit_cost, 2)
        remaining_budget = round(target_budget - total_estimated_cost, 2)
        is_exceeded = total_estimated_cost > target_budget
        
        status = "Within budget" if not is_exceeded else f"Budget exceeded by ₹{int(abs(remaining_budget)):,}"
        
        return {
            "target_budget": target_budget,
            "total_estimated_cost": total_estimated_cost,
            "remaining_budget": remaining_budget,
            "is_exceeded": is_exceeded,
            "status": status,
            "breakdown": {
                "activity_tickets": round(activity_cost, 2),
                "estimated_food": round(food_cost, 2),
                "estimated_transit": round(transit_cost, 2)
            },
            "cost_per_day": round(total_estimated_cost / max(days, 1), 2)
        }

budget_engine = BudgetEngine()
