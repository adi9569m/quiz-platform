import jwt
from flask import current_app
from app.models import User, ROLE_STUDENT, ROLE_ADMIN


def _get_token(client, email, password):
    res = client.post(
        "/api/auth/login",
        json={"email": email, "password": password}
    )
    return res.get_json()["access_token"]


def test_no_jwt_admin_endpoint_returns_401(client):
    res = client.get("/api/admin/test")
    assert res.status_code == 401


def test_no_jwt_student_endpoint_returns_401(client):
    res = client.get("/api/student/test")
    assert res.status_code == 401


def test_student_jwt_student_endpoint_returns_200(client, student_user):
    token = _get_token(client, student_user["email"], student_user["password"])
    res = client.get(
        "/api/student/test",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    data = res.get_json()
    assert data["message"] == "Student authorization test successful"
    assert data["user"]["role"] == ROLE_STUDENT


def test_student_jwt_admin_endpoint_returns_403(client, student_user):
    token = _get_token(client, student_user["email"], student_user["password"])
    res = client.get(
        "/api/admin/test",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 403


def test_admin_jwt_admin_endpoint_returns_200(client, admin_user):
    token = _get_token(client, admin_user["email"], admin_user["password"])
    res = client.get(
        "/api/admin/test",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    data = res.get_json()
    assert data["message"] == "Admin authorization test successful"
    assert data["user"]["role"] == ROLE_ADMIN


def test_admin_jwt_student_endpoint_returns_403(client, admin_user):
    token = _get_token(client, admin_user["email"], admin_user["password"])
    res = client.get(
        "/api/student/test",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 403


def test_normal_registration_cannot_create_admin(client):
    res = client.post(
        "/api/auth/register",
        json={
            "name": "Attacker",
            "email": "attacker@example.com",
            "password": "Password123!",
            "role": "ADMIN"
        }
    )
    assert res.status_code == 201
    data = res.get_json()
    assert data["user"]["role"] == ROLE_STUDENT


def test_tempered_claim_cannot_bypass_db_authz(client, app, student_user):
    with app.app_context():
        custom_token = jwt.encode(
            {"sub": str(student_user["id"]), "role": "ADMIN"},
            current_app.config["JWT_SECRET_KEY"],
            algorithm="HS256"
        )

    res = client.get(
        "/api/admin/test",
        headers={"Authorization": f"Bearer {custom_token}"}
    )
    assert res.status_code == 403


def test_invalid_jwt_rejected(client):
    res = client.get(
        "/api/admin/test",
        headers={"Authorization": "Bearer invalid.jwt.token"}
    )
    assert res.status_code == 401
