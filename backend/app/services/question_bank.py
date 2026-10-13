"""Polymorphic question validation, category catalog, job roles, and bulk import."""
from __future__ import annotations

import csv
import io
import re
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy.orm import Session

from app.models.auth import Assessment, AssessmentSection, JobRole, Question, QuestionCategory, new_id, utcnow

DEFAULT_CATEGORIES = [
    ("Quantitative Aptitude", ["mcq", "msq", "drag_drop"], 0),
    ("Logical Reasoning", ["mcq", "msq", "drag_drop"], 1),
    ("Verbal", ["mcq", "msq", "essay"], 2),
    ("Technical/Coding", ["coding", "sql", "mcq"], 3),
    ("Core CS", ["mcq", "msq", "coding", "drag_drop"], 4),
    ("System Design", ["essay", "mcq"], 5),
    ("General", ["mcq", "msq", "coding", "sql", "essay", "drag_drop"], 6),
]


class CategoryInUseError(Exception):
    """A job category still has questions, so it cannot be deleted."""


def ensure_question_categories(db: Session) -> int:
    """Seed the company library once. Job banks start empty until HR adds categories."""
    library = db.query(QuestionCategory.id).filter(QuestionCategory.job_id.is_(None))
    if library.first():
        return 0
    for label, types, order in DEFAULT_CATEGORIES:
        db.add(QuestionCategory(id=new_id(), label=label, allowed_types=types, sort_order=order, job_id=None))
    db.commit()
    return len(DEFAULT_CATEGORIES)


def category_out(row: QuestionCategory) -> Dict[str, Any]:
    return {
        "id": row.id,
        "label": row.label,
        "allowedTypes": row.allowed_types or [],
        "sortOrder": row.sort_order,
        "jobId": row.job_id,
    }


def list_categories(db: Session, job_id: Optional[str] = None) -> List[Dict[str, Any]]:
    if job_id is None:
        ensure_question_categories(db)
        query = db.query(QuestionCategory).filter(QuestionCategory.job_id.is_(None))
    else:
        query = db.query(QuestionCategory).filter(QuestionCategory.job_id == job_id)
    rows = query.order_by(QuestionCategory.sort_order.asc(), QuestionCategory.label.asc()).all()
    return [category_out(r) for r in rows]


def create_library_category(db: Session, label: str) -> Dict[str, Any]:
    cleaned = (label or "").strip()
    if not cleaned:
        raise ValueError("Category name is required.")
    if len(cleaned) > 80:
        raise ValueError("Category name is too long.")
    dup = (
        db.query(QuestionCategory)
        .filter(QuestionCategory.job_id.is_(None), QuestionCategory.label.ilike(cleaned))
        .first()
    )
    if dup:
        raise ValueError("That category already exists.")
    order = db.query(QuestionCategory).filter(QuestionCategory.job_id.is_(None)).count()
    row = QuestionCategory(id=new_id(), label=cleaned, allowed_types=None, sort_order=order, job_id=None)
    db.add(row)
    db.commit()
    db.refresh(row)
    return category_out(row)


