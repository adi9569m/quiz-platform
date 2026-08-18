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
def student_two(app):
    with app.app_context():
        u = User(
            name="Student Nine Two",
            email="student9_2@example.com",
            role=ROLE_STUDENT,
            status=STATUS_ACTIVE,
        )
        u.set_password("StudentPass123")
        db.session.add(u)
        db.session.commit()
        return {"id": u.id, "email": u.email, "password": "StudentPass123"}


@pytest.fixture
def test_data(app, student_user):
    with app.app_context():
        c = Category(name="Science", description="Science category")
        db.session.add(c)
        db.session.commit()

        q = Quiz(
            title="General Science Quiz",
            description="Test your general science knowledge",
            category_id=c.id,
            difficulty="EASY",
            duration=10,
            passing_score=50.0,
            max_attempts=3,
            status=STATUS_PUBLISHED,
        )
        db.session.add(q)
        db.session.commit()

        q1 = Question(
            quiz_id=q.id,
            question_text="What is H2O?",
            marks=2,
            explanation="H2O is the chemical formula for water.",
        )
        db.session.add(q1)
        db.session.commit()

        opt1_a = QuestionOption(question_id=q1.id, option_key="A", option_text="Oxygen", is_correct=False)
        opt1_b = QuestionOption(question_id=q1.id, option_key="B", option_text="Water", is_correct=True)
        opt1_c = QuestionOption(question_id=q1.id, option_key="C", option_text="Hydrogen", is_correct=False)
        opt1_d = QuestionOption(question_id=q1.id, option_key="D", option_text="Carbon", is_correct=False)
        db.session.add_all([opt1_a, opt1_b, opt1_c, opt1_d])

        q2 = Question(
            quiz_id=q.id,
            question_text="What planet is known as the Red Planet?",
            marks=3,
            explanation=None,
        )
        db.session.add(q2)
        db.session.commit()

        opt2_a = QuestionOption(question_id=q2.id, option_key="A", option_text="Venus", is_correct=False)
        opt2_b = QuestionOption(question_id=q2.id, option_key="B", option_text="Mars", is_correct=True)
        opt2_c = QuestionOption(question_id=q2.id, option_key="C", option_text="Jupiter", is_correct=False)
        opt2_d = QuestionOption(question_id=q2.id, option_key="D", option_text="Saturn", is_correct=False)
        db.session.add_all([opt2_a, opt2_b, opt2_c, opt2_d])

        db.session.commit()

        return {
            "quiz_id": q.id,
            "category_name": c.name,
            "q1_id": q1.id,
            "q1_correct_opt_id": opt1_b.id,
            "q1_wrong_opt_id": opt1_a.id,
            "q2_id": q2.id,
            "q2_correct_opt_id": opt2_b.id,
            "q2_wrong_opt_id": opt2_a.id,
        }



def test_student_can_retrieve_own_finalized_result(client, app, student_user, test_data):
    token = get_token(client, student_user["email"], student_user["password"])
    with app.app_context():
        now = datetime.utcnow()
        attempt = Attempt(
            quiz_id=test_data["quiz_id"],
            user_id=student_user["id"],
            started_at=now - timedelta(minutes=5),
            expires_at=now + timedelta(minutes=5),
            completed_at=now,
            status=STATUS_PASSED,
            total_marks=5,
            obtained_marks=5,
            percentage=100.0,
            correct_answers=2,
            incorrect_answers=0,
            unanswered=0,
            time_taken=300,
        )
        db.session.add(attempt)
        db.session.commit()
        attempt_id = attempt.id

    res = client.get(f"/api/attempts/{attempt_id}/result", headers=auth_header(token))
    assert res.status_code == 200
    data = res.get_json()
    assert data["attempt_id"] == attempt_id
    assert data["summary"]["status"] == STATUS_PASSED


def test_unauthenticated_user_cannot_retrieve_result(client, app, student_user, test_data):
    with app.app_context():
        attempt = Attempt(
            quiz_id=test_data["quiz_id"],
            user_id=student_user["id"],
            expires_at=datetime.utcnow() + timedelta(minutes=5),
            status=STATUS_PASSED,
        )
        db.session.add(attempt)
        db.session.commit()
        attempt_id = attempt.id

    res = client.get(f"/api/attempts/{attempt_id}/result")
    assert res.status_code in [401, 403]


