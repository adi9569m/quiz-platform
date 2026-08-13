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
            name="Student Eight",
            email="student8@example.com",
            role=ROLE_STUDENT,
            status=STATUS_ACTIVE,
        )
        u.set_password("StudentPassword123")
        db.session.add(u)
        db.session.commit()
        return {"id": u.id, "email": u.email, "password": "StudentPassword123"}


@pytest.fixture
def student_user_two(app):
    with app.app_context():
        u = User(
            name="Student Eight Two",
            email="student8two@example.com",
            role=ROLE_STUDENT,
            status=STATUS_ACTIVE,
        )
        u.set_password("StudentPassword123")
        db.session.add(u)
        db.session.commit()
        return {"id": u.id, "email": u.email, "password": "StudentPassword123"}


@pytest.fixture
def test_quiz_with_questions(app):
    with app.app_context():
        cat = Category(name="Day 8 Test Category", description="Category for day 8 testing")
        db.session.add(cat)
        db.session.commit()

        quiz = Quiz(
            title="Day 8 Test Quiz",
            description="Quiz for submission testing",
            category_id=cat.id,
            difficulty="MEDIUM",
            duration=15,
            passing_score=60,
            max_attempts=5,
            status=STATUS_PUBLISHED,
        )
        db.session.add(quiz)
        db.session.commit()

        # Question 1: 2 marks
        q1 = Question(quiz_id=quiz.id, question_text="What is 2 + 2?", question_type="MCQ", marks=2)
        db.session.add(q1)
        db.session.commit()
        opt1_corr = QuestionOption(question_id=q1.id, option_text="4", option_key="A", is_correct=True)
        opt1_wrong = QuestionOption(question_id=q1.id, option_text="5", option_key="B", is_correct=False)
        db.session.add_all([opt1_corr, opt1_wrong])

        # Question 2: 3 marks
        q2 = Question(quiz_id=quiz.id, question_text="Capital of France?", question_type="MCQ", marks=3)
        db.session.add(q2)
        db.session.commit()
        opt2_corr = QuestionOption(question_id=q2.id, option_text="Paris", option_key="A", is_correct=True)
        opt2_wrong = QuestionOption(question_id=q2.id, option_text="London", option_key="B", is_correct=False)
        db.session.add_all([opt2_corr, opt2_wrong])

        # Question 3: 5 marks
        q3 = Question(quiz_id=quiz.id, question_text="Is Python interpreted?", question_type="MCQ", marks=5)
        db.session.add(q3)
        db.session.commit()
        opt3_corr = QuestionOption(question_id=q3.id, option_text="Yes", option_key="A", is_correct=True)
        opt3_wrong = QuestionOption(question_id=q3.id, option_text="No", option_key="B", is_correct=False)
        db.session.add_all([opt3_corr, opt3_wrong])

        db.session.commit()

        return {
            "quiz_id": quiz.id,
            "q1_id": q1.id,
            "q1_corr": opt1_corr.id,
            "q1_wrong": opt1_wrong.id,
            "q2_id": q2.id,
            "q2_corr": opt2_corr.id,
            "q2_wrong": opt2_wrong.id,
            "q3_id": q3.id,
            "q3_corr": opt3_corr.id,
            "q3_wrong": opt3_wrong.id,
        }


# 1. Student can submit own active attempt.
def test_student_can_submit_own_active_attempt(client, student_user, test_quiz_with_questions):
    token = get_token(client, student_user["email"], student_user["password"])
    quiz_id = test_quiz_with_questions["quiz_id"]
    res_start = client.post(f"/api/quizzes/{quiz_id}/start", headers=auth_header(token))
    attempt_id = res_start.get_json()["attempt_id"]

    res_sub = client.post(f"/api/attempts/{attempt_id}/submit", headers=auth_header(token))
    assert res_sub.status_code == 200


# 2. Submission returns calculated result.
def test_submission_returns_calculated_result(client, student_user, test_quiz_with_questions):
    token = get_token(client, student_user["email"], student_user["password"])
    quiz_id = test_quiz_with_questions["quiz_id"]
    res_start = client.post(f"/api/quizzes/{quiz_id}/start", headers=auth_header(token))
    attempt_id = res_start.get_json()["attempt_id"]

    res_sub = client.post(f"/api/attempts/{attempt_id}/submit", headers=auth_header(token))
    data = res_sub.get_json()
    assert "total_marks" in data
    assert "obtained_marks" in data
    assert "percentage" in data
    assert "correct_answers" in data
    assert "incorrect_answers" in data
    assert "unanswered" in data
    assert "status" in data


