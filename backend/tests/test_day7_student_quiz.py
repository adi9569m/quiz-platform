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
    ROLE_ADMIN,
    ROLE_STUDENT,
    STATUS_ACTIVE,
    STATUS_INACTIVE,
    STATUS_DRAFT,
    STATUS_PUBLISHED,
    STATUS_IN_PROGRESS,
    STATUS_EXPIRED,
)


def get_token(client, email, password):
    res = client.post("/api/auth/login", json={"email": email, "password": password})
    data = res.get_json() or {}
    return data.get("access_token")


def auth_header(token):
    return {"Authorization": f"Bearer {token}"} if token else {}


@pytest.fixture
def student_user_data(app):
    with app.app_context():
        u = User(
            name="Student User 7",
            email="student7@example.com",
            role=ROLE_STUDENT,
            status=STATUS_ACTIVE,
        )
        u.set_password("StudentPassword123")
        db.session.add(u)
        db.session.commit()
        return {"id": u.id, "email": u.email, "password": "StudentPassword123"}


@pytest.fixture
def student_user_2_data(app):
    with app.app_context():
        u = User(
            name="Student User 7 Two",
            email="student7two@example.com",
            role=ROLE_STUDENT,
            status=STATUS_ACTIVE,
        )
        u.set_password("StudentPassword123")
        db.session.add(u)
        db.session.commit()
        return {"id": u.id, "email": u.email, "password": "StudentPassword123"}


@pytest.fixture
def inactive_student_data(app):
    with app.app_context():
        u = User(
            name="Inactive Student 7",
            email="inactivestudent7@example.com",
            role=ROLE_STUDENT,
            status=STATUS_INACTIVE,
        )
        u.set_password("StudentPassword123")
        db.session.add(u)
        db.session.commit()
        return {"id": u.id, "email": u.email, "password": "StudentPassword123"}


@pytest.fixture
def sample_published_quiz(app):
    with app.app_context():
        cat = Category(name="Geography Test", description="Geo")
        db.session.add(cat)
        db.session.commit()

        quiz = Quiz(
            title="Sample Published Quiz",
            description="Published quiz test",
            category_id=cat.id,
            difficulty="EASY",
            duration=30,
            passing_score=40,
            max_attempts=3,
            status=STATUS_PUBLISHED,
        )
        db.session.add(quiz)
        db.session.commit()

        for i in range(1, 3):
            q = Question(
                quiz_id=quiz.id,
                question_text=f"Question text {i}",
                question_type="MCQ",
                marks=1,
            )
            db.session.add(q)
            db.session.commit()

            keys = ["A", "B", "C", "D"]
            for idx, key in enumerate(keys):
                opt = QuestionOption(
                    question_id=q.id,
                    option_text=f"Option {key} for Q{i}",
                    option_key=key,
                    is_correct=(idx == 0),
                )
                db.session.add(opt)
            db.session.commit()

        return quiz.id


@pytest.fixture
def sample_draft_quiz(app):
    with app.app_context():
        cat = Category.query.first()
        if not cat:
            cat = Category(name="Draft Category Test", description="Draft")
            db.session.add(cat)
            db.session.commit()

        quiz = Quiz(
            title="Sample Draft Quiz",
            description="Draft quiz test",
            category_id=cat.id,
            difficulty="MEDIUM",
            duration=20,
            passing_score=50,
            max_attempts=2,
            status=STATUS_DRAFT,
        )
        db.session.add(quiz)
        db.session.commit()
        return quiz.id


def test_unauthenticated_cannot_access_student_quizzes(client):
    res = client.get("/api/student/quizzes")
    assert res.status_code == 401


def test_admin_cannot_access_student_quizzes(client, admin_user):
    token = get_token(client, admin_user["email"], admin_user["password"])
    res = client.get("/api/student/quizzes", headers=auth_header(token))
    assert res.status_code == 403


def test_student_can_access_student_quiz_listing(client, student_user_data, sample_published_quiz):
    token = get_token(client, student_user_data["email"], student_user_data["password"])
    res = client.get("/api/student/quizzes", headers=auth_header(token))
    assert res.status_code == 200
    data = res.get_json()
    assert isinstance(data, list)


def test_only_published_quizzes_appear(client, student_user_data, sample_published_quiz, sample_draft_quiz):
    token = get_token(client, student_user_data["email"], student_user_data["password"])
    res = client.get("/api/student/quizzes", headers=auth_header(token))
    assert res.status_code == 200
    quiz_ids = [q["id"] for q in res.get_json()]
    assert sample_published_quiz in quiz_ids
    assert sample_draft_quiz not in quiz_ids


def test_draft_quizzes_do_not_appear(client, student_user_data, sample_draft_quiz):
    token = get_token(client, student_user_data["email"], student_user_data["password"])
    res = client.get("/api/student/quizzes", headers=auth_header(token))
    assert res.status_code == 200
    quiz_ids = [q["id"] for q in res.get_json()]
    assert sample_draft_quiz not in quiz_ids


