"""
AI Essay & Technical Writing Evaluator.

Supports:
1. Google Gemini Flash API (100% Free Tier: 1,500 free requests/day) when GEMINI_API_KEY is configured.
2. High-performance offline rubric & concept analysis engine (100% Free, zero config / offline) as fallback.
"""
from __future__ import annotations

import json
import logging
import os
import re
from typing import Any, Dict, List, Optional

import httpx

from app.core.config import settings

logger = logging.getLogger("nexus.ai_evaluator")

_LOGICAL_CONNECTORS = {
    "however", "therefore", "furthermore", "consequently", "in contrast",
    "on the other hand", "alternatively", "specifically", "trade-off",
    "advantage", "disadvantage", "bottleneck", "scalability", "architecture",
    "consistency", "availability", "partition", "latency", "throughput",
}


def evaluate_essay(
    question_content: str,
    candidate_essay: str,
    points: float = 20.0,
    min_words: Optional[int] = 100,
    max_words: Optional[int] = 1000,
    rubric: Optional[str] = "",
    tags: Optional[List[str]] = None,
    api_key: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Evaluates a candidate's written essay against technical rubrics and constraints.
    Returns structured feedback with scores, strengths, and areas for improvement.
    """
    max_pts = float(points or 20.0)
    essay = (candidate_essay or "").strip()
    min_w = int(min_words or 100)
    max_w = int(max_words or 1000)
    tag_list = [str(t).strip() for t in (tags or []) if t]

    if not essay:
        return {
            "score": 0.0,
            "maxScore": max_pts,
            "percentage": 0.0,
            "wordCount": 0,
            "feedback": "No response was submitted by the candidate.",
            "strengths": [],
            "weaknesses": ["The question was left unanswered."],
            "technicalAccuracy": "None",
            "reasoningDepth": "None",
            "engine": "none",
        }

    key = api_key or getattr(settings, "GEMINI_API_KEY", "") or os.getenv("GEMINI_API_KEY", "")
    if key and len(key) > 10:
        try:
            gemini_result = _evaluate_with_gemini(
                api_key=key,
                prompt=question_content,
                essay=essay,
                max_points=max_pts,
                rubric=rubric or "",
                min_words=min_w,
                max_words=max_w,
            )
            if gemini_result is not None:
                return gemini_result
        except Exception as exc:
            logger.warning("Gemini evaluation error, using offline heuristic fallback: %s", exc)

    # Use offline heuristic rubric engine
    return _evaluate_offline_rubric(
        question_content=question_content,
        essay=essay,
        max_points=max_pts,
        rubric=rubric or "",
        min_words=min_w,
        max_words=max_w,
        tags=tag_list,
    )


def _evaluate_with_gemini(
    api_key: str,
    prompt: str,
    essay: str,
    max_points: float,
    rubric: str,
    min_words: int,
    max_words: int,
) -> Optional[Dict[str, Any]]:
    candidate_models = [
        getattr(settings, "AI_MODEL", "gemini-3.5-flash-lite"),
        "gemini-3.5-flash-lite",
        "gemini-3.8-flash",
        "gemini-flash-latest",
    ]
    seen = set()
    models = [m for m in candidate_models if m and not (m in seen or seen.add(m))]

    system_instruction = (
        "You are an expert technical interviewer evaluating a candidate's written technical response. "
        "Score objectively based on technical correctness, conceptual depth, trade-off understanding, and constraints. "
        "Output ONLY valid JSON matching this schema: "
        "{\"score\": <float between 0 and max_points>, \"percentage\": <float 0 to 100>, "
        "\"feedback\": \"<recruiter summary>\", \"strengths\": [\"<strength 1>\", ...], "
        "\"weaknesses\": [\"<weakness 1>\", ...], \"technicalAccuracy\": \"High\"|\"Medium\"|\"Low\", "
        "\"reasoningDepth\": \"Thorough\"|\"Satisfactory\"|\"Superficial\"}"
    )

    user_message = (
        f"QUESTION:\n{prompt}\n\n"
        f"RUBRIC / CRITERIA:\n{rubric or 'Evaluate technical depth, clarity, and architectural trade-offs.'}\n\n"
        f"CONSTRAINTS: Minimum words: {min_words}, Maximum words: {max_words}. Max points: {max_points}\n\n"
        f"CANDIDATE RESPONSE:\n{essay}\n"
    )

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": system_instruction + "\n\n" + user_message}
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.2,
            "responseMimeType": "application/json",
        },
    }

    with httpx.Client(timeout=18.0) as client:
        for model in models:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
            try:
                response = client.post(url, json=payload)
                if response.status_code == 200:
                    data = response.json()
                    candidates = data.get("candidates") or []
                    if candidates:
                        content_part = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                        parsed = json.loads(content_part)
                        raw_score = float(parsed.get("score", 0.0))
                        clamped_score = min(max_points, max(0.0, raw_score))
                        words = len(essay.split())
                        return {
                            "score": round(clamped_score, 2),
                            "maxScore": max_points,
                            "percentage": round((clamped_score / max_points) * 100, 1) if max_points else 0.0,
                            "wordCount": words,
                            "feedback": parsed.get("feedback", "AI evaluation completed."),
                            "strengths": parsed.get("strengths", []),
                            "weaknesses": parsed.get("weaknesses", []),
                            "technicalAccuracy": parsed.get("technicalAccuracy", "Medium"),
                            "reasoningDepth": parsed.get("reasoningDepth", "Satisfactory"),
                            "engine": f"google_{model}",
                        }
                logger.warning("Gemini model %s returned status %d: %s", model, response.status_code, response.text[:120])
            except Exception as e:
                logger.warning("Error with Gemini model %s: %s", model, e)
        return None


def _evaluate_offline_rubric(
    question_content: str,
    essay: str,
    max_points: float,
    rubric: str,
    min_words: int,
    max_words: int,
    tags: List[str],
) -> Dict[str, Any]:
    """Offline heuristic and concept density evaluation engine."""
    words = len(essay.split())
    text_lower = essay.lower()

    # 1. Word count constraint scoring
    if words < min_words:
        word_ratio = max(0.2, (words / min_words) * 0.7)
        length_note = f"Response is below the minimum word count ({words}/{min_words} words)."
    elif words > (max_words * 1.5):
        word_ratio = 0.85
        length_note = f"Response exceeds recommended word count ({words}/{max_words} words)."
    else:
        word_ratio = 1.0
        length_note = f"Word count ({words} words) meets the required guidelines."

    # 2. Concept & technical terminology extraction
    expected_concepts = set()
    for tag in tags:
        expected_concepts.add(tag.lower())

    # Extract keywords from rubric and prompt
    ref_text = f"{rubric} {question_content}".lower()
    for term in re.findall(r"\b[a-z]{4,}\b", ref_text):
        if term not in {"this", "that", "with", "from", "have", "discuss", "explain", "write", "about", "trade", "offs"}:
            expected_concepts.add(term)

    matched_concepts = []
    missing_concepts = []
    for concept in sorted(expected_concepts):
        if re.search(r"\b" + re.escape(concept) + r"\b", text_lower):
            matched_concepts.append(concept)
        elif len(missing_concepts) < 5:
            missing_concepts.append(concept)

    concept_ratio = (len(matched_concepts) / len(expected_concepts)) if expected_concepts else 0.8
    concept_ratio = min(1.0, max(0.25, concept_ratio))

    # 3. Reasoning & structural depth
    connectors_found = [c for c in _LOGICAL_CONNECTORS if c in text_lower]
    paragraphs = [p for p in essay.split("\n") if p.strip()]
    has_good_structure = len(paragraphs) >= 2 or words < 120

    structural_score = 0.6
    if len(connectors_found) >= 3:
        structural_score += 0.25
    if has_good_structure:
        structural_score += 0.15
    structural_score = min(1.0, structural_score)

    # 4. Final composite score
    composite = (0.35 * word_ratio) + (0.45 * concept_ratio) + (0.20 * structural_score)
    final_score = round(max_points * min(1.0, composite), 2)
    percentage = round((final_score / max_points) * 100, 1) if max_points else 0.0

    # 5. Build strengths & weaknesses
    strengths = []
    weaknesses = []

    if word_ratio >= 0.95:
        strengths.append(length_note)
    else:
        weaknesses.append(length_note)

    if matched_concepts:
        strengths.append(f"Demonstrated understanding of core concepts: {', '.join(matched_concepts[:4])}.")
    if missing_concepts:
        weaknesses.append(f"Could elaborate more on key topics: {', '.join(missing_concepts[:3])}.")

    if len(connectors_found) >= 2:
        strengths.append("Structured technical argumentation with clear logical progression.")
    else:
        weaknesses.append("Consider providing more comparative trade-off analysis.")

    accuracy = "High" if concept_ratio >= 0.75 else ("Medium" if concept_ratio >= 0.45 else "Low")
    depth = "Thorough" if structural_score >= 0.85 else ("Satisfactory" if structural_score >= 0.6 else "Superficial")

    feedback = (
        f"Evaluated candidate response ({words} words). "
        f"Technical concept coverage is {accuracy.lower()} with {depth.lower()} argumentation."
    )

    return {
        "score": final_score,
        "maxScore": max_points,
        "percentage": percentage,
        "wordCount": words,
        "feedback": feedback,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "technicalAccuracy": accuracy,
        "reasoningDepth": depth,
        "engine": "offline_rubric_engine",
    }
