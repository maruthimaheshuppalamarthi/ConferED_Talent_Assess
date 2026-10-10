"""Seed demo recruiter data (questions, assessment, candidates, results) when tables are empty."""
from __future__ import annotations

import logging
from typing import Any, Dict, List

from sqlalchemy.orm import Session

from app.models.auth import (
    Assessment, AssessmentSection, AssessmentSectionQuestion, Candidate,
    CandidateResult, Job, Question, new_id, utcnow,
)

logger = logging.getLogger("nexus.recruiter_seed")

DEMO_PHOTO = (
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='150' "
    "viewBox='0 0 24 24' fill='%231e293b' stroke='%233b82f6' stroke-width='1.5'>"
    "<rect width='24' height='24' rx='3' fill='%230f172a'/><circle cx='12' cy='9' r='4'/>"
    "<path d='M5 20v-1a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v1'/></svg>"
)
DEMO_ID = (
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='150' "
    "viewBox='0 0 24 24' fill='%230f172a' stroke='%23a855f7' stroke-width='1.5'>"
    "<rect width='24' height='24' rx='3' fill='%230f172a'/>"
    "<rect x='3' y='4' width='18' height='16' rx='2' fill='%231e293b'/>"
    "<circle cx='8' cy='11' r='2.5'/><path d='M14 9h4m-4 4h4m-8 3h8'/></svg>"
)

QUESTIONS: List[Dict[str, Any]] = [
    {
        "id": "q-mcq-1", "type": "mcq", "title": "Python Memory Management",
        "content": "Which module in Python can be used to inspect memory allocation and reference counts?",
        "options": [
            {"id": "opt-1", "text": "sys"}, {"id": "opt-2", "text": "gc"},
            {"id": "opt-3", "text": "tracemalloc"}, {"id": "opt-4", "text": "All of the above"},
        ],
        "correct_answers": ["opt-4"], "difficulty": "medium", "points": 10,
        "category": "Python", "tags": ["Core Python", "Memory", "Performance"],
    },
    {
        "id": "q-sql-1", "type": "sql", "title": "Employee Department Salary Ranking",
        "content": "Write an SQL query to retrieve the top 2 highest paid employees in each department using Window Functions.",
        "difficulty": "hard", "points": 20, "category": "SQL Database",
        "tags": ["PostgreSQL", "Window Functions", "Analytics"],
        "sample_code": {"sql": "SELECT department_id, employee_id, salary FROM employees;"},
    },
    {
        "id": "q-coding-1", "type": "coding", "title": "Two Sum Variant: Maximum Subarray Product",
        "content": "Given an integer array `nums`, find a contiguous non-empty subarray with the largest product.",
        "difficulty": "medium", "points": 25, "category": "Algorithms",
        "tags": ["Dynamic Programming", "Array", "Algorithms"], "language": "python",
        "sample_code": {"python": "def max_product(nums):\n    return 0\n"},
        "test_cases": [
            {"id": "tc-1", "input": "[2,3,-2,4]", "expectedOutput": "6", "isHidden": False, "weight": 5},
            {"id": "tc-2", "input": "[-2,0,-1]", "expectedOutput": "0", "isHidden": True, "weight": 5},
        ],
    },
    {
        "id": "q-essay-1", "type": "essay", "title": "Microservice Architecture vs Monolith Design",
        "content": "Discuss the architectural trade-offs between a modular monolith and event-driven microservices.",
        "essay_min_words": 150, "essay_max_words": 500, "difficulty": "hard", "points": 20,
        "category": "System Design", "tags": ["Architecture", "Microservices", "Distributed Systems"],
    },
]

SECTIONS = [
    {"id": "sec-1", "name": "Technical MCQs & Aptitude", "description": "Core concepts.",
     "instructions": "Select the best answer.", "time_limit_minutes": 10, "passing_marks": 10,
     "question_ids": ["q-mcq-1"], "is_mandatory": True, "sort_order": 0},
    {"id": "sec-2", "name": "Database & SQL Engineering", "description": "SQL.",
     "instructions": "Write production-ready SQL.", "time_limit_minutes": 15, "passing_marks": 15,
     "question_ids": ["q-sql-1"], "is_mandatory": True, "sort_order": 1},
    {"id": "sec-3", "name": "Algorithmic Coding Challenge", "description": "DSA.",
     "instructions": "Write efficient code.", "time_limit_minutes": 20, "passing_marks": 20,
     "question_ids": ["q-coding-1"], "is_mandatory": True, "sort_order": 2},
    {"id": "sec-4", "name": "Architectural Essay", "description": "System design.",
     "instructions": "Minimum 150 words.", "time_limit_minutes": 15, "passing_marks": 15,
     "question_ids": ["q-essay-1"], "is_mandatory": False, "sort_order": 3},
]

