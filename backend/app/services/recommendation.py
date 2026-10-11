import math
from typing import List, Dict, Any, Tuple
from app.models.entities import Place
from app.schemas.trip import TripRequest, RecommendationItem, PlaceResponse
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

class BaseRanker:
    def rank(self, places: List[Place], request: TripRequest) -> List[Tuple[Place, float, List[str]]]:
        raise NotImplementedError

class RuleBasedRanker(BaseRanker):
    """
    Multi-attribute content-based scoring combining:
    - Interest match (category & tags)
    - Rating score
    - Walking tolerance match
    - Budget / cost suitability
    """
    def rank(self, places: List[Place], request: TripRequest) -> List[Tuple[Place, float, List[str]]]:
        scored_places = []
        user_interests = [i.strip().lower() for i in request.interests]
        user_walking = request.walking_tolerance.lower()
        
        # Per-day estimated budget allocation for activities
        daily_activity_budget = (request.budget * 0.4) / max(request.days, 1)

        for place in places:
            score = 0.0
            reasons = []

            # 1. Category / Interest Matching (Weight: 0.40)
            category_lower = place.category.lower()
            tags_list = [t.strip().lower() for t in (place.tags or "").split(",") if t.strip()]
            
            category_match = False
            for interest in user_interests:
                if interest in category_lower or any(interest in tag for tag in tags_list):
                    category_match = True
                    break
            
            if category_match:
                score += 0.40
                reasons.append(f"Matches your interest in {place.category}")
            else:
                score += 0.15 # Baseline candidate diversity

            # 2. Rating Score (Weight: 0.25)
            # Normalize 3.5 - 5.0 rating scale
            norm_rating = max(0.0, min(1.0, (place.rating - 3.0) / 2.0))
            score += 0.25 * norm_rating
            if place.rating >= 4.5:
                reasons.append(f"Highly rated attraction ({place.rating}/5)")

            # 3. Walking Tolerance Match (Weight: 0.20)
            place_walking = (place.walking_level or "moderate").lower()
            if user_walking == "low":
                if place_walking == "low":
                    score += 0.20
                    reasons.append("Low walking requirement fits your preference")
                elif place_walking == "moderate":
                    score += 0.10
                else: # high walking
                    score += 0.02
            elif user_walking == "moderate":
                if place_walking in ["low", "moderate"]:
                    score += 0.20
                else:
                    score += 0.10
            else: # high walking tolerance
                score += 0.20 # Enjoys all levels
                if place_walking == "high":
                    reasons.append("Great for active exploration")

            # 4. Cost Suitability (Weight: 0.15)
            if place.cost == 0:
                score += 0.15
                reasons.append("Free admission — budget friendly")
            elif place.cost <= daily_activity_budget:
                score += 0.12
                reasons.append(f"Affordable cost (₹{int(place.cost)}) within budget")
            else:
                score += 0.05

            scored_places.append((place, score, reasons))

        scored_places.sort(key=lambda x: x[1], reverse=True)
        return scored_places


class SemanticRanker(BaseRanker):
    """
    Semantic text ranker using TF-IDF and cosine similarity
    as a robust, fast offline NLP similarity ranker with SentenceTransformer compatibility.
    """
    def rank(self, places: List[Place], request: TripRequest) -> List[Tuple[Place, float, List[str]]]:
        if not places:
            return []

        # Construct query corpus
        query_text = f"{' '.join(request.interests)} {request.travel_style} {request.walking_tolerance} {request.natural_language_query or ''}"
        
        place_descriptions = [
            f"{p.name} {p.category} {p.description} {p.tags}" for p in places
        ]
        
        corpus = [query_text] + place_descriptions
        vectorizer = TfidfVectorizer(stop_words="english")
        
        try:
            tfidf_matrix = vectorizer.fit_transform(corpus)
            cosine_scores = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten()
        except Exception:
            cosine_scores = [0.5] * len(places)

        scored = []
        for place, sim in zip(places, cosine_scores):
            reasons = []
            if sim > 0.2:
                reasons.append(f"Semantic match to your trip vibe ({int(sim * 100)}% relevance)")
            scored.append((place, float(sim), reasons))

        scored.sort(key=lambda x: x[1], reverse=True)
        return scored


class RecommendationEngine:
    """
    Hybrid recommendation engine combining rule-based heuristics
    with semantic vector similarity.
    """
    def __init__(self):
        self.rule_ranker = RuleBasedRanker()
        self.semantic_ranker = SemanticRanker()

    def get_recommendations(
        self, places: List[Place], request: TripRequest, top_k: int = 20
    ) -> List[RecommendationItem]:
        rule_results = {p.id: (score, reasons) for p, score, reasons in self.rule_ranker.rank(places, request)}
        semantic_results = {p.id: (score, reasons) for p, score, reasons in self.semantic_ranker.rank(places, request)}

        combined = []
        for place in places:
            rule_score, rule_reasons = rule_results.get(place.id, (0.5, []))
            sem_score, sem_reasons = semantic_results.get(place.id, (0.0, []))

            # Hybrid score: 70% rule-based (constraints, category, walking, budget), 30% semantic
            final_score = (rule_score * 0.70) + (sem_score * 0.30)
            
            # Combine unique reasons
            reasons = []
            seen = set()
            for r in rule_reasons + sem_reasons:
                if r not in seen:
                    reasons.append(r)
                    seen.add(r)
            if not reasons:
                reasons.append(f"Popular {place.category} in {place.destination}")

            combined.append((place, final_score, reasons))

        combined.sort(key=lambda x: x[1], reverse=True)
        
        output = []
        for place, score, reasons in combined[:top_k]:
            output.append(
                RecommendationItem(
                    place=PlaceResponse.from_orm(place),
                    score=round(score, 3),
                    reasons=reasons[:3]
                )
            )
        return output

recommendation_engine = RecommendationEngine()