def test_quiz_details_return_expected_metadata(client, student_user_data, sample_published_quiz):
    token = get_token(client, student_user_data["email"], student_user_data["password"])
    res = client.get(f"/api/student/quizzes/{sample_published_quiz}", headers=auth_header(token))
    assert res.status_code == 200
    quiz_data = res.get_json()["quiz"]
    assert quiz_data["id"] == sample_published_quiz
    assert quiz_data["title"] == "Sample Published Quiz"

    assert quiz_data["duration"] == 30
    assert quiz_data["passing_score"] == 40
    assert quiz_data["max_attempts"] == 3


def test_correct_question_count_is_returned(client, student_user_data, sample_published_quiz):
    token = get_token(client, student_user_data["email"], student_user_data["password"])
    res = client.get(f"/api/student/quizzes/{sample_published_quiz}", headers=auth_header(token))
    assert res.status_code == 200
    quiz_data = res.get_json()["quiz"]
    assert quiz_data["question_count"] == 2


def test_student_can_start_published_quiz(client, student_user_data, sample_published_quiz):
    token = get_token(client, student_user_data["email"], student_user_data["password"])
    res = client.post(f"/api/quizzes/{sample_published_quiz}/start", headers=auth_header(token))
    assert res.status_code in [200, 201]
    data = res.get_json()
    assert "attempt_id" in data or "id" in data
    assert data["quiz_id"] == sample_published_quiz
    assert "started_at" in data
    assert "expires_at" in data


def test_student_cannot_start_draft_quiz(client, student_user_data, sample_draft_quiz):
    token = get_token(client, student_user_data["email"], student_user_data["password"])
    res = client.post(f"/api/quizzes/{sample_draft_quiz}/start", headers=auth_header(token))
    assert res.status_code == 404


def test_admin_cannot_start_quiz_as_student(client, admin_user, sample_published_quiz):
    token = get_token(client, admin_user["email"], admin_user["password"])
    res = client.post(f"/api/quizzes/{sample_published_quiz}/start", headers=auth_header(token))
    assert res.status_code == 403


def test_invalid_quiz_id_returns_404(client, student_user_data):
    token = get_token(client, student_user_data["email"], student_user_data["password"])
    res = client.post("/api/quizzes/99999/start", headers=auth_header(token))
    assert res.status_code == 404


def test_inactive_student_cannot_start_quiz(client, inactive_student_data, sample_published_quiz):
    token = get_token(client, inactive_student_data["email"], inactive_student_data["password"])
    res = client.post(f"/api/quizzes/{sample_published_quiz}/start", headers=auth_header(token))
    assert res.status_code == 401


def test_start_response_contains_attempt_id(client, student_user_data, sample_published_quiz):
    token = get_token(client, student_user_data["email"], student_user_data["password"])
    res = client.post(f"/api/quizzes/{sample_published_quiz}/start", headers=auth_header(token))
    data = res.get_json()
    assert data.get("attempt_id") is not None or data.get("id") is not None


def test_start_response_contains_expires_at(client, student_user_data, sample_published_quiz):
    token = get_token(client, student_user_data["email"], student_user_data["password"])
    res = client.post(f"/api/quizzes/{sample_published_quiz}/start", headers=auth_header(token))
    data = res.get_json()
    assert "expires_at" in data


def test_student_response_does_not_contain_is_correct(client, student_user_data, sample_published_quiz):
    token = get_token(client, student_user_data["email"], student_user_data["password"])
    res = client.post(f"/api/quizzes/{sample_published_quiz}/start", headers=auth_header(token))
    text = res.get_data(as_text=True)
    assert "is_correct" not in text


def test_student_response_does_not_contain_correct_answer(client, student_user_data, sample_published_quiz):
    token = get_token(client, student_user_data["email"], student_user_data["password"])
    res = client.post(f"/api/quizzes/{sample_published_quiz}/start", headers=auth_header(token))
    text = res.get_data(as_text=True)
    assert "correct_answer" not in text


def test_student_cannot_access_another_students_attempt(client, student_user_data, student_user_2_data, sample_published_quiz):
    token1 = get_token(client, student_user_data["email"], student_user_data["password"])
    token2 = get_token(client, student_user_2_data["email"], student_user_2_data["password"])

    res_start = client.post(f"/api/quizzes/{sample_published_quiz}/start", headers=auth_header(token1))
    attempt_id = res_start.get_json()["attempt_id"]

    res_access = client.get(f"/api/attempts/{attempt_id}", headers=auth_header(token2))
    assert res_access.status_code == 403


def test_student_cannot_manipulate_quiz_ownership(client, student_user_data, student_user_2_data, sample_published_quiz):
    token1 = get_token(client, student_user_data["email"], student_user_data["password"])
    token2 = get_token(client, student_user_2_data["email"], student_user_2_data["password"])

    res_start = client.post(f"/api/quizzes/{sample_published_quiz}/start", headers=auth_header(token1))
    attempt_id = res_start.get_json()["attempt_id"]

    res_ans = client.post(
        f"/api/attempts/{attempt_id}/answers",
        headers=auth_header(token2),
        json={"question_id": 1, "selected_option_id": 1},
    )
    assert res_ans.status_code == 403


