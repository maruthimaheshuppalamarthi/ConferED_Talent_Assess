"""Recruiter pipeline / stage / section APIs (Excel list + assessment builder + question bank)."""
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


def test_pipeline_requires_recruiter(client):
    admin = _admin(client)
    r = client.get(f"{API}/recruiter/pipeline", headers=admin)
    assert r.status_code == 403


def test_pipeline_all_and_stage_endpoints(client):
    admin = _admin(client)
    _, token = recruiter_token(client, admin, "pipe")
    h = auth(token)

    all_resp = client.get(f"{API}/recruiter/pipeline", headers=h)
    assert all_resp.status_code == 200, all_resp.text
    body = all_resp.json()
    assert "items" in body and "counts" in body
    assert body["counts"]["all"] == body["total"] >= 4
    assert any(i["name"] == "Alex Rivera" for i in body["items"])

    stages = [
        "applied", "screened", "assessment-sent", "completed",
        "under-review", "selected", "rejected",
    ]
    for slug in stages:
        r = client.get(f"{API}/recruiter/pipeline/stages/{slug}", headers=h)
        assert r.status_code == 200, (slug, r.text)
        data = r.json()
        assert data["slug"] == slug
        assert "counts" in data
        for row in data["items"]:
            assert row["status"] == data["stage"]

    bad = client.get(f"{API}/recruiter/pipeline/stages/not-a-stage", headers=h)
    assert bad.status_code == 404


def test_candidate_detail_and_decision(client):
    admin = _admin(client)
    _, token = recruiter_token(client, admin, "det")
    h = auth(token)

    missing = client.get(f"{API}/recruiter/candidates/does-not-exist", headers=h)
    assert missing.status_code == 404

    detail = client.get(f"{API}/recruiter/candidates/cand-1", headers=h)
    assert detail.status_code == 200, detail.text
    data = detail.json()
    assert data["name"] == "Alex Rivera"
    assert data["result"]["percentage"] == 90.6

    patched = client.patch(
        f"{API}/recruiter/candidates/cand-1/decision",
        headers=h,
        json={"decision": "Under Review", "notes": "Needs follow-up"},
    )
    assert patched.status_code == 200, patched.text
    assert patched.json()["status"] == "Under Review"
    assert patched.json()["result"]["recruiterNotes"] == "Needs follow-up"


def test_assessments_crud(client):
    admin = _admin(client)
    _, token = recruiter_token(client, admin, "assess")
    h = auth(token)

    listed = client.get(f"{API}/recruiter/assessments", headers=h)
    assert listed.status_code == 200
    assert listed.json()["total"] >= 1
    aid = listed.json()["items"][0]["id"]

    one = client.get(f"{API}/recruiter/assessments/{aid}", headers=h)
    assert one.status_code == 200
    assert one.json()["title"]

    created = client.post(f"{API}/recruiter/assessments", headers=h, json={
        "title": "Temp Assessment",
        "roleTitle": "Engineer",
        "sections": [{"name": "Warmup", "timeLimitMinutes": 5, "passingMarks": 5, "questions": []}],
    })
    assert created.status_code == 201, created.text
    new_id = created.json()["id"]

    updated = client.patch(f"{API}/recruiter/assessments/{new_id}", headers=h,
                           json={"title": "Temp Assessment Updated", "status": "active"})
    assert updated.status_code == 200
    assert updated.json()["title"] == "Temp Assessment Updated"

    deleted = client.delete(f"{API}/recruiter/assessments/{new_id}", headers=h)
    assert deleted.status_code == 204


