import pytest
from app.models import Quiz, STATUS_DRAFT, STATUS_PUBLISHED


def get_token(client, email, password):
    res = client.post("/api/auth/login", json={"email": email, "password": password})
    return res.get_json().get("access_token")


def auth_header(token):
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def sample_quiz_payload():
    return {
        "title": "World Geography Quiz",
        "description": "Test your knowledge about world geography.",
        "category_id": "Geography",
        "difficulty": "EASY",
        "duration": 30,
        "passing_score": 40,
        "max_attempts": 3,
    }


def test_admin_can_create_quiz(client, admin_user, sample_quiz_payload):
    token = get_token(client, admin_user["email"], admin_user["password"])
    res = client.post("/api/quizzes", json=sample_quiz_payload, headers=auth_header(token))
    assert res.status_code == 201
    data = res.get_json()
    assert data["message"] == "Quiz created successfully"
    quiz = data["quiz"]
    assert quiz["title"] == sample_quiz_payload["title"]
    assert quiz["category"] == "Geography"
    assert quiz["difficulty"] == "EASY"
    assert quiz["duration"] == 30
    assert quiz["passing_score"] == 40
    assert quiz["max_attempts"] == 3


def test_student_cannot_create_quiz(client, student_user, sample_quiz_payload):
    token = get_token(client, student_user["email"], student_user["password"])
    res = client.post("/api/quizzes", json=sample_quiz_payload, headers=auth_header(token))
    assert res.status_code == 403


def test_unauthenticated_cannot_create_quiz(client, sample_quiz_payload):
    res = client.post("/api/quizzes", json=sample_quiz_payload)
    assert res.status_code == 401


def test_new_quiz_defaults_to_draft(client, admin_user, sample_quiz_payload):
    token = get_token(client, admin_user["email"], admin_user["password"])
    res = client.post("/api/quizzes", json=sample_quiz_payload, headers=auth_header(token))
    assert res.status_code == 201
    assert res.get_json()["quiz"]["status"] == STATUS_DRAFT


@pytest.mark.parametrize("category", [
    "Geography",
    "Indian History",
    "Programming",
    "General Knowledge (GK)",
    "Trivia",
    1, 2, 3, 4, 5
])
def test_valid_five_categories_accepted(client, admin_user, sample_quiz_payload, category):
    token = get_token(client, admin_user["email"], admin_user["password"])
    payload = dict(sample_quiz_payload)
    payload["category_id"] = category
    res = client.post("/api/quizzes", json=payload, headers=auth_header(token))
    assert res.status_code == 201


def test_invalid_category_rejected(client, admin_user, sample_quiz_payload):
    token = get_token(client, admin_user["email"], admin_user["password"])
    payload = dict(sample_quiz_payload)
    payload["category_id"] = "Quantum Mechanics"
    res = client.post("/api/quizzes", json=payload, headers=auth_header(token))
    assert res.status_code == 400
    assert "Category" in str(res.get_json())


def test_admin_can_list_quizzes(client, admin_user, sample_quiz_payload):
    token = get_token(client, admin_user["email"], admin_user["password"])
    client.post("/api/quizzes", json=sample_quiz_payload, headers=auth_header(token))
    res = client.get("/api/quizzes", headers=auth_header(token))
    assert res.status_code == 200
    quizzes = res.get_json()
    assert isinstance(quizzes, list)
    assert len(quizzes) >= 1


def test_admin_can_retrieve_quiz(client, admin_user, sample_quiz_payload):
    token = get_token(client, admin_user["email"], admin_user["password"])
    create_res = client.post("/api/quizzes", json=sample_quiz_payload, headers=auth_header(token))
    quiz_id = create_res.get_json()["quiz"]["id"]

    res = client.get(f"/api/quizzes/{quiz_id}", headers=auth_header(token))
    assert res.status_code == 200
    data = res.get_json()
    assert data["quiz"]["id"] == quiz_id
    assert data["quiz"]["title"] == sample_quiz_payload["title"]


def test_admin_can_edit_quiz(client, admin_user, sample_quiz_payload):
    token = get_token(client, admin_user["email"], admin_user["password"])
    create_res = client.post("/api/quizzes", json=sample_quiz_payload, headers=auth_header(token))
    quiz_id = create_res.get_json()["quiz"]["id"]

    update_payload = {
        "title": "Advanced World Geography",
        "duration": 45,
        "difficulty": "HARD"
    }
    res = client.put(f"/api/quizzes/{quiz_id}", json=update_payload, headers=auth_header(token))
    assert res.status_code == 200
    quiz = res.get_json()["quiz"]
    assert quiz["title"] == "Advanced World Geography"
    assert quiz["duration"] == 45
    assert quiz["difficulty"] == "HARD"
    assert quiz["status"] == STATUS_DRAFT


def test_student_cannot_edit_quiz(client, admin_user, student_user, sample_quiz_payload):
    admin_token = get_token(client, admin_user["email"], admin_user["password"])
    create_res = client.post("/api/quizzes", json=sample_quiz_payload, headers=auth_header(admin_token))
    quiz_id = create_res.get_json()["quiz"]["id"]

    student_token = get_token(client, student_user["email"], student_user["password"])
    res = client.put(f"/api/quizzes/{quiz_id}", json={"title": "Hacked Title"}, headers=auth_header(student_token))
    assert res.status_code == 403


