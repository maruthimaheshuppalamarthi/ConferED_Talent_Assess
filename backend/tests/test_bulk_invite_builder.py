"""Bulk invites, question filters, and smart assessment builder APIs."""
import io

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services import email as email_service
from helpers import API, auth, recruiter_token, sign_in, ADMIN


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture(autouse=True)
def no_real_email(monkeypatch):
    monkeypatch.setattr(email_service, "send_email", lambda *a, **k: True)


def _admin(client):
    return auth(sign_in(client, "admin", ADMIN["email"], ADMIN["password"])["accessToken"])


def _rec(client, prefix="blk"):
    admin = _admin(client)
    _, token = recruiter_token(client, admin, prefix)
    return auth(token)


def test_question_categories_and_filters(client):
    h = _rec(client, "qcat")
    cats = client.get(f"{API}/recruiter/question-categories", headers=h)
    assert cats.status_code == 200, cats.text
    labels = [c["label"] for c in cats.json()["items"]]
    assert "General" in labels
    assert "Technical/Coding" in labels

    filtered = client.get(f"{API}/recruiter/questions", headers=h, params={"type": "mcq"})
    assert filtered.status_code == 200
    for item in filtered.json()["items"]:
        assert item["type"] == "mcq"


def test_create_polymorphic_mcq(client):
    h = _rec(client, "qmcq")
    body = {
        "type": "mcq",
        "title": "2+2?",
        "content": "What is 2+2?",
        "sectionCategory": "Quantitative Aptitude",
        "selectionMode": "single",
        "options": [
            {"id": "a", "text": "3"},
            {"id": "b", "text": "4"},
        ],
        "correctAnswers": ["b"],
        "difficulty": "easy",
        "points": 5,
    }
    r = client.post(f"{API}/recruiter/questions", headers=h, json=body)
    assert r.status_code == 201, r.text
    data = r.json()
    assert data["sectionCategory"] == "Quantitative Aptitude"
    assert data["correctAnswers"] == ["b"]

    bad = client.post(f"{API}/recruiter/questions", headers=h, json={
        "type": "mcq", "title": "x", "content": "x", "sectionCategory": "General",
        "options": [{"id": "a", "text": "only one"}],
        "correctAnswers": ["a"],
    })
    assert bad.status_code == 400


def test_bulk_preview_confirm_dedupe(client):
    h = _rec(client, "bulk")
    csv_body = (
        "Name,Email,Phone,Organisation,Role,Source\n"
        "Alice One,alice.bulk@example.com,+1-555-0100,Acme,Senior Software Engineer,Campus Hire\n"
        "Alice Dup,alice.bulk@example.com,+1-555-0100,Acme,Senior Software Engineer,Campus Hire\n"
        "Bob Two,bob.bulk@example.com,+1-555-0101,Beta,Senior Software Engineer,Regular\n"
        "Bad Row,not-an-email,+1-555-0102,Gamma,Senior Software Engineer,Referral\n"
    ).encode("utf-8")
    files = {"file": ("candidates.csv", io.BytesIO(csv_body), "text/csv")}
    preview = client.post(
        f"{API}/recruiter/assessments/assess-101/invites/bulk/preview",
        headers=h, files=files,
    )
    assert preview.status_code == 200, preview.text
    data = preview.json()
    assert data["totalRows"] == 4
    assert data["duplicateInFile"] >= 1
    assert data["validRows"] >= 2
    batch_id = data["batchId"]

    confirm = client.post(
        f"{API}/recruiter/invites/batches/{batch_id}/confirm",
        headers=h, json={"forceResend": False, "expiresInHours": 24},
    )
    assert confirm.status_code == 200, confirm.text
    status = confirm.json()
    assert status["queued"] >= 2
    assert status["sent"] + status["failed"] + status.get("skipped", 0) >= 2
    assert any(r["deliveryStatus"] == "SENT" for r in status["rows"])

    # Second upload of same emails → DB dupes
    files2 = {"file": ("again.csv", io.BytesIO(
        b"Name,Email\nAlice One,alice.bulk@example.com\nBob Two,bob.bulk@example.com\n"
    ), "text/csv")}
    preview2 = client.post(
        f"{API}/recruiter/assessments/assess-101/invites/bulk/preview",
        headers=h, files=files2,
    )
    assert preview2.status_code == 200
    assert preview2.json()["duplicateInDb"] >= 2

    st = client.get(f"{API}/recruiter/invites/batches/{batch_id}", headers=h)
    assert st.status_code == 200
    assert st.json()["batchId"] == batch_id