def test_jobs_own_separate_exams(client):
    admin = _admin(client)
    denied = client.get(f"{API}/recruiter/jobs", headers=admin)
    assert denied.status_code == 403

    _, token = recruiter_token(client, admin, "jobs")
    h = auth(token)

    listed = client.get(f"{API}/recruiter/jobs", headers=h)
    assert listed.status_code == 200, listed.text
    seeded = next(j for j in listed.json()["items"] if j["assessmentId"] == "assess-101")
    assert seeded["status"] == "open"
    assert seeded["sectionCount"] >= 0

    backend = client.post(f"{API}/recruiter/jobs", headers=h, json={
        "title": "Backend Engineer",
        "description": "APIs and data",
        "status": "draft",
    })
    assert backend.status_code == 201, backend.text
    cloud = client.post(f"{API}/recruiter/jobs", headers=h, json={
        "title": "Cloud Engineer",
        "description": "Infrastructure",
        "status": "open",
    })
    assert cloud.status_code == 201, cloud.text
    job_a = backend.json()
    job_b = cloud.json()
    assert job_a["assessmentId"] != job_b["assessmentId"]
    assert job_a["sectionCount"] == 4
    assert job_b["status"] == "open"

    bad = client.post(f"{API}/recruiter/jobs", headers=h, json={"title": "Nope", "status": "live"})
    assert bad.status_code == 400

    added = client.patch(
        f"{API}/recruiter/assessments/{job_a['assessmentId']}",
        headers=h,
        json={"sections": [{"name": "MCQ", "timeLimitMinutes": 10, "passingMarks": 5, "questions": []}]},
    )
    assert added.status_code == 200, added.text
    exam_a = client.get(f"{API}/recruiter/assessments/{job_a['assessmentId']}", headers=h)
    exam_b = client.get(f"{API}/recruiter/assessments/{job_b['assessmentId']}", headers=h)
    assert [s["name"] for s in exam_a.json()["sections"]] == ["MCQ"]
    assert [s["name"] for s in exam_b.json()["sections"]] == [
        "Quantitative Aptitude", "Logical Reasoning", "English", "Technical",
    ]

    renamed = client.patch(f"{API}/recruiter/jobs/{job_a['id']}", headers=h, json={
        "title": "Backend Engineer II",
        "status": "open",
    })
    assert renamed.status_code == 200, renamed.text
    assert renamed.json()["title"] == "Backend Engineer II"
    assert renamed.json()["sectionCount"] == 1
    exam_a = client.get(f"{API}/recruiter/assessments/{job_a['assessmentId']}", headers=h)
    assert exam_a.json()["title"] == "Backend Engineer II"
    assert exam_a.json()["status"] == "active"

    blocked = client.delete(f"{API}/recruiter/jobs/{seeded['id']}", headers=h)
    assert blocked.status_code == 409

    removed = client.delete(f"{API}/recruiter/jobs/{job_a['id']}", headers=h)
    assert removed.status_code == 204
    missing = client.get(f"{API}/recruiter/jobs/{job_a['id']}", headers=h)
    assert missing.status_code == 404
    gone = client.get(f"{API}/recruiter/assessments/{job_a['assessmentId']}", headers=h)
    assert gone.status_code == 404
    still_there = client.get(f"{API}/recruiter/assessments/{job_b['assessmentId']}", headers=h)
    assert still_there.status_code == 200


