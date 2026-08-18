from datetime import datetime, timedelta
import pytest

from app.extensions import db
from app.models import (
    User,
    Category,
    Quiz,
    Question,
    QuestionOption,
    Attempt,
    ROLE_STUDENT,
    ROLE_ADMIN,
    STATUS_ACTIVE,
    STATUS_PUBLISHED,
    STATUS_IN_PROGRESS,
    STATUS_PASSED,
    STATUS_FAILED,
    STATUS_EXPIRED,
    STATUS_COMPLETED,
)


def get_token(client, email, password):
    res = client.post("/api/auth/login", json={"email": email, "password": password})
    return res.get_json()["access_token"]


def auth_header(token):
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def test_setup(app):
    with app.app_context():
        cat_prog = Category(name="Programming", description="Coding topics")
        cat_hist = Category(name="History", description="Historical events")
        cat_empty = Category(name="Astronomy", description="Space topics")
        db.session.add_all([cat_prog, cat_hist, cat_empty])
        db.session.commit()

        q_prog1 = Quiz(
            title="Python Basics",
            category_id=cat_prog.id,
            difficulty="EASY",
            duration=10,
            passing_score=50,
            max_attempts=3,
            status=STATUS_PUBLISHED,
        )
        q_prog2 = Quiz(
            title="Data Structures",
            category_id=cat_prog.id,
            difficulty="MEDIUM",
            duration=15,
            passing_score=60,
            max_attempts=3,
            status=STATUS_PUBLISHED,
        )
        q_hist1 = Quiz(
            title="World War II",
            category_id=cat_hist.id,
            difficulty="EASY",
            duration=10,
            passing_score=50,
            max_attempts=3,
            status=STATUS_PUBLISHED,
        )
        db.session.add_all([q_prog1, q_prog2, q_hist1])
        db.session.commit()

        s_rahul = User(name="Rahul Sharma", email="rahul@example.com", role=ROLE_STUDENT, status=STATUS_ACTIVE)
        s_rahul.set_password("Pass123!")

        s_priya = User(name="Priya Patel", email="priya@example.com", role=ROLE_STUDENT, status=STATUS_ACTIVE)
        s_priya.set_password("Pass123!")

        s_amit = User(name="Amit Kumar", email="amit@example.com", role=ROLE_STUDENT, status=STATUS_ACTIVE)
        s_amit.set_password("Pass123!")

        s_neha = User(name="Neha Singh", email="neha@example.com", role=ROLE_STUDENT, status=STATUS_ACTIVE)
        s_neha.set_password("Pass123!")

        u_admin = User(name="Admin User", email="admin_test@example.com", role=ROLE_ADMIN, status=STATUS_ACTIVE)
        u_admin.set_password("AdminPass123!")

        db.session.add_all([s_rahul, s_priya, s_amit, s_neha, u_admin])
        db.session.commit()

        now = datetime.utcnow()

        att_r1 = Attempt(
            quiz_id=q_prog1.id,
            user_id=s_rahul.id,
            started_at=now - timedelta(hours=3),
            expires_at=now - timedelta(hours=2, minutes=50),
            completed_at=now - timedelta(hours=2, minutes=55),
            status=STATUS_PASSED,
            percentage=90.0,
            obtained_marks=9,
            total_marks=10,
        )
        att_r2 = Attempt(
            quiz_id=q_prog2.id,
            user_id=s_rahul.id,
            started_at=now - timedelta(hours=2),
            expires_at=now - timedelta(hours=1, minutes=45),
            completed_at=now - timedelta(hours=1, minutes=50),
            status=STATUS_PASSED,
            percentage=100.0,
            obtained_marks=10,
            total_marks=10,
        )
        att_r3 = Attempt(
            quiz_id=q_hist1.id,
            user_id=s_rahul.id,
            started_at=now - timedelta(hours=1),
            expires_at=now - timedelta(minutes=50),
            completed_at=now - timedelta(minutes=55),
            status=STATUS_PASSED,
            percentage=80.0,
            obtained_marks=8,
            total_marks=10,
        )

        att_p1 = Attempt(
            quiz_id=q_prog1.id,
            user_id=s_priya.id,
            started_at=now - timedelta(hours=3),
            expires_at=now - timedelta(hours=2, minutes=50),
            completed_at=now - timedelta(hours=2, minutes=55),
            status=STATUS_PASSED,
            percentage=90.0,
            obtained_marks=9,
            total_marks=10,
        )
        att_p2 = Attempt(
            quiz_id=q_prog2.id,
            user_id=s_priya.id,
            started_at=now - timedelta(hours=2),
            expires_at=now - timedelta(hours=1, minutes=45),
            completed_at=now - timedelta(hours=1, minutes=50),
            status=STATUS_PASSED,
            percentage=90.0,
            obtained_marks=9,
            total_marks=10,
        )

        att_a1 = Attempt(
            quiz_id=q_prog1.id,
            user_id=s_amit.id,
            started_at=now - timedelta(hours=3),
            expires_at=now - timedelta(hours=2, minutes=50),
            completed_at=now - timedelta(hours=2, minutes=55),
            status=STATUS_PASSED,
            percentage=60.0,
            obtained_marks=6,
            total_marks=10,
        )

        att_n1 = Attempt(
            quiz_id=q_prog1.id,
            user_id=s_neha.id,
            started_at=now,
            expires_at=now + timedelta(minutes=10),
            status=STATUS_IN_PROGRESS,
            percentage=0.0,
        )

        att_adm = Attempt(
            quiz_id=q_prog1.id,
            user_id=u_admin.id,
            started_at=now - timedelta(hours=3),
            expires_at=now - timedelta(hours=2, minutes=50),
            completed_at=now - timedelta(hours=2, minutes=55),
            status=STATUS_PASSED,
            percentage=100.0,
            obtained_marks=10,
            total_marks=10,
        )

        db.session.add_all([att_r1, att_r2, att_r3, att_p1, att_p2, att_a1, att_n1, att_adm])
        db.session.commit()

        return {
            "categories": {
                "prog_id": cat_prog.id,
                "hist_id": cat_hist.id,
                "empty_id": cat_empty.id,
            },
            "students": {
                "rahul": {"id": s_rahul.id, "email": "rahul@example.com", "password": "Pass123!"},
                "priya": {"id": s_priya.id, "email": "priya@example.com", "password": "Pass123!"},
                "amit": {"id": s_amit.id, "email": "amit@example.com", "password": "Pass123!"},
                "neha": {"id": s_neha.id, "email": "neha@example.com", "password": "Pass123!"},
            },
            "admin": {"id": u_admin.id, "email": "admin_test@example.com", "password": "AdminPass123!"},
        }



