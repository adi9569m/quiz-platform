import pytest
from app.models import User, ROLE_ADMIN, ROLE_STUDENT, STATUS_ACTIVE, STATUS_INACTIVE
from app.extensions import db


def get_token(client, email, password):
    res = client.post("/api/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200
    return res.get_json()["access_token"]


def test_get_profile_student(client, student_user):
    token = get_token(client, student_user["email"], student_user["password"])
    res = client.get("/api/profile", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.get_json()
    assert "user" in data
    assert data["user"]["id"] == student_user["id"]
    assert data["user"]["email"] == student_user["email"]
    assert data["user"]["role"] == ROLE_STUDENT
    assert data["user"]["status"] == STATUS_ACTIVE
    assert "created_at" in data["user"]


def test_get_profile_admin(client, admin_user):
    token = get_token(client, admin_user["email"], admin_user["password"])
    res = client.get("/api/profile", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.get_json()
    assert "user" in data
    assert data["user"]["id"] == admin_user["id"]
    assert data["user"]["email"] == admin_user["email"]
    assert data["user"]["role"] == ROLE_ADMIN
    assert data["user"]["status"] == STATUS_ACTIVE


def test_get_profile_unauthenticated(client):
    res = client.get("/api/profile")
    assert res.status_code == 401


def test_update_profile_name(client, student_user, app):
    token = get_token(client, student_user["email"], student_user["password"])
    res = client.put(
        "/api/profile",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": "Updated Student Name", "email": student_user["email"]},
    )
    assert res.status_code == 200
    data = res.get_json()
    assert data["user"]["name"] == "Updated Student Name"
    assert data["user"]["email"] == student_user["email"]

    with app.app_context():
        user = db.session.get(User, student_user["id"])
        assert user.name == "Updated Student Name"


def test_update_profile_email(client, student_user, app):
    token = get_token(client, student_user["email"], student_user["password"])
    new_email = "newstudentemail@example.com"
    res = client.put(
        "/api/profile",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": "Test Student", "email": new_email},
    )
    assert res.status_code == 200
    data = res.get_json()
    assert data["user"]["email"] == new_email

    with app.app_context():
        user = db.session.get(User, student_user["id"])
        assert user.email == new_email


def test_update_profile_blank_name_fails(client, student_user):
    token = get_token(client, student_user["email"], student_user["password"])
    res = client.put(
        "/api/profile",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": "   ", "email": student_user["email"]},
    )
    assert res.status_code == 400
    assert "Name is required" in res.get_json()["message"]


def test_update_profile_invalid_email_fails(client, student_user):
    token = get_token(client, student_user["email"], student_user["password"])
    res = client.put(
        "/api/profile",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": "Test Student", "email": "invalid-email-format"},
    )
    assert res.status_code == 400
    assert "Invalid email format" in res.get_json()["message"]


def test_update_profile_duplicate_email_fails(client, student_user, admin_user):
    token = get_token(client, student_user["email"], student_user["password"])
    res = client.put(
        "/api/profile",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": "Test Student", "email": admin_user["email"]},
    )
    assert res.status_code == 409
    assert "already registered" in res.get_json()["message"]


def test_update_profile_same_email_succeeds(client, student_user):
    token = get_token(client, student_user["email"], student_user["password"])
    res = client.put(
        "/api/profile",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": "New Name Same Email", "email": student_user["email"]},
    )
    assert res.status_code == 200
    assert res.get_json()["user"]["name"] == "New Name Same Email"


def test_update_profile_protected_fields_cannot_be_tampered(client, student_user, app):
    token = get_token(client, student_user["email"], student_user["password"])
    res = client.put(
        "/api/profile",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "name": "Secured Student",
            "email": student_user["email"],
            "role": ROLE_ADMIN,
            "status": STATUS_INACTIVE,
            "id": 9999,
            "password": "HackedPassword",
            "password_hash": "FakeHash",
        },
    )
    assert res.status_code == 200
    data = res.get_json()
    assert data["user"]["role"] == ROLE_STUDENT
    assert data["user"]["status"] == STATUS_ACTIVE
    assert data["user"]["id"] == student_user["id"]

    with app.app_context():
        user = db.session.get(User, student_user["id"])
        assert user.role == ROLE_STUDENT
        assert user.status == STATUS_ACTIVE
        assert user.check_password("StudentPass123") is True


def test_inactive_user_cannot_get_or_update_profile(client, app):
    with app.app_context():
        user = User(
            name="Inactive Student",
            email="inactive@example.com",
            role=ROLE_STUDENT,
            status=STATUS_ACTIVE,
        )
        user.set_password("Pass123456")
        db.session.add(user)
        db.session.commit()
        user_id = user.id

    token = get_token(client, "inactive@example.com", "Pass123456")

    with app.app_context():
        db_user = db.session.get(User, user_id)
        db_user.status = STATUS_INACTIVE
        db.session.commit()

    get_res = client.get("/api/profile", headers={"Authorization": f"Bearer {token}"})
    assert get_res.status_code == 401

    put_res = client.put(
        "/api/profile",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": "Try Update", "email": "inactive@example.com"},
    )
    assert put_res.status_code == 401


def test_auth_profile_alias_endpoint(client, student_user):
    token = get_token(client, student_user["email"], student_user["password"])
    res = client.get("/api/auth/profile", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.get_json()["user"]["id"] == student_user["id"]

    patch_res = client.patch(
        "/api/auth/profile",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": "Patched Name"},
    )
    assert patch_res.status_code == 200
    assert patch_res.get_json()["user"]["name"] == "Patched Name"