def test_started_quiz_returns_questions(client, student_user_data, sample_published_quiz):
    token = get_token(client, student_user_data["email"], student_user_data["password"])
    res = client.post(f"/api/quizzes/{sample_published_quiz}/start", headers=auth_header(token))
    data = res.get_json()
    assert "questions" in data
    assert len(data["questions"]) == 2


def test_each_question_contains_four_options(client, student_user_data, sample_published_quiz):
    token = get_token(client, student_user_data["email"], student_user_data["password"])
    res = client.post(f"/api/quizzes/{sample_published_quiz}/start", headers=auth_header(token))
    questions = res.get_json()["questions"]
    for q in questions:
        assert len(q["options"]) == 4


def test_options_do_not_expose_correctness(client, student_user_data, sample_published_quiz):
    token = get_token(client, student_user_data["email"], student_user_data["password"])
    res = client.post(f"/api/quizzes/{sample_published_quiz}/start", headers=auth_header(token))
    questions = res.get_json()["questions"]
    for q in questions:
        for opt in q["options"]:
            assert "is_correct" not in opt


def test_questions_belong_to_requested_quiz(client, student_user_data, sample_published_quiz):
    token = get_token(client, student_user_data["email"], student_user_data["password"])
    res = client.post(f"/api/quizzes/{sample_published_quiz}/start", headers=auth_header(token))
    questions = res.get_json()["questions"]
    for q in questions:
        assert q["quiz_id"] == sample_published_quiz


def test_refresh_retrieval_returns_same_active_attempt(client, student_user_data, sample_published_quiz):
    token = get_token(client, student_user_data["email"], student_user_data["password"])
    res_start = client.post(f"/api/quizzes/{sample_published_quiz}/start", headers=auth_header(token))
    attempt_id = res_start.get_json()["attempt_id"]

    res_get = client.get(f"/api/attempts/{attempt_id}", headers=auth_header(token))
    assert res_get.status_code == 200
    assert res_get.get_json()["attempt_id"] == attempt_id


def test_duplicate_start_does_not_create_accidental_duplicate(client, student_user_data, sample_published_quiz):
    token = get_token(client, student_user_data["email"], student_user_data["password"])
    res_1 = client.post(f"/api/quizzes/{sample_published_quiz}/start", headers=auth_header(token))
    attempt_id_1 = res_1.get_json()["attempt_id"]

    res_2 = client.post(f"/api/quizzes/{sample_published_quiz}/start", headers=auth_header(token))
    attempt_id_2 = res_2.get_json()["attempt_id"]

    assert attempt_id_1 == attempt_id_2


def test_attempt_belongs_to_authenticated_student(client, student_user_data, sample_published_quiz):
    token = get_token(client, student_user_data["email"], student_user_data["password"])
    res = client.post(f"/api/quizzes/{sample_published_quiz}/start", headers=auth_header(token))
    data = res.get_json()
    assert data["user_id"] == student_user_data["id"]


def test_expires_at_is_based_on_quiz_duration(client, student_user_data, sample_published_quiz):
    token = get_token(client, student_user_data["email"], student_user_data["password"])
    res = client.post(f"/api/quizzes/{sample_published_quiz}/start", headers=auth_header(token))
    data = res.get_json()
    started = datetime.fromisoformat(data["started_at"])
    expires = datetime.fromisoformat(data["expires_at"])
    diff = expires - started
    assert abs(diff.total_seconds() - (30 * 60)) < 5


def test_expired_attempt_is_detected(app, client, student_user_data, sample_published_quiz):
    token = get_token(client, student_user_data["email"], student_user_data["password"])
    res_start = client.post(f"/api/quizzes/{sample_published_quiz}/start", headers=auth_header(token))
    attempt_id = res_start.get_json()["attempt_id"]

    with app.app_context():
        attempt = db.session.get(Attempt, attempt_id)
        attempt.expires_at = datetime.utcnow() - timedelta(minutes=10)
        db.session.commit()

    res_get = client.get(f"/api/attempts/{attempt_id}", headers=auth_header(token))
    assert res_get.status_code == 200
    assert res_get.get_json()["status"] == STATUS_EXPIRED


def test_timeout_cannot_be_triggered_for_another_student(client, student_user_data, student_user_2_data, sample_published_quiz):
    token1 = get_token(client, student_user_data["email"], student_user_data["password"])
    token2 = get_token(client, student_user_2_data["email"], student_user_2_data["password"])

    res_start = client.post(f"/api/quizzes/{sample_published_quiz}/start", headers=auth_header(token1))
    attempt_id = res_start.get_json()["attempt_id"]

    res_timeout = client.post(f"/api/attempts/{attempt_id}/timeout", headers=auth_header(token2))
    assert res_timeout.status_code == 403
