import pytest
from app.models import Category, Quiz, Question, QuestionOption
from seed_data import seed_all


def get_token(client, email, password):
    res = client.post("/api/auth/login", json={"email": email, "password": password})
    return res.get_json().get("access_token")


def auth_header(token):
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def seeded_app(app):
    with app.app_context():
        seed_all()
    return app


@pytest.fixture
def sample_category(app):
    with app.app_context():
        cat = Category(name="Test Category", description="Test Category Description")
        app.db.session.add(cat)
        app.db.session.commit()
        return cat.id


# ==================================================
# CATEGORY TESTS (1-9)
# ==================================================

# 1. Admin can list categories.
def test_admin_can_list_categories(client, admin_user):
    token = get_token(client, admin_user["email"], admin_user["password"])
    res = client.get("/api/categories", headers=auth_header(token))
    assert res.status_code == 200
    assert isinstance(res.get_json(), list)


# 2. Admin can create a category.
def test_admin_can_create_category(client, admin_user):
    token = get_token(client, admin_user["email"], admin_user["password"])
    payload = {"name": "Artificial Intelligence", "description": "AI & ML topics"}
    res = client.post("/api/categories", json=payload, headers=auth_header(token))
    assert res.status_code == 201
    data = res.get_json()
    assert data["message"] == "Category created successfully"
    assert data["category"]["name"] == "Artificial Intelligence"


# 3. Admin can retrieve a category.
def test_admin_can_retrieve_category(client, admin_user):
    token = get_token(client, admin_user["email"], admin_user["password"])
    create_res = client.post("/api/categories", json={"name": "Cybersecurity"}, headers=auth_header(token))
    cat_id = create_res.get_json()["category"]["id"]

    res = client.get(f"/api/categories/{cat_id}", headers=auth_header(token))
    assert res.status_code == 200
    assert res.get_json()["category"]["name"] == "Cybersecurity"


# 4. Admin can edit a category.
def test_admin_can_edit_category(client, admin_user):
    token = get_token(client, admin_user["email"], admin_user["password"])
    create_res = client.post("/api/categories", json={"name": "Data Science"}, headers=auth_header(token))
    cat_id = create_res.get_json()["category"]["id"]

    res = client.put(f"/api/categories/{cat_id}", json={"name": "Data Science & Analytics"}, headers=auth_header(token))
    assert res.status_code == 200
    assert res.get_json()["category"]["name"] == "Data Science & Analytics"


# 5. Admin can delete an unused category.
def test_admin_can_delete_unused_category(client, admin_user):
    token = get_token(client, admin_user["email"], admin_user["password"])
    create_res = client.post("/api/categories", json={"name": "Temporary Category"}, headers=auth_header(token))
    cat_id = create_res.get_json()["category"]["id"]

    res = client.delete(f"/api/categories/{cat_id}", headers=auth_header(token))
    assert res.status_code == 200
    assert res.get_json()["message"] == "Category deleted successfully"

    assert client.get(f"/api/categories/{cat_id}", headers=auth_header(token)).status_code == 404


# 6. Duplicate category name is rejected.
def test_duplicate_category_name_rejected(client, admin_user):
    token = get_token(client, admin_user["email"], admin_user["password"])
    client.post("/api/categories", json={"name": "Cloud Computing"}, headers=auth_header(token))

    res = client.post("/api/categories", json={"name": "cloud computing"}, headers=auth_header(token))
    assert res.status_code == 400
    assert "already exists" in res.get_json()["message"].lower()


# 7. Student cannot create a category.
def test_student_cannot_create_category(client, student_user):
    token = get_token(client, student_user["email"], student_user["password"])
    res = client.post("/api/categories", json={"name": "Student Category"}, headers=auth_header(token))
    assert res.status_code == 403


# 8. Student cannot edit a category.
def test_student_cannot_edit_category(client, admin_user, student_user):
    admin_token = get_token(client, admin_user["email"], admin_user["password"])
    create_res = client.post("/api/categories", json={"name": "DevOps"}, headers=auth_header(admin_token))
    cat_id = create_res.get_json()["category"]["id"]

    student_token = get_token(client, student_user["email"], student_user["password"])
    res = client.put(f"/api/categories/{cat_id}", json={"name": "Hacked Category"}, headers=auth_header(student_token))
    assert res.status_code == 403