def test_job_question_banks_stay_separate(client):
    admin = _admin(client)
    _, token = recruiter_token(client, admin, "banks")
    h = auth(token)

    backend = client.post(f"{API}/recruiter/jobs", headers=h, json={
        "title": "Backend Bank", "description": "APIs", "status": "draft",
    })
    cloud = client.post(f"{API}/recruiter/jobs", headers=h, json={
        "title": "Cloud Bank", "description": "Infra", "status": "draft",
    })
    assert backend.status_code == 201 and cloud.status_code == 201
    job_a = backend.json()["id"]
    job_b = cloud.json()["id"]

    cat = client.post(f"{API}/recruiter/jobs/{job_a}/categories", headers=h, json={"label": "Job SQL Only"})
    assert cat.status_code == 201, cat.text
    dup = client.post(f"{API}/recruiter/jobs/{job_a}/categories", headers=h, json={"label": "job sql only"})
    assert dup.status_code == 400

    library_cats = client.get(f"{API}/recruiter/question-categories", headers=h)
    assert library_cats.status_code == 200
    assert all(c.get("jobId") in (None, "") for c in library_cats.json()["items"])
    assert "Job SQL Only" not in [c["label"] for c in library_cats.json()["items"]]

    created = client.post(f"{API}/recruiter/jobs/{job_a}/questions", headers=h, json={
        "type": "mcq", "title": "Backend only question", "content": "Pick one",
        "sectionCategory": "Job SQL Only", "difficulty": "easy", "points": 5,
        "options": [{"id": "a", "text": "No"}, {"id": "b", "text": "Yes"}],
        "correctAnswers": ["b"],
    })
    assert created.status_code == 201, created.text
    assert created.json()["jobId"] == job_a

    wrong = client.post(f"{API}/recruiter/jobs/{job_b}/questions", headers=h, json={
        "type": "mcq", "title": "Should fail", "content": "Nope",
        "sectionCategory": "Job SQL Only",
        "options": [{"id": "a", "text": "No"}, {"id": "b", "text": "Yes"}],
        "correctAnswers": ["b"],
    })
    assert wrong.status_code == 400

    only_a = client.get(f"{API}/recruiter/jobs/{job_a}/questions", headers=h)
    only_b = client.get(f"{API}/recruiter/jobs/{job_b}/questions", headers=h)
    library = client.get(f"{API}/recruiter/questions", headers=h)
    assert any(q["title"] == "Backend only question" for q in only_a.json()["items"])
    assert only_b.json()["items"] == []
    assert all(q["title"] != "Backend only question" for q in library.json()["items"])

    blocked = client.delete(
        f"{API}/recruiter/jobs/{job_a}/categories/{cat.json()['id']}", headers=h,
    )
    assert blocked.status_code == 409

    assert client.delete(f"{API}/recruiter/jobs/{job_a}", headers=h).status_code == 204
    assert client.delete(f"{API}/recruiter/jobs/{job_b}", headers=h).status_code == 204
    gone = client.get(f"{API}/recruiter/jobs/{job_a}/questions", headers=h)
    assert gone.status_code == 404