def create_job_category(
    db: Session, job_id: str, label: str, allowed_types: Optional[List[str]] = None,
) -> Dict[str, Any]:
    cleaned = (label or "").strip()
    if not cleaned:
        raise ValueError("Category name is required.")
    if len(cleaned) > 80:
        raise ValueError("Category name is too long.")
    dup = (
        db.query(QuestionCategory)
        .filter(QuestionCategory.job_id == job_id, QuestionCategory.label.ilike(cleaned))
        .first()
    )
    if dup:
        raise ValueError("This job already has that category.")
    order = db.query(QuestionCategory).filter(QuestionCategory.job_id == job_id).count()
    row = QuestionCategory(
        id=new_id(), label=cleaned, allowed_types=allowed_types, sort_order=order, job_id=job_id,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return category_out(row)


def delete_job_category(db: Session, job_id: str, category_id: str) -> None:
    row = (
        db.query(QuestionCategory)
        .filter(QuestionCategory.id == category_id, QuestionCategory.job_id == job_id)
        .first()
    )
    if not row:
        raise ValueError("Category not found.")
    used = (
        db.query(Question.id)
        .filter(
            Question.job_id == job_id,
            (Question.section_category == row.label) | (Question.category == row.label),
        )
        .first()
    )
    if used:
        raise CategoryInUseError(
            "Remove or recategorize the questions in this category before deleting it."
        )
    db.delete(row)
    db.commit()


def validate_question_body(body: Dict[str, Any], *, partial: bool = False) -> List[str]:
    errors: List[str] = []
    qtype = body.get("type")
    if not partial and not qtype:
        errors.append("type is required")
    if not partial and not (body.get("title") or "").strip():
        errors.append("title is required")
    if not partial and not (body.get("sectionCategory") or body.get("section_category") or "").strip():
        errors.append("sectionCategory is required")

    if qtype in ("mcq", "msq", "drag_drop"):
        options = body.get("options") or []
        if not partial and len(options) < 2:
            errors.append(f"{qtype} requires at least 2 items/options")
        mode = body.get("selectionMode") or body.get("selection_mode") or (
            "multi" if qtype == "msq" else "single"
        )
        correct = body.get("correctAnswers") or body.get("correct_answers") or []
        if options and correct is not None:
            ids = {o.get("id") for o in options if isinstance(o, dict)}
            if any(c not in ids for c in correct):
                errors.append("correctAnswers must reference option/item ids")
            if qtype == "mcq" and mode == "single" and len(correct) != 1 and not partial:
                errors.append("single-select requires exactly one correct answer")
            if qtype == "msq" and len(correct) < 1 and not partial:
                errors.append("multi-select requires at least one correct answer")
            if qtype == "drag_drop" and not partial and len(correct) != len(options):
                errors.append("drag_drop correctAnswers must list every item in the correct order")

    if qtype in ("coding", "sql"):
        cases = body.get("testCases") or body.get("test_cases") or []
        status = body.get("status") or "published"
        if status == "published" and not partial and cases:
            hidden = [c for c in cases if isinstance(c, dict) and c.get("isHidden")]
            if not hidden:
                errors.append("published coding/sql questions should include at least one hidden test case")
        # sql/coding may omit test cases while drafting; empty list is allowed for draft only
        if status == "published" and not partial and not cases:
            # recommend at least one case, but do not hard-fail empty seed-style SQL prompts
            pass

    if qtype == "essay":
        mn = body.get("essayMinWords") if "essayMinWords" in body else body.get("essay_min_words")
        mx = body.get("essayMaxWords") if "essayMaxWords" in body else body.get("essay_max_words")
        if mn is not None and mx is not None and int(mn) > int(mx):
            errors.append("essayMinWords cannot exceed essayMaxWords")

    return errors


def question_out(q: Question) -> Dict[str, Any]:
    meta = q.coding_meta or {}
    return {
        "id": q.id,
        "type": q.type,
        "title": q.title,
        "content": q.content,
        "options": q.options,
        "correctAnswers": q.correct_answers,
        "sampleCode": q.sample_code,
        "language": q.language,
        "testCases": q.test_cases,
        "essayMinWords": q.essay_min_words,
        "essayMaxWords": q.essay_max_words,
        "difficulty": q.difficulty,
        "points": q.points,
        "category": q.category,
        "tags": q.tags or [],
        "sectionCategory": q.section_category or q.category,
        "jobRole": q.job_role,
        "jobId": q.job_id,
        "selectionMode": q.selection_mode or ("multi" if q.type == "msq" else "single" if q.type == "mcq" else None),
        "stemFormat": q.stem_format or "plain",
        "codingMeta": meta,
        "constraints": meta.get("constraints"),
        "ioFormat": meta.get("io_format"),
        "timeLimitMs": meta.get("time_limit_ms"),
        "memoryLimitKb": meta.get("memory_limit_kb"),
        "rubric": q.rubric,
        "explanation": q.explanation or "",
        "status": q.status or "published",
    }


def apply_question_fields(q: Question, body: Dict[str, Any]) -> None:
    mapping = {
        "type": "type", "title": "title", "content": "content", "options": "options",
        "correctAnswers": "correct_answers", "sampleCode": "sample_code", "language": "language",
        "testCases": "test_cases", "essayMinWords": "essay_min_words", "essayMaxWords": "essay_max_words",
        "difficulty": "difficulty", "points": "points", "category": "category", "tags": "tags",
        "sectionCategory": "section_category", "jobRole": "job_role",
        "selectionMode": "selection_mode",
        "stemFormat": "stem_format", "rubric": "rubric", "explanation": "explanation", "status": "status",
    }
    for src, dest in mapping.items():
        if src not in body:
            continue
        val = body[src]
        if src == "jobRole":
            setattr(q, dest, (val or "").strip() or None)
        elif val is not None:
            setattr(q, dest, val)
    if "sectionCategory" in body and body["sectionCategory"] and not body.get("category"):
        q.category = body["sectionCategory"]
    meta = dict(q.coding_meta or {})
    if "codingMeta" in body and isinstance(body["codingMeta"], dict):
        meta.update(body["codingMeta"])
    for src, key in (
        ("constraints", "constraints"), ("ioFormat", "io_format"),
        ("timeLimitMs", "time_limit_ms"), ("memoryLimitKb", "memory_limit_kb"),
    ):
        if src in body and body[src] is not None:
            meta[key] = body[src]
    if meta:
        q.coding_meta = meta
    if q.type == "msq" and not q.selection_mode:
        q.selection_mode = "multi"
    if q.type == "mcq" and not q.selection_mode:
        q.selection_mode = "single"
    q.updated_at = utcnow()


def list_questions_filtered(
    db: Session, *, category: Optional[str] = None, qtype: Optional[str] = None,
    difficulty: Optional[str] = None, status: Optional[str] = None, q: Optional[str] = None,
    job_role: Optional[str] = None, job_id: Optional[str] = None, library_only: bool = False,
) -> List[Dict[str, Any]]:
    query = db.query(Question)
    if job_id:
        query = query.filter(Question.job_id == job_id)
    elif library_only:
        query = query.filter(Question.job_id.is_(None))
    if category:
        query = query.filter(
            (Question.section_category == category) | (Question.category == category)
        )
    if qtype:
        query = query.filter(Question.type == qtype)
    if difficulty:
        query = query.filter(Question.difficulty == difficulty)
    if status:
        query = query.filter(Question.status == status)
    if job_role:
        query = query.filter(Question.job_role == job_role)
    if q:
        like = f"%{q}%"
        query = query.filter((Question.title.ilike(like)) | (Question.content.ilike(like)))
    return [question_out(row) for row in query.order_by(Question.created_at.desc()).all()]


def _sync_orphan_roles_into_catalog(db: Session) -> None:
    """Promote role strings found on assessments/sections/questions into job_roles."""
    existing = {r.name.strip().lower() for r in db.query(JobRole).all()}
    discovered: Dict[str, str] = {}
    for src in (
        db.query(Assessment.role_title).filter(Assessment.role_title.isnot(None)).distinct().all(),
        db.query(AssessmentSection.job_role).filter(AssessmentSection.job_role.isnot(None)).distinct().all(),
        db.query(Question.job_role).filter(Question.job_role.isnot(None)).distinct().all(),
    ):
        for (raw,) in src:
            name = (raw or "").strip()
            if not name:
                continue
            key = name.lower()
            if key not in existing and key not in discovered:
                discovered[key] = name
    if not discovered:
        return
    base = db.query(JobRole).count()
    for i, name in enumerate(sorted(discovered.values(), key=str.lower)):
        db.add(JobRole(id=new_id(), name=name, sort_order=base + i))
    db.commit()


def list_job_roles(db: Session) -> List[Dict[str, Any]]:
    """Job roles from the catalog (merged with any orphan strings from assessments)."""
    _sync_orphan_roles_into_catalog(db)
    rows = db.query(JobRole).order_by(JobRole.sort_order.asc(), JobRole.name.asc()).all()
    return [
        {"id": r.id, "name": r.name, "description": r.description, "sortOrder": r.sort_order}
        for r in rows
    ]


def list_job_role_names(db: Session) -> List[str]:
    return [r["name"] for r in list_job_roles(db)]


def create_job_role(db: Session, *, name: str, description: Optional[str] = None) -> Dict[str, Any]:
    cleaned = (name or "").strip()
    if not cleaned:
        raise ValueError("Job role name is required")
    dup = db.query(JobRole).filter(JobRole.name.ilike(cleaned)).first()
    if dup:
        return {"id": dup.id, "name": dup.name, "description": dup.description, "sortOrder": dup.sort_order}
    max_order = db.query(JobRole).count()
    row = JobRole(id=new_id(), name=cleaned, description=(description or "").strip() or None, sort_order=max_order)
    db.add(row)
    db.commit()
    db.refresh(row)
    return {"id": row.id, "name": row.name, "description": row.description, "sortOrder": row.sort_order}


def delete_job_role(db: Session, role_id: str) -> None:
    row = db.query(JobRole).filter(JobRole.id == role_id).first()
    if not row:
        raise ValueError("Job role not found")
    db.delete(row)
    db.commit()


# ------------------------------------------------------------------ bulk question import
QUESTION_HEADER_ALIASES = {
    "title": "title", "question title": "title", "name": "title", "question": "title",
    "type": "type", "question type": "type",
    "content": "content", "stem": "content", "body": "content",
    "section": "section",
    "category": "category",
    "job": "job", "jobrole": "job", "job role": "job", "hiring track": "job", "role": "job",
    "difficulty": "difficulty",
    "points": "points", "marks": "points", "score": "points",
    "options": "options", "choices": "options",
    "correctanswer": "correct_answers", "correctanswers": "correct_answers",
    "correct answers": "correct_answers", "correct answer": "correct_answers",
    "correct": "correct_answers", "answer": "correct_answers", "answers": "correct_answers",
    "correct option": "correct_answers", "correctoption": "correct_answers",
    "constraints": "constraints",
    "ioformat": "io_format", "io format": "io_format", "i/o format": "io_format",
    "essayminwords": "essay_min_words", "essay min words": "essay_min_words", "min words": "essay_min_words",
    "essaymaxwords": "essay_max_words", "essay max words": "essay_max_words", "max words": "essay_max_words",
    "rubric": "rubric",
    "status": "status",
}


def _norm_q_header(h: str) -> str:
    key = re.sub(r"\s+", " ", (h or "").strip().lower())
    compact = key.replace(" ", "").replace("/", "")
    return QUESTION_HEADER_ALIASES.get(key) or QUESTION_HEADER_ALIASES.get(compact) or key


def _read_question_rows(filename: str, raw: bytes) -> List[Dict[str, str]]:
    name = (filename or "").lower()
    if name.endswith(".csv"):
        text = raw.decode("utf-8-sig", errors="replace")
        reader = csv.DictReader(io.StringIO(text))
        rows = []
        for r in reader:
            mapped = {_norm_q_header(k): (v or "").strip() for k, v in r.items() if k}
            if any(mapped.values()):
                rows.append(mapped)
        return rows

    if name.endswith(".xlsx") or name.endswith(".xls"):
        try:
            from openpyxl import load_workbook
        except ImportError as exc:
            raise ValueError("openpyxl is required for Excel uploads") from exc
        wb = load_workbook(filename=io.BytesIO(raw), read_only=True, data_only=True)
        ws = wb.active
        data = list(ws.iter_rows(values_only=True))
        if not data:
            return []
        headers = [_norm_q_header(str(c or "")) for c in data[0]]
        rows = []
        for line in data[1:]:
            mapped: Dict[str, str] = {}
            for i, h in enumerate(headers):
                if not h:
                    continue
                val = line[i] if i < len(line) else ""
                mapped[h] = "" if val is None else str(val).strip()
            if any(mapped.values()):
                rows.append(mapped)
        return rows

    raise ValueError("Unsupported file type. Upload .xlsx, .xls, or .csv")


def _split_pipe(value: str) -> List[str]:
    if not value:
        return []
    return [p.strip() for p in re.split(r"[|;]", value) if p.strip()]


_BULK_SECTIONS = {
    "quantitative aptitude": "Quantitative Aptitude",
    "logical reasoning": "Logical Reasoning",
    "english": "English",
    "technical": "Technical",
}
_BULK_CATEGORIES = {
    "mcq": ("mcq", "MCQ"),
    "theory": ("essay", "Theory"),
    "coding": ("coding", "Coding"),
}


def _row_to_question_body(row: Dict[str, str]) -> Tuple[Optional[Dict[str, Any]], List[str]]:
    errors: List[str] = []
    title = (row.get("title") or "").strip()
    content = (row.get("content") or title).strip()
    section_raw = (row.get("section") or "").strip().lower()
    category_raw = (row.get("category") or row.get("type") or "mcq").strip().lower()
    job_name = (row.get("job") or "").strip() or None
    difficulty = (row.get("difficulty") or "medium").strip().lower() or "medium"
    if difficulty not in ("easy", "medium", "hard"):
        difficulty = "medium"
    try:
        points = int(float(row.get("points") or 10))
    except ValueError:
        points = 10
        errors.append("Invalid points; defaulted to 10")

    if not title:
        errors.append("Question is required")
    section = _BULK_SECTIONS.get(section_raw)
    if not section:
        errors.append("Section must be Quantitative Aptitude, Logical Reasoning, English, or Technical")
    mapped = _BULK_CATEGORIES.get(category_raw)
    if not mapped:
        errors.append("Category must be MCQ or Coding")
        qtype, category_label = "mcq", "MCQ"
    else:
        qtype, category_label = mapped

    body: Dict[str, Any] = {
        "type": qtype,
        "title": title,
        "content": content or title,
        "sectionCategory": section or "",
        "category": category_label,
        "jobName": job_name,
        "difficulty": difficulty,
        "points": points,
        "status": "published",
        "stemFormat": "plain",
        "tags": [],
    }

    if qtype == "mcq":
        opt_texts = _split_pipe(row.get("options") or "")
        if len(opt_texts) < 2:
            errors.append("MCQ needs at least 2 options separated by |")
        options = [{"id": f"opt-{i + 1}", "text": t} for i, t in enumerate(opt_texts)]
        correct_raw = _split_pipe(row.get("correct_answers") or "")
        correct_ids: List[str] = []
        for c in correct_raw:
            if c.isdigit():
                idx = int(c) - 1
                if 0 <= idx < len(options):
                    correct_ids.append(options[idx]["id"])
            else:
                match = next((o for o in options if o["text"].lower() == c.lower()), None)
                if match:
                    correct_ids.append(match["id"])
        if len(correct_ids) != 1:
            errors.append("CorrectAnswer must be one option number (1, 2, 3…) or the option text")
        body["options"] = options
        body["correctAnswers"] = correct_ids[:1]
        body["selectionMode"] = "single"

    if qtype == "coding":
        body["constraints"] = row.get("constraints") or ""
        body["ioFormat"] = row.get("io_format") or ""
        body["testCases"] = []

    hard = [e for e in errors if "defaulted" not in e and "Invalid points" not in e]
    if hard:
        return None, errors
    return body, errors


def _job_id_for_import(db: Session, name_or_id: Optional[str]) -> Optional[str]:
    from app.models.auth import Job
    token = (name_or_id or "").strip()
    if not token:
        return None
    job = db.query(Job).filter(Job.id == token).first()
    if job is None:
        job = db.query(Job).filter(Job.title.ilike(token)).first()
    if job is None:
        raise ValueError(f"Job '{token}' was not found")
    if job.status == "closed":
        raise ValueError(f"Job '{job.title}' is closed. Questions cannot be assigned to it.")
    return job.id


def import_questions_from_file(
    db: Session, *, filename: str, raw: bytes, default_job: Optional[str] = None,
) -> Dict[str, Any]:
    """Parse CSV/Excel and persist each question on the questions table, linked to a job."""
    from app.services.recruiter_pipeline import create_question

    parsed = _read_question_rows(filename, raw)
    if not parsed:
        raise ValueError("File has no data rows")
    if len(parsed) > 500:
        raise ValueError("File has more than 500 question rows")

    created: List[Dict[str, Any]] = []
    failed: List[Dict[str, Any]] = []

    for idx, raw_row in enumerate(parsed, start=2):
        if default_job and not (raw_row.get("job") or "").strip():
            raw_row = {**raw_row, "job": default_job}
        body, row_errors = _row_to_question_body(raw_row)
        if body is None:
            failed.append({"rowNumber": idx, "title": raw_row.get("title") or "", "errors": row_errors})
            continue
        try:
            job_id = _job_id_for_import(db, body.pop("jobName", None))
            if job_id:
                body["jobId"] = job_id
            out = create_question(db, body)
            created.append({
                "rowNumber": idx, "id": out["id"], "title": out["title"],
                "type": out["type"], "jobRole": out.get("jobRole"), "jobId": out.get("jobId"),
            })
        except ValueError as exc:
            failed.append({"rowNumber": idx, "title": body.get("title") or "", "errors": [str(exc)] + row_errors})
        except Exception as exc:  # noqa: BLE001
            failed.append({"rowNumber": idx, "title": body.get("title") or "", "errors": [str(exc)]})

    return {
        "filename": filename,
        "totalRows": len(parsed),
        "created": len(created),
        "failed": len(failed),
        "items": created,
        "errors": failed,
    }


SAMPLE_QUESTION_CSV = (
    "Question,Section,Category,Content,Difficulty,Points,Options,CorrectAnswer,Job\n"
    "What is 2+2?,Quantitative Aptitude,MCQ,Select the correct sum,easy,5,3|4|5|6,2,\n"
    "Which figure comes next?,Logical Reasoning,MCQ,Choose the next figure in the series,medium,5,Circle|Square|Triangle,2,\n"
    "Choose the correct sentence,English,MCQ,Pick the grammatically correct sentence,easy,5,He go home|He goes home|He going home,2,\n"
    "What does JVM stand for?,Technical,MCQ,Choose the right expansion,easy,5,Java Virtual Machine|Java Variable Method|Just Virtual Memory,1,\n"
    "Reverse a string,Technical,Coding,Write a function that returns the reversed string,medium,20,,,,\n"
)
