import random
import clickhouse_connect
from datetime import datetime, timedelta
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class DashboardService:
    def __init__(self):
        self.client = None
        try:
            self.client = clickhouse_connect.get_client(
                host=settings.CLICKHOUSE_HOST,
                port=settings.CLICKHOUSE_PORT,
                username=settings.CLICKHOUSE_USER,
                password=settings.CLICKHOUSE_PASSWORD,
                connect_timeout=2
            )
        except Exception as e:
            logger.warning(f"Could not connect to ClickHouse: {e}. Using Mock Data.")
            self.client = None

    def get_summary_stats(self):
        """
        Return high-level stats: Total Evals, Avg Score, 24h Growth.
        """
        if self.client:
            try:
                # Query Real Data from 'evaluation_logs' or similar table if exists
                # For now, we assume table 'trace_events' exists or we use mock if table missing
                # Placeholder logic for real query:
                # result = self.client.query("SELECT count(*), avg(score) FROM evaluation_results")
                pass
            except Exception:
                pass

        # Mock Data (Robust Fallback)
        return {
            "total_evaluations": 12543,
            "avg_score": 0.85,
            "failure_rate": 0.12,
            "active_agents": 5,
            "trends": {
                "eval_growth": "+15%",
                "score_growth": "+2.3%"
            }
        }

    def get_trend_data(self, days: int = 7):
        """
        Return daily average scores for chart.
        """
        labels = []
        scores = []
        
        today = datetime.now()
        for i in range(days):
            date = today - timedelta(days=days-1-i)
            labels.append(date.strftime("%Y-%m-%d"))
            # Random trend slightly increasing
            base_score = 0.75 + (i * 0.01) + random.uniform(-0.05, 0.05)
            scores.append(round(min(1.0, max(0.0, base_score)), 2))
            
        return {
            "labels": labels,
            "datasets": [
                {
                    "label": "Average Faithfulness",
                    "data": scores,
                    "borderColor": "rgb(75, 192, 192)",
                    "tension": 0.1
                }
            ]
        }
    
    def get_metric_breakdown(self):
        return [
            {"name": "Faithfulness", "score": 0.88},
            {"name": "Answer Relevancy", "score": 0.92},
            {"name": "Contextual Precision", "score": 0.76},
            {"name": "Toxicity", "score": 0.01}, # Low is good, handle inversion in UI
            {"name": "Bias", "score": 0.02}
        ]