def test_unauthenticated_access_returns_401(client):
    res = client.get("/api/leaderboard")
    assert res.status_code == 401


def test_student_can_retrieve_leaderboard(client, test_setup):
    token = get_token(client, test_setup["students"]["rahul"]["email"], test_setup["students"]["rahul"]["password"])
    res = client.get("/api/leaderboard", headers=auth_header(token))
    assert res.status_code == 200
    data = res.get_json()
    assert "leaderboard" in data
    assert isinstance(data["leaderboard"], list)
    assert len(data["leaderboard"]) > 0


def test_admin_does_not_appear_on_leaderboard(client, test_setup):
    token = get_token(client, test_setup["students"]["rahul"]["email"], test_setup["students"]["rahul"]["password"])
    res = client.get("/api/leaderboard", headers=auth_header(token))
    assert res.status_code == 200
    data = res.get_json()
    admin_id = test_setup["admin"]["id"]
    participant_ids = [entry["student_id"] for entry in data["leaderboard"]]
    assert admin_id not in participant_ids


def test_students_with_finalized_attempts_appear(client, test_setup):
    token = get_token(client, test_setup["students"]["rahul"]["email"], test_setup["students"]["rahul"]["password"])
    res = client.get("/api/leaderboard", headers=auth_header(token))
    assert res.status_code == 200
    data = res.get_json()
    participant_ids = [entry["student_id"] for entry in data["leaderboard"]]
    assert test_setup["students"]["rahul"]["id"] in participant_ids
    assert test_setup["students"]["priya"]["id"] in participant_ids
    assert test_setup["students"]["amit"]["id"] in participant_ids


def test_in_progress_attempts_excluded(client, test_setup):
    token = get_token(client, test_setup["students"]["rahul"]["email"], test_setup["students"]["rahul"]["password"])
    res = client.get("/api/leaderboard", headers=auth_header(token))
    assert res.status_code == 200
    data = res.get_json()
    participant_ids = [entry["student_id"] for entry in data["leaderboard"]]
    assert test_setup["students"]["neha"]["id"] not in participant_ids