CANDIDATES = [
    {"id": "cand-1", "name": "Alex Rivera", "email": "alex.rivera@example.com", "phone": "+1-555-0192",
     "experience_years": 6, "skills": ["Python", "FastAPI", "TypeScript", "PostgreSQL", "Docker"],
     "status": "Completed", "assessment_id": "assess-101", "invited_at": "2026-07-28",
     "otp_verified": True, "system_check_passed": True, "assessment_completed": True,
     "identity_status": "approved"},
    {"id": "cand-2", "name": "Priya Sharma", "email": "priya.sharma@example.com", "phone": "+91-98765-43210",
     "experience_years": 8, "skills": ["Java", "Spring Boot", "Microservices", "SQL", "Kubernetes"],
     "status": "Under Review", "assessment_id": "assess-101", "invited_at": "2026-07-29",
     "otp_verified": True, "system_check_passed": True, "assessment_completed": True,
     "identity_status": "approved"},
    {"id": "cand-3", "name": "Marcus Vance", "email": "marcus.vance@example.com", "phone": "+44-7700-900077",
     "experience_years": 4, "skills": ["React", "Node.js", "GraphQL", "Tailwind", "MongoDB"],
     "status": "Assessment Sent", "assessment_id": "assess-101", "invited_at": "2026-07-30",
     "otp_verified": False, "system_check_passed": False, "assessment_completed": False,
     "identity_status": "pending_verification"},
    {"id": "cand-4", "name": "Sophia Chen", "email": "sophia.chen@example.com", "phone": "+1-555-0144",
     "experience_years": 5, "skills": ["Python", "PyTorch", "FastAPI", "Docker", "AWS"],
     "status": "Selected", "assessment_id": "assess-101", "invited_at": "2026-07-25",
     "otp_verified": True, "system_check_passed": True, "assessment_completed": True,
     "identity_status": "approved"},
]

RESULTS = [
    {
        "id": "res-1", "candidate_id": "cand-1", "assessment_id": "assess-101",
        "completed_at": "2026-07-28T16:45:00Z", "total_score": 68, "max_score": 75, "percentage": 90.6,
        "pass_status": "Pass",
        "section_scores": {
            "Technical MCQs & Aptitude": {"score": 10, "maxScore": 10, "percentage": 100},
            "Database & SQL Engineering": {"score": 20, "maxScore": 20, "percentage": 100},
            "Algorithmic Coding Challenge": {"score": 25, "maxScore": 25, "percentage": 100},
            "Architectural Essay": {"score": 13, "maxScore": 20, "percentage": 65},
        },
        "ai_confidence_score": 94.5, "total_violations": 1,
        "proctoring_logs": [{
            "id": "viol-1", "candidateId": "cand-1", "timestamp": "16:12:04",
            "type": "Tab Switch", "severity": "low",
            "description": "Candidate switched window for 2 seconds (Warning issued)",
        }],
        "recruiter_notes": "Exceptional coding speed and SQL expertise.",
        "recruiter_decision": "Selected",
    },
    {
        "id": "res-2", "candidate_id": "cand-2", "assessment_id": "assess-101",
        "completed_at": "2026-07-29T11:20:00Z", "total_score": 54, "max_score": 75, "percentage": 72.0,
        "pass_status": "Pass",
        "section_scores": {
            "Technical MCQs & Aptitude": {"score": 10, "maxScore": 10, "percentage": 100},
            "Database & SQL Engineering": {"score": 15, "maxScore": 20, "percentage": 75},
            "Algorithmic Coding Challenge": {"score": 15, "maxScore": 25, "percentage": 60},
            "Architectural Essay": {"score": 14, "maxScore": 20, "percentage": 70},
        },
        "ai_confidence_score": 88.0, "total_violations": 2,
        "proctoring_logs": [
            {"id": "viol-2", "candidateId": "cand-2", "timestamp": "11:05:12", "type": "Looking Away",
             "severity": "low", "description": "Gaze moved off-screen for 4 seconds."},
            {"id": "viol-3", "candidateId": "cand-2", "timestamp": "11:15:40", "type": "Background Voice",
             "severity": "medium", "description": "Background audio detected above threshold."},
        ],
        "recruiter_notes": "Passed baseline cutoff. Follow-up interview recommended.",
        "recruiter_decision": "Under Review",
    },
]


def seed_recruiter_demo(db: Session) -> bool:
    """Insert demo hiring data once. Returns True when seed ran."""
    if db.query(Candidate.id).first() is not None:
        return False

    db.add(Assessment(
        id="assess-101",
        title="Senior Software Engineer",
        role_title="Senior Software Engineer",
        description="Comprehensive technical evaluation covering MCQs, SQL, coding, and system design.",
        total_duration_minutes=60, total_questions=4, passing_percentage=70,
        status="active", created_date="2026-07-20",
    ))
    db.add(Job(
        id="job-101",
        title="Senior Software Engineer",
        description="Comprehensive technical evaluation covering MCQs, SQL, coding, and system design.",
        status="open",
        assessment_id="assess-101",
    ))
    for c in CANDIDATES:
        db.add(Candidate(
            id=c["id"], name=c["name"], email=c["email"], phone=c["phone"],
            experience_years=c["experience_years"], skills=c["skills"], status=c["status"],
            assessment_id=c["assessment_id"], invited_at=c["invited_at"],
            otp_verified=c["otp_verified"], system_check_passed=c["system_check_passed"],
            assessment_completed=c["assessment_completed"],
            live_photo_url=DEMO_PHOTO, id_proof_url=DEMO_ID,
            identity_status=c["identity_status"], updated_at=utcnow(),
        ))

    for r in RESULTS:
        db.add(CandidateResult(
            id=r["id"], candidate_id=r["candidate_id"], assessment_id=r["assessment_id"],
            completed_at=r["completed_at"], total_score=r["total_score"], max_score=r["max_score"],
            percentage=r["percentage"], section_scores=r["section_scores"],
            ai_confidence_score=r["ai_confidence_score"], total_violations=r["total_violations"],
            pass_status=r["pass_status"], proctoring_logs=r["proctoring_logs"],
            recruiter_notes=r["recruiter_notes"], recruiter_decision=r["recruiter_decision"],
        ))

    db.commit()
    logger.info("Seeded recruiter demo: %d questions, 1 assessment, %d candidates, %d results",
                len(QUESTIONS), len(CANDIDATES), len(RESULTS))
    return True