# 9. Student cannot delete a category.
def test_student_cannot_delete_category(client, admin_user, student_user):
    admin_token = get_token(client, admin_user["email"], admin_user["password"])
    create_res = client.post("/api/categories", json={"name": "Networking"}, headers=auth_header(admin_token))
    cat_id = create_res.get_json()["category"]["id"]

    student_token = get_token(client, student_user["email"], student_user["password"])
    res = client.delete(f"/api/categories/{cat_id}", headers=auth_header(student_token))
    assert res.status_code == 403


# ==================================================
# QUESTION TESTS (10-25)
# ==================================================

@pytest.fixture
def sample_quiz_id(client, admin_user):
    token = get_token(client, admin_user["email"], admin_user["password"])
    # Ensure Geography category exists
    client.post("/api/categories", json={"name": "Geography"}, headers=auth_header(token))
    res = client.post("/api/quizzes", json={
        "title": "Sample Quiz for Questions",
        "category": "Geography",
        "difficulty": "EASY",
        "duration": 30,
        "passing_score": 40,
        "max_attempts": 3
    }, headers=auth_header(token))
    return res.get_json()["quiz"]["id"]


@pytest.fixture
def sample_mcq_payload():
    return {
        "question_text": "What is the capital of France?",
        "question_type": "MCQ",
        "marks": 1,
        "options": [
            {"key": "A", "text": "London", "is_correct": False},
            {"key": "B", "text": "Berlin", "is_correct": False},
            {"key": "C", "text": "Paris", "is_correct": True},
            {"key": "D", "text": "Madrid", "is_correct": False},
        ]
    }


# 10. Admin can list questions for a quiz.
def test_admin_can_list_questions(client, admin_user, sample_quiz_id, sample_mcq_payload):
    token = get_token(client, admin_user["email"], admin_user["password"])
    client.post(f"/api/quizzes/{sample_quiz_id}/questions", json=sample_mcq_payload, headers=auth_header(token))

    res = client.get(f"/api/quizzes/{sample_quiz_id}/questions", headers=auth_header(token))
    assert res.status_code == 200
    questions = res.get_json()
    assert isinstance(questions, list)
    assert len(questions) == 1


# 11. Admin can create an MCQ.
def test_admin_can_create_mcq(client, admin_user, sample_quiz_id, sample_mcq_payload):
    token = get_token(client, admin_user["email"], admin_user["password"])
    res = client.post(f"/api/quizzes/{sample_quiz_id}/questions", json=sample_mcq_payload, headers=auth_header(token))
    assert res.status_code == 201
    data = res.get_json()
    assert data["message"] == "Question created successfully"
    q = data["question"]
    assert q["question_text"] == sample_mcq_payload["question_text"]
    assert q["marks"] == 1


# 12. New MCQ contains exactly four options.
def test_new_mcq_contains_four_options(client, admin_user, sample_quiz_id, sample_mcq_payload):
    token = get_token(client, admin_user["email"], admin_user["password"])
    res = client.post(f"/api/quizzes/{sample_quiz_id}/questions", json=sample_mcq_payload, headers=auth_header(token))
    q = res.get_json()["question"]
    assert len(q["options"]) == 4


# 13. Exactly one option is correct.
def test_exactly_one_option_is_correct(client, admin_user, sample_quiz_id, sample_mcq_payload):
    token = get_token(client, admin_user["email"], admin_user["password"])
    res = client.post(f"/api/quizzes/{sample_quiz_id}/questions", json=sample_mcq_payload, headers=auth_header(token))
    q = res.get_json()["question"]
    correct_opts = [opt for opt in q["options"] if opt["is_correct"]]
    assert len(correct_opts) == 1
    assert correct_opts[0]["key"] == "C"


