import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, ForeignKey, Text, JSON, DateTime, Enum
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True)
    email = Column(String, unique=True, nullable=False, index=True)
    full_name = Column(String, nullable=False)
    role = Column(String, default="Candidate")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Candidate(Base):
    __tablename__ = "candidates"
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    phone = Column(String)
    experience_years = Column(Integer, default=0)
    skills = Column(JSON, default=list)
    status = Column(String, default="Applied") # Applied, Screened, Assessment Sent, Completed, Under Review, Selected, Rejected
    invited_at = Column(DateTime, default=datetime.datetime.utcnow)
    otp_verified = Column(Boolean, default=False)
    system_check_passed = Column(Boolean, default=False)

class Assessment(Base):
    __tablename__ = "assessments"
    id = Column(String, primary_key=True)
    title = Column(String, nullable=False)
    role_title = Column(String, nullable=False)
    description = Column(Text)
    total_duration_minutes = Column(Integer, default=60)
    passing_percentage = Column(Float, default=70.0)
    status = Column(String, default="active")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    sections = relationship("AssessmentSection", backref="assessment", cascade="all, delete-orphan")

class AssessmentSection(Base):
    __tablename__ = "assessment_sections"
    id = Column(String, primary_key=True)
    assessment_id = Column(String, ForeignKey("assessments.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text)
    instructions = Column(Text)
    time_limit_minutes = Column(Integer, default=15)
    passing_marks = Column(Float, default=10.0)
    is_mandatory = Column(Boolean, default=True)

class Question(Base):
    __tablename__ = "questions"
    id = Column(String, primary_key=True)
    type = Column(String, nullable=False) # mcq, msq, coding, sql, essay
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    options = Column(JSON, nullable=True)
    correct_answers = Column(JSON, nullable=True)
    sample_code = Column(JSON, nullable=True)
    test_cases = Column(JSON, nullable=True)
    difficulty = Column(String, default="medium")
    points = Column(Integer, default=10)
    category = Column(String, default="General")
    tags = Column(JSON, default=list)

class CandidateSubmission(Base):
    __tablename__ = "candidate_submissions"
    id = Column(String, primary_key=True)
    candidate_id = Column(String, ForeignKey("candidates.id"), nullable=False)
    assessment_id = Column(String, ForeignKey("assessments.id"), nullable=False)
    answers_json = Column(JSON, default=dict)
    code_submissions_json = Column(JSON, default=dict)
    submitted_at = Column(DateTime, default=datetime.datetime.utcnow)

class ProctoringViolationLog(Base):
    __tablename__ = "proctoring_violation_logs"
    id = Column(String, primary_key=True)
    candidate_id = Column(String, ForeignKey("candidates.id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    violation_type = Column(String, nullable=False) # Tab Switch, Face Missing, Multiple Faces, Mobile Phone, Voice
    severity = Column(String, default="medium")
    description = Column(Text)

class CandidateResult(Base):
    __tablename__ = "candidate_results"
    id = Column(String, primary_key=True)
    candidate_id = Column(String, ForeignKey("candidates.id"), nullable=False)
    assessment_id = Column(String, ForeignKey("assessments.id"), nullable=False)
    completed_at = Column(DateTime, default=datetime.datetime.utcnow)
    total_score = Column(Float, nullable=False)
    max_score = Column(Float, nullable=False)
    percentage = Column(Float, nullable=False)
    pass_status = Column(String, nullable=False) # Pass, Fail
    section_scores_json = Column(JSON, default=dict)
    ai_confidence_score = Column(Float, default=95.0)
    total_violations = Column(Integer, default=0)
    recruiter_notes = Column(Text, default="")
    recruiter_decision = Column(String, default="Under Review")