def test_average_score_calculated_correctly(client, test_setup):
    token = get_token(client, test_setup["students"]["rahul"]["email"], test_setup["students"]["rahul"]["password"])
    res = client.get("/api/leaderboard", headers=auth_header(token))
    assert res.status_code == 200
    data = res.get_json()

    rahul_entry = next(e for e in data["leaderboard"] if e["student_id"] == test_setup["students"]["rahul"]["id"])
    assert rahul_entry["average_score"] == 90.0

    amit_entry = next(e for e in data["leaderboard"] if e["student_id"] == test_setup["students"]["amit"]["id"])
    assert amit_entry["average_score"] == 60.0


def test_quizzes_completed_count_is_correct(client, test_setup):
    token = get_token(client, test_setup["students"]["rahul"]["email"], test_setup["students"]["rahul"]["password"])
    res = client.get("/api/leaderboard", headers=auth_header(token))
    assert res.status_code == 200
    data = res.get_json()

    rahul_entry = next(e for e in data["leaderboard"] if e["student_id"] == test_setup["students"]["rahul"]["id"])
    assert rahul_entry["quizzes_completed"] == 3

    priya_entry = next(e for e in data["leaderboard"] if e["student_id"] == test_setup["students"]["priya"]["id"])
    assert priya_entry["quizzes_completed"] == 2


def test_rankings_sorted_by_average_score(client, test_setup):
    token = get_token(client, test_setup["students"]["rahul"]["email"], test_setup["students"]["rahul"]["password"])
    res = client.get("/api/leaderboard", headers=auth_header(token))
    assert res.status_code == 200
    data = res.get_json()
    leaderboard = data["leaderboard"]

    scores = [e["average_score"] for e in leaderboard]
    assert scores == sorted(scores, reverse=True)


def test_quiz_count_used_as_tie_breaker(client, test_setup):
    token = get_token(client, test_setup["students"]["rahul"]["email"], test_setup["students"]["rahul"]["password"])
    res = client.get("/api/leaderboard", headers=auth_header(token))
    assert res.status_code == 200
    data = res.get_json()
    leaderboard = data["leaderboard"]

    assert leaderboard[0]["student_id"] == test_setup["students"]["rahul"]["id"]
    assert leaderboard[0]["rank"] == 1
    assert leaderboard[1]["student_id"] == test_setup["students"]["priya"]["id"]
    assert leaderboard[1]["rank"] == 2


def test_ranking_is_deterministic(client, test_setup):
    token = get_token(client, test_setup["students"]["rahul"]["email"], test_setup["students"]["rahul"]["password"])
    res1 = client.get("/api/leaderboard", headers=auth_header(token))
    res2 = client.get("/api/leaderboard", headers=auth_header(token))
    assert res1.get_json() == res2.get_json()


def test_empty_leaderboard_returns_safely(client, app):
    with app.app_context():
        student = User(name="Solo Student", email="solo@example.com", role=ROLE_STUDENT, status=STATUS_ACTIVE)
        student.set_password("SoloPass123!")
        db.session.add(student)
        db.session.commit()

    token = get_token(client, "solo@example.com", "SoloPass123!")
    res = client.get("/api/leaderboard", headers=auth_header(token))
    assert res.status_code == 200
    data = res.get_json()
    assert data["leaderboard"] == []
    assert data["user_rank"] is None



def test_existing_category_returns_leaderboard(client, test_setup):
    token = get_token(client, test_setup["students"]["rahul"]["email"], test_setup["students"]["rahul"]["password"])
    prog_id = test_setup["categories"]["prog_id"]
    res = client.get(f"/api/leaderboard?category_id={prog_id}", headers=auth_header(token))
    assert res.status_code == 200
    data = res.get_json()
    assert "leaderboard" in data
    assert len(data["leaderboard"]) > 0


def test_category_rankings_only_use_category_attempts(client, test_setup):
    token = get_token(client, test_setup["students"]["rahul"]["email"], test_setup["students"]["rahul"]["password"])
    hist_id = test_setup["categories"]["hist_id"]
    res = client.get(f"/api/leaderboard?category_id={hist_id}", headers=auth_header(token))
    assert res.status_code == 200
    data = res.get_json()

    participant_ids = [e["student_id"] for e in data["leaderboard"]]
    assert participant_ids == [test_setup["students"]["rahul"]["id"]]