def test_student_cannot_retrieve_another_student_result(client, app, student_user, student_two, test_data):
    token_two = get_token(client, student_two["email"], student_two["password"])
    with app.app_context():
        attempt = Attempt(
            quiz_id=test_data["quiz_id"],
            user_id=student_user["id"],
            expires_at=datetime.utcnow() + timedelta(minutes=5),
            status=STATUS_PASSED,
        )
        db.session.add(attempt)
        db.session.commit()
        attempt_id = attempt.id

    res = client.get(f"/api/attempts/{attempt_id}/result", headers=auth_header(token_two))
    assert res.status_code == 403
    assert "Forbidden" in res.get_json()["message"]


def test_invalid_attempt_id_returns_404(client, student_user):
    token = get_token(client, student_user["email"], student_user["password"])
    res = client.get("/api/attempts/99999/result", headers=auth_header(token))
    assert res.status_code == 404


def test_in_progress_attempt_cannot_return_finalized_result(client, app, student_user, test_data):
    token = get_token(client, student_user["email"], student_user["password"])
    with app.app_context():
        attempt = Attempt(
            quiz_id=test_data["quiz_id"],
            user_id=student_user["id"],
            started_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(minutes=10),
            status=STATUS_IN_PROGRESS,
        )
        db.session.add(attempt)
        db.session.commit()
        attempt_id = attempt.id

    res = client.get(f"/api/attempts/{attempt_id}/result", headers=auth_header(token))
    assert res.status_code == 400
    assert "in progress" in res.get_json()["message"].lower()


def test_finalized_passed_attempt_can_return_result(client, app, student_user, test_data):
    token = get_token(client, student_user["email"], student_user["password"])
    with app.app_context():
        attempt = Attempt(
            quiz_id=test_data["quiz_id"],
            user_id=student_user["id"],
            expires_at=datetime.utcnow() + timedelta(minutes=10),
            status=STATUS_PASSED,
        )
        db.session.add(attempt)
        db.session.commit()
        attempt_id = attempt.id

    res = client.get(f"/api/attempts/{attempt_id}/result", headers=auth_header(token))
    assert res.status_code == 200
    assert res.get_json()["summary"]["status"] == STATUS_PASSED


def test_finalized_failed_attempt_can_return_result(client, app, student_user, test_data):
    token = get_token(client, student_user["email"], student_user["password"])
    with app.app_context():
        attempt = Attempt(
            quiz_id=test_data["quiz_id"],
            user_id=student_user["id"],
            expires_at=datetime.utcnow() + timedelta(minutes=10),
            status=STATUS_FAILED,
        )
        db.session.add(attempt)
        db.session.commit()
        attempt_id = attempt.id

    res = client.get(f"/api/attempts/{attempt_id}/result", headers=auth_header(token))
    assert res.status_code == 200
    assert res.get_json()["summary"]["status"] == STATUS_FAILED


def test_finalized_expired_attempt_can_return_result(client, app, student_user, test_data):
    token = get_token(client, student_user["email"], student_user["password"])
    with app.app_context():
        attempt = Attempt(
            quiz_id=test_data["quiz_id"],
            user_id=student_user["id"],
            expires_at=datetime.utcnow() - timedelta(minutes=5),
            status=STATUS_EXPIRED,
        )
        db.session.add(attempt)
        db.session.commit()
        attempt_id = attempt.id

    res = client.get(f"/api/attempts/{attempt_id}/result", headers=auth_header(token))
    assert res.status_code == 200
    assert res.get_json()["summary"]["status"] == STATUS_EXPIRED


def test_result_summary_fields(client, app, student_user, test_data):
    token = get_token(client, student_user["email"], student_user["password"])
    with app.app_context():
        attempt = Attempt(
            quiz_id=test_data["quiz_id"],
            user_id=student_user["id"],
            started_at=datetime.utcnow() - timedelta(minutes=5),
            expires_at=datetime.utcnow() + timedelta(minutes=5),
            completed_at=datetime.utcnow(),
            status=STATUS_PASSED,
            total_marks=5,
            obtained_marks=4,
            percentage=80.0,
            correct_answers=1,
            incorrect_answers=0,
            unanswered=1,
            time_taken=245,
        )
        db.session.add(attempt)
        db.session.commit()
        attempt_id = attempt.id

    res = client.get(f"/api/attempts/{attempt_id}/result", headers=auth_header(token))
    assert res.status_code == 200
    summary = res.get_json()["summary"]

    assert summary["percentage"] == 80.0
    assert summary["obtained_marks"] == 4
    assert summary["total_marks"] == 5
    assert summary["correct_answers"] == 1
    assert summary["incorrect_answers"] == 0
    assert summary["unanswered"] == 1
    assert summary["time_taken"] == 245
    assert summary["status"] == STATUS_PASSED


