from datetime import datetime, timedelta
import pytest
from app import db
from app.models import (
    User,
    Category,
    Quiz,
    Question,
    QuestionOption,
    Attempt,
    AttemptAnswer,
    ROLE_ADMIN,
    ROLE_STUDENT,
    STATUS_ACTIVE,
    STATUS_PUBLISHED,
    STATUS_IN_PROGRESS,
    STATUS_PASSED,
    STATUS_FAILED,
    STATUS_EXPIRED,
)


def get_token(client, email, password):
    res = client.post("/api/auth/login", json={"email": email, "password": password})
    data = res.get_json() or {}
    return data.get("access_token")


def auth_header(token):
    return {"Authorization": f"Bearer {token}"} if token else {}


@pytest.fixture
def student_user(app):
    with app.app_context():
        u = User(
            name="Student Ten One",
            email="student10_1@example.com",
            role=ROLE_STUDENT,
            status=STATUS_ACTIVE,
        )
        u.set_password("StudentPass123")
        db.session.add(u)
        db.session.commit()
        return {"id": u.id, "email": u.email, "password": "StudentPass123"}


@pytest.fixture
def student_two(app):
    with app.app_context():
        u = User(
            name="Student Ten Two",
            email="student10_2@example.com",
            role=ROLE_STUDENT,
            status=STATUS_ACTIVE,
        )
        u.set_password("StudentPass123")
        db.session.add(u)
        db.session.commit()
        return {"id": u.id, "email": u.email, "password": "StudentPass123"}


@pytest.fixture
def admin_user(app):
    with app.app_context():
        u = User(
            name="Admin Ten",
            email="admin10@example.com",
            role=ROLE_ADMIN,
            status=STATUS_ACTIVE,
        )
        u.set_password("AdminPass123")
        db.session.add(u)
        db.session.commit()
        return {"id": u.id, "email": u.email, "password": "AdminPass123"}


@pytest.fixture
def test_setup(app, student_user, student_two):
    with app.app_context():
        c = Category(name="Computer Science", description="CS subjects")
        db.session.add(c)
        db.session.commit()

        q1 = Quiz(
            title="Python Fundamentals",
            description="Basic Python quiz",
            category_id=c.id,
            difficulty="EASY",
            duration=10,
            passing_score=60.0,
            max_attempts=5,
            status=STATUS_PUBLISHED,
        )
        q2 = Quiz(
            title="Database Systems",
            description="SQL and Relational DBs",
            category_id=c.id,
            difficulty="MEDIUM",
            duration=15,
            passing_score=70.0,
            max_attempts=5,
            status=STATUS_PUBLISHED,
        )
        db.session.add_all([q1, q2])
        db.session.commit()

        now = datetime.utcnow()

        # Student 1:
        # Attempt 1: PASSED (percentage: 80.0, correct: 4, incorrect: 1)
        att1 = Attempt(
            quiz_id=q1.id,
            user_id=student_user["id"],
            started_at=now - timedelta(hours=3),
            expires_at=now - timedelta(hours=2, minutes=50),
            completed_at=now - timedelta(hours=2, minutes=55),
            status=STATUS_PASSED,
            total_marks=10,
            obtained_marks=8,
            percentage=80.0,
            correct_answers=4,
            incorrect_answers=1,
            unanswered=0,
            time_taken=300,
        )

        # Attempt 2: FAILED (percentage: 40.0, correct: 2, incorrect: 3)
        att2 = Attempt(
            quiz_id=q2.id,
            user_id=student_user["id"],
            started_at=now - timedelta(hours=2),
            expires_at=now - timedelta(hours=1, minutes=45),
            completed_at=now - timedelta(hours=1, minutes=50),
            status=STATUS_FAILED,
            total_marks=10,
            obtained_marks=4,
            percentage=40.0,
            correct_answers=2,
            incorrect_answers=3,
            unanswered=0,
            time_taken=600,
        )

        # Attempt 3: PASSED (percentage: 90.0, correct: 9, incorrect: 1)
        att3 = Attempt(
            quiz_id=q1.id,
            user_id=student_user["id"],
            started_at=now - timedelta(hours=1),
            expires_at=now - timedelta(minutes=50),
            completed_at=now - timedelta(minutes=52),
            status=STATUS_PASSED,
            total_marks=10,
            obtained_marks=9,
            percentage=90.0,
            correct_answers=9,
            incorrect_answers=1,
            unanswered=0,
            time_taken=480,
        )

        # Attempt 4: IN_PROGRESS (should not count as finalized attempt)
        att4 = Attempt(
            quiz_id=q2.id,
            user_id=student_user["id"],
            started_at=now,
            expires_at=now + timedelta(minutes=15),
            status=STATUS_IN_PROGRESS,
        )

        # Student 2:
        # Attempt for Student 2: PASSED (percentage: 100.0)
        att_s2 = Attempt(
            quiz_id=q1.id,
            user_id=student_two["id"],
            started_at=now - timedelta(hours=1),
            expires_at=now - timedelta(minutes=50),
            completed_at=now - timedelta(minutes=55),
            status=STATUS_PASSED,
            total_marks=10,
            obtained_marks=10,
            percentage=100.0,
            correct_answers=5,
            incorrect_answers=0,
            unanswered=0,
            time_taken=200,
        )

        db.session.add_all([att1, att2, att3, att4, att_s2])
        db.session.commit()

        return {
            "q1_id": q1.id,
            "q2_id": q2.id,
            "att1_id": att1.id,
            "att2_id": att2.id,
            "att3_id": att3.id,
            "att4_id": att4.id,
            "att_s2_id": att_s2.id,
        }