def test_section_assignment_does_not_cross_jobs(client):
    admin = _admin(client)
    _, token = recruiter_token(client, admin, "assign")
    h = auth(token)

    def mcq(title):
        return {
            "type": "mcq", "title": title, "content": title,
            "sectionCategory": "Assign Cat", "difficulty": "easy", "points": 5,
            "options": [{"id": "a", "text": "No"}, {"id": "b", "text": "Yes"}],
            "correctAnswers": ["b"],
        }

    job_a = client.post(f"{API}/recruiter/jobs", headers=h, json={"title": "Assign A", "status": "draft"}).json()
    job_b = client.post(f"{API}/recruiter/jobs", headers=h, json={"title": "Assign B", "status": "draft"}).json()
    assert client.post(f"{API}/recruiter/jobs/{job_a['id']}/categories", headers=h, json={"label": "Assign Cat"}).status_code == 201
    assert client.post(f"{API}/recruiter/jobs/{job_b['id']}/categories", headers=h, json={"label": "Assign Cat"}).status_code == 201

    own = client.post(f"{API}/recruiter/jobs/{job_a['id']}/questions", headers=h, json=mcq("Owned by A")).json()
    other = client.post(f"{API}/recruiter/jobs/{job_b['id']}/questions", headers=h, json=mcq("Owned by B")).json()
    library = client.post(f"{API}/recruiter/questions", headers=h, json={
        **mcq("From the library"), "sectionCategory": "General", "category": "General",
    })
    assert library.status_code == 201, library.text
    library_id = library.json()["id"]

    exam_a = client.get(f"{API}/recruiter/assessments/{job_a['assessmentId']}", headers=h).json()
    added = client.patch(
        f"{API}/recruiter/assessments/{job_a['assessmentId']}",
        headers=h,
        json={"sections": [{"name": "MCQ", "timeLimitMinutes": 10, "passingMarks": 5, "questions": []}]},
    )
    assert added.status_code == 200, added.text
    sec_a = added.json()["sections"][0]["id"]
    sec_b_body = client.patch(
        f"{API}/recruiter/assessments/{job_b['assessmentId']}",
        headers=h,
        json={"sections": [{"name": "MCQ", "timeLimitMinutes": 10, "passingMarks": 5, "questions": []}]},
    )
    sec_b = sec_b_body.json()["sections"][0]["id"]

    elig = client.get(
        f"{API}/recruiter/assessments/{job_a['assessmentId']}/sections/{sec_a}/eligible-questions",
        headers=h,
    )
    assert elig.status_code == 200, elig.text
    titles = {item["title"] for item in elig.json()["items"]}
    assert "Owned by A" in titles
    assert "From the library" in titles
    assert "Owned by B" not in titles

    linked = client.post(
        f"{API}/recruiter/assessments/{job_a['assessmentId']}/sections/{sec_a}/questions",
        headers=h, json={"questionIds": [own["id"], library_id]},
    )
    assert linked.status_code == 200, linked.text
    assert {q["id"] for q in linked.json()["questions"]} == {own["id"], library_id}

    rejected = client.post(
        f"{API}/recruiter/assessments/{job_a['assessmentId']}/sections/{sec_a}/questions",
        headers=h, json={"questionIds": [other["id"]]},
    )
    assert rejected.status_code == 400

    exam_b = client.get(f"{API}/recruiter/assessments/{job_b['assessmentId']}", headers=h).json()
    assert exam_b["sections"][0]["questions"] == []

    # Same library question can be linked onto the second job without copying it.
    also = client.post(
        f"{API}/recruiter/assessments/{job_b['assessmentId']}/sections/{sec_b}/questions",
        headers=h, json={"questionIds": [library_id]},
    )
    assert also.status_code == 200, also.text
    assert also.json()["questions"][0]["id"] == library_id

    cleared = client.put(
        f"{API}/recruiter/assessments/{job_a['assessmentId']}/sections/{sec_a}",
        headers=h, json={"questionIds": []},
    )
    assert cleared.status_code == 200, cleared.text
    assert cleared.json()["questions"] == []
    still = client.get(f"{API}/recruiter/jobs/{job_a['id']}/questions", headers=h)
    assert any(q["id"] == own["id"] for q in still.json()["items"])

    assert client.delete(f"{API}/recruiter/jobs/{job_a['id']}", headers=h).status_code == 204
    assert client.delete(f"{API}/recruiter/jobs/{job_b['id']}", headers=h).status_code == 204
    assert client.delete(f"{API}/recruiter/questions/{library_id}", headers=h).status_code == 204
    assert exam_a["id"] == job_a["assessmentId"]


def test_questions_crud(client):
    admin = _admin(client)
    _, token = recruiter_token(client, admin, "qb")
    h = auth(token)

    listed = client.get(f"{API}/recruiter/questions", headers=h)
    assert listed.status_code == 200
    assert listed.json()["total"] >= 0

    created = client.post(f"{API}/recruiter/questions", headers=h, json={
        "type": "mcq", "title": "Temp Q", "content": "What is 2+2?",
        "difficulty": "easy", "points": 5, "category": "General",
        "sectionCategory": "General",
        "selectionMode": "single",
        "options": [{"id": "a", "text": "3"}, {"id": "b", "text": "4"}],
        "correctAnswers": ["b"],
        "tags": ["arith"],
    })
    assert created.status_code == 201, created.text
    qid = created.json()["id"]

    patched = client.patch(f"{API}/recruiter/questions/{qid}", headers=h, json={
        "title": "Temp Q Updated",
        "sectionCategory": "General",
        "options": [{"id": "a", "text": "3"}, {"id": "b", "text": "4"}],
        "correctAnswers": ["b"],
    })
    assert patched.status_code == 200
    assert patched.json()["title"] == "Temp Q Updated"

    one = client.get(f"{API}/recruiter/questions/{qid}", headers=h)
    assert one.status_code == 200

    deleted = client.delete(f"{API}/recruiter/questions/{qid}", headers=h)
    assert deleted.status_code == 204

    gone = client.get(f"{API}/recruiter/questions/{qid}", headers=h)
    assert gone.status_code == 404