def test_answer_review_data_and_unanswered_handling(client, app, student_user, test_data):
    token = get_token(client, student_user["email"], student_user["password"])
    with app.app_context():
        attempt = Attempt(
            quiz_id=test_data["quiz_id"],
            user_id=student_user["id"],
            expires_at=datetime.utcnow() + timedelta(minutes=10),
            status=STATUS_FAILED,
            total_marks=5,
            obtained_marks=2,
            percentage=40.0,
            correct_answers=1,
            incorrect_answers=0,
            unanswered=1,
            time_taken=120,
        )
        db.session.add(attempt)
        db.session.commit()

        ans1 = AttemptAnswer(
            attempt_id=attempt.id,
            question_id=test_data["q1_id"],
            selected_option_id=test_data["q1_correct_opt_id"],
            is_correct=True,
        )
        ans2 = AttemptAnswer(
            attempt_id=attempt.id,
            question_id=test_data["q2_id"],
            selected_option_id=None,
            is_correct=False,
        )
        db.session.add_all([ans1, ans2])
        db.session.commit()
        attempt_id = attempt.id

    res = client.get(f"/api/attempts/{attempt_id}/result", headers=auth_header(token))
    assert res.status_code == 200
    data = res.get_json()
    review = data["review"]

    assert len(review) == 2

    item1 = review[0]
    assert item1["question_id"] == test_data["q1_id"]
    assert item1["question_text"] == "What is H2O?"
    assert item1["marks"] == 2
    assert item1["selected_option"]["key"] == "B"
    assert item1["selected_option"]["text"] == "Water"
    assert item1["correct_option"]["key"] == "B"
    assert item1["correct_option"]["text"] == "Water"
    assert item1["is_correct"] is True
    assert item1["explanation"] == "H2O is the chemical formula for water."

    item2 = review[1]
    assert item2["question_id"] == test_data["q2_id"]
    assert item2["selected_option"] is None
    assert item2["correct_option"]["key"] == "B"
    assert item2["correct_option"]["text"] == "Mars"
    assert item2["is_correct"] is False
    assert item2["explanation"] == "No explanation available."


def test_four_options_remain_associated(client, app, student_user, test_data):
    with app.app_context():
        q1 = db.session.get(Question, test_data["q1_id"])
        assert len(q1.options) == 4
        q2 = db.session.get(Question, test_data["q2_id"])
        assert len(q2.options) == 4


def test_result_endpoint_verifies_ownership(client, app, student_user, student_two, test_data):
    token_two = get_token(client, student_two["email"], student_two["password"])
    with app.app_context():
        attempt = Attempt(
            quiz_id=test_data["quiz_id"],
            user_id=student_user["id"],
            expires_at=datetime.utcnow() + timedelta(minutes=10),
            status=STATUS_PASSED,
        )
        db.session.add(attempt)
        db.session.commit()
        attempt_id = attempt.id

    res = client.get(f"/api/attempts/{attempt_id}/result", headers=auth_header(token_two))
    assert res.status_code == 403


def test_result_endpoint_does_not_trust_frontend_score(client, app, student_user, test_data):
    token = get_token(client, student_user["email"], student_user["password"])
    with app.app_context():
        attempt = Attempt(
            quiz_id=test_data["quiz_id"],
            user_id=student_user["id"],
            expires_at=datetime.utcnow() + timedelta(minutes=10),
            total_marks=10,
            obtained_marks=7,
            percentage=70.0,
            correct_answers=3,
            incorrect_answers=1,
            unanswered=0,
            time_taken=180,
            status=STATUS_PASSED,
        )
        db.session.add(attempt)
        db.session.commit()
        attempt_id = attempt.id

    res = client.get(f"/api/attempts/{attempt_id}/result", headers=auth_header(token))
    assert res.status_code == 200
    data = res.get_json()
    assert data["summary"]["percentage"] == 70.0
    assert data["summary"]["obtained_marks"] == 7

    with app.app_context():
        db_attempt = db.session.get(Attempt, attempt_id)
        assert db_attempt.percentage == 70.0
        assert db_attempt.obtained_marks == 7
        assert db_attempt.status == STATUS_PASSED


def test_in_progress_attempt_does_not_reveal_correct_answers(client, app, student_user, test_data):
    token = get_token(client, student_user["email"], student_user["password"])
    with app.app_context():
        attempt = Attempt(
            quiz_id=test_data["quiz_id"],
            user_id=student_user["id"],
            started_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(minutes=10),
            status=STATUS_IN_PROGRESS,
        )
        db.session.add(attempt)
        db.session.commit()
        attempt_id = attempt.id

    res = client.get(f"/api/attempts/{attempt_id}/result", headers=auth_header(token))
    assert res.status_code == 400
    assert "review" not in res.get_json()