# ==================================================
# AUTHORIZATION TESTS (1 - 4)
# ==================================================

def test_student_can_access_own_dashboard(client, student_user, test_setup):
    token = get_token(client, student_user["email"], student_user["password"])
    res = client.get("/api/student/dashboard", headers=auth_header(token))
    assert res.status_code == 200
    data = res.get_json()
    assert "statistics" in data
    assert "recent_attempts" in data
    assert "performance" in data


def test_unauthenticated_user_cannot_access_dashboard(client):
    res = client.get("/api/student/dashboard")
    assert res.status_code == 401


def test_admin_cannot_access_student_dashboard(client, admin_user):
    token = get_token(client, admin_user["email"], admin_user["password"])
    res = client.get("/api/student/dashboard", headers=auth_header(token))
    assert res.status_code == 403


def test_dashboard_data_cannot_be_requested_for_another_user(client, student_user, student_two, test_setup):
    token = get_token(client, student_user["email"], student_user["password"])
    # Attempting query parameter injection
    res = client.get(f"/api/student/dashboard?user_id={student_two['id']}", headers=auth_header(token))
    assert res.status_code == 200
    data = res.get_json()
    # Response must reflect student 1's stats (3 attempts), NOT student 2's (1 attempt)
    assert data["statistics"]["total_attempted"] == 3
    assert data["statistics"]["highest_score"] == 90.0


# ==================================================
# STATISTICS CALCULATIONS TESTS (5 - 12)
# ==================================================

def test_total_attempted_is_correct(client, student_user, test_setup):
    token = get_token(client, student_user["email"], student_user["password"])
    res = client.get("/api/student/dashboard", headers=auth_header(token))
    assert res.status_code == 200
    stats = res.get_json()["statistics"]
    assert stats["total_attempted"] == 3


def test_total_passed_is_correct(client, student_user, test_setup):
    token = get_token(client, student_user["email"], student_user["password"])
    res = client.get("/api/student/dashboard", headers=auth_header(token))
    assert res.status_code == 200
    stats = res.get_json()["statistics"]
    assert stats["total_passed"] == 2  # att1 and att3


def test_total_failed_is_correct(client, student_user, test_setup):
    token = get_token(client, student_user["email"], student_user["password"])
    res = client.get("/api/student/dashboard", headers=auth_header(token))
    assert res.status_code == 200
    stats = res.get_json()["statistics"]
    assert stats["total_failed"] == 1  # att2


def test_average_score_is_correct(client, student_user, test_setup):
    token = get_token(client, student_user["email"], student_user["password"])
    res = client.get("/api/student/dashboard", headers=auth_header(token))
    assert res.status_code == 200
    stats = res.get_json()["statistics"]
    # Scores: 80.0, 40.0, 90.0 => (80+40+90)/3 = 70.0
    assert stats["average_score"] == 70.0


def test_highest_score_is_correct(client, student_user, test_setup):
    token = get_token(client, student_user["email"], student_user["password"])
    res = client.get("/api/student/dashboard", headers=auth_header(token))
    assert res.status_code == 200
    stats = res.get_json()["statistics"]
    assert stats["highest_score"] == 90.0


def test_total_questions_answered_is_correct(client, student_user, test_setup):
    token = get_token(client, student_user["email"], student_user["password"])
    res = client.get("/api/student/dashboard", headers=auth_header(token))
    assert res.status_code == 200
    stats = res.get_json()["statistics"]
    # att1: (4+1)=5, att2: (2+3)=5, att3: (9+1)=10 => Total = 20
    assert stats["total_questions_answered"] == 20


def test_in_progress_attempts_are_not_counted(client, student_user, test_setup):
    token = get_token(client, student_user["email"], student_user["password"])
    res = client.get("/api/student/dashboard", headers=auth_header(token))
    assert res.status_code == 200
    stats = res.get_json()["statistics"]
    # Total attempted should be 3, ignoring the 4th IN_PROGRESS attempt
    assert stats["total_attempted"] == 3