def test_invite_upserts_candidate_row(client):
    admin = _admin(client)
    _, token = recruiter_token(client, admin, "inv")
    h = auth(token)

    r = client.post(f"{API}/recruiter/candidates/invites", headers=h, json={
        "name": "New Hire",
        "email": "new.hire@example.com",
        "assessmentId": "assess-101",
        "expiresInHours": 24,
        "candidateId": "cand-new-hire-1",
    })
    assert r.status_code == 201, r.text

    detail = client.get(f"{API}/recruiter/candidates/cand-new-hire-1", headers=h)
    assert detail.status_code == 200
    assert detail.json()["status"] == "Assessment Sent"
    assert detail.json()["email"] == "new.hire@example.com"


def test_only_open_jobs_accept_invites_and_questions(client):
    admin = _admin(client)
    _, token = recruiter_token(client, admin, "openonly")
    h = auth(token)
    draft = client.post(f"{API}/recruiter/jobs", headers=h, json={
        "title": "Draft Only", "status": "draft",
    }).json()
    blocked = client.post(f"{API}/recruiter/candidates/invites", headers=h, json={
        "name": "Pat", "email": "pat.draft@example.com",
        "assessmentId": draft["assessmentId"], "expiresInHours": 24,
    })
    assert blocked.status_code == 400, blocked.text

    opened = client.patch(f"{API}/recruiter/jobs/{draft['id']}", headers=h, json={"status": "open"})
    assert opened.status_code == 200
    closed = client.patch(f"{API}/recruiter/jobs/{draft['id']}", headers=h, json={"status": "closed"})
    assert closed.status_code == 200
    cat = client.post(f"{API}/recruiter/question-categories", headers=h, json={"label": "Closed Gate"})
    assert cat.status_code in (201, 400)
    denied = client.post(f"{API}/recruiter/questions", headers=h, json={
        "type": "mcq", "title": "Should not land on a closed job", "content": "No",
        "sectionCategory": "Technical", "jobId": draft["id"], "difficulty": "easy", "points": 5,
        "options": [{"id": "a", "text": "No"}, {"id": "b", "text": "Yes"}],
        "correctAnswers": ["b"],
    })
    assert denied.status_code == 400, denied.text


def test_question_bank_assignment_shows_on_the_job(client):
    admin = _admin(client)
    _, token = recruiter_token(client, admin, "assignview")
    h = auth(token)
    job = client.post(f"{API}/recruiter/jobs", headers=h, json={
        "title": "View Job", "description": "See assigned work", "status": "draft",
    }).json()
    cat = client.post(f"{API}/recruiter/question-categories", headers=h, json={"label": "Assign View"})
    assert cat.status_code == 201, cat.text
    section = client.post(f"{API}/recruiter/jobs/{job['id']}/sections", headers=h, json={
        "name": "Technical MCQs", "timeLimitMinutes": 10, "passingMarks": 5,
    })
    assert section.status_code == 201, section.text
    created = client.post(f"{API}/recruiter/questions", headers=h, json={
        "type": "mcq", "title": "Assigned from the bank", "content": "Pick one",
        "sectionCategory": "Assign View", "difficulty": "easy", "points": 5,
        "jobId": job["id"], "sectionId": section.json()["id"],
        "options": [{"id": "a", "text": "No"}, {"id": "b", "text": "Yes"}],
        "correctAnswers": ["b"],
    })
    assert created.status_code == 201, created.text
    assert created.json()["jobId"] == job["id"]

    exam = client.get(f"{API}/recruiter/assessments/{job['assessmentId']}", headers=h).json()
    placed = next(sec for sec in exam["sections"] if sec["name"] == "Technical MCQs")
    assert placed["questions"][0]["title"] == "Assigned from the bank"
    assert placed["questions"][0]["sectionCategory"] == "Assign View"

    tagged = client.post(f"{API}/recruiter/questions", headers=h, json={
        "type": "mcq", "title": "Tagged with the job name", "content": "Pick one",
        "sectionCategory": "Assign View", "jobRole": "View Job", "difficulty": "easy", "points": 5,
        "options": [{"id": "a", "text": "No"}, {"id": "b", "text": "Yes"}],
        "correctAnswers": ["b"],
    })
    assert tagged.status_code == 201, tagged.text
    owned = client.get(f"{API}/recruiter/jobs/{job['id']}/questions", headers=h)
    titles = {q["title"] for q in owned.json()["items"]}
    assert "Tagged with the job name" in titles
    assert client.delete(f"{API}/recruiter/jobs/{job['id']}", headers=h).status_code == 204