# 14. Invalid MCQ with zero correct options is rejected.
def test_zero_correct_options_rejected(client, admin_user, sample_quiz_id, sample_mcq_payload):
    token = get_token(client, admin_user["email"], admin_user["password"])
    payload = dict(sample_mcq_payload)
    payload["options"] = [
        {"key": "A", "text": "London", "is_correct": False},
        {"key": "B", "text": "Berlin", "is_correct": False},
        {"key": "C", "text": "Paris", "is_correct": False},
        {"key": "D", "text": "Madrid", "is_correct": False},
    ]
    res = client.post(f"/api/quizzes/{sample_quiz_id}/questions", json=payload, headers=auth_header(token))
    assert res.status_code == 400


# 15. Invalid MCQ with multiple correct options is rejected.
def test_multiple_correct_options_rejected(client, admin_user, sample_quiz_id, sample_mcq_payload):
    token = get_token(client, admin_user["email"], admin_user["password"])
    payload = dict(sample_mcq_payload)
    payload["options"] = [
        {"key": "A", "text": "London", "is_correct": True},
        {"key": "B", "text": "Berlin", "is_correct": False},
        {"key": "C", "text": "Paris", "is_correct": True},
        {"key": "D", "text": "Madrid", "is_correct": False},
    ]
    res = client.post(f"/api/quizzes/{sample_quiz_id}/questions", json=payload, headers=auth_header(token))
    assert res.status_code == 400


# 16. Admin can retrieve a question.
def test_admin_can_retrieve_question(client, admin_user, sample_quiz_id, sample_mcq_payload):
    token = get_token(client, admin_user["email"], admin_user["password"])
    create_res = client.post(f"/api/quizzes/{sample_quiz_id}/questions", json=sample_mcq_payload, headers=auth_header(token))
    q_id = create_res.get_json()["question"]["id"]

    res = client.get(f"/api/questions/{q_id}", headers=auth_header(token))
    assert res.status_code == 200
    assert res.get_json()["question"]["id"] == q_id


# 17. Admin can edit a question.
def test_admin_can_edit_question(client, admin_user, sample_quiz_id, sample_mcq_payload):
    token = get_token(client, admin_user["email"], admin_user["password"])
    create_res = client.post(f"/api/quizzes/{sample_quiz_id}/questions", json=sample_mcq_payload, headers=auth_header(token))
    q_id = create_res.get_json()["question"]["id"]

    update_payload = {
        "question_text": "What is the capital of Germany?",
        "marks": 2,
        "options": [
            {"key": "A", "text": "London", "is_correct": False},
            {"key": "B", "text": "Berlin", "is_correct": True},
            {"key": "C", "text": "Paris", "is_correct": False},
            {"key": "D", "text": "Madrid", "is_correct": False},
        ]
    }
    res = client.put(f"/api/questions/{q_id}", json=update_payload, headers=auth_header(token))
    assert res.status_code == 200
    updated_q = res.get_json()["question"]
    assert updated_q["question_text"] == "What is the capital of Germany?"
    assert updated_q["marks"] == 2
    correct_opt = next(o for o in updated_q["options"] if o["is_correct"])
    assert correct_opt["key"] == "B"


# 18. Admin can delete a question.
def test_admin_can_delete_question(client, admin_user, sample_quiz_id, sample_mcq_payload):
    token = get_token(client, admin_user["email"], admin_user["password"])
    create_res = client.post(f"/api/quizzes/{sample_quiz_id}/questions", json=sample_mcq_payload, headers=auth_header(token))
    q_id = create_res.get_json()["question"]["id"]

    res = client.delete(f"/api/questions/{q_id}", headers=auth_header(token))
    assert res.status_code == 200

    assert client.get(f"/api/questions/{q_id}", headers=auth_header(token)).status_code == 404


# 19. Student cannot create questions.
def test_student_cannot_create_questions(client, student_user, sample_quiz_id, sample_mcq_payload):
    token = get_token(client, student_user["email"], student_user["password"])
    res = client.post(f"/api/quizzes/{sample_quiz_id}/questions", json=sample_mcq_payload, headers=auth_header(token))
    assert res.status_code == 403


# 20. Student cannot edit questions.
def test_student_cannot_edit_questions(client, admin_user, student_user, sample_quiz_id, sample_mcq_payload):
    admin_token = get_token(client, admin_user["email"], admin_user["password"])
    create_res = client.post(f"/api/quizzes/{sample_quiz_id}/questions", json=sample_mcq_payload, headers=auth_header(admin_token))
    q_id = create_res.get_json()["question"]["id"]

    student_token = get_token(client, student_user["email"], student_user["password"])
    res = client.put(f"/api/questions/{q_id}", json={"question_text": "Hacked Question"}, headers=auth_header(student_token))
    assert res.status_code == 403