# 3. Admin cannot submit as student.
def test_admin_cannot_submit_as_student(client, admin_user, student_user, test_quiz_with_questions):
    token_st = get_token(client, student_user["email"], student_user["password"])
    token_ad = get_token(client, admin_user["email"], admin_user["password"])
    quiz_id = test_quiz_with_questions["quiz_id"]

    res_start = client.post(f"/api/quizzes/{quiz_id}/start", headers=auth_header(token_st))
    attempt_id = res_start.get_json()["attempt_id"]

    res_sub = client.post(f"/api/attempts/{attempt_id}/submit", headers=auth_header(token_ad))
    assert res_sub.status_code == 403


# 4. Unauthenticated user cannot submit.
def test_unauthenticated_cannot_submit(client, student_user, test_quiz_with_questions):
    token = get_token(client, student_user["email"], student_user["password"])
    quiz_id = test_quiz_with_questions["quiz_id"]
    res_start = client.post(f"/api/quizzes/{quiz_id}/start", headers=auth_header(token))
    attempt_id = res_start.get_json()["attempt_id"]

    res_sub = client.post(f"/api/attempts/{attempt_id}/submit")
    assert res_sub.status_code == 401


# 5. Invalid attempt ID returns 404.
def test_invalid_attempt_id_returns_404(client, student_user):
    token = get_token(client, student_user["email"], student_user["password"])
    res = client.post("/api/attempts/999999/submit", headers=auth_header(token))
    assert res.status_code == 404


# 6. Student cannot submit another student's attempt.
def test_student_cannot_submit_another_students_attempt(client, student_user, student_user_two, test_quiz_with_questions):
    token1 = get_token(client, student_user["email"], student_user["password"])
    token2 = get_token(client, student_user_two["email"], student_user_two["password"])
    quiz_id = test_quiz_with_questions["quiz_id"]

    res_start = client.post(f"/api/quizzes/{quiz_id}/start", headers=auth_header(token1))
    attempt_id = res_start.get_json()["attempt_id"]

    res_sub = client.post(f"/api/attempts/{attempt_id}/submit", headers=auth_header(token2))
    assert res_sub.status_code == 403


# 7 - 16: SCORING TESTS
def test_correct_incorrect_unanswered_marks_calculation(client, student_user, test_quiz_with_questions):
    token = get_token(client, student_user["email"], student_user["password"])
    info = test_quiz_with_questions
    quiz_id = info["quiz_id"]

    res_start = client.post(f"/api/quizzes/{quiz_id}/start", headers=auth_header(token))
    attempt_id = res_start.get_json()["attempt_id"]

    # Q1 (2 marks): Correct
    client.post(f"/api/attempts/{attempt_id}/answers", headers=auth_header(token), json={"question_id": info["q1_id"], "selected_option_id": info["q1_corr"]})

    # Q2 (3 marks): Incorrect
    client.post(f"/api/attempts/{attempt_id}/answers", headers=auth_header(token), json={"question_id": info["q2_id"], "selected_option_id": info["q2_wrong"]})

    # Q3 (5 marks): Unanswered

    res_sub = client.post(f"/api/attempts/{attempt_id}/submit", headers=auth_header(token))
    assert res_sub.status_code == 200
    data = res_sub.get_json()

    assert data["correct_answers"] == 1
    assert data["incorrect_answers"] == 1
    assert data["unanswered"] == 1
    assert data["total_marks"] == 10  # 2 + 3 + 5
    assert data["obtained_marks"] == 2  # Q1 correct (2)
    assert data["percentage"] == 20.0  # (2 / 10) * 100
    assert data["status"] == STATUS_FAILED  # 20% < 60% passing score