def test_each_candidate_gets_a_frozen_paper():
    import random
    from urllib.parse import parse_qs, urlparse

    from app.models.auth import Question
    from app.services.recruiter_pipeline import draw_question_ids, option_order_for

    easy = [Question(id=f"e{i}", type="mcq", difficulty="easy", title="e", content="e") for i in range(6)]
    hard = [Question(id=f"h{i}", type="mcq", difficulty="hard", title="h", content="h") for i in range(2)]
    drawn = draw_question_ids(easy + hard, 4, random.Random(1))
    assert len(drawn) == 4
    assert sum(item.startswith("h") for item in drawn) == 1

    sample = Question(
        id="q", type="mcq", title="t", content="t", difficulty="easy",
        options=[
            {"id": "a", "text": "One"}, {"id": "b", "text": "Two"},
            {"id": "c", "text": "Three"}, {"id": "d", "text": "All of the above"},
        ],
    )
    orders = [option_order_for(sample, random.Random(n)) for n in range(6)]
    assert all(order[-1] == "d" for order in orders)
    assert any(order[:3] != ["a", "b", "c"] for order in orders)


def test_two_candidates_see_different_frozen_papers(client):
    from urllib.parse import parse_qs, urlparse

    admin = _admin(client)
    _, token = recruiter_token(client, admin, "paper")
    h = auth(token)
    job = client.post(f"{API}/recruiter/jobs", headers=h, json={
        "title": "Paper Job", "status": "open",
    }).json()
    assert client.post(
        f"{API}/recruiter/jobs/{job['id']}/categories", headers=h, json={"label": "Paper"},
    ).status_code == 201

    ids = []
    for i in range(4):
        created = client.post(f"{API}/recruiter/jobs/{job['id']}/questions", headers=h, json={
            "type": "mcq", "title": f"Paper Q{i}", "content": f"Stem {i}",
            "sectionCategory": "Paper", "difficulty": "easy" if i < 3 else "hard", "points": 5,
            "options": [
                {"id": "a", "text": "One"}, {"id": "b", "text": "Two"},
                {"id": "c", "text": "Three"}, {"id": "d", "text": "All of the above"},
            ],
            "correctAnswers": ["b"],
        })
        assert created.status_code == 201, created.text
        ids.append(created.json()["id"])

    patched = client.patch(f"{API}/recruiter/assessments/{job['assessmentId']}", headers=h, json={
        "sections": [{
            "name": "MCQ", "timeLimitMinutes": 10, "passingMarks": 5,
            "pickCount": 4, "questions": [{"id": qid} for qid in ids],
        }],
    })
    assert patched.status_code == 200, patched.text

    def open_paper(email):
        inv = client.post(f"{API}/recruiter/candidates/invites", headers=h, json={
            "name": email.split("@")[0], "email": email,
            "assessmentId": job["assessmentId"], "expiresInHours": 48,
        })
        assert inv.status_code == 201, inv.text
        invite_token = parse_qs(urlparse(inv.json()["link"]).query)["invite"][0]
        verified = client.post(f"{API}/candidate/verify", json={
            "inviteToken": invite_token, "otp": inv.json()["devOtp"],
        })
        assert verified.status_code == 200, verified.text
        access = verified.json()["accessToken"]
        first = client.get(f"{API}/candidate/assessment", headers=auth(access))
        second = client.get(f"{API}/candidate/assessment", headers=auth(access))
        assert first.status_code == 200 and second.status_code == 200
        q1 = first.json()["sections"][0]["questions"]
        q2 = second.json()["sections"][0]["questions"]
        assert [q["id"] for q in q1] == [q["id"] for q in q2]
        assert [opt["id"] for q in q1 for opt in q["options"]] == [
            opt["id"] for q in q2 for opt in q["options"]
        ]
        assert len(q1) == 4
        for question in q1:
            assert question["options"][-1]["text"] == "All of the above"
            assert "correctAnswers" not in question
        return access, q1, inv.json()["candidateId"]

    opened = [open_paper(f"paper.{i}@example.com") for i in range(6)]
    signatures = [
        tuple((q["id"], tuple(opt["id"] for opt in q["options"])) for q in paper)
        for _, paper, _ in opened
    ]
    assert len(set(signatures)) > 1

    access, paper, cand_id = opened[0]
    submitted = client.post(
        f"{API}/candidate/submit", headers=auth(access),
        json={"answers": {q["id"]: "b" for q in paper}},
    )
    assert submitted.status_code == 200, submitted.text
    detail = client.get(f"{API}/recruiter/candidates/{cand_id}", headers=h)
    assert detail.status_code == 200, detail.text
    body = detail.json()
    assert body["result"]["totalScore"] == 20
    seen = body["paper"][0]["questions"]
    assert [q["number"] for q in seen] == [1, 2, 3, 4]
    assert [q["title"] for q in seen] == [q["title"] for q in paper]
    assert seen[0]["options"][-1]["text"] == "All of the above"
    assert any(opt["correct"] for opt in seen[0]["options"])

    removed = client.delete(f"{API}/recruiter/jobs/{job['id']}", headers=h)
    assert removed.status_code == 409