def test_average_category_score_is_correct(client, test_setup):
    token = get_token(client, test_setup["students"]["rahul"]["email"], test_setup["students"]["rahul"]["password"])
    prog_id = test_setup["categories"]["prog_id"]
    res = client.get(f"/api/leaderboard?category_id={prog_id}", headers=auth_header(token))
    assert res.status_code == 200
    data = res.get_json()

    rahul_entry = next(e for e in data["leaderboard"] if e["student_id"] == test_setup["students"]["rahul"]["id"])
    assert rahul_entry["average_score"] == 95.0

    priya_entry = next(e for e in data["leaderboard"] if e["student_id"] == test_setup["students"]["priya"]["id"])
    assert priya_entry["average_score"] == 90.0


def test_category_quiz_count_is_correct(client, test_setup):
    token = get_token(client, test_setup["students"]["rahul"]["email"], test_setup["students"]["rahul"]["password"])
    prog_id = test_setup["categories"]["prog_id"]
    res = client.get(f"/api/leaderboard?category_id={prog_id}", headers=auth_header(token))
    assert res.status_code == 200
    data = res.get_json()

    rahul_entry = next(e for e in data["leaderboard"] if e["student_id"] == test_setup["students"]["rahul"]["id"])
    assert rahul_entry["quizzes_completed"] == 2


def test_category_ranking_is_sorted_correctly(client, test_setup):
    token = get_token(client, test_setup["students"]["rahul"]["email"], test_setup["students"]["rahul"]["password"])
    prog_id = test_setup["categories"]["prog_id"]
    res = client.get(f"/api/leaderboard?category_id={prog_id}", headers=auth_header(token))
    assert res.status_code == 200
    data = res.get_json()
    leaderboard = data["leaderboard"]

    assert leaderboard[0]["student_id"] == test_setup["students"]["rahul"]["id"]
    assert leaderboard[0]["rank"] == 1
    assert leaderboard[1]["student_id"] == test_setup["students"]["priya"]["id"]
    assert leaderboard[1]["rank"] == 2
    assert leaderboard[2]["student_id"] == test_setup["students"]["amit"]["id"]
    assert leaderboard[2]["rank"] == 3


def test_invalid_category_returns_404(client, test_setup):
    token = get_token(client, test_setup["students"]["rahul"]["email"], test_setup["students"]["rahul"]["password"])
    res = client.get("/api/leaderboard?category_id=99999", headers=auth_header(token))
    assert res.status_code == 404

    res_invalid_str = client.get("/api/leaderboard?category_id=notanumber", headers=auth_header(token))
    assert res_invalid_str.status_code == 404


def test_category_with_no_attempts_returns_empty(client, test_setup):
    token = get_token(client, test_setup["students"]["rahul"]["email"], test_setup["students"]["rahul"]["password"])
    empty_id = test_setup["categories"]["empty_id"]
    res = client.get(f"/api/leaderboard?category_id={empty_id}", headers=auth_header(token))
    assert res.status_code == 200
    data = res.get_json()
    assert data["leaderboard"] == []



def test_password_information_never_returned(client, test_setup):
    token = get_token(client, test_setup["students"]["rahul"]["email"], test_setup["students"]["rahul"]["password"])
    res = client.get("/api/leaderboard", headers=auth_header(token))
    assert res.status_code == 200
    raw_text = res.get_data(as_text=True).lower()
    assert "password" not in raw_text
    assert "hash" not in raw_text


def test_emails_not_exposed_in_leaderboard(client, test_setup):
    token = get_token(client, test_setup["students"]["rahul"]["email"], test_setup["students"]["rahul"]["password"])
    res = client.get("/api/leaderboard", headers=auth_header(token))
    assert res.status_code == 200
    data = res.get_json()
    for entry in data["leaderboard"]:
        assert "email" not in entry


def test_private_data_not_exposed(client, test_setup):
    token = get_token(client, test_setup["students"]["rahul"]["email"], test_setup["students"]["rahul"]["password"])
    res = client.get("/api/leaderboard", headers=auth_header(token))
    assert res.status_code == 200
    data = res.get_json()
    for entry in data["leaderboard"]:
        assert set(entry.keys()) == {"rank", "student_id", "student_name", "average_score", "quizzes_completed"}