def test_pass_status_calculated_correctly(client, student_user, test_quiz_with_questions):
    token = get_token(client, student_user["email"], student_user["password"])
    info = test_quiz_with_questions
    quiz_id = info["quiz_id"]

    res_start = client.post(f"/api/quizzes/{quiz_id}/start", headers=auth_header(token))
    attempt_id = res_start.get_json()["attempt_id"]

    # Q1 (2 marks): Correct, Q2 (3 marks): Incorrect, Q3 (5 marks): Correct -> Total 7 / 10 = 70% >= 60%
    client.post(f"/api/attempts/{attempt_id}/answers", headers=auth_header(token), json={"question_id": info["q1_id"], "selected_option_id": info["q1_corr"]})
    client.post(f"/api/attempts/{attempt_id}/answers", headers=auth_header(token), json={"question_id": info["q2_id"], "selected_option_id": info["q2_wrong"]})
    client.post(f"/api/attempts/{attempt_id}/answers", headers=auth_header(token), json={"question_id": info["q3_id"], "selected_option_id": info["q3_corr"]})

    res_sub = client.post(f"/api/attempts/{attempt_id}/submit", headers=auth_header(token))
    data = res_sub.get_json()
    assert data["obtained_marks"] == 7
    assert data["total_marks"] == 10
    assert data["percentage"] == 70.0
    assert data["status"] == STATUS_PASSED


def test_no_negative_marking_is_applied(client, student_user, test_quiz_with_questions):
    token = get_token(client, student_user["email"], student_user["password"])
    info = test_quiz_with_questions
    quiz_id = info["quiz_id"]

    res_start = client.post(f"/api/quizzes/{quiz_id}/start", headers=auth_header(token))
    attempt_id = res_start.get_json()["attempt_id"]

    # Answer all wrong
    client.post(f"/api/attempts/{attempt_id}/answers", headers=auth_header(token), json={"question_id": info["q1_id"], "selected_option_id": info["q1_wrong"]})
    client.post(f"/api/attempts/{attempt_id}/answers", headers=auth_header(token), json={"question_id": info["q2_id"], "selected_option_id": info["q2_wrong"]})
    client.post(f"/api/attempts/{attempt_id}/answers", headers=auth_header(token), json={"question_id": info["q3_id"], "selected_option_id": info["q3_wrong"]})

    res_sub = client.post(f"/api/attempts/{attempt_id}/submit", headers=auth_header(token))
    data = res_sub.get_json()
    assert data["obtained_marks"] == 0
    assert data["percentage"] == 0.0
    assert data["status"] == STATUS_FAILED


# 17 - 20: TIME & EXPIRATION TESTS
def test_time_taken_calculated_by_backend(client, student_user, test_quiz_with_questions):
    token = get_token(client, student_user["email"], student_user["password"])
    quiz_id = test_quiz_with_questions["quiz_id"]
    res_start = client.post(f"/api/quizzes/{quiz_id}/start", headers=auth_header(token))
    attempt_id = res_start.get_json()["attempt_id"]

    res_sub = client.post(f"/api/attempts/{attempt_id}/submit", headers=auth_header(token))
    data = res_sub.get_json()
    assert "time_taken" in data
    assert isinstance(data["time_taken"], int)
    assert data["time_taken"] >= 0


def test_expired_attempt_cannot_be_submitted_as_normal_and_is_auto_scored(app, client, student_user, test_quiz_with_questions):
    token = get_token(client, student_user["email"], student_user["password"])
    info = test_quiz_with_questions
    quiz_id = info["quiz_id"]

    res_start = client.post(f"/api/quizzes/{quiz_id}/start", headers=auth_header(token))
    attempt_id = res_start.get_json()["attempt_id"]

    # Save 1 correct answer before expiry
    client.post(f"/api/attempts/{attempt_id}/answers", headers=auth_header(token), json={"question_id": info["q1_id"], "selected_option_id": info["q1_corr"]})

    # Force expiration in DB
    with app.app_context():
        attempt = db.session.get(Attempt, attempt_id)
        attempt.expires_at = datetime.utcnow() - timedelta(minutes=5)
        db.session.commit()

    # GET request detects expiration and auto-finalizes
    res_get = client.get(f"/api/attempts/{attempt_id}", headers=auth_header(token))
    assert res_get.status_code == 200
    data = res_get.get_json()
    assert data["status"] != STATUS_IN_PROGRESS

    # Subsequent submission request fails because already finalized
    res_sub = client.post(f"/api/attempts/{attempt_id}/submit", headers=auth_header(token))
    assert res_sub.status_code == 409