def test_job_bank_questions_appear_on_candidate_paper(client):
    from urllib.parse import parse_qs, urlparse

    admin = _admin(client)
    _, token = recruiter_token(client, admin, "papersee")
    h = auth(token)
    job = client.post(f"{API}/recruiter/jobs", headers=h, json={
        "title": "Visible Paper", "status": "open",
    }).json()
    names = ["Quantitative Aptitude", "Logical Reasoning", "English", "Technical"]
    for name in names:
        created = client.post(f"{API}/recruiter/jobs/{job['id']}/questions", headers=h, json={
            "type": "mcq", "title": f"{name} Q", "content": f"Stem {name}",
            "sectionCategory": name, "difficulty": "easy", "points": 5,
            "options": [{"id": "a", "text": "No"}, {"id": "b", "text": "Yes"}],
            "correctAnswers": ["b"],
        })
        assert created.status_code == 201, created.text

    exam = client.get(f"{API}/recruiter/assessments/{job['assessmentId']}", headers=h).json()
    assert [sec["name"] for sec in exam["sections"]] == names
    for sec in exam["sections"]:
        assert [q["title"] for q in sec["questions"]] == [f"{sec['name']} Q"]

    inv = client.post(f"{API}/recruiter/candidates/invites", headers=h, json={
        "name": "See Paper", "email": "see.paper@example.com",
        "assessmentId": job["assessmentId"], "expiresInHours": 24,
    })
    assert inv.status_code == 201, inv.text
    invite_token = parse_qs(urlparse(inv.json()["link"]).query)["invite"][0]
    verified = client.post(f"{API}/candidate/verify", json={
        "inviteToken": invite_token, "otp": inv.json()["devOtp"],
    })
    assert verified.status_code == 200, verified.text
    paper = client.get(
        f"{API}/candidate/assessment",
        headers=auth(verified.json()["accessToken"]),
    )
    assert paper.status_code == 200, paper.text
    sections = paper.json()["sections"]
    assert [sec["name"] for sec in sections] == names
    for sec in sections:
        assert len(sec["questions"]) == 1
        assert sec["questions"][0]["title"] == f"{sec['name']} Q"
        assert "correctAnswers" not in sec["questions"][0]