def test_admin_can_delete_quiz(client, admin_user, sample_quiz_payload):
    token = get_token(client, admin_user["email"], admin_user["password"])
    create_res = client.post("/api/quizzes", json=sample_quiz_payload, headers=auth_header(token))
    quiz_id = create_res.get_json()["quiz"]["id"]

    res = client.delete(f"/api/quizzes/{quiz_id}", headers=auth_header(token))
    assert res.status_code == 200
    assert res.get_json()["message"] == "Quiz deleted successfully"

    get_res = client.get(f"/api/quizzes/{quiz_id}", headers=auth_header(token))
    assert get_res.status_code == 404


def test_student_cannot_delete_quiz(client, admin_user, student_user, sample_quiz_payload):
    admin_token = get_token(client, admin_user["email"], admin_user["password"])
    create_res = client.post("/api/quizzes", json=sample_quiz_payload, headers=auth_header(admin_token))
    quiz_id = create_res.get_json()["quiz"]["id"]

    student_token = get_token(client, student_user["email"], student_user["password"])
    res = client.delete(f"/api/quizzes/{quiz_id}", headers=auth_header(student_token))
    assert res.status_code == 403


def test_admin_can_publish_quiz(client, admin_user, sample_quiz_payload):
    token = get_token(client, admin_user["email"], admin_user["password"])
    create_res = client.post("/api/quizzes", json=sample_quiz_payload, headers=auth_header(token))
    quiz_id = create_res.get_json()["quiz"]["id"]

    res = client.patch(f"/api/quizzes/{quiz_id}/publish", json={"status": "PUBLISHED"}, headers=auth_header(token))
    assert res.status_code == 200
    data = res.get_json()
    assert data["status"] == STATUS_PUBLISHED
    assert data["quiz"]["status"] == STATUS_PUBLISHED


def test_admin_can_unpublish_quiz(client, admin_user, sample_quiz_payload):
    token = get_token(client, admin_user["email"], admin_user["password"])
    create_res = client.post("/api/quizzes", json=sample_quiz_payload, headers=auth_header(token))
    quiz_id = create_res.get_json()["quiz"]["id"]

    client.patch(f"/api/quizzes/{quiz_id}/publish", json={"status": "PUBLISHED"}, headers=auth_header(token))
    res = client.patch(f"/api/quizzes/{quiz_id}/publish", json={"status": "DRAFT"}, headers=auth_header(token))
    assert res.status_code == 200
    data = res.get_json()
    assert data["status"] == STATUS_DRAFT
    assert data["quiz"]["status"] == STATUS_DRAFT


def test_student_cannot_publish_unpublish(client, admin_user, student_user, sample_quiz_payload):
    admin_token = get_token(client, admin_user["email"], admin_user["password"])
    create_res = client.post("/api/quizzes", json=sample_quiz_payload, headers=auth_header(admin_token))
    quiz_id = create_res.get_json()["quiz"]["id"]

    student_token = get_token(client, student_user["email"], student_user["password"])
    res = client.patch(f"/api/quizzes/{quiz_id}/publish", json={"status": "PUBLISHED"}, headers=auth_header(student_token))
    assert res.status_code == 403


def test_invalid_quiz_id_returns_404(client, admin_user):
    token = get_token(client, admin_user["email"], admin_user["password"])
    res = client.get("/api/quizzes/99999", headers=auth_header(token))
    assert res.status_code == 404
    assert client.put("/api/quizzes/99999", json={"title": "A"}, headers=auth_header(token)).status_code == 404
    assert client.delete("/api/quizzes/99999", headers=auth_header(token)).status_code == 404
    assert client.patch("/api/quizzes/99999/publish", headers=auth_header(token)).status_code == 404


def test_invalid_quiz_data_rejected(client, admin_user, sample_quiz_payload):
    token = get_token(client, admin_user["email"], admin_user["password"])
    payload = dict(sample_quiz_payload, title="")
    res = client.post("/api/quizzes", json=payload, headers=auth_header(token))
    assert res.status_code == 400

    payload = dict(sample_quiz_payload, duration=-10)
    res = client.post("/api/quizzes", json=payload, headers=auth_header(token))
    assert res.status_code == 400

    payload = dict(sample_quiz_payload, passing_score=150)
    res = client.post("/api/quizzes", json=payload, headers=auth_header(token))
    assert res.status_code == 400


def test_invalid_difficulty_rejected(client, admin_user, sample_quiz_payload):
    token = get_token(client, admin_user["email"], admin_user["password"])
    payload = dict(sample_quiz_payload, difficulty="SUPER_HARD")
    res = client.post("/api/quizzes", json=payload, headers=auth_header(token))
    assert res.status_code == 400


def test_invalid_status_cannot_be_injected(client, admin_user, sample_quiz_payload):
    token = get_token(client, admin_user["email"], admin_user["password"])
    payload = dict(sample_quiz_payload, status="PUBLISHED")
    res = client.post("/api/quizzes", json=payload, headers=auth_header(token))
    assert res.status_code == 201
    assert res.get_json()["quiz"]["status"] == STATUS_DRAFT

    quiz_id = res.get_json()["quiz"]["id"]
    res_edit = client.put(f"/api/quizzes/{quiz_id}", json={"status": "PUBLISHED"}, headers=auth_header(token))
    assert res_edit.status_code == 200
    assert res_edit.get_json()["quiz"]["status"] == STATUS_DRAFT


def test_password_hash_never_returned(client, admin_user, sample_quiz_payload):
    token = get_token(client, admin_user["email"], admin_user["password"])
    create_res = client.post("/api/quizzes", json=sample_quiz_payload, headers=auth_header(token))
    quiz_str = str(create_res.get_json())
    assert "password" not in quiz_str.lower() or "password_hash" not in quiz_str.lower()
    assert "AdminPass123" not in quiz_str