# 21. Student cannot delete questions.
def test_student_cannot_delete_questions(client, admin_user, student_user, sample_quiz_id, sample_mcq_payload):
    admin_token = get_token(client, admin_user["email"], admin_user["password"])
    create_res = client.post(f"/api/quizzes/{sample_quiz_id}/questions", json=sample_mcq_payload, headers=auth_header(admin_token))
    q_id = create_res.get_json()["question"]["id"]

    student_token = get_token(client, student_user["email"], student_user["password"])
    res = client.delete(f"/api/questions/{q_id}", headers=auth_header(student_token))
    assert res.status_code == 403


# 22. Invalid quiz ID returns 404.
def test_invalid_quiz_id_returns_404(client, admin_user, sample_mcq_payload):
    token = get_token(client, admin_user["email"], admin_user["password"])
    assert client.get("/api/quizzes/99999/questions", headers=auth_header(token)).status_code == 404
    assert client.post("/api/quizzes/99999/questions", json=sample_mcq_payload, headers=auth_header(token)).status_code == 404


# 23. Invalid question ID returns 404.
def test_invalid_question_id_returns_404(client, admin_user):
    token = get_token(client, admin_user["email"], admin_user["password"])
    assert client.get("/api/questions/99999", headers=auth_header(token)).status_code == 404
    assert client.put("/api/questions/99999", json={"question_text": "X"}, headers=auth_header(token)).status_code == 404
    assert client.delete("/api/questions/99999", headers=auth_header(token)).status_code == 404


# 24. Invalid marks are rejected.
def test_invalid_marks_rejected(client, admin_user, sample_quiz_id, sample_mcq_payload):
    token = get_token(client, admin_user["email"], admin_user["password"])
    payload = dict(sample_mcq_payload, marks=-5)
    res = client.post(f"/api/quizzes/{sample_quiz_id}/questions", json=payload, headers=auth_header(token))
    assert res.status_code == 400


# 25. Empty question text is rejected.
def test_empty_question_text_rejected(client, admin_user, sample_quiz_id, sample_mcq_payload):
    token = get_token(client, admin_user["email"], admin_user["password"])
    payload = dict(sample_mcq_payload, question_text="   ")
    res = client.post(f"/api/quizzes/{sample_quiz_id}/questions", json=payload, headers=auth_header(token))
    assert res.status_code == 400


# ==================================================
# SEED TESTS (26-32)
# ==================================================

# 26. Five categories exist.
def test_seed_five_categories_exist(seeded_app):
    with seeded_app.app_context():
        assert Category.query.count() == 5


# 27. Five seed quizzes exist.
def test_seed_five_quizzes_exist(seeded_app):
    with seeded_app.app_context():
        assert Quiz.query.count() == 5


# 28. 100 questions exist.
def test_seed_100_questions_exist(seeded_app):
    with seeded_app.app_context():
        assert Question.query.count() == 100


# 29. Each quiz contains 20 questions.
def test_seed_each_quiz_contains_20_questions(seeded_app):
    with seeded_app.app_context():
        quizzes = Quiz.query.all()
        for q in quizzes:
            assert len(q.questions) == 20


# 30. Each question contains four options.
def test_seed_each_question_contains_four_options(seeded_app):
    with seeded_app.app_context():
        questions = Question.query.all()
        for q in questions:
            assert len(q.options) == 4


# 31. Each question has exactly one correct option.
def test_seed_each_question_has_one_correct_option(seeded_app):
    with seeded_app.app_context():
        questions = Question.query.all()
        for q in questions:
            correct_opts = [opt for opt in q.options if opt.is_correct]
            assert len(correct_opts) == 1


# 32. Running the seed twice does not create duplicates.
def test_seed_idempotency(seeded_app):
    with seeded_app.app_context():
        seed_all()
        assert Category.query.count() == 5
        assert Quiz.query.count() == 5
        assert Question.query.count() == 100
