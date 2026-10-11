from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.services.evaluation import evaluation_engine

router = APIRouter(prefix="/evaluation", tags=["Research Evaluation"])

@router.get("/benchmark")
def get_benchmark_results(db: Session = Depends(get_db)):
    """
    Executes live scientific benchmark evaluating Precision@K, NDCG,
    Route distance savings, and comparison against Baseline A (Greedy)
    and Baseline B (Pure Rec).
    """
    return evaluation_engine.run_benchmark(db)
