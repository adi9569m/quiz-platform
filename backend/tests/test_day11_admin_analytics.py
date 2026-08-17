from datetime import datetime, timedelta
from app.extensions import db
from app.models import (
    User,
    ROLE_STUDENT,
    ROLE_ADMIN,
    STATUS_ACTIVE,
    Quiz,
    STATUS_PUBLISHED,
    Category,
    Attempt,
    STATUS_IN_PROGRESS,
    STATUS_PASSED,
    STATUS_FAILED,
    STATUS_EXPIRED,
)


def _get_token(client, email, password):
    res = client.post(
        "/api/auth/login",
        json={"email": email, "password": password}
    )
    return res.get_json()["access_token"]


def test_unauthenticated_cannot_access_analytics(client):
    res = client.get("/api/admin/analytics")
    assert res.status_code == 401


def test_student_cannot_access_analytics(client, student_user):
    token = _get_token(client, student_user["email"], student_user["password"])
    res = client.get(
        "/api/admin/analytics",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 403


def test_admin_can_access_analytics(client, admin_user):
    token = _get_token(client, admin_user["email"], admin_user["password"])
    res = client.get(
        "/api/admin/analytics",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    data = res.get_json()
    assert "attempts_over_time" in data
    assert "student_registrations" in data
    assert "average_quiz_scores" in data
    assert "pass_fail_ratio" in data
    assert "popular_quizzes" in data
    assert "popular_categories" in data


def test_empty_data_analytics(client, admin_user):
    token = _get_token(client, admin_user["email"], admin_user["password"])
    res = client.get(
        "/api/admin/analytics",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    data = res.get_json()
    assert data["attempts_over_time"] == []
    assert data["average_quiz_scores"] == []
    assert data["pass_fail_ratio"] == {"passed": 0, "failed": 0}
    assert data["popular_quizzes"] == []
    assert data["popular_categories"] == []


def test_attempts_over_time_finalized_only(app, client, admin_user, student_user):
    with app.app_context():
        category = Category(name="General Science")
        db.session.add(category)
        db.session.commit()

        quiz = Quiz(
            title="Science Basics",
            category_id=category.id,
            difficulty="EASY",
            duration=10,
            passing_score=50,
            max_attempts=3,
            status=STATUS_PUBLISHED
        )
        db.session.add(quiz)
        db.session.commit()

        date_1 = datetime(2026, 8, 1, 10, 0, 0)
        date_2 = datetime(2026, 8, 2, 12, 0, 0)

        att1 = Attempt(
            quiz_id=quiz.id,
            user_id=student_user["id"],
            started_at=date_1 - timedelta(minutes=5),
            expires_at=date_1 + timedelta(minutes=5),
            completed_at=date_1,
            status=STATUS_PASSED,
            percentage=80.0
        )
        att2 = Attempt(
            quiz_id=quiz.id,
            user_id=student_user["id"],
            started_at=date_1 - timedelta(minutes=5),
            expires_at=date_1 + timedelta(minutes=5),
            completed_at=date_1,
            status=STATUS_FAILED,
            percentage=40.0
        )
        att3 = Attempt(
            quiz_id=quiz.id,
            user_id=student_user["id"],
            started_at=date_2 - timedelta(minutes=5),
            expires_at=date_2 + timedelta(minutes=5),
            completed_at=date_2,
            status=STATUS_PASSED,
            percentage=90.0
        )
        att4 = Attempt(
            quiz_id=quiz.id,
            user_id=student_user["id"],
            started_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(minutes=10),
            status=STATUS_IN_PROGRESS
        )
        db.session.add_all([att1, att2, att3, att4])
        db.session.commit()

    token = _get_token(client, admin_user["email"], admin_user["password"])
    res = client.get(
        "/api/admin/analytics",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    data = res.get_json()
    attempts_over_time = data["attempts_over_time"]

    assert len(attempts_over_time) == 2
    assert attempts_over_time[0] == {"date": "2026-08-01", "attempts": 2}
    assert attempts_over_time[1] == {"date": "2026-08-02", "attempts": 1}


def test_student_registrations(app, client, admin_user):
    with app.app_context():
        s1 = User(
            name="Student 1",
            email="s1@example.com",
            role=ROLE_STUDENT,
            status=STATUS_ACTIVE,
            created_at=datetime(2026, 8, 1, 9, 0, 0)
        )
        s1.set_password("Pass1234")

        s2 = User(
            name="Student 2",
            email="s2@example.com",
            role=ROLE_STUDENT,
            status=STATUS_ACTIVE,
            created_at=datetime(2026, 8, 2, 14, 0, 0)
        )
        s2.set_password("Pass1234")

        a2 = User(
            name="Admin 2",
            email="admin2@example.com",
            role=ROLE_ADMIN,
            status=STATUS_ACTIVE,
            created_at=datetime(2026, 8, 2, 15, 0, 0)
        )
        a2.set_password("Pass1234")

        db.session.add_all([s1, s2, a2])
        db.session.commit()

    token = _get_token(client, admin_user["email"], admin_user["password"])
    res = client.get(
        "/api/admin/analytics",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    data = res.get_json()
    registrations = data["student_registrations"]

    aug1 = next((r for r in registrations if r["date"] == "2026-08-01"), None)
    aug2 = next((r for r in registrations if r["date"] == "2026-08-02"), None)
    assert aug1 is not None and aug1["registrations"] >= 1
    assert aug2 is not None and aug2["registrations"] == 1


def test_average_quiz_scores(app, client, admin_user, student_user):
    with app.app_context():
        category = Category(name="Math")
        db.session.add(category)
        db.session.commit()

        q1 = Quiz(
            title="Algebra",
            category_id=category.id,
            difficulty="EASY",
            duration=10,
            passing_score=50,
            max_attempts=3,
            status=STATUS_PUBLISHED
        )
        q2 = Quiz(
            title="Geometry",
            category_id=category.id,
            difficulty="MEDIUM",
            duration=15,
            passing_score=60,
            max_attempts=3,
            status=STATUS_PUBLISHED
        )
        db.session.add_all([q1, q2])
        db.session.commit()

        now = datetime.utcnow()
        att1 = Attempt(
            quiz_id=q1.id, user_id=student_user["id"],
            started_at=now, expires_at=now, completed_at=now,
            status=STATUS_PASSED, percentage=80.0
        )
        att2 = Attempt(
            quiz_id=q1.id, user_id=student_user["id"],
            started_at=now, expires_at=now, completed_at=now,
            status=STATUS_PASSED, percentage=60.0
        )
        att3 = Attempt(
            quiz_id=q2.id, user_id=student_user["id"],
            started_at=now, expires_at=now + timedelta(minutes=15),
            status=STATUS_IN_PROGRESS, percentage=0.0
        )
        db.session.add_all([att1, att2, att3])
        db.session.commit()

    token = _get_token(client, admin_user["email"], admin_user["password"])
    res = client.get(
        "/api/admin/analytics",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    data = res.get_json()
    avg_scores = data["average_quiz_scores"]

    q1_avg = next((s for s in avg_scores if s["quiz_title"] == "Algebra"), None)
    q2_avg = next((s for s in avg_scores if s["quiz_title"] == "Geometry"), None)

    assert q1_avg is not None
    assert q1_avg["average_score"] == 70.0
    assert q2_avg is None


def test_pass_fail_ratio(app, client, admin_user, student_user):
    with app.app_context():
        category = Category(name="History")
        db.session.add(category)
        db.session.commit()

        quiz = Quiz(
            title="World History",
            category_id=category.id,
            difficulty="EASY",
            duration=10,
            passing_score=50,
            max_attempts=5,
            status=STATUS_PUBLISHED
        )
        db.session.add(quiz)
        db.session.commit()

        now = datetime.utcnow()
        att_pass1 = Attempt(quiz_id=quiz.id, user_id=student_user["id"], started_at=now, expires_at=now, completed_at=now, status=STATUS_PASSED, percentage=90)
        att_pass2 = Attempt(quiz_id=quiz.id, user_id=student_user["id"], started_at=now, expires_at=now, completed_at=now, status=STATUS_PASSED, percentage=80)
        att_fail = Attempt(quiz_id=quiz.id, user_id=student_user["id"], started_at=now, expires_at=now, completed_at=now, status=STATUS_FAILED, percentage=30)
        att_exp = Attempt(quiz_id=quiz.id, user_id=student_user["id"], started_at=now, expires_at=now, completed_at=now, status=STATUS_EXPIRED, percentage=20)
        att_prog = Attempt(quiz_id=quiz.id, user_id=student_user["id"], started_at=now, expires_at=now + timedelta(minutes=10), status=STATUS_IN_PROGRESS)

        db.session.add_all([att_pass1, att_pass2, att_fail, att_exp, att_prog])
        db.session.commit()

    token = _get_token(client, admin_user["email"], admin_user["password"])
    res = client.get(
        "/api/admin/analytics",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    data = res.get_json()
    ratio = data["pass_fail_ratio"]
    assert ratio["passed"] == 2
    assert ratio["failed"] == 2


def test_popular_quizzes_ranking(app, client, admin_user, student_user):
    with app.app_context():
        category = Category(name="Tech")
        db.session.add(category)
        db.session.commit()

        q_python = Quiz(title="Python Quiz", category_id=category.id, difficulty="EASY", duration=10, passing_score=50, max_attempts=10, status=STATUS_PUBLISHED)
        q_java = Quiz(title="Java Quiz", category_id=category.id, difficulty="EASY", duration=10, passing_score=50, max_attempts=10, status=STATUS_PUBLISHED)
        db.session.add_all([q_python, q_java])
        db.session.commit()

        now = datetime.utcnow()
        for _ in range(3):
            db.session.add(Attempt(quiz_id=q_python.id, user_id=student_user["id"], started_at=now, expires_at=now, completed_at=now, status=STATUS_PASSED, percentage=80))
        db.session.add(Attempt(quiz_id=q_java.id, user_id=student_user["id"], started_at=now, expires_at=now, completed_at=now, status=STATUS_PASSED, percentage=75))
        db.session.commit()

    token = _get_token(client, admin_user["email"], admin_user["password"])
    res = client.get(
        "/api/admin/analytics",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    data = res.get_json()
    popular = data["popular_quizzes"]
    assert len(popular) >= 2
    assert popular[0]["quiz_title"] == "Python Quiz"
    assert popular[0]["attempt_count"] == 3
    assert popular[1]["quiz_title"] == "Java Quiz"
    assert popular[1]["attempt_count"] == 1


def test_popular_categories_ranking(app, client, admin_user, student_user):
    with app.app_context():
        cat1 = Category(name="Programming Languages")
        cat2 = Category(name="World Geography")
        db.session.add_all([cat1, cat2])
        db.session.commit()

        q1 = Quiz(title="C++ Quiz", category_id=cat1.id, difficulty="HARD", duration=20, passing_score=60, max_attempts=5, status=STATUS_PUBLISHED)
        q2 = Quiz(title="Capitals Quiz", category_id=cat2.id, difficulty="EASY", duration=10, passing_score=50, max_attempts=5, status=STATUS_PUBLISHED)
        db.session.add_all([q1, q2])
        db.session.commit()

        now = datetime.utcnow()
        for _ in range(4):
            db.session.add(Attempt(quiz_id=q1.id, user_id=student_user["id"], started_at=now, expires_at=now, completed_at=now, status=STATUS_PASSED, percentage=85))
        for _ in range(2):
            db.session.add(Attempt(quiz_id=q2.id, user_id=student_user["id"], started_at=now, expires_at=now, completed_at=now, status=STATUS_PASSED, percentage=70))
        db.session.commit()

    token = _get_token(client, admin_user["email"], admin_user["password"])
    res = client.get(
        "/api/admin/analytics",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    data = res.get_json()
    popular_cats = data["popular_categories"]
    assert len(popular_cats) >= 2
    assert popular_cats[0]["category"] == "Programming Languages"
    assert popular_cats[0]["attempt_count"] == 4
    assert popular_cats[1]["category"] == "World Geography"
    assert popular_cats[1]["attempt_count"] == 2