def test_zero_attempt_student_receives_zero_statistics(client, app):
    with app.app_context():
        new_student = User(
            name="New Student",
            email="newstudent10@example.com",
            role=ROLE_STUDENT,
            status=STATUS_ACTIVE,
        )
        new_student.set_password("StudentPass123")
        db.session.add(new_student)
        db.session.commit()

    token = get_token(client, "newstudent10@example.com", "StudentPass123")
    res = client.get("/api/student/dashboard", headers=auth_header(token))
    assert res.status_code == 200
    data = res.get_json()
    stats = data["statistics"]
    assert stats["total_attempted"] == 0
    assert stats["total_passed"] == 0
    assert stats["total_failed"] == 0
    assert stats["average_score"] == 0.0
    assert stats["highest_score"] == 0.0
    assert stats["total_questions_answered"] == 0
    assert data["recent_attempts"] == []
    assert data["performance"] == []


# ==================================================
# RECENT ATTEMPTS TESTS (13 - 18)
# ==================================================

def test_recent_attempts_are_returned(client, student_user, test_setup):
    token = get_token(client, student_user["email"], student_user["password"])
    res = client.get("/api/student/dashboard", headers=auth_header(token))
    assert res.status_code == 200
    recent = res.get_json()["recent_attempts"]
    assert len(recent) == 3


def test_recent_attempts_are_sorted_newest_first(client, student_user, test_setup):
    token = get_token(client, student_user["email"], student_user["password"])
    res = client.get("/api/student/dashboard", headers=auth_header(token))
    assert res.status_code == 200
    recent = res.get_json()["recent_attempts"]
    # att3 is newest (completed 52m ago), att2 is middle (1h 50m ago), att1 is oldest (2h 55m ago)
    assert recent[0]["attempt_id"] == test_setup["att3_id"]
    assert recent[1]["attempt_id"] == test_setup["att2_id"]
    assert recent[2]["attempt_id"] == test_setup["att1_id"]


def test_recent_attempt_contains_quiz_title(client, student_user, test_setup):
    token = get_token(client, student_user["email"], student_user["password"])
    res = client.get("/api/student/dashboard", headers=auth_header(token))
    assert res.status_code == 200
    recent = res.get_json()["recent_attempts"]
    for item in recent:
        assert "quiz_title" in item
        assert isinstance(item["quiz_title"], str)
        assert len(item["quiz_title"]) > 0


def test_recent_attempt_contains_percentage(client, student_user, test_setup):
    token = get_token(client, student_user["email"], student_user["password"])
    res = client.get("/api/student/dashboard", headers=auth_header(token))
    assert res.status_code == 200
    recent = res.get_json()["recent_attempts"]
    percentages = [item["percentage"] for item in recent]
    assert percentages == [90.0, 40.0, 80.0]


def test_recent_attempt_contains_status(client, student_user, test_setup):
    token = get_token(client, student_user["email"], student_user["password"])
    res = client.get("/api/student/dashboard", headers=auth_header(token))
    assert res.status_code == 200
    recent = res.get_json()["recent_attempts"]
    statuses = [item["status"] for item in recent]
    assert statuses == [STATUS_PASSED, STATUS_FAILED, STATUS_PASSED]


def test_recent_attempt_contains_attempt_id(client, student_user, test_setup):
    token = get_token(client, student_user["email"], student_user["password"])
    res = client.get("/api/student/dashboard", headers=auth_header(token))
    assert res.status_code == 200
    recent = res.get_json()["recent_attempts"]
    for item in recent:
        assert "attempt_id" in item
        assert isinstance(item["attempt_id"], int)


# ==================================================
# PERFORMANCE CHART TESTS (19 - 21)
# ==================================================

def test_performance_data_is_returned(client, student_user, test_setup):
    token = get_token(client, student_user["email"], student_user["password"])
    res = client.get("/api/student/dashboard", headers=auth_header(token))
    assert res.status_code == 200
    perf = res.get_json()["performance"]
    assert len(perf) == 3


def test_performance_data_uses_actual_percentages(client, student_user, test_setup):
    token = get_token(client, student_user["email"], student_user["password"])
    res = client.get("/api/student/dashboard", headers=auth_header(token))
    assert res.status_code == 200
    perf = res.get_json()["performance"]
    # Chronologically ordered: att1 (80.0), att2 (40.0), att3 (90.0)
    percentages = [p["percentage"] for p in perf]
    assert percentages == [80.0, 40.0, 90.0]


def test_performance_data_does_not_contain_another_student_attempts(client, student_user, student_two, test_setup):
    token = get_token(client, student_user["email"], student_user["password"])
    res = client.get("/api/student/dashboard", headers=auth_header(token))
    assert res.status_code == 200
    perf = res.get_json()["performance"]
    percentages = [p["percentage"] for p in perf]
    # Student 2 has 100.0%, which must NOT be present in Student 1's performance data
    assert 100.0 not in percentages
