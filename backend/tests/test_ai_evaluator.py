"""Unit tests for the AI Essay Evaluation Engine."""
import pytest
from app.services.ai_evaluator import evaluate_essay


def test_empty_essay_returns_zero_score():
    result = evaluate_essay(
        question_content="Discuss microservice architecture trade-offs.",
        candidate_essay="",
        points=25.0,
        min_words=100,
    )
    assert result["score"] == 0.0
    assert result["percentage"] == 0.0
    assert "No response" in result["feedback"]
    assert len(result["weaknesses"]) > 0


def test_short_essay_below_min_words_receives_penalty():
    short_text = "Microservices are good because they are small."
    result = evaluate_essay(
        question_content="Discuss microservice architecture trade-offs.",
        candidate_essay=short_text,
        points=20.0,
        min_words=100,
        max_words=300,
        tags=["microservices", "docker"],
    )
    assert result["score"] < 12.0  # Penalized for being under length
    assert result["wordCount"] == len(short_text.split())
    assert any("below the minimum word count" in str(w) for w in result["weaknesses"])


def test_high_quality_essay_earns_high_score_and_strengths():
    essay = (
        "When evaluating a modular monolithic architecture versus an event-driven microservices design, "
        "several fundamental architectural trade-offs must be analyzed. Monolithic applications simplify deployment, "
        "monitoring, and transactional integrity via local database ACID properties. However, as organizations grow, "
        "event-driven microservices offer independent deployment and horizontal scalability at the cost of operational overhead. "
        "Managing data consistency across distributed boundaries necessitates adopting the Saga pattern and eventual consistency "
        "as dictated by the CAP theorem. Consequently, teams must weigh deployment complexity against high throughput and availability."
    )
    result = evaluate_essay(
        question_content="Discuss the architectural trade-offs between a modular monolith and event-driven microservices. Highlight CAP theorem, Saga pattern, and deployment complexity.",
        candidate_essay=essay,
        points=30.0,
        min_words=50,
        max_words=200,
        rubric="Evaluate understanding of CAP theorem, Saga pattern, ACID transactions, and deployment complexity.",
        tags=["monolith", "microservices", "saga", "cap"],
    )
    assert result["score"] >= 24.0  # High score
    assert result["percentage"] >= 80.0
    assert result["technicalAccuracy"] in ("High", "Medium")
    assert len(result["strengths"]) >= 2
    assert any(len(s) > 10 for s in result["strengths"])
