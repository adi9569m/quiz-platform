import jwt
from flask import current_app
from app.models import User, ROLE_STUDENT, ROLE_ADMIN


def _get_token(client, email, password):
    res = client.post(
        "/api/auth/login",
        json={"email": email, "password": password}
    )
    return res.get_json()["access_token"]


# 1. No JWT -> admin endpoint returns 401
def test_no_jwt_admin_endpoint_returns_401(client):
    res = client.get("/api/admin/test")
    assert res.status_code == 401


# 2. No JWT -> student endpoint returns 401
def test_no_jwt_student_endpoint_returns_401(client):
    res = client.get("/api/student/test")
    assert res.status_code == 401


# 3. Student JWT -> student endpoint returns 200
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


# 4. Student JWT -> admin endpoint returns 403
def test_student_jwt_admin_endpoint_returns_403(client, student_user):
    token = _get_token(client, student_user["email"], student_user["password"])
    res = client.get(
        "/api/admin/test",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 403


# 5. Admin JWT -> admin endpoint returns 200
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


# 6. Admin JWT -> student endpoint returns 403
def test_admin_jwt_student_endpoint_returns_403(client, admin_user):
    token = _get_token(client, admin_user["email"], admin_user["password"])
    res = client.get(
        "/api/student/test",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 403


# 7. Normal registration cannot create ADMIN
def test_normal_registration_cannot_create_admin(client):
    res = client.post(
        "/api/auth/register",
        json={
            "name": "Attacker",
            "email": "attacker@example.com",
            "password": "Password123!",
            "role": "ADMIN"  # Attempt to create ADMIN
        }
    )
    assert res.status_code == 201
    data = res.get_json()
    # Verification: role created in DB must be STUDENT
    assert data["user"]["role"] == ROLE_STUDENT


# 8. Changing the role in the request cannot bypass database authorization
def test_tempered_claim_cannot_bypass_db_authz(client, app, student_user):
    # If client manually creates a token claiming role: ADMIN but with student's user identity
    with app.app_context():
        custom_token = jwt.encode(
            {"sub": str(student_user["id"]), "role": "ADMIN"},
            current_app.config["JWT_SECRET_KEY"],
            algorithm="HS256"
        )

    # Middleware checks actual user record in database, so even with role: ADMIN in token payload, DB role is STUDENT -> 403
    res = client.get(
        "/api/admin/test",
        headers={"Authorization": f"Bearer {custom_token}"}
    )
    assert res.status_code == 403


# 9. Invalid / expired JWT is rejected
def test_invalid_jwt_rejected(client):
    res = client.get(
        "/api/admin/test",
        headers={"Authorization": "Bearer invalid.jwt.token"}
    )
    assert res.status_code == 401