def test_section_filters_and_eligible(client):
    h = _rec(client, "secf")
    # Find a section on assess-101
    jobs = client.get(f"{API}/recruiter/jobs", headers=h)
    job = next(j for j in jobs.json()["items"] if j["assessmentId"] == "assess-101")
    created = client.post(f"{API}/recruiter/jobs/{job['id']}/sections", headers=h, json={
        "name": "Technical", "timeLimitMinutes": 10, "passingMarks": 5,
    })
    assert created.status_code == 201, created.text
    sec_id = created.json()["id"]

    updated = client.put(
        f"{API}/recruiter/assessments/assess-101/sections/{sec_id}",
        headers=h,
        json={
            "allowedTypes": ["mcq", "msq"],
            "allowedCategories": ["General", "Quantitative Aptitude", "Technical/Coding", "Core CS"],
            "pickCount": 1,
            "randomizeQuestions": True,
        },
    )
    assert updated.status_code == 200, updated.text
    body = updated.json()
    assert body["pickCount"] == 1
    assert "mcq" in body["allowedTypes"]

    elig = client.get(
        f"{API}/recruiter/assessments/assess-101/sections/{sec_id}/eligible-questions",
        headers=h,
    )
    assert elig.status_code == 200, elig.text
    for item in elig.json()["items"]:
        assert item["type"] in ("mcq", "msq")


def test_job_roles_catalog_and_bulk_question_import(client):
    h = _rec(client, "jrole")
    created = client.post(f"{API}/recruiter/job-roles", headers=h, json={"name": "Campus Hire"})
    assert created.status_code == 201, created.text
    assert created.json()["name"] == "Campus Hire"

    listed = client.get(f"{API}/recruiter/job-roles", headers=h)
    assert listed.status_code == 200
    names = [r["name"] for r in listed.json()["items"]]
    assert "Campus Hire" in names

    job = client.post(f"{API}/recruiter/jobs", headers=h, json={"title": "Campus Hire", "status": "open"})
    assert job.status_code == 201, job.text
    csv_body = (
        "Question,Section,Category,Content,Difficulty,Points,Options,CorrectAnswer\n"
        "Sum check,Quantitative Aptitude,MCQ,What is 2+2?,easy,5,3|4|5,2\n"
        "Reverse a string,Technical,Coding,Write a function that reverses text,medium,20,,\n"
    )
    imported = client.post(
        f"{API}/recruiter/questions/bulk/import",
        headers=h,
        params={"jobId": job.json()["id"]},
        files={"file": ("questions.csv", csv_body.encode("utf-8"), "text/csv")},
    )
    assert imported.status_code == 200, imported.text
    data = imported.json()
    assert data["created"] == 2, data
    assert data["failed"] == 0
    assert data["items"][0]["jobId"] == job.json()["id"]

    qs = client.get(f"{API}/recruiter/jobs/{job.json()['id']}/questions", headers=h)
    assert qs.status_code == 200
    titles = {q["title"]: q for q in qs.json()["items"]}
    assert titles["Sum check"]["sectionCategory"] == "Quantitative Aptitude"
    assert titles["Sum check"]["type"] == "mcq"
    assert titles["Sum check"]["correctAnswers"] == ["opt-2"]
    assert titles["Reverse a string"]["type"] == "coding"
    assert titles["Reverse a string"]["sectionCategory"] == "Technical"
