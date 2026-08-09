from app.models import User, ROLE_STUDENT


def test_student_registration(client):
    res = client.post(
        "/api/auth/register",
        json={
            "name": "Jane Student",
            "email": "jane@example.com",
            "password": "SecurePassword123"
        }
    )
    assert res.status_code == 201
    data = res.get_json()
    assert data["message"] == "Registration successful"
    assert data["user"]["email"] == "jane@example.com"
    assert data["user"]["role"] == ROLE_STUDENT


def test_registration_duplicate_email(client, student_user):
    res = client.post(
        "/api/auth/register",
        json={
            "name": "Another Student",
            "email": student_user["email"],
            "password": "SecurePassword123"
        }
    )
    assert res.status_code == 409
    data = res.get_json()
    assert "already registered" in data["message"].lower()


def test_login_success(client, student_user):
    res = client.post(
        "/api/auth/login",
        json={
            "email": student_user["email"],
            "password": student_user["password"]
        }
    )
    assert res.status_code == 200
    data = res.get_json()
    assert "access_token" in data
    assert data["user"]["email"] == student_user["email"]
    assert data["user"]["role"] == ROLE_STUDENT


def test_login_invalid_password(client, student_user):
    res = client.post(
        "/api/auth/login",
        json={
            "email": student_user["email"],
            "password": "WrongPassword!"
        }
    )
    assert res.status_code == 401


def test_password_hashing(app, student_user):
    with app.app_context():
        user = User.query.filter_by(email=student_user["email"]).first()
        assert user.password != student_user["password"]
        assert user.check_password(student_user["password"])
        assert not user.check_password("WrongPassword")


def test_logout(client, student_user):
    login_res = client.post(
        "/api/auth/login",
        json={
            "email": student_user["email"],
            "password": student_user["password"]
        }
    )
    token = login_res.get_json()["access_token"]

    logout_res = client.post(
        "/api/auth/logout",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert logout_res.status_code == 200
    assert logout_res.get_json()["message"] == "Logout successful"
