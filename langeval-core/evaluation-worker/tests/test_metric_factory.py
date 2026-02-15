import sys
import os
import pytest
from unittest.mock import MagicMock

# Set dummy API key for deepeval init
os.environ["OPENAI_API_KEY"] = "sk-placeholder-key-for-testing"

# Add app directory to sys.path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.services.evaluator import MetricFactory
from deepeval.metrics import GEval, TaskCompletionMetric, AnswerRelevancyMetric

def test_create_rag_metrics():
    metric = MetricFactory.create_metric("answer_relevancy")
    assert isinstance(metric, AnswerRelevancyMetric)
    assert metric.threshold == 0.5 

def test_create_agentic_metrics():
    metric = MetricFactory.create_metric("task_completion", {"threshold": 0.8})
    assert isinstance(metric, TaskCompletionMetric)
    assert metric.threshold == 0.8

def test_create_geval_metrics():
    # Test Tool Correctness (which might use GEval fallback)
    metric = MetricFactory.create_metric("tool_correctness")
    # Even if it's GEval, it should be created
    assert metric is not None
    if isinstance(metric, GEval):
        assert metric.name == "Tool Correctness"

    # Test Plan Adherence
    metric = MetricFactory.create_metric("plan_adherence")
    assert isinstance(metric, GEval)
    assert metric.name == "Plan Adherence"

def test_create_safety_metrics():
    # Test Non-Advice
    metric = MetricFactory.create_metric("non_advice")
    assert isinstance(metric, GEval)
    assert metric.name == "Non-Advice"

def test_custom_metric():
    config = {
        "name": "My Custom Metric",
        "criteria": "Check if cool."
    }
    metric = MetricFactory.create_metric("g_eval", config)
    assert isinstance(metric, GEval)
    assert metric.name == "My Custom Metric"
    assert metric.criteria == "Check if cool."

def test_unknown_metric():
    metric = MetricFactory.create_metric("unknown_metric_id")
    assert metric is None