# 21 - 28: SECURITY & INTEGRITY TESTS
def test_frontend_cannot_submit_fake_score(client, student_user, test_quiz_with_questions):
    token = get_token(client, student_user["email"], student_user["password"])
    quiz_id = test_quiz_with_questions["quiz_id"]
    res_start = client.post(f"/api/quizzes/{quiz_id}/start", headers=auth_header(token))
    attempt_id = res_start.get_json()["attempt_id"]

    # Attempt payload with fake score/percentage/correct_answers
    res_sub = client.post(
        f"/api/attempts/{attempt_id}/submit",
        headers=auth_header(token),
        json={"obtained_marks": 100, "percentage": 100.0, "status": "PASSED", "correct_answers": 100, "time_taken": 1},
    )
    assert res_sub.status_code == 200
    data = res_sub.get_json()
    # Backend ignores fake values and calculates correctly for unanswered quiz
    assert data["obtained_marks"] == 0
    assert data["percentage"] == 0.0
    assert data["status"] == STATUS_FAILED


def test_completed_attempt_cannot_be_submitted_again(client, student_user, test_quiz_with_questions):
    token = get_token(client, student_user["email"], student_user["password"])
    quiz_id = test_quiz_with_questions["quiz_id"]
    res_start = client.post(f"/api/quizzes/{quiz_id}/start", headers=auth_header(token))
    attempt_id = res_start.get_json()["attempt_id"]

    res_1 = client.post(f"/api/attempts/{attempt_id}/submit", headers=auth_header(token))
    assert res_1.status_code == 200

    res_2 = client.post(f"/api/attempts/{attempt_id}/submit", headers=auth_header(token))
    assert res_2.status_code == 409


def test_completed_attempt_answers_cannot_be_modified(client, student_user, test_quiz_with_questions):
    token = get_token(client, student_user["email"], student_user["password"])
    info = test_quiz_with_questions
    quiz_id = info["quiz_id"]

    res_start = client.post(f"/api/quizzes/{quiz_id}/start", headers=auth_header(token))
    attempt_id = res_start.get_json()["attempt_id"]

    # Submit attempt
    client.post(f"/api/attempts/{attempt_id}/submit", headers=auth_header(token))

    # Try saving new answer
    res_ans = client.post(
        f"/api/attempts/{attempt_id}/answers",
        headers=auth_header(token),
        json={"question_id": info["q1_id"], "selected_option_id": info["q1_corr"]},
    )
    assert res_ans.status_code == 400


def test_expired_attempt_answers_cannot_be_modified(app, client, student_user, test_quiz_with_questions):
    token = get_token(client, student_user["email"], student_user["password"])
    info = test_quiz_with_questions
    quiz_id = info["quiz_id"]

    res_start = client.post(f"/api/quizzes/{quiz_id}/start", headers=auth_header(token))
    attempt_id = res_start.get_json()["attempt_id"]

    # Force expiration in DB
    with app.app_context():
        attempt = db.session.get(Attempt, attempt_id)
        attempt.expires_at = datetime.utcnow() - timedelta(minutes=5)
        db.session.commit()

    res_ans = client.post(
        f"/api/attempts/{attempt_id}/answers",
        headers=auth_header(token),
        json={"question_id": info["q1_id"], "selected_option_id": info["q1_corr"]},
    )
    assert res_ans.status_code == 400


# 29 - 34: PERSISTENCE & DATA INTEGRITY TESTS
def test_result_persisted_to_database(app, client, student_user, test_quiz_with_questions):
    token = get_token(client, student_user["email"], student_user["password"])
    info = test_quiz_with_questions
    quiz_id = info["quiz_id"]

    res_start = client.post(f"/api/quizzes/{quiz_id}/start", headers=auth_header(token))
    attempt_id = res_start.get_json()["attempt_id"]

    client.post(f"/api/attempts/{attempt_id}/answers", headers=auth_header(token), json={"question_id": info["q1_id"], "selected_option_id": info["q1_corr"]})
    client.post(f"/api/attempts/{attempt_id}/submit", headers=auth_header(token))

    with app.app_context():
        attempt = db.session.get(Attempt, attempt_id)
        assert attempt.status == STATUS_FAILED  # 2 / 10 = 20% < 60%
        assert attempt.obtained_marks == 2
        assert attempt.total_marks == 10
        assert attempt.percentage == 20.0
        assert attempt.completed_at is not None

        ans = AttemptAnswer.query.filter_by(attempt_id=attempt.id, question_id=info["q1_id"]).first()
        assert ans is not None
        assert ans.is_correct is True
